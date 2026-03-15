import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'
import { CSV_SCHEMAS, validateRow } from '@/lib/validation/csvSchemas'
import Papa from 'papaparse'

export async function POST(request: Request) {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return NextResponse.json({ error: 'Unauthorized: Authentication required for tactical data ingestion.' }, { status: 401 })
    }

    // We use admin client for the actual transaction to ensure cascading inserts work reliably across schemas
    const adminSupabase = createAdminClient()

    const formData = await request.formData()
    const datasetName = formData.get('name') as string

    if (!datasetName) return NextResponse.json({ error: 'Dataset name is required' }, { status: 400 })

    const files = {
        nodes: formData.get('logistics_nodes') as File,
        edges: formData.get('route_edges') as File,
        pricing: formData.get('carrier_pricing') as File,
        fuel: formData.get('fuel_indices') as File,
        shipments: formData.get('shipments') as File | null
    }

    if (!files.nodes || !files.edges || !files.pricing || !files.fuel) {
        return NextResponse.json({ error: 'Missing required CSV files. (nodes, edges, pricing, fuel required)' }, { status: 400 })
    }

    try {
        // 1. Create Dataset Entry
        const { data: dataset, error: dErr } = await adminSupabase
            .from('datasets')
            .insert([{ name: datasetName, uploaded_by: user.id }])
            .select()
            .single()

        if (dErr) throw dErr

        const parseCsv = (text: string): Promise<any[]> => {
            return new Promise((resolve, reject) => {
                Papa.parse(text, {
                    header: true,
                    skipEmptyLines: true,
                    complete: (results) => resolve(results.data),
                    error: (error: any) => reject(error)
                })
            })
        }

        // 2. Process Nodes
        const nodesText = await files.nodes.text()
        const nodesData = await parseCsv(nodesText)
        const csvToUuidMap: Record<string, string> = {}
        const sanitizedNodes: any[] = []

        nodesData.forEach((row, i) => {
            const errors = validateRow(CSV_SCHEMAS.nodes, row, i + 2, 'nodes')
            if (errors) throw new Error(errors.join('\n'))

            sanitizedNodes.push({
                dataset_id: dataset.id,
                name: row.node_name,
                type: row.node_type.toLowerCase(),
                latitude: parseFloat(row.latitude),
                longitude: parseFloat(row.longitude),
                metadata: { csvId: row.node_id, capacity: parseFloat(row.capacity) }
            })
        })

        const { data: insertedNodes, error: nErr } = await adminSupabase.from('logistics_nodes').insert(sanitizedNodes).select()
        if (nErr) throw nErr
        insertedNodes.forEach((n: any) => csvToUuidMap[n.metadata.csvId] = n.id)

        // 3. Process Edges
        const edgesText = await files.edges.text()
        const edgesData = await parseCsv(edgesText)
        const sanitizedEdges: any[] = []

        edgesData.forEach((row, i) => {
            const errors = validateRow(CSV_SCHEMAS.edges, row, i + 2, 'edges')
            if (errors) throw new Error(errors.join('\n'))

            if (!csvToUuidMap[row.from_node_id] || !csvToUuidMap[row.to_node_id]) {
                throw new Error(`Row ${i + 2}: Edge references missing node ID: ${row.from_node_id} -> ${row.to_node_id}`)
            }

            sanitizedEdges.push({
                dataset_id: dataset.id,
                source_node_id: csvToUuidMap[row.from_node_id],
                target_node_id: csvToUuidMap[row.to_node_id],
                distance: parseFloat(row.distance_km),
                mode: row.mode.toLowerCase(),
                capacity: parseFloat(row.capacity),
                cost_per_unit: parseFloat(row.base_cost) / 1000,
                fuel_sensitivity: parseFloat(row.fuel_sensitivity)
            })
        })

        const { error: eErr } = await adminSupabase.from('route_edges').insert(sanitizedEdges)
        if (eErr) throw eErr

        // 4. Process Pricing
        const pricingText = await files.pricing.text()
        const pricingData = await parseCsv(pricingText)
        const sanitizedPricing = pricingData.map((row, i) => {
            const errors = validateRow(CSV_SCHEMAS.pricing, row, i + 2, 'pricing')
            if (errors) throw new Error(errors.join('\n'))
            return {
                dataset_id: dataset.id,
                carrier_id: row.carrier_id,
                mode: row.mode.toLowerCase(),
                cost_per_km: parseFloat(row.cost_per_km),
                fuel_indexed: String(row.fuel_indexed).toLowerCase() === 'true'
            }
        })
        const { error: pErr } = await adminSupabase.from('carrier_pricing').insert(sanitizedPricing)
        if (pErr) throw pErr

        // 5. Process Fuel
        const fuelText = await files.fuel.text()
        const fuelData = await parseCsv(fuelText)
        const sanitizedFuel = fuelData.map((row, i) => {
            const errors = validateRow(CSV_SCHEMAS.fuel, row, i + 2, 'fuel')
            if (errors) throw new Error(errors.join('\n'))
            return {
                dataset_id: dataset.id,
                fuel_type: row.fuel_type.toLowerCase(),
                price_index: parseFloat(row.base_price),
                region: row.region
            }
        })
        const { error: fErr } = await adminSupabase.from('fuel_indices').insert(sanitizedFuel)
        if (fErr) throw fErr

        // 6. Process Shipments (Optional)
        if (files.shipments) {
            const shipmentsText = await files.shipments.text()
            const shipmentsData = await parseCsv(shipmentsText)
            const sanitizedShipments = shipmentsData.map((row, i) => {
                const errors = validateRow(CSV_SCHEMAS.shipments, row, i + 2, 'shipments')
                if (errors) throw new Error(errors.join('\n'))
                return {
                    dataset_id: dataset.id,
                    shipment_id: row.shipment_id,
                    origin_node_id: row.origin_node_id,
                    destination_node_id: row.destination_node_id,
                    volume: parseFloat(row.volume)
                }
            })
            const { error: sErr } = await adminSupabase.from('shipments').insert(sanitizedShipments)
            if (sErr) throw sErr
        }

        return NextResponse.json({ success: true, datasetId: dataset.id })

    } catch (error: any) {
        console.error('Ingestion error:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
