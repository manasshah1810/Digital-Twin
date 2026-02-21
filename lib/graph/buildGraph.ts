import { createAdminClient } from '../supabase/admin'

export interface GraphNode {
    id: string
    name: string
    type: string
    latitude?: number
    longitude?: number
    metadata: any
}

export interface GraphEdge {
    id: string
    source: string
    target: string
    mode: string
    distance: number
    costPerUnit: number
    transitTime: number
    capacity?: number
    utilization?: number
    metadata?: any
}

export interface LogisticsGraph {
    nodes: Map<string, GraphNode>
    adjacencyList: Map<string, GraphEdge[]>
}

export async function buildGraph(datasetId: string, scenarioId?: string): Promise<LogisticsGraph> {
    const supabase = createAdminClient()

    // 1. Fetch from Dataset (The Ground Truth)
    const { data: nodesData, error: nodesError } = await supabase
        .from('logistics_nodes')
        .select('*')
        .eq('dataset_id', datasetId)

    if (nodesError) throw new Error(`Failed to fetch nodes for dataset ${datasetId}: ${nodesError.message}`)

    const { data: edgesData, error: edgesError } = await supabase
        .from('route_edges')
        .select('*')
        .eq('dataset_id', datasetId)

    if (edgesError) throw new Error(`Failed to fetch edges for dataset ${datasetId}: ${edgesError.message}`)

    console.log(`[Bio-Grid] Building graph from Dataset ${datasetId}`)
    console.log(`[Bio-Grid] Loaded ${nodesData.length} nodes and ${edgesData.length} edges`)

    const nodes = new Map<string, GraphNode>()
    const adjacencyList = new Map<string, GraphEdge[]>()

    for (const node of nodesData) {
        nodes.set(node.id, {
            id: node.id,
            name: node.name,
            type: node.type,
            latitude: node.latitude,
            longitude: node.longitude,
            metadata: node.metadata
        })
        adjacencyList.set(node.id, [])
    }

    const SPEEDS: Record<string, number> = { 'truck': 60, 'rail': 45, 'sea': 25 }

    for (const edge of edgesData) {
        if (!nodes.has(edge.source_node_id)) continue
        if (!nodes.has(edge.target_node_id)) continue

        const dist = Number(edge.distance) || 0
        const cost = Number(edge.cost_per_unit || edge.base_cost_usd) || 0
        const mode = (edge.mode || 'truck').toLowerCase()

        // Generalized speed heuristic for 54+ types
        let speed = 50
        if (mode.includes('sea') || mode.includes('maritime') || mode.includes('vessel')) speed = 25
        else if (mode.includes('rail') || mode.includes('train')) speed = 45
        else if (mode.includes('air') || mode.includes('flight') || mode.includes('plane')) speed = 800
        else if (mode.includes('truck') || mode.includes('road')) speed = 60

        const graphEdge: GraphEdge = {
            id: edge.id,
            source: edge.source_node_id,
            target: edge.target_node_id,
            distance: dist,
            mode: edge.mode,
            costPerUnit: cost,
            transitTime: dist / speed,
            capacity: edge.capacity ? Number(edge.capacity) : undefined,
            metadata: edge.metadata || {}
        }

        const currentEdges = adjacencyList.get(edge.source_node_id) || []
        currentEdges.push(graphEdge)
        adjacencyList.set(edge.source_node_id, currentEdges)

        // AUTO-GENERATE REVERSE EDGE
        const reverseEdge: GraphEdge = {
            ...graphEdge,
            id: `${edge.id}_rev`,
            source: edge.target_node_id,
            target: edge.source_node_id
        }
        const targetEdges = adjacencyList.get(edge.target_node_id) || []
        targetEdges.push(reverseEdge)
        adjacencyList.set(edge.target_node_id, targetEdges)
    }
    // ── SYNTHETIC AIR EDGES ──────────────────────────────────────────────
    // If the dataset has no air edges, inject virtual air connections
    // between nodes 200+ km apart so Dijkstra can consider air transport.
    const allEdgeModes = new Set(edgesData.map((e: any) => (e.mode || '').toLowerCase()))
    const hasAirEdges = [...allEdgeModes].some(m => m.includes('air') || m.includes('flight') || m.includes('plane'))

    if (!hasAirEdges) {
        const nodeList = Array.from(nodes.values()).filter(n => typeof n.latitude === 'number' && typeof n.longitude === 'number')
        const toRad = (d: number) => d * Math.PI / 180
        const haversine = (lat1: number, lon1: number, lat2: number, lon2: number) => {
            const R = 6371
            const dLat = toRad(lat2 - lat1), dLon = toRad(lon2 - lon1)
            const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2
            return Math.round(R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)))
        }

        let airCount = 0
        for (let i = 0; i < nodeList.length; i++) {
            for (let j = i + 1; j < nodeList.length; j++) {
                const a = nodeList[i], b = nodeList[j]
                const dist = haversine(a.latitude!, a.longitude!, b.latitude!, b.longitude!)
                if (dist < 200) continue // Air only makes sense for longer distances

                const airEdge: GraphEdge = {
                    id: `air_${a.id}_${b.id}`,
                    source: a.id,
                    target: b.id,
                    mode: 'air',
                    distance: dist,
                    costPerUnit: 2.5, // ~$2.5/km (expensive but fast)
                    transitTime: dist / 800, // 800 km/h
                    capacity: 5000,
                    metadata: { synthetic: true }
                }
                const reverseAirEdge: GraphEdge = {
                    ...airEdge,
                    id: `air_${b.id}_${a.id}`,
                    source: b.id,
                    target: a.id
                }

                const aEdges = adjacencyList.get(a.id) || []
                aEdges.push(airEdge)
                adjacencyList.set(a.id, aEdges)

                const bEdges = adjacencyList.get(b.id) || []
                bEdges.push(reverseAirEdge)
                adjacencyList.set(b.id, bEdges)

                airCount++
            }
        }
        if (airCount > 0) {
            console.log(`[Graph] Injected ${airCount} synthetic air edges (dataset had none)`)
        }
    }

    return { nodes, adjacencyList }
}
