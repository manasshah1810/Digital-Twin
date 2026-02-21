import { LogisticsGraph, GraphNode, GraphEdge } from '../graph/buildGraph'

export interface RouteStep {
    nodeId: string
    mode?: string
    cost: number
}

export interface OptimizationResult {
    path: string[]
    totalCost: number
    totalCO2: number
    totalTransitTime: number
    modeBreakdown: Record<string, number>
    steps: RouteStep[]
}

export const getModeFactors = (mode: string) => {
    const m = mode.toLowerCase()
    if (m.includes('sea') || m.includes('maritime')) return { co2: 0.015, speed: 25 }
    if (m.includes('rail') || m.includes('train')) return { co2: 0.04, speed: 45 }
    if (m.includes('air') || m.includes('flight')) return { co2: 0.8, speed: 800 }
    return { co2: 0.12, speed: 60 } // truck default
}

export interface CargoConfig {
    packageCount: number
    packageWeight?: number // kg
    packageVolume?: number // m3
}

/**
 * Implements Dijkstra's algorithm to find the optimized path in the logistics graph.
 */
export type WeightMode = 'cost' | 'time' | 'balanced' | 'co2'

export function findLeastCostPath(
    graph: LogisticsGraph,
    sourceId: string,
    targetId: string,
    removedEdges: Set<string> = new Set(),
    removedNodes: Set<string> = new Set(),
    weightMode: WeightMode = 'cost',
    timeValue: number = 25, // USD per hour for balanced trade-off
    cargo?: CargoConfig
): OptimizationResult | null {
    console.log(`[Dijkstra] Pathfinding started: ${sourceId} -> ${targetId} (Mode: ${weightMode})`)
    if (removedNodes.has(sourceId) || removedNodes.has(targetId)) {
        console.log(`[Dijkstra] Source or target node removed. Returning null.`)
        return null
    }

    const scores = new Map<string, number>()
    const previous = new Map<string, { nodeId: string; mode?: string; cost: number; transitTime: number; trips: number } | null>()
    const visited = new Set<string>()

    for (const nodeId of graph.nodes.keys()) {
        scores.set(nodeId, Infinity)
        previous.set(nodeId, null)
    }
    scores.set(sourceId, 0)

    const priorityQueue: [string, number][] = [[sourceId, 0]]
    let visitedCount = 0

    while (priorityQueue.length > 0) {
        priorityQueue.sort((a, b) => a[1] - b[1])
        const [uId, uScore] = priorityQueue.shift()!

        if (visited.has(uId)) continue
        visited.add(uId)
        visitedCount++

        if (uId === targetId) {
            console.log(`[Dijkstra] Target reached. Visited ${visitedCount} nodes. Total Score: ${uScore}`)
            break
        }

        const neighbors = graph.adjacencyList.get(uId) || []
        for (const edge of neighbors) {
            if (visited.has(edge.target) || removedNodes.has(edge.target)) continue

            const edgeKey = `${uId}-${edge.target}-${edge.mode}`
            if (removedEdges.has(edgeKey)) continue

            // Edge Case: Respect strict zero capacity as a blockage
            if (edge.capacity === 0) continue

            // Calculate Trips based on Cargo weight and mode-specific capacities
            let trips = 1
            if (cargo && cargo.packageCount > 0) {
                const totalWeight = cargo.packageCount * (cargo.packageWeight || 1)

                const m = edge.mode?.toLowerCase() || ''
                let cap = 20000 // default truck
                if (m.includes('sea') || m.includes('maritimes')) cap = 28000
                else if (m.includes('rail') || m.includes('train')) cap = 30000
                else if (m.includes('air') || m.includes('flight')) cap = 5000

                const effectiveCapacity = edge.capacity || cap
                trips = Math.ceil(totalWeight / effectiveCapacity)
            }

            const baseCost = edge.costPerUnit !== undefined ? edge.distance * edge.costPerUnit : edge.distance
            const cost = baseCost * trips
            const time = edge.transitTime || 0 // Time doesn't scale linearly with packets (parallel loading/unloading)

            const factors = getModeFactors(edge.mode || 'truck')
            const co2 = edge.distance * factors.co2 * trips

            let weight = cost
            if (weightMode === 'time') {
                weight = time
            } else if (weightMode === 'co2') {
                weight = co2
            } else if (weightMode === 'balanced') {
                weight = cost + (time * timeValue)
            }

            const alt = uScore + weight

            if (alt < (scores.get(edge.target) || Infinity)) {
                scores.set(edge.target, alt)
                previous.set(edge.target, { nodeId: uId, mode: edge.mode, cost: cost, transitTime: time, trips: trips })
                priorityQueue.push([edge.target, alt])
            }
        }
    }

    if (scores.get(targetId) === Infinity) return null

    const path: string[] = []
    const steps: RouteStep[] = []
    const modeBreakdown: Record<string, number> = {}
    let totalCO2 = 0
    let totalTransitTime = 0
    let totalCost = 0
    let currId: string | undefined = targetId

    while (currId) {
        path.unshift(currId)
        const prev = previous.get(currId)

        if (prev) {
            steps.unshift({ nodeId: currId, mode: prev.mode, cost: prev.cost })
            totalCost += prev.cost
            totalTransitTime += prev.transitTime

            if (prev.mode) {
                modeBreakdown[prev.mode] = (modeBreakdown[prev.mode] || 0) + prev.cost

                // Track Sustainability
                const factors = getModeFactors(prev.mode)
                const neighbors = graph.adjacencyList.get(prev.nodeId) || []
                const edge = neighbors.find(e => e.target === currId && e.mode === prev.mode)
                if (edge) {
                    // CO2 scales with trips (more trucks/ships = more fuel)
                    totalCO2 += (edge.distance * factors.co2) * prev.trips
                }
            }
            currId = prev.nodeId
        } else {
            steps.unshift({ nodeId: currId, cost: 0 })
            currId = undefined
        }
    }

    return { path, totalCost, totalCO2, totalTransitTime, modeBreakdown, steps }
}

