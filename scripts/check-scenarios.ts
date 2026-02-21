import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function checkScenarios() {
    const { data, error } = await supabase
        .from('scenarios')
        .select('id, name, dataset_id')

    if (error) {
        console.error('Error fetching scenarios:', error)
        return
    }

    console.log('Scenarios count:', data.length)
    data.forEach(s => {
        if (!s.dataset_id) {
            console.log(`Scenario BROKEN (no dataset_id): ${s.id} - ${s.name}`)
        } else {
            console.log(`Scenario OK: ${s.id} - ${s.name} (dataset: ${s.dataset_id})`)
        }
    })
}

checkScenarios()
