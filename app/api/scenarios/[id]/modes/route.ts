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

    if (sErr) return NextResponse.json({ error: sErr.message }, { status: 500 })
    if (!scenario || !scenario.dataset_id) return NextResponse.json({ error: 'Scenario or Dataset not found' }, { status: 404 })

    // 2. Fetch Distinct Modes for that Dataset
    const { data: modes, error } = await supabase
        .from('route_edges')
        .select('mode')
        .eq('dataset_id', scenario.dataset_id)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    const normMode = (m: string) => {
        const l = m.toLowerCase()
        if (l === 'plane' || l === 'flight' || l === 'aviation') return 'air'
        if (l === 'maritime' || l === 'vessel' || l === 'ocean') return 'sea'
        if (l === 'train' || l === 'freight rail') return 'rail'
        if (l === 'road') return 'truck'
        return l
    }

    const datasetModes = modes.map(m => normMode(m.mode)).filter(Boolean)
    const coreModes = ['truck', 'rail', 'sea', 'air']
    const uniqueModes = Array.from(new Set([...datasetModes, ...coreModes]))
    return NextResponse.json(uniqueModes)
}
