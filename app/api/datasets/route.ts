import { createAdminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'

export async function GET() {
    const supabase = createAdminClient()
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

    console.log(`[API] Starting cascading delete for dataset: ${id}`)
    const supabase = createAdminClient()

    try {
        // 0. Get all scenarios associated with this dataset
        const { data: scenarios, error: fetchErr } = await supabase
            .from('scenarios')
            .select('id')
            .eq('dataset_id', id)

        if (fetchErr) throw new Error(`Failed to fetch scenarios: ${fetchErr.message}`)

        const scenarioIds = scenarios?.map(s => s.id) || []
        console.log(`[API] Found ${scenarioIds.length} scenarios to purge`)

        if (scenarioIds.length > 0) {
            // 1. Break scenario tree structure (self-references)
            console.log('[API] Decoupling scenario tree...')
            const { error: unlinkErr } = await supabase
                .from('scenarios')
                .update({ parent_scenario_id: null })
                .in('id', scenarioIds)
            if (unlinkErr) throw new Error(`Failed to unlink scenario tree: ${unlinkErr.message}`)

            // 2. Delete decision traces
            console.log('[API] Purging decision traces...')
            const { error: dtErr } = await supabase.from('decision_traces').delete().in('scenario_id', scenarioIds)
            if (dtErr) throw new Error(`Failed to delete decision traces: ${dtErr.message}`)

            // 3. Delete optimization results
            console.log('[API] Purging optimization results...')
            const { error: orErr } = await supabase.from('optimization_results').delete().in('scenario_id', scenarioIds)
            if (orErr) throw new Error(`Failed to delete optimization results: ${orErr.message}`)

            // 4. Delete the scenarios themselves
            console.log('[API] Purging scenarios...')
            const { error: scErr } = await supabase.from('scenarios').delete().in('id', scenarioIds)
            if (scErr) throw new Error(`Failed to delete scenarios: ${scErr.message}`)
        }

        // 5. Delete baseline routes (reference nodes)
        console.log('[API] Purging baseline routes...')
        const { error: brErr } = await supabase.from('baseline_routes').delete().eq('dataset_id', id)
        if (brErr) throw new Error(`Failed to delete baseline routes: ${brErr.message}`)

        // 6. Delete shipments (reference nodes)
        console.log('[API] Purging shipments...')
        const { error: shErr } = await supabase.from('shipments').delete().eq('dataset_id', id)
        if (shErr) throw new Error(`Failed to delete shipments: ${shErr.message}`)

        // 7. Delete edges (reference nodes)
        console.log('[API] Purging transit edges...')
        const { error: reErr } = await supabase.from('route_edges').delete().eq('dataset_id', id)
        if (reErr) throw new Error(`Failed to delete route edges: ${reErr.message}`)

        // 8. Delete carrier pricing
        console.log('[API] Purging carrier pricing...')
        const { error: cpErr } = await supabase.from('carrier_pricing').delete().eq('dataset_id', id)
        if (cpErr) throw new Error(`Failed to delete carrier pricing: ${cpErr.message}`)

        // 9. Delete fuel indices
        console.log('[API] Purging fuel indices...')
        const { error: fiErr } = await supabase.from('fuel_indices').delete().eq('dataset_id', id)
        if (fiErr) throw new Error(`Failed to delete fuel indices: ${fiErr.message}`)

        // 10. Delete nodes (Ground level)
        console.log('[API] Purging logistics nodes...')
        const { error: lnErr } = await supabase.from('logistics_nodes').delete().eq('dataset_id', id)
        if (lnErr) throw new Error(`Failed to delete logistics nodes: ${lnErr.message}`)

        // 11. Finally delete the dataset meta-object
        console.log('[API] Deleting dataset entry...')
        const { error: dErr } = await supabase
            .from('datasets')
            .delete()
            .eq('id', id)

        if (dErr) throw new Error(`Failed to delete dataset entry: ${dErr.message}`)

        console.log(`[API] Cascading delete successful for dataset: ${id}`)
        return NextResponse.json({ success: true })
    } catch (error: any) {
        console.error('[API] Delete Error:', error)

        let customMessage = error.message
        if (customMessage.includes('has no field "scenario_id"')) {
            customMessage = "Database Pivot Error: A trigger is trying to access a deleted column. Please find SUPABASE_FIX.sql in your folder and run it in the Supabase SQL Editor."
        } else if (customMessage.includes('snapshots are immutable')) {
            customMessage = "Immutability Error: Baseline snapshots are blocking the delete. Please run the SQL fix in SUPABASE_FIX.sql to allow administrative cleanup."
        }

        return NextResponse.json({
            error: customMessage,
            success: false
        }, { status: 500 })
    }
}