/**
 * Implements Yen's algorithm to find the K shortest paths.
 */
export function findKLeastCostPaths(
    graph: LogisticsGraph,
    sourceId: string,
    targetId: string,
    K: number = 3,
    weightMode: WeightMode = 'cost',
    timeValue: number = 25,
    cargo?: CargoConfig
): OptimizationResult[] {
    const A: OptimizationResult[] = []
    const B: OptimizationResult[] = []

    const firstPath = findLeastCostPath(graph, sourceId, targetId, new Set(), new Set(), weightMode, timeValue, cargo)
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

            const spurPath = findLeastCostPath(graph, spurNode, targetId, removedEdges, removedNodes, weightMode, timeValue, cargo)

            if (spurPath) {
                const totalPath = [...rootPathNodes.slice(0, -1), ...spurPath.path]
                const totalSteps = [...rootPathSteps.slice(0, -1), ...spurPath.steps]

                const totalCost = rootPathSteps.reduce((acc, s) => acc + s.cost, 0) - rootPathSteps[i].cost + spurPath.totalCost

                let totalCO2 = spurPath.totalCO2
                let totalTransitTime = spurPath.totalTransitTime

                // Add root path CO2/TransitTime
                for (let j = 0; j < i; j++) {
                    const step = rootPathSteps[j + 1]
                    const prevNodeId = rootPathNodes[j]
                    if (step.mode) {
                        const neighbors = graph.adjacencyList.get(prevNodeId) || []
                        const edge = neighbors.find(e => e.target === step.nodeId && e.mode === step.mode)
                        if (edge) {
                            const factors = getModeFactors(step.mode)

                            // Re-calculate trips for root path step
                            let trips = 1
                            if (cargo && cargo.packageCount > 0) {
                                const m = step.mode.toLowerCase()
                                let cap = 20000
                                if (m.includes('sea') || m.includes('maritim')) cap = 28000
                                else if (m.includes('rail') || m.includes('train')) cap = 30000
                                else if (m.includes('air') || m.includes('flight')) cap = 5000

                                const effectiveCapacity = edge.capacity || cap
                                trips = Math.ceil((cargo.packageCount * (cargo.packageWeight || 1)) / effectiveCapacity)
                            }

                            totalCO2 += (edge.distance * factors.co2) * trips
                            totalTransitTime += edge.distance / factors.speed
                        }
                    }
                }

                const modeBreakdown: Record<string, number> = {}
                totalSteps.forEach(s => {
                    if (s.mode) modeBreakdown[s.mode] = (modeBreakdown[s.mode] || 0) + s.cost
                })

                const candidate: OptimizationResult = {
                    path: totalPath,
                    totalCost,
                    totalCO2,
                    totalTransitTime,
                    modeBreakdown,
                    steps: totalSteps
                }

                if (!B.some(p => JSON.stringify(p.steps) === JSON.stringify(candidate.steps))) {
                    B.push(candidate)
                }
            }
        }

        if (B.length === 0) break

        // Sort B by the same priority logic (Cost + Time * timeValue if balanced)
        B.sort((a, b) => {
            if (weightMode === 'time') return a.totalTransitTime - b.totalTransitTime
            if (weightMode === 'co2') return a.totalCO2 - b.totalCO2
            if (weightMode === 'balanced') {
                const scoreA = a.totalCost + (a.totalTransitTime * timeValue)
                const scoreB = b.totalCost + (b.totalTransitTime * timeValue)
                return scoreA - scoreB
            }
            return a.totalCost - b.totalCost
        })

        A.push(B.shift()!)
    }

    return A
}

