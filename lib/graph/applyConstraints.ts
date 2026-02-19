import { LogisticsGraph, GraphEdge, GraphNode } from './buildGraph'

export interface SimulationScenarioConfig {
    fuelPriceMultipliers: Record<string, number> // mode -> multiplier (e.g., {'truck': 1.2})
    closedNodeIds: string[]
    edgeCapacityThrottles: Record<string, number> // edge id -> percentage (0.0 to 1.0)
    forbiddenModes?: string[]
}

/**
 * Applies shocks and constraints to a logistics graph.
 * This process is deterministic and does not mutate the original graph.
 */
export function applyConstraints(
    baseGraph: LogisticsGraph,
    config: SimulationScenarioConfig
): LogisticsGraph {
    const closedNodes = new Set(config.closedNodeIds)
    const forbiddenModes = new Set(config.forbiddenModes || [])
    const newNodes = new Map<string, GraphNode>()
    const newAdjacencyList = new Map<string, GraphEdge[]>()

    // 1. Filter Nodes
    for (const [nodeId, node] of baseGraph.nodes) {
        if (!closedNodes.has(nodeId)) {
            newNodes.set(nodeId, { ...node })
            newAdjacencyList.set(nodeId, [])
        }
    }

    // 2. Filter and Modify Edges
    for (const [sourceId, edges] of baseGraph.adjacencyList) {
        // Skip if source node is closed
        if (closedNodes.has(sourceId)) continue

        const modifiedEdges: GraphEdge[] = []

        for (const edge of edges) {
            // Skip if target node is closed
            if (closedNodes.has(edge.target)) continue

            // Skip if mode is forbidden
            if (forbiddenModes.has(edge.mode)) continue

            // Clone edge to avoid mutation
            const newEdge: GraphEdge = { ...edge }

            // Apply Fuel Price Multiplier
            const multiplier = config.fuelPriceMultipliers[newEdge.mode] || 1.0
            if (newEdge.costPerUnit !== undefined) {
                newEdge.costPerUnit = newEdge.costPerUnit * multiplier
            }

            // Apply Capacity Throttling
            const throttle = config.edgeCapacityThrottles[newEdge.id] ?? 1.0
            if (newEdge.capacity !== undefined) {
                newEdge.capacity = newEdge.capacity * throttle
            }

            modifiedEdges.push(newEdge)
        }

        newAdjacencyList.set(sourceId, modifiedEdges)
    }

    return {
        nodes: newNodes,
        adjacencyList: newAdjacencyList
    }
}
