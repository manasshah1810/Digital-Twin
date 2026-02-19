-- Baseline Routes Table for Snapshots
CREATE TABLE IF NOT EXISTS baseline_routes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  scenario_id UUID NOT NULL REFERENCES scenarios(id) ON DELETE CASCADE,
  source_node_id UUID NOT NULL REFERENCES logistics_nodes(id) ON DELETE CASCADE,
  target_node_id UUID NOT NULL REFERENCES logistics_nodes(id) ON DELETE CASCADE,
  total_cost DECIMAL NOT NULL,
  route_data JSONB NOT NULL, -- { path: string[], modeBreakdown: Record<string, number>, steps: any[] }
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(scenario_id, source_node_id, target_node_id)
);

-- Ensure Immutability for Baseline Snapshots
CREATE OR REPLACE FUNCTION protect_baseline_routes()
RETURNS TRIGGER AS $$
BEGIN
  RAISE EXCEPTION 'Operation not permitted: Baseline snapshots are immutable.';
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_protect_baseline_routes
BEFORE UPDATE OR DELETE ON baseline_routes
FOR EACH ROW EXECUTE FUNCTION protect_baseline_routes();
