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

export async function POST(request: Request) {
    const supabase = createAdminClient()
    const { scenarioId, sourceNodeId, targetNodeId, constraints, targetRank = 1 } = await request.json()

    if (!scenarioId || !sourceNodeId || !targetNodeId) {
        return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 })
    }

    try {
        // 0. Resolve Scenario & Dataset Context
        const { data: scenario, error: sErr } = await supabase
            .from('scenarios')
            .select('id, dataset_id')
            .eq('id', scenarioId)
            .single()

        if (sErr || !scenario?.dataset_id) {
            return NextResponse.json({
                error: 'STRATEGIC BLOCKAGE: No active Bio-Grid (Dataset) associated with this scenario. Please upload and link an architecture first.',
                type: 'SYSTEM_CONFIG_ERROR'
            }, { status: 422 })
        }

        // 1. Build Base Graph from Dataset (Ground Truth)
        const baseGraph = await buildGraph(scenario.dataset_id, scenarioId)

        // 2. Prepare Simulation Config
        const { data: fuelIndices } = await supabase
            .from('fuel_indices')
            .select('fuel_type, price_index')
            .eq('dataset_id', scenario.dataset_id) // Fuel indices now belong to dataset

        const fuelMultipliers: Record<string, number> = {}
        fuelIndices?.forEach(fi => {
            fuelMultipliers[fi.fuel_type] = Number(fi.price_index)
        })

        const config = {
            fuelPriceMultipliers: constraints?.fuelPriceMultipliers || fuelMultipliers,
            closedNodeIds: constraints?.closedNodeIds || [],
            forbiddenModes: constraints?.forbiddenModes || [],
            edgeCapacityThrottles: constraints?.edgeCapacityThrottles || {}
        }

        // 3. Apply Constraints/Shocks (Tactical Layer)
        const constrainedGraph = applyConstraints(baseGraph, config)

        // 4. Run Optimization (K-Shortest Paths, K=3)
        const allResults = findKLeastCostPaths(constrainedGraph, sourceNodeId, targetNodeId, 3)

        if (allResults.length === 0) {
            const sourceNeighbors = baseGraph.adjacencyList.get(sourceNodeId) || []
            const targetInbound = Array.from(baseGraph.adjacencyList.values())
                .flat()
                .filter(e => e.target === targetNodeId)

            return NextResponse.json({
                error: 'NETWORK DISCONNECTED: No feasible trajectory found. Tactical constraints have likely isolated the origin or destination from the network.',
                type: 'REACHABILITY_ERROR',
                diagnostics: {
                    sourceClosed: config.closedNodeIds.includes(sourceNodeId),
                    targetClosed: config.closedNodeIds.includes(targetNodeId),
                    sourceDeadEnd: sourceNeighbors.length === 0,
                    targetIsolated: targetInbound.length === 0,
                    baseGraphStats: {
                        nodesCount: baseGraph.nodes.size,
                        edgesCount: Array.from(baseGraph.adjacencyList.values()).flat().length
                    },
                    constrainedGraphStats: {
                        nodesCount: constrainedGraph.nodes.size,
                        edgesCount: Array.from(constrainedGraph.adjacencyList.values()).flat().length
                    },
                    activeModes: Array.from(baseGraph.adjacencyList.values()).flat().map(e => e.mode).filter(m => !config.forbiddenModes.includes(m))
                }
            }, { status: 422 })
        }

        // Edge Case Detection: System Alerts
        const systemAlerts = []

        // 1. Multiple Optima
        if (allResults.length > 1 && allResults[0].totalCost === allResults[1].totalCost) {
            systemAlerts.push({
                type: 'MULTIPLE_OPTIMA',
                severity: 'INFO',
                message: 'Non-Unique Solution: Multiple trajectories identified with identical least-cost metrics. Load balancing is theoretically possible.'
            })
        }

        // 2. Extreme Shock
        const fuelMultipliers_vals = Object.values(config.fuelPriceMultipliers) as number[]
        const maxFuelMultiplier = fuelMultipliers_vals.length > 0 ? Math.max(...fuelMultipliers_vals) : 1
        if (maxFuelMultiplier > 5) {
            systemAlerts.push({
                type: 'HYPER_SHOCK',
                severity: 'CRITICAL',
                message: `Extreme Volatility: Fuel multiplier (${maxFuelMultiplier.toFixed(1)}x) exceeds standard volatility bounds (>5.0x).`
            })
        }

        // Select the path based on requested rank (clamped to available results)
        const selectedIndex = Math.min(Math.max(0, targetRank - 1), allResults.length - 1);
        const result = allResults[selectedIndex]

        // 5. Build/Retrieve Baseline Snapshot for Comparison (Dataset-scoped)
        const baselineSnapshot = await getOrSetBaselineSnapshot(scenario.dataset_id, sourceNodeId, targetNodeId)
        const baselineResult = baselineSnapshot?.result

        // 6. Compute Deltas
        const baselineCost = baselineResult?.totalCost || result.totalCost
        const absDelta = result.totalCost - baselineCost
        const relDelta = baselineCost !== 0 ? (absDelta / baselineCost) * 100 : 0

        const technicalExplanation = explainRouteChange(baselineResult || result, result, config)

        // 6.5 Resolve Human Readable Path Data for all alternatives
        const processedResults = allResults.map((r: OptimizationResult, index: number) => {
            const pDetails = r.path.map((id: string) => {
                const node = baseGraph.nodes.get(id);
                return {
                    id: id,
                    name: node?.name || 'Unknown Terminal',
                    type: node?.type || 'N/A',
                    latitude: node?.latitude,
                    longitude: node?.longitude
                };
            });

            return {
                rank: index + 1,
                ...r,
                pathDetails: pDetails,
                readablePath: pDetails.map((n: any) => `${n.name} [${n.type.toUpperCase()}]`)
            };
        });

        const primaryProcessed = processedResults[selectedIndex];

        // 6.75 Bottleneck Detection (on selected path)
        const bottlenecks: any[] = [];
        result.steps.forEach((step: any, i: number) => {
            if (i === 0) return; // Skip origin
            const baselineStep = baselineResult?.steps.find((s: any) => s.nodeId === step.nodeId);
            const marginalIncrease = baselineStep ? step.cost - baselineStep.cost : 0;

            const node = baseGraph.nodes.get(step.nodeId);
            const metadata = node?.metadata || {};
            const capacity = metadata.capacity || 0;
            const currentLoad = metadata.currentLoad || 0;
            const utilization = capacity > 0 ? (currentLoad / capacity) * 100 : 0;

            if (marginalIncrease > 0) {
                bottlenecks.push({
                    type: 'EDGE_COST_SPIKE',
                    nodeId: step.nodeId,
                    entity: `${primaryProcessed.pathDetails[i - 1].name} -> ${primaryProcessed.pathDetails[i].name}`,
                    severity: marginalIncrease > (baselineStep?.cost || 1) ? 'CRITICAL' : 'WARNING',
                    impact: `+$${marginalIncrease.toLocaleString()} marginal cost increase`,
                    marginalCost: marginalIncrease
                });
            }

            if (utilization > 85) {
                bottlenecks.push({
                    type: 'CAPACITY_STRESS',
                    nodeId: step.nodeId,
                    entity: node?.name,
                    severity: utilization > 95 ? 'CRITICAL' : 'WARNING',
                    impact: `Terminal utilization at ${utilization.toFixed(1)}%`,
                    utilization: utilization
                });
            }

            if (config.closedNodeIds.includes(step.nodeId)) {
                bottlenecks.push({
                    type: 'NODE_TERMINATION',
                    nodeId: step.nodeId,
                    entity: node?.name,
                    severity: 'CRITICAL',
                    impact: 'Operational failure: Traffic rerouted through higher-cost path'
                });
            }
        });

        // 7. Generate LLM Explanation via OpenRouter
        const llmResult = await generateExplanation(
            { path: baselineResult?.path || [], totalCost: baselineCost },
            { path: result.path, totalCost: result.totalCost },
            absDelta,
            config
        )

        // 7.5 Generate Operational Implications
        const implications = await generateOperationalImplications({
            deltas: { absolute: absDelta, percentage: relDelta },
            bottlenecks,
            modeBreakdown: result.modeBreakdown
        })

        // 7.75 Generate Strategic Recommendations
        const recommendations = await generateRecommendations({
            deltas: { absolute: absDelta, percentage: relDelta },
            bottlenecks,
            modeBreakdown: result.modeBreakdown
        })

        // 7.85 Generate Confidence & Limitations
        const confidence = await generateConfidenceBoundaries({
            scenarioId,
            sourceNodeId,
            targetNodeId,
            constraints: config
        })

        // 8. Persist Optimization Results with Ranked Alternatives
        const { data: savedResult, error: saveError } = await supabase
            .from('optimization_results')
            .insert([{
                scenario_id: scenarioId,
                total_cost: result.totalCost,
                run_status: 'completed',
                result_data: {
                    ...primaryProcessed,
                    alternatives: processedResults.filter((_, idx) => idx !== selectedIndex),
                    constraintsApplied: config,
                    technicalExplanation: technicalExplanation,
                    bottlenecks: bottlenecks,
                    operationalImplications: implications,
                    recommendedActions: recommendations,
                    confidenceBoundaries: confidence,
                    deltas: {
                        absoluteCost: absDelta,
                        percentChange: relDelta,
                        baselineSnapshotId: baselineResult ? (baselineResult as any).id : null
                    }
                }
            }])
            .select()
            .single()

        if (saveError) throw saveError

        // 9. Persist Decision Trace (LLM Explanation)
        const { error: traceError } = await supabase
            .from('decision_traces')
            .insert([{
                optimization_result_id: savedResult.id,
                scenario_id: scenarioId,
                step_number: 1,
                decision_type: 'ROUTE_SHOCK_RECALCULATION',
                rationale: llmResult.summary,
                impact_metrics: {
                    tradeoffs: llmResult.tradeoffs,
                    costDelta: absDelta,
                    percentChange: relDelta,
                    baselinePath: baselineResult?.path,
                    optimizedPath: result.path,
                    alternativesCount: allResults.length
                }
            }])

        if (traceError) console.error('Failed to save decision trace:', traceError)

        // Resolve human-readable baseline for map comparison
        const baselinePathDetails = baselineResult?.path.map((id: string) => {
            const node = baseGraph.nodes.get(id);
            return {
                id: id,
                name: node?.name || 'Unknown Terminal',
                type: node?.type || 'N/A',
                latitude: node?.latitude,
                longitude: node?.longitude
            };
        }) || [];

        return NextResponse.json({
            success: true,
            resultId: savedResult.id,
            ...primaryProcessed,
            alternatives: processedResults.filter((_, idx) => idx !== selectedIndex),
            baselinePath: baselinePathDetails,
            baselineMetadata: baselineSnapshot?.metadata,
            constraints: config,
            bottlenecks: bottlenecks,
            systemAlerts: systemAlerts,
            implications: implications,
            recommendations: recommendations,
            confidence: confidence,
            deltas: {
                absolute: absDelta,
                percentage: relDelta
            },
            explanation: {
                summary: llmResult.summary,
                tradeoffs: llmResult.tradeoffs,
                technical: technicalExplanation.reason,
                isDegraded: (llmResult as any).isDegraded || false
            }
        })

    } catch (error: any) {
        console.error('Optimization error:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
