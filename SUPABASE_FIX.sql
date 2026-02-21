CREATE OR REPLACE FUNCTION protect_baseline_data()
RETURNS TRIGGER AS $$
DECLARE
    is_base BOOLEAN := false;
BEGIN
    -- If we are in the scenarios table, check the current row
    IF (TG_TABLE_NAME = 'scenarios') THEN
        IF (OLD.is_baseline = true) THEN
            RAISE EXCEPTION 'Operation not permitted: Baseline scenarios are immutable.';
        END IF;
        RETURN OLD;
    END IF;
    BEGIN
        -- This block will fail safely if scenario_id doesn't exist on the record
        IF (OLD.scenario_id IS NOT NULL) THEN
            SELECT is_baseline INTO is_base FROM scenarios WHERE id = OLD.scenario_id;
            IF (is_base = true) THEN
                RAISE EXCEPTION 'Operation not permitted: This record belongs to an immutable baseline.';
            END IF;
        END IF;
    EXCEPTION WHEN undefined_column THEN
        -- Column is missing (pivot applied), skip the baseline check safely
        NULL;
    END;

    RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- 2. Update baseline_routes protection
-- The previous version blocked ALL deletes. This version allows DELETE 
-- but keeps UPDATE blocked to maintain snapshot integrity.
CREATE OR REPLACE FUNCTION protect_baseline_routes()
RETURNS TRIGGER AS $$
BEGIN
  -- Allow DELETE to enable dataset cleanup
  -- Keep UPDATE blocked so existing snapshots can't be tampered with
  IF (TG_OP = 'UPDATE') THEN
    RAISE EXCEPTION 'Operation not permitted: Baseline snapshots are immutable and cannot be modified.';
  END IF;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- 3. Confirm trigger state (Optional, but ensures everything is active)
-- Triggers are already attached from migrations 001 and 002. 
-- Replacing the functions above fixes the behavior immediately.
