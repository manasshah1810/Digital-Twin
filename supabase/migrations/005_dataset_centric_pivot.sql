-- migration/005_dataset_centric_pivot.sql
-- PURPOSE: Pivot the data model from scenario-centric to dataset-centric.
-- Static network data (nodes, edges, fuel, pricing) belongs to DATASETS.
-- Scenarios are simulation parameters layered ON TOP of datasets.

-- 1. Infrastructure: Datasets table
CREATE TABLE IF NOT EXISTS datasets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  uploaded_by TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  is_active BOOLEAN DEFAULT false
);

-- 2. Scenario Mapping: Ensure dataset_id and simulation parameters exist
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME='scenarios' AND COLUMN_NAME='dataset_id') THEN
        ALTER TABLE scenarios ADD COLUMN dataset_id UUID REFERENCES datasets(id) ON DELETE CASCADE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME='scenarios' AND COLUMN_NAME='origin_node_id') THEN
        ALTER TABLE scenarios ADD COLUMN origin_node_id UUID;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME='scenarios' AND COLUMN_NAME='destination_node_id') THEN
        ALTER TABLE scenarios ADD COLUMN destination_node_id UUID;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME='scenarios' AND COLUMN_NAME='constraints') THEN
        ALTER TABLE scenarios ADD COLUMN constraints JSONB DEFAULT '{}';
    END IF;
END $$;

-- 3. Add dataset_id to network tables (if missing)
DO $$ 
DECLARE 
    tbl TEXT;
BEGIN
    FOR tbl IN SELECT unnest(ARRAY['logistics_nodes', 'route_edges', 'fuel_indices']) 
    LOOP
        IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME=tbl AND COLUMN_NAME='dataset_id') THEN
            EXECUTE format('ALTER TABLE %I ADD COLUMN dataset_id UUID REFERENCES datasets(id) ON DELETE CASCADE', tbl);
        END IF;
    END LOOP;
END $$;

-- 4. Create Supporting Structures
CREATE TABLE IF NOT EXISTS carrier_pricing (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  dataset_id UUID NOT NULL REFERENCES datasets(id) ON DELETE CASCADE,
  carrier_id TEXT NOT NULL,
  mode TEXT NOT NULL,
  cost_per_km DECIMAL NOT NULL,
  fuel_indexed BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS shipments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  dataset_id UUID NOT NULL REFERENCES datasets(id) ON DELETE CASCADE,
  shipment_id TEXT NOT NULL,
  origin_node_id TEXT NOT NULL,
  destination_node_id TEXT NOT NULL,
  volume DECIMAL NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 5. THE PIVOT: Remove scenario_id from static network tables
-- We must disable the user-defined immutability triggers first.
-- We use individual DISABLE TRIGGER commands with specific trigger names.
-- If the triggers don't exist, these will error — so we wrap in exception handlers.

DO $$ BEGIN
    BEGIN ALTER TABLE logistics_nodes DISABLE TRIGGER trg_protect_nodes; EXCEPTION WHEN undefined_object THEN NULL; END;
    BEGIN ALTER TABLE route_edges DISABLE TRIGGER trg_protect_edges; EXCEPTION WHEN undefined_object THEN NULL; END;
    BEGIN ALTER TABLE fuel_indices DISABLE TRIGGER trg_protect_fuel; EXCEPTION WHEN undefined_object THEN NULL; END;
END $$;

-- Drop scenario_id from network tables (CASCADE removes dependent FKs)
DO $$
DECLARE
    tbl TEXT;
BEGIN
    FOR tbl IN SELECT unnest(ARRAY['logistics_nodes', 'route_edges', 'fuel_indices'])
    LOOP
        IF EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME=tbl AND COLUMN_NAME='scenario_id') THEN
            EXECUTE format('ALTER TABLE %I DROP COLUMN scenario_id CASCADE', tbl);
        END IF;
    END LOOP;
END $$;

-- Re-enable triggers
DO $$ BEGIN
    BEGIN ALTER TABLE logistics_nodes ENABLE TRIGGER trg_protect_nodes; EXCEPTION WHEN undefined_object THEN NULL; END;
    BEGIN ALTER TABLE route_edges ENABLE TRIGGER trg_protect_edges; EXCEPTION WHEN undefined_object THEN NULL; END;
    BEGIN ALTER TABLE fuel_indices ENABLE TRIGGER trg_protect_fuel; EXCEPTION WHEN undefined_object THEN NULL; END;
END $$;

-- 6. Add missing columns to fuel_indices (region was never in the original schema)
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME='fuel_indices' AND COLUMN_NAME='region') THEN
        ALTER TABLE fuel_indices ADD COLUMN region TEXT;
    END IF;
END $$;

-- 7. Add baseline_routes dataset_id column if baseline_routes table exists
DO $$ BEGIN
    IF EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME='baseline_routes') THEN
        IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME='baseline_routes' AND COLUMN_NAME='dataset_id') THEN
            ALTER TABLE baseline_routes ADD COLUMN dataset_id UUID REFERENCES datasets(id) ON DELETE CASCADE;
        END IF;
        IF EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME='baseline_routes' AND COLUMN_NAME='scenario_id') THEN
            ALTER TABLE baseline_routes DROP COLUMN scenario_id CASCADE;
        END IF;
    END IF;
END $$;

-- 7. Indexes
CREATE INDEX IF NOT EXISTS idx_nodes_dataset_id ON logistics_nodes(dataset_id);
CREATE INDEX IF NOT EXISTS idx_edges_dataset_id ON route_edges(dataset_id);
CREATE INDEX IF NOT EXISTS idx_fuel_dataset_id ON fuel_indices(dataset_id);
CREATE INDEX IF NOT EXISTS idx_carrier_dataset_id ON carrier_pricing(dataset_id);
CREATE INDEX IF NOT EXISTS idx_shipments_dataset_id ON shipments(dataset_id);
