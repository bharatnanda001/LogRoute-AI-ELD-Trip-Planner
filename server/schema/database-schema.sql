-- =====================================================================
-- ELD Trip Planner — PostgreSQL Schema (v1.0)
-- Target: multi-driver, multi-carrier, auth-aware, web-only deployment
-- =====================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "btree_gist";

-- Enums
CREATE TYPE user_role AS ENUM ('driver', 'dispatcher', 'carrier_admin', 'system_admin');
CREATE TYPE duty_status AS ENUM ('off_duty', 'sleeper_berth', 'driving', 'on_duty_not_driving');
CREATE TYPE cycle_rule AS ENUM ('60_7', '70_8');
CREATE TYPE trip_status AS ENUM ('draft', 'planned', 'in_progress', 'completed', 'cancelled');
CREATE TYPE vehicle_unit_type AS ENUM ('tractor', 'trailer', 'straight_truck');
CREATE TYPE segment_annotation AS ENUM (
    'pretrip_inspection', 'posttrip_inspection', 'pickup', 'dropoff',
    'fuel_stop', 'thirty_min_break', 'ten_hour_reset', 'thirty_four_hour_restart',
    'scale_stop', 'driving_leg', 'other'
);

-- 1. USERS
CREATE TABLE users (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email           VARCHAR(255) NOT NULL UNIQUE,
    password_hash   VARCHAR(255) NOT NULL,
    role            user_role NOT NULL DEFAULT 'driver',
    is_active       BOOLEAN NOT NULL DEFAULT TRUE,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. CARRIERS
CREATE TABLE carriers (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name                VARCHAR(120) NOT NULL,
    usdot_number        VARCHAR(9) UNIQUE,
    main_office_address VARCHAR(255) NOT NULL,
    home_terminal_tz    VARCHAR(64) NOT NULL DEFAULT 'America/Chicago',
    default_cycle_rule  cycle_rule NOT NULL DEFAULT '70_8',
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. CARRIER_MEMBERSHIPS
CREATE TABLE carrier_memberships (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    carrier_id  UUID NOT NULL REFERENCES carriers(id) ON DELETE CASCADE,
    role_at_carrier user_role NOT NULL,
    is_active   BOOLEAN NOT NULL DEFAULT TRUE,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (user_id, carrier_id)
);

-- 4. DRIVERS
CREATE TABLE drivers (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id                 UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    carrier_id              UUID REFERENCES carriers(id),
    first_name              VARCHAR(60) NOT NULL,
    last_name               VARCHAR(60) NOT NULL,
    driver_license_number   VARCHAR(32) NOT NULL,
    driver_license_state    CHAR(2) NOT NULL,
    home_terminal_name      VARCHAR(120) NOT NULL,
    cycle_rule              cycle_rule NOT NULL DEFAULT '70_8',
    created_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (driver_license_number, driver_license_state)
);
CREATE INDEX idx_drivers_carrier ON drivers(carrier_id);

-- 5. VEHICLES
CREATE TABLE vehicles (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    carrier_id   UUID NOT NULL REFERENCES carriers(id) ON DELETE CASCADE,
    unit_type    vehicle_unit_type NOT NULL,
    unit_number  VARCHAR(20) NOT NULL,
    vin          VARCHAR(18),
    created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (carrier_id, unit_type, unit_number)
);
CREATE INDEX idx_vehicles_carrier ON vehicles(carrier_id);

-- 6. LOCATIONS
CREATE TABLE locations (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    label       VARCHAR(255) NOT NULL,
    city        VARCHAR(100),
    state       CHAR(2),
    latitude    NUMERIC(9,6) NOT NULL,
    longitude   NUMERIC(9,6) NOT NULL,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_locations_city_state ON locations(city, state);

-- 7. TRIPS
CREATE TABLE trips (
    id                          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    driver_id                   UUID NOT NULL REFERENCES drivers(id),
    carrier_id                  UUID NOT NULL REFERENCES carriers(id),
    tractor_vehicle_id          UUID REFERENCES vehicles(id),
    trailer_vehicle_id          UUID REFERENCES vehicles(id),
    current_location_id         UUID NOT NULL REFERENCES locations(id),
    pickup_location_id          UUID NOT NULL REFERENCES locations(id),
    dropoff_location_id         UUID NOT NULL REFERENCES locations(id),
    cycle_hours_used_at_start   NUMERIC(5,2) NOT NULL CHECK (cycle_hours_used_at_start >= 0),
    cycle_rule_used             cycle_rule NOT NULL,
    status                      trip_status NOT NULL DEFAULT 'draft',
    total_miles                 NUMERIC(8,2),
    total_drive_hours           NUMERIC(6,2),
    route_polyline              TEXT,
    shipping_doc_number         VARCHAR(60),
    commodity_description       VARCHAR(255),
    created_at                  TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at                  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_trips_driver ON trips(driver_id);
CREATE INDEX idx_trips_carrier ON trips(carrier_id);
CREATE INDEX idx_trips_status ON trips(status);

-- 8. DUTY_STATUS_SEGMENTS
CREATE TABLE duty_status_segments (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    trip_id                 UUID NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
    sequence_number         INTEGER NOT NULL,
    duty_status             duty_status NOT NULL,
    start_time              TIMESTAMPTZ NOT NULL,
    end_time                TIMESTAMPTZ NOT NULL,
    location_id             UUID REFERENCES locations(id),
    annotation              segment_annotation,
    remark_text             VARCHAR(120),
    odometer_miles_at_start NUMERIC(8,2),
    is_bracketed            BOOLEAN NOT NULL DEFAULT FALSE,
    created_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT chk_segment_time_order CHECK (end_time > start_time),
    UNIQUE (trip_id, sequence_number),
    EXCLUDE USING gist (
        trip_id WITH =,
        tstzrange(start_time, end_time) WITH &&
    )
);
CREATE INDEX idx_segments_trip_seq ON duty_status_segments(trip_id, sequence_number);
CREATE INDEX idx_segments_time_range ON duty_status_segments USING gist (tstzrange(start_time, end_time));

-- 9. DAILY_LOG_SHEETS
CREATE TABLE daily_log_sheets (
    id                                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    trip_id                             UUID NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
    log_date                            DATE NOT NULL,
    period_start_time                   TIMESTAMPTZ NOT NULL,
    period_end_time                     TIMESTAMPTZ NOT NULL,
    total_off_duty_minutes              INTEGER NOT NULL DEFAULT 0,
    total_sleeper_berth_minutes         INTEGER NOT NULL DEFAULT 0,
    total_driving_minutes               INTEGER NOT NULL DEFAULT 0,
    total_on_duty_not_driving_minutes   INTEGER NOT NULL DEFAULT 0,
    total_miles_driven_today            NUMERIC(6,2) NOT NULL DEFAULT 0,
    carrier_name_snapshot               VARCHAR(120) NOT NULL,
    main_office_address_snapshot        VARCHAR(255) NOT NULL,
    driver_signature_name               VARCHAR(120),
    co_driver_name                      VARCHAR(120),
    certified                           BOOLEAN NOT NULL DEFAULT FALSE,
    certified_at                        TIMESTAMPTZ,
    created_at                          TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (trip_id, log_date),
    CONSTRAINT chk_daily_totals_sum_to_24h CHECK (
        total_off_duty_minutes + total_sleeper_berth_minutes +
        total_driving_minutes + total_on_duty_not_driving_minutes = 1440
    )
);
CREATE INDEX idx_daily_logs_trip ON daily_log_sheets(trip_id, log_date);

-- 10. DAILY_LOG_SEGMENT_MAP
CREATE TABLE daily_log_segment_map (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    daily_log_sheet_id      UUID NOT NULL REFERENCES daily_log_sheets(id) ON DELETE CASCADE,
    duty_status_segment_id  UUID NOT NULL REFERENCES duty_status_segments(id) ON DELETE CASCADE,
    portion_start_time      TIMESTAMPTZ NOT NULL,
    portion_end_time        TIMESTAMPTZ NOT NULL,
    CONSTRAINT chk_portion_time_order CHECK (portion_end_time > portion_start_time),
    UNIQUE (daily_log_sheet_id, duty_status_segment_id)
);
CREATE INDEX idx_log_segment_map_sheet ON daily_log_segment_map(daily_log_sheet_id);
CREATE INDEX idx_log_segment_map_segment ON daily_log_segment_map(duty_status_segment_id);

-- 11. CYCLE_HOUR_SNAPSHOTS
CREATE TABLE cycle_hour_snapshots (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    driver_id               UUID NOT NULL REFERENCES drivers(id) ON DELETE CASCADE,
    snapshot_date            DATE NOT NULL,
    on_duty_hours_that_day   NUMERIC(5,2) NOT NULL,
    rolling_total_hours       NUMERIC(5,2) NOT NULL,
    restart_34hr_taken        BOOLEAN NOT NULL DEFAULT FALSE,
    created_at                TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (driver_id, snapshot_date)
);
CREATE INDEX idx_cycle_snapshots_driver_date ON cycle_hour_snapshots(driver_id, snapshot_date);
