import { LogisticsGraph, GraphEdge, GraphNode } from './buildGraph'
import { calculatePhysicsCost } from '../optimization/physics'

export interface SimulationScenarioConfig {
    fuelPriceMultipliers: Record<string, number> // mode -> multiplier (e.g., {'truck': 1.2})
    closedNodeIds: string[]
    edgeCapacityThrottles: Record<string, number> // edge id -> percentage (0.0 to 1.0)
    forbiddenModes?: string[]
    softModeConstraints?: boolean // If true, forbidden modes are penalized (1000x cost) instead of removed
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
    // Normalize mode synonyms to canonical form
    const normMode = (m: string) => {
        const l = m.toLowerCase()
        if (l === 'plane' || l === 'flight' || l === 'aviation') return 'air'
        if (l === 'maritime' || l === 'vessel' || l === 'ocean') return 'sea'
        if (l === 'train' || l === 'freight rail') return 'rail'
        if (l === 'road') return 'truck'
        return l
    }
    const forbiddenModes = new Set((config.forbiddenModes || []).map(m => normMode(m)))
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

            let modePenaltyMultiplier = 1.0

            // Handle Forbidden Modes (synonym-aware)
            const edgeModeNorm = normMode(edge.mode)
            if (forbiddenModes.has(edgeModeNorm)) {
                if (config.softModeConstraints) {
                    modePenaltyMultiplier = 100000.0 // Massive penalty to treat as virtual blockage
                } else {
                    continue // Hard Constraint: Remove edge entirely
                }
            }

            // Clone edge to avoid mutation
            const newEdge: GraphEdge = { ...edge }

            // PHYSICS OVERRIDE: Calculate cost based on KM, Efficiency, and Regional Fuel Price
            const sNode = baseGraph.nodes.get(sourceId)
            const tNode = baseGraph.nodes.get(edge.target)
            const country = sNode?.metadata?.country || tNode?.metadata?.country || 'DEFAULT'

            const physics = calculatePhysicsCost(newEdge.distance, newEdge.mode, country)
            let basePhysicsCost = physics.total

            // Apply Fuel Price Multiplier (User-set nudge) + Mode Penalty
            const fuelMultiplier = config.fuelPriceMultipliers[edgeModeNorm] || 1.0
            const totalMultiplier = fuelMultiplier * modePenaltyMultiplier
            const finalCost = basePhysicsCost * totalMultiplier

            newEdge.costPerUnit = finalCost
            newEdge.metadata = {
                ...edge.metadata,
                costBreakdown: physics.breakdown
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
