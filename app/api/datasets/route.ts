import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'

export async function GET() {
    const supabase = createClient()
    let { data: { user } } = await supabase.auth.getUser()

    // Development bypass to allow local testing without session
    if (!user && process.env.NODE_ENV === 'development') {
        console.log('[API] Dev Bypass: Using mock user for /api/datasets')
        user = { id: '00000000-0000-0000-0000-000000000000', email: 'dev@local.twin' } as any
    }

    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data, error } = await supabase
        .from('datasets')
        .select('*')
        .order('uploaded_at', { ascending: false })

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data)
}

export async function DELETE(request: Request) {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) return NextResponse.json({ error: 'Asset ID is required' }, { status: 400 })

    const supabase = createClient()
    let { data: { user } } = await supabase.auth.getUser()

    if (!user && process.env.NODE_ENV === 'development') {
        user = { id: '00000000-0000-0000-0000-000000000000', email: 'dev@local.twin' } as any
    }

    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // Verify ownership before cascading delete
    const { data: dataset, error: ownerErr } = await supabase
        .from('datasets')
        .select('id, uploaded_by')
        .eq('id', id)
        .single()

    if (ownerErr || !dataset) return NextResponse.json({ error: 'Dataset not found' }, { status: 404 })
    if (dataset.uploaded_by !== user.id) return NextResponse.json({ error: 'Forbidden: You do not own this dataset.' }, { status: 403 })

    console.log(`[API] Authorized cascading delete for dataset: ${id} by user: ${user.id}`)
    const adminSupabase = createAdminClient()

    try {
        // 0. Get all scenarios associated with this dataset
        const { data: scenarios, error: fetchErr } = await adminSupabase
            .from('scenarios')
            .select('id')
            .eq('dataset_id', id)

        if (fetchErr) throw new Error(`Failed to fetch scenarios: ${fetchErr.message}`)

        const scenarioIds = scenarios?.map(s => s.id) || []

        if (scenarioIds.length > 0) {
            // 1. Break scenario tree structure (self-references)
            await adminSupabase.from('scenarios').update({ parent_scenario_id: null }).in('id', scenarioIds)
            // 2. Delete decision traces
            await adminSupabase.from('decision_traces').delete().in('scenario_id', scenarioIds)
            // 3. Delete optimization results
            await adminSupabase.from('optimization_results').delete().in('scenario_id', scenarioIds)
            // 4. Delete the scenarios themselves
            await adminSupabase.from('scenarios').delete().in('id', scenarioIds)
        }

        // 5. Delete baseline routes
        await adminSupabase.from('baseline_routes').delete().eq('dataset_id', id)
        // 6. Delete shipments
        await adminSupabase.from('shipments').delete().eq('dataset_id', id)
        // 7. Delete edges
        await adminSupabase.from('route_edges').delete().eq('dataset_id', id)
        // 8. Delete carrier pricing
        await adminSupabase.from('carrier_pricing').delete().eq('dataset_id', id)
        // 9. Delete fuel indices
        await adminSupabase.from('fuel_indices').delete().eq('dataset_id', id)
        // 10. Delete nodes
        await adminSupabase.from('logistics_nodes').delete().eq('dataset_id', id)
        // 11. Finally delete the dataset entry
        await adminSupabase.from('datasets').delete().eq('id', id)

        return NextResponse.json({ success: true })
    } catch (error: any) {
        console.error('[API] Delete Error:', error)
        return NextResponse.json({ error: error.message, success: false }, { status: 500 })
    }
}
