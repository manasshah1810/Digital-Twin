import { createAdminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'

export async function POST(
    request: Request,
    { params }: { params: { id: string } }
) {
    const scenarioId = params.id
    const { name } = await request.json()
    const supabase = createAdminClient()

    try {
        // 1. Get original scenario (with its dataset_id and parameters)
        const { data: original, error: fetchError } = await supabase
            .from('scenarios')
            .select('*')
            .eq('id', scenarioId)
            .single()

        if (fetchError || !original) throw new Error('Original scenario not found')

        // 2. Create new scenario branch (pointing to the SAME dataset)
        const { data: forked, error: createError } = await supabase
            .from('scenarios')
            .insert([{
                name: name || `${original.name} (Forked)`,
                description: original.description,
                is_baseline: false,
                parent_scenario_id: scenarioId,
                dataset_id: original.dataset_id,
                origin_node_id: original.origin_node_id,
                destination_node_id: original.destination_node_id,
                constraints: original.constraints
            }])
            .select()
            .single()

        if (createError) throw createError

        // Under the Dataset-Centric model, we DO NOT clone nodes or edges.
        // They remain static in the 'logistics_nodes' and 'route_edges' tables
        // and are filtered at runtime by the 'constraints' stored in the scenario.

        return NextResponse.json({ success: true, scenario: forked })
    } catch (error: any) {
        console.error('Forking error:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
