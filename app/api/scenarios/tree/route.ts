import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    try {
        const { data: scenarios, error } = await supabase
            .from('scenarios')
            .select('id, name, parent_scenario_id, is_baseline, created_at, dataset_id')
            .order('created_at', { ascending: true })

        if (error) throw error

        return NextResponse.json(scenarios)
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
