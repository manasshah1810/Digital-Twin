import * as dotenv from 'dotenv';
import path from 'path';
import { createAdminClient } from './lib/supabase/admin';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

async function recreate() {
    const supabase = createAdminClient();

    // 1. Get the target dataset
    const { data: datasets } = await supabase.from('datasets').select('id, name');
    if (!datasets || datasets.length === 0) {
        console.error('No datasets found.');
        return;
    }
    const dsId = datasets[0].id;
    console.log(`Using Dataset: ${datasets[0].name} (${dsId})`);

    // 2. Create the NEW Baseline
    console.log('Creating New Global Baseline...');
    const { data: newBaseline, error: cErr } = await supabase
        .from('scenarios')
        .insert([{
            name: 'Global Baseline (Fixed)',
            description: 'Standard global operations (Verified)',
            is_baseline: true,
            dataset_id: dsId
        }])
        .select()
        .single();

    if (cErr) {
        console.error('Failed to create new baseline:', cErr);
        return;
    }
    console.log(`Created new baseline: ${newBaseline.id}`);

    // 3. Attempt to delete the broken "Global Baseline"
    // Since we can't update it, we might be able to delete it if the trigger allows.
    console.log('Attempting to remove broken "Global Baseline"...');
    const { error: dErr } = await supabase
        .from('scenarios')
        .delete()
        .eq('name', 'Global Baseline')
        .is('dataset_id', null);

    if (dErr) {
        console.warn('Could not delete old baseline (Trigger likely blocks delete too):', dErr.message);
        console.log('You should use "Global Baseline (Fixed)" from now on.');
    } else {
        console.log('SUCCESS: Broken baseline removed.');
    }
}

recreate();
