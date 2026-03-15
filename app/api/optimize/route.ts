import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'
import { buildGraph } from '@/lib/graph/buildGraph'
import { applyConstraints } from '@/lib/graph/applyConstraints'
import { findKLeastCostPaths } from '@/lib/optimization/dijkstra'
import { explainRouteChange } from '@/lib/explainability/explainRouteChange'
import { generateExplanation } from '@/lib/explainability/generateExplanation'
import { getOrSetBaselineSnapshot } from '@/lib/optimization/baselineSnapshot'
import { generateOperationalImplications } from '@/lib/explainability/operationalImplications'
import { generateRecommendations } from '@/lib/explainability/recommendedActions'
import { generateConfidenceBoundaries } from '@/lib/explainability/confidenceGuard'
import { calculatePhysicsCost } from '@/lib/optimization/physics'
import { getStrategicRoutingOptions } from '@/lib/optimization/strategicAI'

export async function POST(request: Request) {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Still using admin for system-level graph building to avoid RLS overhead on thousands of edges
    const adminSupabase = createAdminClient()

    const {
        scenarioId,
        sourceNodeId,
        targetNodeId,
        constraints,
        targetRank = 1,
        weightMode = 'balanced',
        timeValue = 25,
        skipAI = false,
        cargo
    } = await request.json()

    if (!scenarioId || !sourceNodeId || !targetNodeId) {
        return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 })
    }

    try {
        // 0. Resolve Context (Parallelized)
        const [scenarioRes, fuelIndicesRes] = await Promise.all([
            adminSupabase.from('scenarios').select('id, dataset_id').eq('id', scenarioId).maybeSingle(),
            adminSupabase.from('fuel_indices').select('fuel_type, price_index').eq('dataset_id', (await adminSupabase.from('scenarios').select('dataset_id').eq('id', scenarioId).single()).data?.dataset_id)
        ])

        const scenario = scenarioRes.data
        if (!scenario) throw new Error('Scenario not found')
        if (!scenario.dataset_id) throw new Error('No dataset linked to scenario')

        // 1. Build Base Graph & Get Strategic AI Options in Parallel
        const [baseGraph, strategicOptions] = await Promise.all([
            buildGraph(scenario.dataset_id, scenarioId),
            !skipAI ? (async () => {
                const { data: modesData } = await adminSupabase.from('route_edges').select('mode').eq('dataset_id', scenario.dataset_id)
                const availableModes = Array.from(new Set(modesData?.map(m => m.mode).filter(Boolean) || []))
                const sNode = (await buildGraph(scenario.dataset_id, scenarioId)).nodes.get(sourceNodeId)
                const tNode = (await buildGraph(scenario.dataset_id, scenarioId)).nodes.get(targetNodeId)
                if (!sNode || !tNode) return []
                return getStrategicRoutingOptions(sNode, tNode, cargo, availableModes)
            })() : Promise.resolve([])
        ])

        const sNode = baseGraph.nodes.get(sourceNodeId)
        const tNode = baseGraph.nodes.get(targetNodeId)
        if (!sNode || !tNode) throw new Error('Source or Target missing')

        // 3. Prepare Config
        const fuelMultipliers: Record<string, number> = {}
        fuelIndicesRes.data?.forEach(fi => { fuelMultipliers[fi.fuel_type] = Number(fi.price_index) })

        const config = {
            fuelPriceMultipliers: constraints?.fuelPriceMultipliers || fuelMultipliers,
            closedNodeIds: constraints?.closedNodeIds || [],
            forbiddenModes: constraints?.forbiddenModes || [],
            edgeCapacityThrottles: constraints?.edgeCapacityThrottles || {},
            congestedNodes: constraints?.congestedNodes || {}
        }

        // 4. Transform AI Strategies into Calculated Results
        const getTripsForMode = (mode: string) => {
            if (!cargo) return 1
            const weight = (cargo.packageCount || 0) * (cargo.packageWeight || 0)
            if (weight === 0) return Math.ceil((cargo.packageCount || 1) / 1000)
            const m = mode.toLowerCase()
            let cap = 20000
            if (m.includes('sea')) cap = 28000
            else if (m.includes('rail')) cap = 30000
            else if (m.includes('air')) cap = 5000
            return Math.ceil(weight / cap)
        }

        const aiResults: any[] = strategicOptions.map((strat: any, sIdx: number) => {
            let totalCost = 0, totalCO2 = 0, totalTime = 0
            const steps: any[] = [{ nodeId: sourceNodeId, name: sNode?.name, latitude: sNode?.latitude, longitude: sNode?.longitude, cost: 0 }]
            const path: string[] = [sourceNodeId]
            const modeBreakdown: Record<string, number> = {}
            const totalLoad = (cargo?.packageCount || 0) * (cargo?.packageWeight || 0)

            for (let i = 0; i < strat.steps.length - 1; i++) {
                const u = strat.steps[i], v = strat.steps[i + 1]
                const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
                    const toRad = (d: number) => d * Math.PI / 180
                    const R = 6371
                    const dLat = toRad(lat2 - lat1), dLon = toRad(lon2 - lon1)
                    const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2
                    return Math.round(R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)))
                }
                const dist = calculateDistance(u.latitude, u.longitude, v.latitude, v.longitude)
                const trips = getTripsForMode(v.mode)
                const lowMode = v.mode.toLowerCase()
                const isSea = lowMode.includes('sea'); const isRail = lowMode.includes('rail'); const isAir = lowMode.includes('air')
                const cap = isSea ? 28000 : (isRail ? 30000 : (isAir ? 5000 : 20000))
                const tripWeight = trips > 0 ? totalLoad / trips : 0
                const phys = calculatePhysicsCost(dist, v.mode, sNode?.metadata?.country, tripWeight, cap)
                const cost = phys.total * trips
                totalCost += cost
                const baseCO2 = isSea ? 0.015 : (isRail ? 0.04 : (isAir ? 0.8 : 0.12))
                totalCO2 += dist * baseCO2 * trips * (1 + (tripWeight / cap) * 0.2)
                const speed = isSea ? 25 : (isRail ? 45 : (isAir ? 800 : 60))
                totalTime += dist / speed
                modeBreakdown[v.mode] = (modeBreakdown[v.mode] || 0) + cost
                const isLast = i === strat.steps.length - 2
                const vid = isLast ? targetNodeId : `AI_${sIdx}_${i}`
                path.push(vid)
                steps.push({ nodeId: vid, name: isLast ? tNode?.name : v.haltName, latitude: isLast ? tNode?.latitude : v.latitude, longitude: isLast ? tNode?.longitude : v.longitude, mode: v.mode, cost, isNautical: isSea, instruction: v.instruction })
            }
            return { strategyName: strat.strategyName, generativeReason: strat.description, path, totalCost, totalCO2, totalTransitTime: totalTime, steps, modeBreakdown, isStrategicAI: true, isGenerative: true }
        })

        // 5. Run Technical Optimization
        let constrainedGraph = applyConstraints(baseGraph, config)
        let dijkstraResults = findKLeastCostPaths(constrainedGraph, sourceNodeId, targetNodeId, 3, weightMode, timeValue, cargo)

        let allResults = [...aiResults, ...dijkstraResults]
        allResults.sort((a, b) => {
            if (weightMode === 'time') return a.totalTransitTime - b.totalTransitTime
            if (weightMode === 'co2') return a.totalCO2 - b.totalCO2
            return (a.totalCost + a.totalTransitTime * timeValue) - (b.totalCost + b.totalTransitTime * timeValue)
        })

        if (allResults.length === 0) throw new Error('No path found')

        const processedResults = allResults.map((res: any, index: number) => {
            let pathDetails: any[]
            if (res.isStrategicAI && res.steps) {
                pathDetails = res.steps.map((step: any) => ({
                    id: step.nodeId, name: step.name || 'AI Waypoint', type: step.mode?.toUpperCase() || 'HUB',
                    latitude: step.latitude, longitude: step.longitude, mode: step.mode, isNautical: step.isNautical || false, metadata: { instruction: step.instruction }
                }))
            } else {
                pathDetails = res.path.map((nodeId: string, idx: number) => {
                    const node = baseGraph.nodes.get(nodeId)
                    let detail: any = { id: nodeId, name: node?.name, type: node?.type || 'HUB', latitude: node?.latitude, longitude: node?.longitude, metadata: node?.metadata || {} }
                    if (idx > 0) {
                        const prevNodeId = res.path[idx - 1]
                        const edge = constrainedGraph.adjacencyList.get(prevNodeId)?.find(e => e.target === nodeId)
                        if (edge) {
                            detail.mode = edge.mode; const lowMode = (edge.mode || '').toLowerCase()
                            detail.isNautical = lowMode.includes('sea')
                        }
                    }
                    return detail
                })
            }
            return { rank: index + 1, ...res, pathDetails, readablePath: pathDetails.map((n: any) => `${n.name} [${n.type.toUpperCase()}]`), sourceNodeId, targetNodeId }
        })

        const selectedIndex = Math.min(Math.max(0, targetRank - 1), processedResults.length - 1);
        const result = processedResults[selectedIndex]

        // 6. Final Insights (PARALLELIZED LLM FLOW)
        const baselineSnapshot = await getOrSetBaselineSnapshot(scenario.dataset_id, sourceNodeId, targetNodeId)
        const baselineResult = baselineSnapshot?.result
        const baselineCost = baselineResult?.totalCost || result.totalCost
        const absDelta = result.totalCost - baselineCost
        const relDelta = baselineCost !== 0 ? (absDelta / baselineCost) * 100 : 0

        const bottlenecks: any[] = []
        result.steps.forEach((step: any, i: number) => {
            if (i === 0) return
            const node = baseGraph.nodes.get(step.nodeId)
            if (node?.metadata?.currentLoad / node?.metadata?.capacity > 0.95) {
                bottlenecks.push({ type: 'CAPACITY_STRESS', entity: node?.name, severity: 'CRITICAL', impact: 'Terminal congestion' })
            }
        })

        // RUN ALL LLM TASKS IN PARALLEL
        const [llmResult, implications, recommendations, confidence] = await Promise.all([
            generateExplanation({ path: baselineResult?.path || [], totalCost: baselineCost }, { path: result.path, totalCost: result.totalCost }, absDelta, config),
            generateOperationalImplications({ deltas: { absolute: absDelta, percentage: relDelta }, bottlenecks, modeBreakdown: result.modeBreakdown }),
            generateRecommendations({ deltas: { absolute: absDelta, percentage: relDelta }, bottlenecks, modeBreakdown: result.modeBreakdown }),
            generateConfidenceBoundaries({ scenarioId, sourceNodeId, targetNodeId, constraints: config })
        ])

        const { data: savedResult } = await adminSupabase
            .from('optimization_results')
            .insert([{
                scenario_id: scenarioId,
                total_cost: result.totalCost,
                run_status: 'completed',
                result_data: {
                    ...result,
                    alternatives: processedResults.filter((_, idx) => idx !== selectedIndex),
                    constraintsApplied: config,
                    technicalExplanation: explainRouteChange(baselineResult || result, result, config), bottlenecks, operationalImplications: implications, recommendedActions: recommendations, confidenceBoundaries: confidence,
                    deltas: { absoluteCost: absDelta, percentChange: relDelta }
                }
            }])
            .select().single()

        return NextResponse.json({
            success: true,
            resultId: savedResult?.id,
            ...result,
            alternatives: processedResults.filter((_, idx) => idx !== selectedIndex),
            baselinePath: baselineResult?.path.map((id: string) => {
                const node = baseGraph.nodes.get(id);
                return { id, name: node?.name, type: node?.type, latitude: node?.latitude, longitude: node?.longitude };
            }) || [],
            constraints: config,
            bottlenecks,
            implications, recommendations, confidence,
            deltas: { absolute: absDelta, percentage: relDelta },
            explanation: { summary: llmResult.summary, tradeoffs: llmResult.tradeoffs, technical: explainRouteChange(baselineResult || result, result, config).reason }
        })

    } catch (error: any) {
        console.error('Optimization error:', error)
        return NextResponse.json({ error: error.message, success: false }, { status: 500 })
    }
}
