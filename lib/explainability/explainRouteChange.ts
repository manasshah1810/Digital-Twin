import { OptimizationResult } from '../optimization/dijkstra'
import { SimulationScenarioConfig } from '../graph/applyConstraints'

export interface RouteDifference {
    type: 'path_change' | 'cost_increase' | 'no_change'
    reason: string
    invalidatedNodes: string[]
    invalidatedEdges: string[]
    dominantCostFactor: string
    costDelta: number
}

/**
 * Compares a baseline route against an optimized route to explain why changes occurred.
 */
export function explainRouteChange(
    baselineResult: OptimizationResult,
    optimizedResult: OptimizationResult,
    config: SimulationScenarioConfig
): RouteDifference {
    const costDelta = optimizedResult.totalCost - baselineResult.totalCost
    const pathChanged = JSON.stringify(baselineResult.path) !== JSON.stringify(optimizedResult.path)

    const invalidatedNodes: string[] = []
    const invalidatedEdges: string[] = []

    // Identify invalidated components from the baseline path
    baselineResult.path.forEach((nodeId) => {
        if (config.closedNodeIds.includes(nodeId)) {
            invalidatedNodes.push(nodeId)
        }
    })

    // Check if any edges in the original path were throttled or became too expensive
    for (let i = 0; i < baselineResult.path.length - 1; i++) {
        const source = baselineResult.path[i]
        const target = baselineResult.path[i + 1]

        // In a real scenario, we'd lookup the edge ID. For this simulation, 
        // we check the config for any throttles or high multipliers affecting this segment.
        // Assuming edge IDs might be mapped in a full implementation.
    }

    // Determine dominant cost factor
    let dominantCostFactor = 'distance'
    const modeChanges = Object.keys(config.fuelPriceMultipliers).filter(m => config.fuelPriceMultipliers[m] > 1.0)

    if (modeChanges.length > 0) {
        dominantCostFactor = `fuel_price_spike:${modeChanges.join(',')}`
    } else if (config.closedNodeIds.length > 0) {
        dominantCostFactor = 'infrastructure_closure'
    }

    let type: RouteDifference['type'] = 'no_change'
    let reason = 'The route remains optimal despite simulation constraints.'

    if (pathChanged) {
        type = 'path_change'
        reason = invalidatedNodes.length > 0
            ? `Route diversion required due to node closures: ${invalidatedNodes.join(', ')}.`
            : `Route recalculated to minimize cost after fuel price adjustments.`
    } else if (costDelta > 0) {
        type = 'cost_increase'
        reason = `The path is still the most efficient, but total costs increased by ${costDelta.toFixed(2)} due to fuel price shocks.`
    }

    return {
        type,
        reason,
        invalidatedNodes,
        invalidatedEdges,
        dominantCostFactor,
        costDelta
    }
}
