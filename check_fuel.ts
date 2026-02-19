import * as dotenv from 'dotenv';
import path from 'path';
import { createAdminClient } from './lib/supabase/admin';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

async function checkFuel() {
    const supabase = createAdminClient();
    const { data, error } = await supabase.from('fuel_indices').select('fuel_type');
    if (error) {
        console.error(error);
        return;
    }
    const types = Array.from(new Set(data.map(d => d.fuel_type)));
    console.log('Current fuel types in DB:', types);
}

checkFuel();
