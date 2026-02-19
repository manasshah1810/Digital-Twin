import { createAdminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'

export async function GET() {
    const supabase = createAdminClient()

    try {
        const { data: scenarios, error } = await supabase
            .from('scenarios')
            .select('id, name, parent_scenario_id, is_baseline, created_at')
            .order('created_at', { ascending: true })

        if (error) throw error

        return NextResponse.json(scenarios)
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
