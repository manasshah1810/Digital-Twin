-- Add parent_scenario_id to allow branching/forking
ALTER TABLE scenarios ADD COLUMN parent_scenario_id UUID REFERENCES scenarios(id) ON DELETE SET NULL;

CREATE INDEX idx_scenarios_parent_id ON scenarios(parent_scenario_id);
