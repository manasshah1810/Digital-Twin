import { createAdminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'

export async function GET(
    request: Request,
    { params }: { params: { id: string } }
) {
    const supabase = createAdminClient()

    // 1. Get Scenario's Dataset ID
    const { data: scenario, error: sErr } = await supabase
        .from('scenarios')
        .select('dataset_id')
        .eq('id', params.id)
        .maybeSingle()

    if (sErr) {
        return NextResponse.json({ error: sErr.message }, { status: 500 })
    }

    if (!scenario) {
        return NextResponse.json({ error: 'Scenario not found' }, { status: 404 })
    }

    if (!scenario.dataset_id) {
        return NextResponse.json({ error: 'Scenario not associated with a valid Bio-Grid.' }, { status: 404 })
    }

    // 2. Fetch Nodes for that Dataset
    const { data: nodes, error } = await supabase
        .from('logistics_nodes')
        .select('id, name, type')
        .eq('dataset_id', scenario.dataset_id)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(nodes)
}
