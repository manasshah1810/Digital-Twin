import * as dotenv from 'dotenv';
import path from 'path';
import { createAdminClient } from './lib/supabase/admin';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

async function fix() {
    const supabase = createAdminClient();

    // 1. Get the dataset ID
    const { data: datasets } = await supabase.from('datasets').select('id, name');
    if (!datasets || datasets.length === 0) {
        console.error('No datasets found to link to.');
        return;
    }
    const targetDatasetId = datasets[0].id;
    console.log(`Targeting Dataset: ${datasets[0].name} (${targetDatasetId})`);

    // 2. Update Global Baseline
    console.log('Updating "Global Baseline" link...');
    const { error: uErr } = await supabase
        .from('scenarios')
        .update({ dataset_id: targetDatasetId })
        .eq('name', 'Global Baseline');

    if (uErr) {
        console.error('Fix failed:', uErr);
    } else {
        console.log('SUCCESS: Global Baseline is now linked to the dataset.');
    }

    // 3. Optional: Clean up other null scenarios
    const { error: uErr2 } = await supabase
        .from('scenarios')
        .update({ dataset_id: targetDatasetId })
        .is('dataset_id', null);

    if (!uErr2) console.log('Cleaned up other unlinked scenarios.');
}

fix();
