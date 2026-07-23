-- =====================================================================
-- Migration 002: FMCSA Event Log (Immutable, Append-Only)
-- Every status change, login, logout, certification, edit = one event.
-- No UPDATE or DELETE allowed — enforced by trigger.
-- =====================================================================

CREATE TABLE IF NOT EXISTS eld_events (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    driver_id       UUID NOT NULL REFERENCES drivers(id) ON DELETE CASCADE,
    carrier_id      UUID NOT NULL REFERENCES carriers(id) ON DELETE CASCADE,
    event_type      VARCHAR(50) NOT NULL,
    -- event_type: status_change | login | logout | certification |
    --             edit | annotation | power_on | power_off |
    --             malfunction_logged | malfunction_cleared
    event_code      VARCHAR(10),           -- FMCSA event type/code (e.g., 1/1, 1/2)
    previous_value  JSONB,
    new_value       JSONB,
    recorded_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
    latitude        NUMERIC(9,6),
    longitude       NUMERIC(9,6),
    odometer_miles  NUMERIC(8,1),
    engine_hours    NUMERIC(8,1),
    sequence_id     BIGSERIAL NOT NULL,    -- monotonically increasing, never gaps
    annotation      TEXT,
    origin          VARCHAR(20) NOT NULL DEFAULT 'driver',
    -- origin: driver | auto | fleet_admin | system
    synced          BOOLEAN NOT NULL DEFAULT TRUE,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_events_driver_time ON eld_events(driver_id, recorded_at DESC);
CREATE INDEX IF NOT EXISTS idx_events_carrier ON eld_events(carrier_id);
CREATE INDEX IF NOT EXISTS idx_events_type ON eld_events(event_type);
CREATE INDEX IF NOT EXISTS idx_events_sequence ON eld_events(sequence_id);

-- Immutability trigger: prevent UPDATE and DELETE
CREATE OR REPLACE FUNCTION prevent_event_mutation()
RETURNS TRIGGER AS $$
BEGIN
    RAISE EXCEPTION 'ELD events are immutable. Cannot % on eld_events table.',
        TG_OP;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_immutable_events ON eld_events;
CREATE TRIGGER trg_immutable_events
    BEFORE UPDATE OR DELETE ON eld_events
    FOR EACH ROW
    EXECUTE FUNCTION prevent_event_mutation();

COMMENT ON TABLE eld_events IS 'Immutable FMCSA event log — append-only, no updates or deletes.';
