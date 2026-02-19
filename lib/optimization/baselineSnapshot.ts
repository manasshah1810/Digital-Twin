import { createAdminClient } from '../supabase/admin'
import { findLeastCostPath, OptimizationResult } from './dijkstra'
import { buildGraph } from '../graph/buildGraph'

export interface BaselineSnapshot {
    result: OptimizationResult
    metadata: {
        computedAt: string
        isLocked: boolean
        datasetId: string
    }
}

export async function getOrSetBaselineSnapshot(
    datasetId: string,
    sourceNodeId: string,
    targetNodeId: string
): Promise<BaselineSnapshot | null> {
    const supabase = createAdminClient()

    // 1. Try to fetch existing snapshot scoped to dataset
    const { data: existing } = await supabase
        .from('baseline_routes')
        .select('route_data, total_cost, created_at')
        .eq('dataset_id', datasetId)
        .eq('source_node_id', sourceNodeId)
        .eq('target_node_id', targetNodeId)
        .single()

    if (existing) {
        return {
            result: {
                path: existing.route_data.path,
                totalCost: Number(existing.total_cost),
                modeBreakdown: existing.route_data.modeBreakdown,
                steps: existing.route_data.steps
            },
            metadata: {
                computedAt: existing.created_at,
                isLocked: true,
                datasetId
            }
        }
    }

    // 2. Compute baseline from the raw dataset (no constraints applied)
    const graph = await buildGraph(datasetId)
    const result = findLeastCostPath(graph, sourceNodeId, targetNodeId)

    if (!result) return null

    // 3. Store snapshot immutably
    const { data: saved, error: storeError } = await supabase
        .from('baseline_routes')
        .insert([{
            dataset_id: datasetId,
            source_node_id: sourceNodeId,
            target_node_id: targetNodeId,
            total_cost: result.totalCost,
            route_data: {
                path: result.path,
                modeBreakdown: result.modeBreakdown,
                steps: result.steps
            }
        }])
        .select('created_at')
        .single()

    if (storeError) {
        console.error('Failed to store baseline snapshot:', storeError)
    }

    return {
        result,
        metadata: {
            computedAt: saved?.created_at || new Date().toISOString(),
            isLocked: true,
            datasetId
        }
    }
}
