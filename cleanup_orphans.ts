import * as dotenv from 'dotenv';
import path from 'path';
import { createAdminClient } from './lib/supabase/admin';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

async function cleanup() {
    const supabase = createAdminClient();

    const { data: datasets } = await supabase.from('datasets').select('id');
    if (!datasets || datasets.length === 0) return;
    const dsId = datasets[0].id;

    console.log('Linking non-baseline orphaned scenarios...');
    const { error: err } = await supabase
        .from('scenarios')
        .update({ dataset_id: dsId })
        .is('dataset_id', null)
        .eq('is_baseline', false);

    if (err) console.error('Cleanup failed:', err);
    else console.log('orphaned scenarios linked to primary dataset.');
}

cleanup();
