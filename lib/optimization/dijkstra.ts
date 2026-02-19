import { LogisticsGraph, GraphNode, GraphEdge } from '../graph/buildGraph'

export interface RouteStep {
    nodeId: string
    mode?: string
    cost: number
}

export interface OptimizationResult {
    path: string[]
    totalCost: number
    modeBreakdown: Record<string, number>
    steps: RouteStep[]
}

/**
 * Implements Dijkstra's algorithm to find the least-cost path in the logistics graph.
 */
export function findLeastCostPath(
    graph: LogisticsGraph,
    sourceId: string,
    targetId: string,
    removedEdges: Set<string> = new Set(),
    removedNodes: Set<string> = new Set()
): OptimizationResult | null {
    if (removedNodes.has(sourceId) || removedNodes.has(targetId)) return null

    const distances = new Map<string, number>()
    const previous = new Map<string, { nodeId: string; mode?: string; cost: number } | null>()
    const visited = new Set<string>()

    for (const nodeId of graph.nodes.keys()) {
        distances.set(nodeId, Infinity)
        previous.set(nodeId, null)
    }
    distances.set(sourceId, 0)

    const priorityQueue: [string, number][] = [[sourceId, 0]]

    while (priorityQueue.length > 0) {
        priorityQueue.sort((a, b) => a[1] - b[1])
        const [uId, uDist] = priorityQueue.shift()!

        if (visited.has(uId)) continue
        visited.add(uId)

        if (uId === targetId) break

        const neighbors = graph.adjacencyList.get(uId) || []
        for (const edge of neighbors) {
            if (visited.has(edge.target) || removedNodes.has(edge.target)) continue

            const edgeKey = `${uId}-${edge.target}-${edge.mode}`
            if (removedEdges.has(edgeKey)) continue

            // Edge Case: Respect strict zero capacity as a blockage
            if (edge.capacity === 0) continue

            const weight = edge.costPerUnit !== undefined ? edge.distance * edge.costPerUnit : edge.distance
            const alt = uDist + weight

            if (alt < (distances.get(edge.target) || Infinity)) {
                distances.set(edge.target, alt)
                previous.set(edge.target, { nodeId: uId, mode: edge.mode, cost: weight })
                priorityQueue.push([edge.target, alt])
            }
        }
    }

    if (distances.get(targetId) === Infinity) return null

    const path: string[] = []
    const steps: RouteStep[] = []
    const modeBreakdown: Record<string, number> = {}
    let currId: string | undefined = targetId
    let totalCost = distances.get(targetId) || 0

    while (currId) {
        path.unshift(currId)
        const prev = previous.get(currId)

        if (prev) {
            steps.unshift({ nodeId: currId, mode: prev.mode, cost: prev.cost })
            if (prev.mode) {
                modeBreakdown[prev.mode] = (modeBreakdown[prev.mode] || 0) + prev.cost
            }
            currId = prev.nodeId
        } else {
            steps.unshift({ nodeId: currId, cost: 0 })
            currId = undefined
        }
    }

    return { path, totalCost, modeBreakdown, steps }
}

/**
 * Implements Yen's algorithm to find the K shortest paths.
 */
export function findKLeastCostPaths(
    graph: LogisticsGraph,
    sourceId: string,
    targetId: string,
    K: number = 3
): OptimizationResult[] {
    const A: OptimizationResult[] = []
    const B: OptimizationResult[] = []

    const firstPath = findLeastCostPath(graph, sourceId, targetId)
    if (!firstPath) return []
    A.push(firstPath)

    for (let k = 1; k < K; k++) {
        const prevPath = A[k - 1]

        for (let i = 0; i < prevPath.path.length - 1; i++) {
            const spurNode = prevPath.path[i]
            const rootPathSteps = prevPath.steps.slice(0, i + 1)
            const rootPathNodes = prevPath.path.slice(0, i + 1)

            const removedEdges = new Set<string>()
            for (const path of A) {
                if (JSON.stringify(path.path.slice(0, i + 1)) === JSON.stringify(rootPathNodes)) {
                    const nextStep = path.steps[i + 1]
                    if (nextStep) {
                        removedEdges.add(`${spurNode}-${nextStep.nodeId}-${nextStep.mode}`)
                    }
                }
            }

            const removedNodes = new Set<string>(rootPathNodes.slice(0, -1))

            const spurPath = findLeastCostPath(graph, spurNode, targetId, removedEdges, removedNodes)

            if (spurPath) {
                const totalPath = [...rootPathNodes.slice(0, -1), ...spurPath.path]
                const totalSteps = [...rootPathSteps.slice(0, -1), ...spurPath.steps]

                const totalCost = rootPathSteps.reduce((acc, s) => acc + s.cost, 0) - rootPathSteps[i].cost + spurPath.totalCost

                const modeBreakdown: Record<string, number> = {}
                totalSteps.forEach(s => {
                    if (s.mode) modeBreakdown[s.mode] = (modeBreakdown[s.mode] || 0) + s.cost
                })

                const candidate: OptimizationResult = {
                    path: totalPath,
                    totalCost,
                    modeBreakdown,
                    steps: totalSteps
                }

                if (!B.some(p => JSON.stringify(p.steps) === JSON.stringify(candidate.steps))) {
                    B.push(candidate)
                }
            }
        }

        if (B.length === 0) break
        B.sort((a, b) => a.totalCost - b.totalCost)
        A.push(B.shift()!)
    }

    return A
}

