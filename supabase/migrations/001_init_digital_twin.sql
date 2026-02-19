-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Function to handle updated_at
CREATE OR REPLACE FUNCTION handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Scenarios Table
CREATE TABLE scenarios (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  is_baseline BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TRIGGER set_updated_at_scenarios
BEFORE UPDATE ON scenarios
FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

-- Logistics Nodes Table
CREATE TABLE logistics_nodes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  scenario_id UUID NOT NULL REFERENCES scenarios(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  latitude DECIMAL(9,6),
  longitude DECIMAL(9,6),
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_logistics_nodes_scenario_id ON logistics_nodes(scenario_id);
CREATE INDEX idx_logistics_nodes_type ON logistics_nodes(type);

CREATE TRIGGER set_updated_at_logistics_nodes
BEFORE UPDATE ON logistics_nodes
FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

-- Route Edges Table
CREATE TABLE route_edges (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  scenario_id UUID NOT NULL REFERENCES scenarios(id) ON DELETE CASCADE,
  source_node_id UUID NOT NULL REFERENCES logistics_nodes(id) ON DELETE CASCADE,
  target_node_id UUID NOT NULL REFERENCES logistics_nodes(id) ON DELETE CASCADE,
  distance DECIMAL NOT NULL,
  mode TEXT NOT NULL, -- e.g., truck, rail, sea, air
  capacity DECIMAL,
  cost_per_unit DECIMAL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_route_edges_scenario_id ON route_edges(scenario_id);
CREATE INDEX idx_route_edges_source_node_id ON route_edges(source_node_id);
CREATE INDEX idx_route_edges_target_node_id ON route_edges(target_node_id);

CREATE TRIGGER set_updated_at_route_edges
BEFORE UPDATE ON route_edges
FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

-- Fuel Indices Table
CREATE TABLE fuel_indices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  scenario_id UUID NOT NULL REFERENCES scenarios(id) ON DELETE CASCADE,
  fuel_type TEXT NOT NULL,
  price_index DECIMAL NOT NULL,
  valid_from TIMESTAMPTZ,
  valid_until TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_fuel_indices_scenario_id ON fuel_indices(scenario_id);

CREATE TRIGGER set_updated_at_fuel_indices
BEFORE UPDATE ON fuel_indices
FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

-- Optimization Results Table
CREATE TABLE optimization_results (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  scenario_id UUID NOT NULL REFERENCES scenarios(id) ON DELETE CASCADE,
  total_cost DECIMAL,
  total_emissions DECIMAL,
  run_status TEXT DEFAULT 'pending', -- pending, running, completed, failed
  result_data JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_optimization_results_scenario_id ON optimization_results(scenario_id);

CREATE TRIGGER set_updated_at_optimization_results
BEFORE UPDATE ON optimization_results
FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

-- Decision Traces Table
CREATE TABLE decision_traces (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  optimization_result_id UUID NOT NULL REFERENCES optimization_results(id) ON DELETE CASCADE,
  scenario_id UUID NOT NULL REFERENCES scenarios(id) ON DELETE CASCADE,
  step_number INTEGER NOT NULL,
  decision_type TEXT NOT NULL,
  rationale TEXT,
  impact_metrics JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_decision_traces_scenario_id ON decision_traces(scenario_id);
CREATE INDEX idx_decision_traces_opt_result_id ON decision_traces(optimization_result_id);

-- Immutable Baseline Check
CREATE OR REPLACE FUNCTION protect_baseline_data()
RETURNS TRIGGER AS $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM scenarios 
    WHERE id = CASE 
      WHEN TG_TABLE_NAME = 'scenarios' THEN OLD.id 
      ELSE OLD.scenario_id 
    END 
    AND is_baseline = true
  ) THEN
    RAISE EXCEPTION 'Operation not permitted: Baseline scenarios and their associated data are immutable.';
  END IF;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- Attach immutability protection triggers
CREATE TRIGGER trg_protect_scenarios
BEFORE UPDATE OR DELETE ON scenarios
FOR EACH ROW WHEN (OLD.is_baseline = true)
EXECUTE FUNCTION protect_baseline_data();

CREATE TRIGGER trg_protect_nodes
BEFORE UPDATE OR DELETE ON logistics_nodes
FOR EACH ROW EXECUTE FUNCTION protect_baseline_data();

CREATE TRIGGER trg_protect_edges
BEFORE UPDATE OR DELETE ON route_edges
FOR EACH ROW EXECUTE FUNCTION protect_baseline_data();

CREATE TRIGGER trg_protect_fuel
BEFORE UPDATE OR DELETE ON fuel_indices
FOR EACH ROW EXECUTE FUNCTION protect_baseline_data();
