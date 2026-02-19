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
    distance: number
    mode: string
    capacity?: number
    costPerUnit?: number
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

    for (const edge of edgesData) {
        if (!nodes.has(edge.source_node_id)) {
            throw new Error(`Edge ${edge.id} references missing source node ${edge.source_node_id}`)
        }
        if (!nodes.has(edge.target_node_id)) {
            throw new Error(`Edge ${edge.id} references missing target node ${edge.target_node_id}`)
        }
        if (edge.cost_per_unit != null && edge.cost_per_unit < 0) {
            throw new Error(`Edge ${edge.id} has negative cost: ${edge.cost_per_unit}`)
        }
        if (edge.distance < 0) {
            throw new Error(`Edge ${edge.id} has negative distance: ${edge.distance}`)
        }

        const capacityNum = edge.capacity != null ? Number(edge.capacity) : undefined
        const costNum = edge.cost_per_unit != null ? Number(edge.cost_per_unit) : undefined

        const graphEdge: GraphEdge = {
            id: edge.id,
            source: edge.source_node_id,
            target: edge.target_node_id,
            distance: Number(edge.distance),
            mode: edge.mode,
            capacity: isNaN(capacityNum as number) ? undefined : capacityNum,
            costPerUnit: isNaN(costNum as number) ? undefined : costNum
        }

        const currentEdges = adjacencyList.get(edge.source_node_id) || []
        currentEdges.push(graphEdge)
        adjacencyList.set(edge.source_node_id, currentEdges)
    }

    return { nodes, adjacencyList }
}
