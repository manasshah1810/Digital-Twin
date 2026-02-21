const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function checkScenarios() {
    const { data: scenarios, error } = await supabase
        .from('scenarios')
        .select('id, name, dataset_id')

    if (error) {
        console.error('Error fetching scenarios:', error)
        return
    }

    console.log('Scenarios count:', scenarios.length)
    const broken = scenarios.filter(s => !s.dataset_id)
    if (broken.length > 0) {
        console.log('BROKEN SCENARIOS (missing dataset_id):')
        broken.forEach(s => console.log(`- ${s.id}: ${s.name}`))
    } else {
        console.log('All scenarios have a dataset_id.')
    }

    const { data: datasets } = await supabase.from('datasets').select('id, name')
    console.log('Available Datasets:', datasets)
}

checkScenarios()
