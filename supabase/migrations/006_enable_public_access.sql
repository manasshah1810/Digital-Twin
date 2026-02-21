-- migration/006_enable_public_access.sql
-- PURPOSE: Enable permissive RLS for prototype access.

DO $$ 
DECLARE 
    tbl TEXT;
BEGIN
    FOR tbl IN SELECT unnest(ARRAY['datasets', 'scenarios', 'logistics_nodes', 'route_edges', 'fuel_indices', 'optimization_results', 'decision_traces', 'carrier_pricing', 'shipments', 'baseline_routes']) 
    LOOP
        -- Enable RLS just in case
        EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', tbl);
        
        -- Drop existing policies to avoid conflicts
        EXECUTE format('DROP POLICY IF EXISTS "Public Access" ON %I', tbl);
        EXECUTE format('DROP POLICY IF EXISTS "Enable read access for all users" ON %I', tbl);
        EXECUTE format('DROP POLICY IF EXISTS "Enable insert access for all users" ON %I', tbl);
        
        -- Create completely open policy for prototype (READ/WRITE for everyone)
        EXECUTE format('CREATE POLICY "Public Access" ON %I FOR ALL USING (true) WITH CHECK (true)', tbl);
    END LOOP;
END $$;
