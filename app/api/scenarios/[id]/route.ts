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
        .single()

    if (scenarioError) return NextResponse.json({ error: scenarioError.message }, { status: 404 })

    // Fetch latest optimization result for this scenario
    const { data: latestResult } = await supabase
        .from('optimization_results')
        .select('*')
        .eq('scenario_id', params.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

    return NextResponse.json({
        ...scenario,
        latestResult: latestResult || null
    })
}

export async function PATCH(
    request: Request,
    { params }: { params: { id: string } }
) {
    const supabase = createAdminClient()

    const { data: currentScenario } = await supabase
        .from('scenarios')
        .select('is_baseline')
        .eq('id', params.id)
        .single()

    if (currentScenario?.is_baseline) {
        return NextResponse.json({ error: 'Cannot edit baseline scenario' }, { status: 403 })
    }

    const body = await request.json()
    const { data, error } = await supabase
        .from('scenarios')
        .update({
            name: body.name,
            description: body.description,
            updated_at: new Date().toISOString()
        })
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

    const { data: currentScenario } = await supabase
        .from('scenarios')
        .select('is_baseline')
        .eq('id', params.id)
        .single()

    if (currentScenario?.is_baseline) {
        return NextResponse.json({ error: 'Cannot delete baseline scenario' }, { status: 403 })
    }

    const { error } = await supabase
        .from('scenarios')
        .delete()
        .eq('id', params.id)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ success: true })
}
