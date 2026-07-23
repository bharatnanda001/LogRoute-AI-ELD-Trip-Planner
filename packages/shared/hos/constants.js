// packages/shared/hos/constants.js
// ═══════════════════════════════════════════════════════════════════
// FMCSA 49 CFR Part 395 Hours of Service Regulatory Constants
// Enterprise Commercial ELD Specification (Samsara / Motive Grade)
// ═══════════════════════════════════════════════════════════════════

/** Maximum driving hours allowed per 14-hour duty window (§395.3(a)(1)) */
export const MAX_DRIVING_HOURS = 11;

/** Maximum total shift window duration in hours (§395.3(a)(2)) */
export const MAX_WINDOW_HOURS = 14;

/** Cumulative driving hours after which a 30-minute break is mandatory (§395.3(a)(3)(ii)) */
export const BREAK_AFTER_DRIVING_HOURS = 8;

/** Duration of the mandatory rest break in hours (§395.3(a)(3)(ii)) */
export const BREAK_DURATION_HOURS = 0.5;

/** Maximum cycle hours allowed in 8 consecutive days (§395.3(b)) */
export const CYCLE_LIMIT_HOURS = 70;

/** Number of days in the standard cycle (§395.3(b)) */
export const CYCLE_DAYS = 8;

/** Mandatory off-duty reset duration in hours (§395.3(a)(1)) */
export const RESET_HOURS = 10;

/** Consecutive off-duty hours required for a 34-hour restart (§395.3(c)) */
export const RESTART_HOURS = 34;

/** Default distance interval between fuel stops in miles */
export const FUEL_STOP_INTERVAL_MILES = 1000;

/** Duration of a standard fuel stop in hours */
export const FUEL_STOP_DURATION_HOURS = 0.5;

/** Duration of pre-trip inspection in hours */
export const PRETRIP_DURATION_HOURS = 0.5;

/** Duration of pickup stop in hours */
export const PICKUP_DURATION_HOURS = 1.0;

/** Duration of dropoff stop in hours */
export const DROPOFF_DURATION_HOURS = 1.0;

/** Standard average commercial driving speed in miles per hour */
export const DEFAULT_AVG_SPEED_MPH = 60;

/** Duty Status Enums */
export const DUTY = {
  OFF_DUTY: 'off_duty',
  SLEEPER_BERTH: 'sleeper_berth',
  DRIVING: 'driving',
  ON_DUTY_NOT_DRIVING: 'on_duty_not_driving',
};

/** Special Duty Categories (§395.28 & FMCSA Guidance) */
export const SPECIAL_CATEGORY = {
  NONE: 'none',
  PERSONAL_CONVEYANCE: 'personal_conveyance', // Off-Duty (PC)
  YARD_MOVE: 'yard_move',                    // On-Duty (YM)
};

/** HOS Rule Sets (Interstate vs Intrastate) */
export const RULE_SETS = {
  INTERSTATE_70_8: { id: 'interstate_70_8', name: 'Interstate 70-Hr / 8-Day', maxDriving: 11, maxWindow: 14, cycleLimit: 70, cycleDays: 8 },
  INTERSTATE_60_7: { id: 'interstate_60_7', name: 'Interstate 60-Hr / 7-Day', maxDriving: 11, maxWindow: 14, cycleLimit: 60, cycleDays: 7 },
  INTRASTATE_TEXAS: { id: 'intrastate_tx', name: 'Intrastate Texas (12h/15h/70h)', maxDriving: 12, maxWindow: 15, cycleLimit: 70, cycleDays: 7 },
  INTRASTATE_CALIFORNIA: { id: 'intrastate_ca', name: 'Intrastate California (12h/16h/80h)', maxDriving: 12, maxWindow: 16, cycleLimit: 80, cycleDays: 8 },
};

/** Special HOS Exceptions (§395.1) */
export const HOS_EXCEPTIONS = {
  ADVERSE_DRIVING: 'adverse_driving',            // §395.1(b)(1) +2h driving & window
  SIXTEEN_HOUR_SHORT_HAUL: 'sixteen_hour_haul',  // §395.1(o) 16-hr shift window extension (1x / 7 days)
  SHORT_HAUL_150_AIR: 'short_haul_150_air',     // §395.1(e) 150 air-mile radius exemption
};

/** FMCSA Immutable Audit Event Types */
export const FMCSA_EVENT_TYPES = {
  DUTY_CHANGE: 'DUTY_CHANGE',
  ENGINE_ON: 'ENGINE_ON',
  ENGINE_OFF: 'ENGINE_OFF',
  POWER_LOSS: 'POWER_LOSS',
  POWER_RESTORED: 'POWER_RESTORED',
  SYNC_LOSS: 'SYNC_LOSS',
  ELD_MALFUNCTION: 'ELD_MALFUNCTION',
  UNIDENTIFIED_DRIVING: 'UNIDENTIFIED_DRIVING',
  CERTIFICATION: 'CERTIFICATION',
  LOG_EDIT: 'LOG_EDIT',
  SPECIAL_CATEGORY_CHANGE: 'SPECIAL_CATEGORY_CHANGE',
};

export const HOS_LIMITS = {
  MAX_DRIVING_HOURS,
  MAX_WINDOW_HOURS,
  BREAK_AFTER_DRIVING_HOURS,
  BREAK_DURATION_HOURS,
  CYCLE_LIMIT_HOURS,
  RESET_HOURS,
  RESTART_HOURS,
};
