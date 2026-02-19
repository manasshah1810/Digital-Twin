import { createAdminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'
import { buildGraph } from '@/lib/graph/buildGraph'
import { applyConstraints } from '@/lib/graph/applyConstraints'
import { findLeastCostPath } from '@/lib/optimization/dijkstra'
import { getOrSetBaselineSnapshot } from '@/lib/optimization/baselineSnapshot'

export async function POST(request: Request) {
    const supabase = createAdminClient()
    const { scenarioId, routePairs, constraints } = await request.json()

    if (!scenarioId || !routePairs || !Array.isArray(routePairs)) {
        return NextResponse.json({ error: 'Missing scenarioId or invalid routePairs array' }, { status: 400 })
    }

    try {
        // 0. Resolve Dataset from Scenario
        const { data: scenario, error: sErr } = await supabase
            .from('scenarios')
            .select('id, dataset_id')
            .eq('id', scenarioId)
            .single()

        if (sErr || !scenario?.dataset_id) {
            return NextResponse.json({
                error: 'No active Bio-Grid linked to this scenario. Upload a dataset first.',
                type: 'SYSTEM_CONFIG_ERROR'
            }, { status: 422 })
        }

        // 1. Build graph from Dataset
        const baseGraph = await buildGraph(scenario.dataset_id)

        // 2. Prepare Simulation Config from Dataset fuel indices
        const { data: fuelIndices } = await supabase
            .from('fuel_indices')
            .select('fuel_type, price_index')
            .eq('dataset_id', scenario.dataset_id)

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

        const constrainedGraph = applyConstraints(baseGraph, config)

        // 3. Find Baseline Scenario for benchmarking
        const { data: baselineScenario } = await supabase
            .from('scenarios')
            .select('id, dataset_id')
            .eq('is_baseline', true)
            .eq('dataset_id', scenario.dataset_id)
            .single()
        const baselineDatasetId = baselineScenario?.dataset_id || scenario.dataset_id

        const results = []
        let totalScenarioCost = 0
        let totalBaselineCost = 0

        for (const pair of routePairs) {
            const { sourceNodeId, targetNodeId } = pair
            const result = findLeastCostPath(constrainedGraph, sourceNodeId, targetNodeId)
            const baseline = await getOrSetBaselineSnapshot(baselineDatasetId, sourceNodeId, targetNodeId)

            if (result && baseline) {
                totalScenarioCost += result.totalCost
                totalBaselineCost += baseline.result.totalCost
                results.push({
                    source: sourceNodeId,
                    target: targetNodeId,
                    cost: result.totalCost,
                    baselineCost: baseline.result.totalCost,
                    delta: result.totalCost - baseline.result.totalCost
                })
            }
        }

        const absDelta = totalScenarioCost - totalBaselineCost
        const relDelta = totalBaselineCost !== 0 ? (absDelta / totalBaselineCost) * 100 : 0

        return NextResponse.json({
            success: true,
            summary: {
                totalCost: totalScenarioCost,
                totalBaselineCost,
                absoluteDelta: absDelta,
                averagePercentageDelta: relDelta,
                routesProcessed: results.length
            },
            individualResults: results
        })

    } catch (error: any) {
        console.error('Batch optimization error:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
