-- =====================================================================
-- Migration 004: DVIR (Driver Vehicle Inspection Reports)
-- Pre-trip / Post-trip / En-route inspections with defect tracking.
-- =====================================================================

CREATE TABLE IF NOT EXISTS dvir_reports (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    driver_id           UUID NOT NULL REFERENCES drivers(id) ON DELETE CASCADE,
    carrier_id          UUID NOT NULL REFERENCES carriers(id) ON DELETE CASCADE,
    vehicle_id          UUID NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
    trailer_id          UUID REFERENCES vehicles(id),
    inspection_type     VARCHAR(20) NOT NULL,
    -- inspection_type: pre_trip | post_trip | en_route
    inspection_date     DATE NOT NULL,
    odometer_miles      NUMERIC(8,1),
    location_text       VARCHAR(255),
    latitude            NUMERIC(9,6),
    longitude           NUMERIC(9,6),

    -- Defect categories checklist (JSONB array)
    -- Each: { category, item, condition: 'ok'|'defect'|'na',
    --         severity: 'none'|'minor'|'major'|'out_of_service',
    --         description, photo_url? }
    defects             JSONB NOT NULL DEFAULT '[]',

    -- Standard DVIR categories
    -- brakes, coupling_devices, defroster_heater, door, electrical,
    -- emergency_equipment, exhaust, fluid_levels, frame, fuel_system,
    -- horn, lights, mirrors, reflectors, steering, suspension,
    -- tires, wheels_rims, wipers, other
    condition_safe      BOOLEAN NOT NULL,
    has_defects         BOOLEAN NOT NULL DEFAULT FALSE,

    -- Signatures
    driver_signature    TEXT,    -- base64 canvas signature
    driver_signed_at    TIMESTAMPTZ,
    mechanic_signature  TEXT,
    mechanic_name       VARCHAR(120),
    mechanic_notes      TEXT,
    mechanic_signed_at  TIMESTAMPTZ,
    repair_required     BOOLEAN NOT NULL DEFAULT FALSE,
    repairs_completed   BOOLEAN,
    repairs_completed_at TIMESTAMPTZ,

    -- Lock
    certified_at        TIMESTAMPTZ,
    synced              BOOLEAN NOT NULL DEFAULT TRUE,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_dvir_driver ON dvir_reports(driver_id);
CREATE INDEX IF NOT EXISTS idx_dvir_carrier ON dvir_reports(carrier_id);
CREATE INDEX IF NOT EXISTS idx_dvir_vehicle ON dvir_reports(vehicle_id, inspection_date DESC);
CREATE INDEX IF NOT EXISTS idx_dvir_date ON dvir_reports(inspection_date DESC);

COMMENT ON TABLE dvir_reports IS 'Driver Vehicle Inspection Reports — pre/post trip with defect tracking and signatures.';
