-- =====================================================================
-- Migration 007: Refresh Tokens
-- Long-lived refresh tokens stored server-side for JWT rotation.
-- =====================================================================

CREATE TABLE IF NOT EXISTS refresh_tokens (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash  VARCHAR(255) NOT NULL,
    device_info TEXT,              -- user-agent or device identifier
    ip_address  INET,
    expires_at  TIMESTAMPTZ NOT NULL,
    revoked_at  TIMESTAMPTZ,       -- NULL = active, set = revoked
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_refresh_user ON refresh_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_refresh_hash ON refresh_tokens(token_hash);
CREATE INDEX IF NOT EXISTS idx_refresh_expires ON refresh_tokens(expires_at);

-- Auto-cleanup expired tokens (optional scheduled job)
-- DELETE FROM refresh_tokens WHERE expires_at < now() - INTERVAL '7 days';

COMMENT ON TABLE refresh_tokens IS 'Server-side refresh token store for JWT rotation with device tracking.';
