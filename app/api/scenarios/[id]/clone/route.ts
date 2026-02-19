import { createAdminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'

export async function POST(
    request: Request,
    { params }: { params: { id: string } }
) {
    const supabase = createAdminClient()

    // 1. Fetch source scenario
    const { data: sourceScenario, error: fetchError } = await supabase
        .from('scenarios')
        .select('*')
        .eq('id', params.id)
        .single()

    if (fetchError || !sourceScenario) {
        return NextResponse.json({ error: 'Source scenario not found' }, { status: 404 })
    }

    // 2. Clone scenario metadata only (dataset-centric: no node/edge cloning needed)
    const { data: newScenario, error: insertError } = await supabase
        .from('scenarios')
        .insert([{
            name: `${sourceScenario.name} (Clone)`,
            description: sourceScenario.description,
            is_baseline: false,
            dataset_id: sourceScenario.dataset_id,
            origin_node_id: sourceScenario.origin_node_id,
            destination_node_id: sourceScenario.destination_node_id,
            constraints: sourceScenario.constraints
        }])
        .select()
        .single()

    if (insertError) return NextResponse.json({ error: insertError.message }, { status: 500 })

    return NextResponse.json(newScenario)
}
