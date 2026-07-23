-- =====================================================================
-- Migration 003: Edit History (Immutable Audit Trail)
-- Every edit stores: old value, new value, who, when, reason.
-- FMCSA requires edit reason for all log amendments.
-- =====================================================================

CREATE TABLE IF NOT EXISTS edit_history (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    entity_type     VARCHAR(50) NOT NULL,
    -- entity_type: duty_status_segment | daily_log_sheet | trip | dvir_report
    entity_id       UUID NOT NULL,
    field_name      VARCHAR(100) NOT NULL,
    old_value       JSONB,
    new_value       JSONB,
    edited_by       UUID NOT NULL REFERENCES users(id),
    edited_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
    reason          TEXT NOT NULL,
    -- FMCSA requires a reason for every log edit/amendment
    edit_type       VARCHAR(20) NOT NULL DEFAULT 'amendment',
    -- edit_type: amendment | correction | annotation | system_auto
    ip_address      INET,
    user_agent      TEXT,
    synced          BOOLEAN NOT NULL DEFAULT TRUE,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_edit_history_entity ON edit_history(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_edit_history_editor ON edit_history(edited_by);
CREATE INDEX IF NOT EXISTS idx_edit_history_time ON edit_history(edited_at DESC);

COMMENT ON TABLE edit_history IS 'Immutable edit audit trail — every change to logs, segments, trips is recorded.';
