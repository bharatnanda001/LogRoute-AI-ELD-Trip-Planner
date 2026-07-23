-- =====================================================================
-- Migration 008: Driver Certifications (End-of-Day Signature)
-- Driver signs "I certify this log is true and correct."
-- Locks the daily log sheet; further edits become amendments.
-- =====================================================================

CREATE TABLE IF NOT EXISTS driver_certifications (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    daily_log_sheet_id  UUID NOT NULL REFERENCES daily_log_sheets(id) ON DELETE CASCADE,
    driver_id           UUID NOT NULL REFERENCES drivers(id) ON DELETE CASCADE,
    carrier_id          UUID NOT NULL REFERENCES carriers(id) ON DELETE CASCADE,
    signature_data      TEXT NOT NULL,
    -- base64-encoded canvas signature image
    certification_text  TEXT NOT NULL DEFAULT 'I hereby certify that my data entries and my record of duty status for this 24-hour period are true and correct.',
    certified_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
    ip_address          INET,
    user_agent          TEXT,
    latitude            NUMERIC(9,6),
    longitude           NUMERIC(9,6),
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (daily_log_sheet_id, driver_id)
);

CREATE INDEX IF NOT EXISTS idx_cert_driver ON driver_certifications(driver_id);
CREATE INDEX IF NOT EXISTS idx_cert_log ON driver_certifications(daily_log_sheet_id);

-- When a certification is created, mark the daily_log_sheet as certified
CREATE OR REPLACE FUNCTION certify_daily_log()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE daily_log_sheets
    SET certified = TRUE, certified_at = NEW.certified_at
    WHERE id = NEW.daily_log_sheet_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_certify_log ON driver_certifications;
CREATE TRIGGER trg_certify_log
    AFTER INSERT ON driver_certifications
    FOR EACH ROW
    EXECUTE FUNCTION certify_daily_log();

COMMENT ON TABLE driver_certifications IS 'End-of-day driver certification — locks the log, further edits become amendments.';
