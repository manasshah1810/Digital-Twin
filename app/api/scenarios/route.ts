import { createAdminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'

export async function GET() {
    const supabase = createAdminClient()

    const { data, error } = await supabase
        .from('scenarios')
        .select('*')
        .order('created_at', { ascending: false })

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data)
}

export async function POST(request: Request) {
    const supabase = createAdminClient()

    const body = await request.json()
    if (!body.dataset_id) {
        return NextResponse.json({ error: 'A valid Bio-Grid (dataset_id) is required to initialize a scenario branch.' }, { status: 400 })
    }

    const { data, error } = await supabase
        .from('scenarios')
        .insert([{
            name: body.name,
            description: body.description,
            is_baseline: false,
            dataset_id: body.dataset_id
        }])
        .select()
        .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data)
}
