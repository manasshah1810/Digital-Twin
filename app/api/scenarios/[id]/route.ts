import { createAdminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'

export async function GET(
    request: Request,
    { params }: { params: { id: string } }
) {
    const supabase = createAdminClient()

    const { data: scenario, error: scenarioError } = await supabase
        .from('scenarios')
        .select('*')
        .eq('id', params.id)
        .maybeSingle()

    if (scenarioError) return NextResponse.json({ error: scenarioError.message }, { status: 500 })
    if (!scenario) return NextResponse.json({ error: 'Scenario not found' }, { status: 404 })

    // Fetch latest optimization result for this scenario
    const { data: latestResult } = await supabase
        .from('optimization_results')
        .select('*')
        .eq('scenario_id', params.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()

    // Also fetch dataset info to check if AI-generated
    let datasetUploadType = null
    if (scenario.dataset_id) {
        const { data: dataset } = await supabase
            .from('datasets')
            .select('upload_type')
            .eq('id', scenario.dataset_id)
            .maybeSingle()
        datasetUploadType = dataset?.upload_type || null
    }

    return NextResponse.json({
        ...scenario,
        dataset_upload_type: datasetUploadType,
        latestResult: latestResult || null
    })
}

export async function PATCH(
    request: Request,
    { params }: { params: { id: string } }
) {
    const supabase = createAdminClient()

    const { data: currentScenario, error: fetchError } = await supabase
        .from('scenarios')
        .select('is_baseline')
        .eq('id', params.id)
        .maybeSingle()

    if (fetchError) return NextResponse.json({ error: fetchError.message }, { status: 500 })
    if (!currentScenario) return NextResponse.json({ error: 'Scenario not found' }, { status: 404 })

    if (currentScenario.is_baseline) {
        return NextResponse.json({ error: 'Cannot edit baseline scenario' }, { status: 403 })
    }

    const body = await request.json()
    const updateData: any = {
        updated_at: new Date().toISOString()
    }
    if (body.name !== undefined) updateData.name = body.name
    if (body.description !== undefined) updateData.description = body.description
    if (body.parameter_deltas !== undefined) updateData.parameter_deltas = body.parameter_deltas
    if (body.dataset_id !== undefined) updateData.dataset_id = body.dataset_id

    const { data, error } = await supabase
        .from('scenarios')
        .update(updateData)
        .eq('id', params.id)
        .select()
        .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data)
}

export async function DELETE(
    request: Request,
    { params }: { params: { id: string } }
) {
    const supabase = createAdminClient()

    const { data: currentScenario, error: fetchError } = await supabase
        .from('scenarios')
        .select('is_baseline')
        .eq('id', params.id)
        .maybeSingle()

    if (fetchError) return NextResponse.json({ error: fetchError.message }, { status: 500 })
    if (!currentScenario) return NextResponse.json({ error: 'Scenario not found' }, { status: 404 })

    if (currentScenario.is_baseline) {
        return NextResponse.json({ error: 'Cannot delete baseline scenario' }, { status: 403 })
    }

    const { error } = await supabase
        .from('scenarios')
        .delete()
        .eq('id', params.id)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ success: true })
}
