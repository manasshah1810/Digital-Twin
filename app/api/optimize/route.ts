import { createAdminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'
import { buildGraph } from '@/lib/graph/buildGraph'
import { applyConstraints } from '@/lib/graph/applyConstraints'
import { findLeastCostPath, findKLeastCostPaths, OptimizationResult } from '@/lib/optimization/dijkstra'
import { explainRouteChange } from '@/lib/explainability/explainRouteChange'
import { generateExplanation } from '@/lib/explainability/generateExplanation'
import { getOrSetBaselineSnapshot } from '@/lib/optimization/baselineSnapshot'
import { generateOperationalImplications } from '@/lib/explainability/operationalImplications'
import { generateRecommendations } from '@/lib/explainability/recommendedActions'
import { generateConfidenceBoundaries } from '@/lib/explainability/confidenceGuard'
import { suggestInfrastructureLink } from '@/lib/explainability/suggestInfrastructureLink'
import { diagnoseDisruption } from '@/lib/explainability/diagnoseDisruption'
import { calculatePhysicsCost, getRegionalFuelPrice } from '@/lib/optimization/physics'
import { getStrategicRoutingOptions } from '@/lib/optimization/strategicAI'

export async function POST(request: Request) {
    const supabase = createAdminClient()
    const {
        scenarioId,
        sourceNodeId,
        targetNodeId,
        constraints,
        targetRank = 1,
        weightMode = 'balanced',
        timeValue = 25,
        cargo // { packageCount, packageWeight, packageVolume }
    } = await request.json()

    if (!scenarioId || !sourceNodeId || !targetNodeId) {
        return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 })
    }

    try {
        // 0. Resolve Context
        const { data: scenario, error: sErr } = await supabase
            .from('scenarios')
            .select('id, dataset_id')
            .eq('id', scenarioId)
            .maybeSingle()

        if (sErr) throw new Error(sErr.message)
        if (!scenario) throw new Error('Scenario not found')
        if (!scenario.dataset_id) throw new Error('No dataset linked to scenario')

        // 1. Build Base Graph 
        const baseGraph = await buildGraph(scenario.dataset_id, scenarioId)
        const sNode = baseGraph.nodes.get(sourceNodeId)
        const tNode = baseGraph.nodes.get(targetNodeId)

        if (!sNode || !tNode) throw new Error('Source or Target missing')

        // 2. STRATEGIC AI LAYER (Top 10 Logical Paths)
        const { data: modesData } = await supabase.from('route_edges').select('mode').eq('dataset_id', scenario.dataset_id)
        const availableModes = Array.from(new Set(modesData?.map(m => m.mode).filter(Boolean) || []))
        const strategicOptions = await getStrategicRoutingOptions(sNode, tNode, cargo, availableModes)

        // 3. Prepare Config
        const { data: fuelIndices } = await supabase
            .from('fuel_indices')
            .select('fuel_type, price_index')
            .eq('dataset_id', scenario.dataset_id)

        const fuelMultipliers: Record<string, number> = {}
        fuelIndices?.forEach(fi => { fuelMultipliers[fi.fuel_type] = Number(fi.price_index) })

        const config = {
            fuelPriceMultipliers: constraints?.fuelPriceMultipliers || fuelMultipliers,
            closedNodeIds: constraints?.closedNodeIds || [],
            forbiddenModes: constraints?.forbiddenModes || [],
            edgeCapacityThrottles: constraints?.edgeCapacityThrottles || {}
        }

        // 4. Transform AI Strategies into Calculated Results
        const getTripsForMode = (mode: string) => {
            if (!cargo) return 1
            const weight = (cargo.packageCount || 0) * (cargo.packageWeight || 0)
            if (weight === 0) return Math.ceil((cargo.packageCount || 1) / 1000)

            const m = mode.toLowerCase()
            let cap = 20000 // default truck
            if (m.includes('sea') || m.includes('maritim') || m.includes('vessel')) cap = 28000
            else if (m.includes('rail') || m.includes('train')) cap = 30000
            else if (m.includes('air') || m.includes('flight') || m.includes('plane')) cap = 5000
            return Math.ceil(weight / cap)
        }

        const aiResults: any[] = strategicOptions.map((strat, sIdx) => {
            let totalCost = 0, totalCO2 = 0, totalTime = 0
            const steps: any[] = [{ nodeId: sourceNodeId, name: sNode.name, latitude: sNode.latitude, longitude: sNode.longitude, cost: 0 }]
            const path: string[] = [sourceNodeId]
            const modeBreakdown: Record<string, number> = {}

            const totalLoad = (cargo?.packageCount || 0) * (cargo?.packageWeight || 0)
            const capacities: Record<string, number> = { 'truck': 20000, 'rail': 30000, 'sea': 28000, 'air': 5000 }

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

                // Heuristic matching for AI modes
                const lowMode = v.mode.toLowerCase()
                const isSea = lowMode.includes('sea') || lowMode.includes('maritim') || lowMode.includes('vessel')
                const isRail = lowMode.includes('rail') || lowMode.includes('train')
                const isAir = lowMode.includes('air') || lowMode.includes('flight') || lowMode.includes('aviation')

                const cap = isSea ? 28000 : (isRail ? 30000 : (isAir ? 5000 : 20000))
                const tripWeight = trips > 0 ? totalLoad / trips : 0

                const phys = calculatePhysicsCost(dist, v.mode, sNode.metadata?.country, tripWeight, cap)
                const cost = phys.total * trips
                totalCost += cost

                const baseCO2 = isSea ? 0.015 : (isRail ? 0.04 : (isAir ? 0.8 : 0.12))
                totalCO2 += dist * baseCO2 * trips * (1 + (tripWeight / cap) * 0.2)

                const speed = isSea ? 25 : (isRail ? 45 : (isAir ? 800 : 60))
                totalTime += dist / speed
                modeBreakdown[v.mode] = (modeBreakdown[v.mode] || 0) + cost

                // Snap the last step to targetNodeId
                const isLast = i === strat.steps.length - 2
                const vid = isLast ? targetNodeId : `AI_${sIdx}_${i}`

                path.push(vid)
                steps.push({
                    nodeId: vid,
                    name: isLast ? tNode.name : v.haltName,
                    latitude: isLast ? tNode.latitude : v.latitude,
                    longitude: isLast ? tNode.longitude : v.longitude,
                    mode: v.mode,
                    cost,
                    isNautical: isSea,
                    instruction: v.instruction
                })
            }
            return { strategyName: strat.strategyName, generativeReason: strat.description, path, totalCost, totalCO2, totalTransitTime: totalTime, steps, modeBreakdown, isStrategicAI: true, isGenerative: true }
        })

        // 5. Run Technical Optimization
        let constrainedGraph = applyConstraints(baseGraph, config)
        let dijkstraResults = findKLeastCostPaths(constrainedGraph, sourceNodeId, targetNodeId, 3, weightMode, timeValue, cargo)

        // Merge & Sort
        let allResults = [...aiResults, ...dijkstraResults]
        allResults.sort((a, b) => {
            if (weightMode === 'time') return a.totalTransitTime - b.totalTransitTime
            if (weightMode === 'co2') return a.totalCO2 - b.totalCO2
            return (a.totalCost + a.totalTransitTime * timeValue) - (b.totalCost + b.totalTransitTime * timeValue)
        })

        if (allResults.length === 0) throw new Error('No path found')

        // Process final high-fidelity results
        const processedResults = allResults.map((res: any, index: number) => {
            let pathDetails: any[]

            if (res.isStrategicAI && res.steps) {
                // AI results: steps already contain full coordinate data — use directly
                pathDetails = res.steps.map((step: any) => ({
                    id: step.nodeId,
                    name: step.name || 'AI Waypoint',
                    type: step.mode?.toUpperCase() || 'HUB',
                    latitude: step.latitude,
                    longitude: step.longitude,
                    mode: step.mode,
                    isNautical: step.isNautical || false,
                    metadata: { instruction: step.instruction }
                }))
            } else {
                // Dijkstra results: resolve from graph
                const resultPath = res.path || []
                pathDetails = resultPath.map((nodeId: string, idx: number) => {
                    const node = baseGraph.nodes.get(nodeId)
                    let detail: any = {
                        id: nodeId,
                        name: node?.name || 'Wait-point',
                        type: node?.type || 'HUB',
                        latitude: node?.latitude,
                        longitude: node?.longitude,
                        metadata: node?.metadata || {}
                    }

                    if (idx > 0) {
                        const prevNodeId = resultPath[idx - 1]
                        const edge = constrainedGraph.adjacencyList.get(prevNodeId)?.find(e => e.target === nodeId)
                        if (edge) {
                            detail.mode = edge.mode
                            const lowMode = (edge.mode || '').toLowerCase()
                            detail.isNautical = lowMode.includes('sea') || lowMode.includes('maritim') || lowMode.includes('vessel')
                        }
                    }
                    return detail
                })
            }

            // Ensure every result has a cost breakdown
            if (!res.costBreakdown && res.path.length > 1 && !res.isStrategicAI) {
                const breakdown = { fuel: 0, maintenance: 0, fees: 0, distanceKm: 0, fuelPriceUsed: 0, efficiencyUsed: 0 }
                for (let i = 0; i < res.path.length - 1; i++) {
                    const u = res.path[i], v = res.path[i + 1]
                    const edge = constrainedGraph.adjacencyList.get(u)?.find(e => e.target === v)
                    if (edge?.metadata?.costBreakdown) {
                        const b = edge.metadata.costBreakdown
                        breakdown.fuel += b.fuel; breakdown.maintenance += b.maintenance; breakdown.fees += b.fees; breakdown.distanceKm += b.distanceKm
                    }
                }
                res.costBreakdown = breakdown
            }

            return {
                rank: index + 1,
                ...res,
                pathDetails,
                readablePath: pathDetails.map((n: any) => `${n.name} [${n.type.toUpperCase()}]`),
                sourceNodeId,
                targetNodeId
            }
        })

        const selectedIndex = Math.min(Math.max(0, targetRank - 1), processedResults.length - 1);
        const result = processedResults[selectedIndex]

        const systemAlerts = []
        if (result.isStrategicAI) {
            systemAlerts.push({
                type: 'AI_STRATEGIC_PLAN',
                severity: 'INFO',
                message: `Master Planner: This route follows the '${result.strategyName}' strategy. AI logically identified multimodal hubs to prevent infrastructure gaps.`
            })
        }
        if (!cargo?.packageCount) {
            systemAlerts.push({ type: 'DATA_GAP', severity: 'WARNING', message: 'Cargo Volume Missing: Using single-unit estimates.' })
        }

        // Snapshots & Metrics
        const baselineSnapshot = await getOrSetBaselineSnapshot(scenario.dataset_id, sourceNodeId, targetNodeId)
        const baselineResult = baselineSnapshot?.result
        const baselineCost = baselineResult?.totalCost || result.totalCost
        const absDelta = result.totalCost - baselineCost
        const relDelta = baselineCost !== 0 ? (absDelta / baselineCost) * 100 : 0
        const baselineCO2 = baselineResult?.totalCO2 || result.totalCO2
        const co2Delta = result.totalCO2 - baselineCO2
        const co2RelDelta = baselineCO2 !== 0 ? (co2Delta / baselineCO2) * 100 : 0
        const baselineTime = baselineResult?.totalTransitTime || result.totalTransitTime
        const timeDelta = result.totalTransitTime - baselineTime
        const timeRelDelta = baselineTime !== 0 ? (timeDelta / baselineTime) * 100 : 0

        const technicalExplanation = explainRouteChange(baselineResult || result, result, config)

        const bottlenecks: any[] = []
        result.steps.forEach((step: any, i: number) => {
            if (i === 0) return
            const node = baseGraph.nodes.get(step.nodeId)
            const metadata = node?.metadata || {}
            if (metadata.currentLoad / metadata.capacity > 0.95) {
                bottlenecks.push({ type: 'CAPACITY_STRESS', entity: node?.name, severity: 'CRITICAL', impact: 'Terminal congestion' })
            }
        })

        const llmResult = await generateExplanation(
            { path: baselineResult?.path || [], totalCost: baselineCost },
            { path: result.path, totalCost: result.totalCost },
            absDelta,
            config
        )

        const implications = await generateOperationalImplications({ deltas: { absolute: absDelta, percentage: relDelta }, bottlenecks, modeBreakdown: result.modeBreakdown })
        const recommendations = await generateRecommendations({ deltas: { absolute: absDelta, percentage: relDelta }, bottlenecks, modeBreakdown: result.modeBreakdown })
        const confidence = await generateConfidenceBoundaries({ scenarioId, sourceNodeId, targetNodeId, constraints: config })

        const { data: savedResult, error: saveError } = await supabase
            .from('optimization_results')
            .insert([{
                scenario_id: scenarioId,
                total_cost: result.totalCost,
                run_status: 'completed',
                result_data: {
                    ...result,
                    alternatives: processedResults.filter((_, idx) => idx !== selectedIndex),
                    constraintsApplied: config,
                    technicalExplanation, bottlenecks, operationalImplications: implications, recommendedActions: recommendations, confidenceBoundaries: confidence,
                    deltas: { absoluteCost: absDelta, percentChange: relDelta, co2Delta, co2PercentChange: co2RelDelta, timeDelta, timePercentChange: timeRelDelta }
                }
            }])
            .select().single()

        // Resolve human-readable baseline for map comparison (Detailed objects)
        const baselinePathDetails = baselineResult?.path.map((id: string) => {
            const node = baseGraph.nodes.get(id);
            return {
                id,
                name: node?.name || 'Unknown',
                type: node?.type || 'N/A',
                latitude: node?.latitude,
                longitude: node?.longitude
            };
        }) || [];

        return NextResponse.json({
            success: true,
            resultId: savedResult.id,
            ...result,
            alternatives: processedResults.filter((_, idx) => idx !== selectedIndex),
            baselinePath: baselinePathDetails, // Now full objects
            constraints: config,
            bottlenecks,
            systemAlerts,
            implications,
            recommendations,
            confidence,
            deltas: { absolute: absDelta, percentage: relDelta, co2: co2Delta, co2Percentage: co2RelDelta, time: timeDelta, timePercentage: timeRelDelta },
            explanation: { summary: llmResult.summary, tradeoffs: llmResult.tradeoffs, technical: technicalExplanation.reason }
        })

    } catch (error: any) {
        console.error('Optimization error:', error)
        return NextResponse.json({
            error: error.message,
            success: false,
            diagnostics: {
                message: "A fundamental topology gap was detected. Check if your dataset contains links between these continents or hubs."
            }
        }, { status: 500 })
    }
}
