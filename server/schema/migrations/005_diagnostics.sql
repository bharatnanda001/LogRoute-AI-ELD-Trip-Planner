-- =====================================================================
-- Migration 005: ELD Diagnostic Events
-- GPS lost, power interruption, engine sync lost, data transfer failed.
-- =====================================================================

CREATE TABLE IF NOT EXISTS eld_diagnostics (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    driver_id       UUID REFERENCES drivers(id),
    carrier_id      UUID NOT NULL REFERENCES carriers(id) ON DELETE CASCADE,
    vehicle_id      UUID REFERENCES vehicles(id),
    diagnostic_code VARCHAR(30) NOT NULL,
    -- diagnostic_code: gps_lost | power_interrupt | engine_sync_lost |
    --                  data_transfer_fail | clock_drift | firmware_error |
    --                  eld_disconnected | eld_reconnected
    severity        VARCHAR(10) NOT NULL DEFAULT 'warning',
    -- severity: info | warning | critical
    description     TEXT,
    started_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    resolved_at     TIMESTAMPTZ,
    is_active       BOOLEAN NOT NULL DEFAULT TRUE,
    latitude        NUMERIC(9,6),
    longitude       NUMERIC(9,6),
    synced          BOOLEAN NOT NULL DEFAULT TRUE,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_diag_carrier ON eld_diagnostics(carrier_id);
CREATE INDEX IF NOT EXISTS idx_diag_driver ON eld_diagnostics(driver_id);
CREATE INDEX IF NOT EXISTS idx_diag_active ON eld_diagnostics(is_active) WHERE is_active = TRUE;
CREATE INDEX IF NOT EXISTS idx_diag_code ON eld_diagnostics(diagnostic_code);

COMMENT ON TABLE eld_diagnostics IS 'ELD diagnostic/malfunction events — GPS loss, power interruption, etc.';
