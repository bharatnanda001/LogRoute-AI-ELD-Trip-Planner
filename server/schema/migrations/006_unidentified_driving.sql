-- =====================================================================
-- Migration 006: Unidentified Driving Records
-- If truck moves with no driver logged in → create unknown event.
-- Fleet manager assigns to a driver later (like Samsara/Motive).
-- =====================================================================

CREATE TABLE IF NOT EXISTS unidentified_driving (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    carrier_id      UUID NOT NULL REFERENCES carriers(id) ON DELETE CASCADE,
    vehicle_id      UUID NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
    start_time      TIMESTAMPTZ NOT NULL,
    end_time        TIMESTAMPTZ,
    distance_miles  NUMERIC(6,1),
    start_odometer  NUMERIC(8,1),
    end_odometer    NUMERIC(8,1),
    start_latitude  NUMERIC(9,6),
    start_longitude NUMERIC(9,6),
    end_latitude    NUMERIC(9,6),
    end_longitude   NUMERIC(9,6),

    -- Assignment
    assigned_driver UUID REFERENCES drivers(id),
    assigned_by     UUID REFERENCES users(id),
    assigned_at     TIMESTAMPTZ,
    assignment_note TEXT,

    -- Status
    status          VARCHAR(20) NOT NULL DEFAULT 'unassigned',
    -- status: unassigned | assigned | accepted | disputed | resolved
    disputed_by     UUID REFERENCES drivers(id),
    disputed_at     TIMESTAMPTZ,
    dispute_reason  TEXT,

    synced          BOOLEAN NOT NULL DEFAULT TRUE,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_uid_carrier ON unidentified_driving(carrier_id);
CREATE INDEX IF NOT EXISTS idx_uid_vehicle ON unidentified_driving(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_uid_status ON unidentified_driving(status);
CREATE INDEX IF NOT EXISTS idx_uid_assigned ON unidentified_driving(assigned_driver);

COMMENT ON TABLE unidentified_driving IS 'Unidentified driving events — truck moved without a logged-in driver.';
