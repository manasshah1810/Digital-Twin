import * as dotenv from 'dotenv';
import path from 'path';
import { createAdminClient } from './lib/supabase/admin';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

async function debug() {
    const supabase = createAdminClient();

    console.log('--- Datasets ---');
    const { data: datasets } = await supabase.from('datasets').select('*');
    console.table(datasets?.map(d => ({ id: d.id, name: d.name, type: d.upload_type })));

    console.log('\n--- Scenarios ---');
    const { data: scenarios } = await supabase.from('scenarios').select('id, name, is_baseline, dataset_id');
    console.table(scenarios);

    if (datasets && datasets.length > 0 && scenarios) {
        const baseline = scenarios.find(s => s.name === 'Global Baseline');
        if (baseline && !baseline.dataset_id) {
            console.log(`\nFIX REQUIRED: "Global Baseline" (${baseline.id}) has no dataset_id.`);
            console.log(`It should probably be linked to dataset: ${datasets[0].id}`);
        }
    }
}

debug();
