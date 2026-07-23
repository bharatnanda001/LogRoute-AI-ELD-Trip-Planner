-- =====================================================================
-- Migration 001: GPS Position History
-- Records driver GPS positions every 60 seconds for audit/playback.
-- =====================================================================

CREATE TABLE IF NOT EXISTS gps_positions (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    driver_id    UUID NOT NULL REFERENCES drivers(id) ON DELETE CASCADE,
    carrier_id   UUID NOT NULL REFERENCES carriers(id) ON DELETE CASCADE,
    latitude     NUMERIC(9,6) NOT NULL,
    longitude    NUMERIC(9,6) NOT NULL,
    speed_mph    NUMERIC(5,1) DEFAULT 0,
    heading      NUMERIC(5,1) DEFAULT 0,
    accuracy_m   NUMERIC(6,1),
    recorded_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    source       VARCHAR(20) NOT NULL DEFAULT 'browser_gps',
    -- source: browser_gps | eld_device | manual
    synced       BOOLEAN NOT NULL DEFAULT TRUE,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_gps_driver_time ON gps_positions(driver_id, recorded_at DESC);
CREATE INDEX IF NOT EXISTS idx_gps_carrier ON gps_positions(carrier_id);
CREATE INDEX IF NOT EXISTS idx_gps_recorded ON gps_positions(recorded_at);

COMMENT ON TABLE gps_positions IS 'GPS breadcrumb trail — one row per ~60s while driver is active.';
