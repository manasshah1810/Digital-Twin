import * as dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { createAdminClient } from './lib/supabase/admin';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

async function importData() {
    const supabase = createAdminClient();

    // 1. Create Baseline Scenario
    console.log('Creating Baseline Scenario...');
    const { data: scenario, error: sErr } = await supabase
        .from('scenarios')
        .insert([{ name: 'Ground Truth Baseline', description: 'Standard global operations', is_baseline: true }])
        .select()
        .single();

    if (sErr) {
        console.error('Failed to create scenario:', sErr);
        return;
    }
    console.log(`Created Scenario: ${scenario.id}`);

    // 2. Import Nodes
    console.log('Importing Nodes...');
    const nodesRaw = fs.readFileSync('logistics_nodes.csv', 'utf-8').split('\n').slice(1);
    const csvToUuidMap: Record<string, string> = {};

    const nodesToInsert = nodesRaw.filter(l => l.trim()).map(line => {
        const [csvId, name, type, country, region, lat, lon, cap, cost] = line.split(',');
        return {
            scenario_id: scenario.id,
            name,
            type,
            latitude: parseFloat(lat),
            longitude: parseFloat(lon),
            metadata: { csvId, country, region, capacity: parseInt(cap), cost_usd: parseInt(cost) }
        };
    });

    const { data: insertedNodes, error: nErr } = await supabase.from('logistics_nodes').insert(nodesToInsert).select();
    if (nErr) {
        console.error('Node Import Error:', nErr);
        return;
    }

    insertedNodes.forEach(n => {
        csvToUuidMap[n.metadata.csvId] = n.id;
    });
    console.log(`Imported ${insertedNodes.length} nodes and built ID map.`);

    // 3. Import Edges
    console.log('Importing Edges...');
    const edgesRaw = fs.readFileSync('transport_routes.csv', 'utf-8').split('\n').slice(1);
    const edgesToInsert = edgesRaw.filter(l => l.trim()).map(line => {
        const [rid, from, to, mode, dist, base, sens, cap, time] = line.split(',');

        if (!csvToUuidMap[from] || !csvToUuidMap[to]) {
            console.warn(`Edge ${rid} references missing node: ${from} -> ${to}`);
            return null;
        }

        return {
            scenario_id: scenario.id,
            source_node_id: csvToUuidMap[from],
            target_node_id: csvToUuidMap[to],
            distance: parseFloat(dist),
            mode: mode.toLowerCase(),
            capacity: isNaN(parseFloat(cap)) ? null : parseFloat(cap),
            cost_per_unit: parseFloat(base) / 1000,
            created_at: new Date().toISOString()
        };
    }).filter(Boolean);

    // Batch edges to avoid request size limits
    for (let i = 0; i < edgesToInsert.length; i += 100) {
        const chunk = edgesToInsert.slice(i, i + 100);
        const { error: eErr } = await supabase.from('route_edges').insert(chunk);
        if (eErr) console.error(`Edge Import Error (chunk ${i}):`, eErr);
    }
    console.log(`Imported ${edgesToInsert.length} edges.`);

    // 4. Import Fuel
    console.log('Importing Fuel Indices...');
    const fuelRaw = fs.readFileSync('fuel_price_index.csv', 'utf-8').split('\n').slice(1);
    const fuelToInsert = fuelRaw.filter(l => l.trim()).map(line => {
        const [type, price] = line.split(',');
        return {
            scenario_id: scenario.id,
            fuel_type: type.toLowerCase(),
            price_index: parseFloat(price)
        };
    });

    const { error: fErr } = await supabase.from('fuel_indices').insert(fuelToInsert);
    if (fErr) console.error('Fuel Import Error:', fErr);
    else console.log(`Imported ${fuelToInsert.length} fuel indices.`);

    console.log('\n--- IMPORT SUCCESSFUL ---');
    console.log('The system is now primed with Ground Truth data.');
}

importData();
