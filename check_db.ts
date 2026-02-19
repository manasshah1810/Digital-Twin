import * as dotenv from 'dotenv';
import path from 'path';

// Load .env.local manually
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

import { createAdminClient } from './lib/supabase/admin';

async function check() {
    const supabase = createAdminClient();

    const { data: scenarios, error: sErr } = await supabase.from('scenarios').select('*');
    if (sErr) {
        console.error('Scenarios Error:', sErr);
        return;
    }

    console.log('--- Scenarios Found ---');
    console.table(scenarios?.map(s => ({ id: s.id, name: s.name, baseline: s.is_baseline })));

    if (scenarios && scenarios.length > 0) {
        const scenarioId = scenarios[0].id;
        console.log(`\nChecking Data for Scenario: ${scenarios[0].name} (${scenarioId})`);

        const { data: nodes } = await supabase.from('logistics_nodes').select('id, name').eq('scenario_id', scenarioId);
        console.log(`Nodes: ${nodes?.length || 0}`);
        if (nodes?.length) console.table(nodes.slice(0, 5));

        const { data: edges } = await supabase.from('route_edges').select('id, source_node_id, target_node_id, mode').eq('scenario_id', scenarioId);
        console.log(`Edges: ${edges?.length || 0}`);
        if (edges?.length) console.table(edges.slice(0, 5));

        if (nodes && nodes.length >= 2 && (!edges || edges.length === 0)) {
            console.warn('CRITICAL: Nodes exist but NO EDGES found. Routing will fail.');
        }
    } else {
        console.warn('CRITICAL: No scenarios found in DB.');
    }
}

check();
