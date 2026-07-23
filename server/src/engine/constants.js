// server/src/engine/constants.js
// ═══════════════════════════════════════════════════════════════════
// FMCSA Hours-of-Service limits — 49 CFR Part 395
// Property-carrying CMV drivers, 70-hour/8-day cycle
// No adverse driving conditions exception applied
// ═══════════════════════════════════════════════════════════════════

/** §395.3(a)(3) — Maximum hours of driving after a qualifying off-duty reset */
export const MAX_DRIVING_HOURS = 11;

/** §395.3(a)(2) — Maximum on-duty window (starts at first on-duty event, does NOT pause for breaks) */
export const MAX_WINDOW_HOURS = 14;

/** §395.3(a)(3)(ii) — Mandatory 30-min break after this many cumulative driving hours */
export const BREAK_AFTER_DRIVING_HOURS = 8;

/** §395.3(a)(3)(ii) — Duration of the mandatory break (Off Duty, Sleeper Berth, or On Duty Not Driving) */
export const BREAK_DURATION_HOURS = 0.5;

/** §395.3(b) — Maximum total on-duty hours in a rolling 8-day window */
export const CYCLE_LIMIT_HOURS = 70;

/** §395.3(b) — Number of trailing days for the cycle limit */
export const CYCLE_WINDOW_DAYS = 8;

/** §395.3(c) — Consecutive off-duty hours required to reset the 70-hr accumulator */
export const RESTART_HOURS = 34;

/** §395.3(a)(1) — Consecutive off-duty hours required before 14-hr/11-hr clocks reset */
export const RESET_HOURS = 10;

// ── Assignment-specific assumptions (not from regulation) ───────────
/** Fuel stop required at least every this many miles */
export const FUEL_STOP_INTERVAL_MILES = 1000;

/** Duration of a fuel stop (On Duty Not Driving) — configurable placeholder */
export const FUEL_STOP_DURATION_HOURS = 0.5;

/** Duration allotted for pickup (On Duty Not Driving) */
export const PICKUP_DURATION_HOURS = 1;

/** Duration allotted for drop-off (On Duty Not Driving) */
export const DROPOFF_DURATION_HOURS = 1;

/** Pre-trip inspection time (On Duty Not Driving), included in first day */
export const PRETRIP_DURATION_HOURS = 0.25;

// ── Duty status enum values ─────────────────────────────────────────
export const DUTY = Object.freeze({
  OFF_DUTY: 'off_duty',
  SLEEPER_BERTH: 'sleeper_berth',
  DRIVING: 'driving',
  ON_DUTY_NOT_DRIVING: 'on_duty_not_driving',
});
