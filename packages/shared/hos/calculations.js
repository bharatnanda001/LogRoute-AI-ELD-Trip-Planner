// packages/shared/hos/calculations.js
// ═══════════════════════════════════════════════════════════════════
// Pure FMCSA 49 CFR Part 395 HOS Engine Calculations
// Zero external dependencies — runs in Node.js, Web Worker, and Browser.
// ═══════════════════════════════════════════════════════════════════

import {
  MAX_DRIVING_HOURS,
  MAX_WINDOW_HOURS,
  BREAK_AFTER_DRIVING_HOURS,
  BREAK_DURATION_HOURS,
  CYCLE_LIMIT_HOURS,
  RESET_HOURS,
  RESTART_HOURS,
  FUEL_STOP_INTERVAL_MILES,
  FUEL_STOP_DURATION_HOURS,
  PICKUP_DURATION_HOURS,
  DROPOFF_DURATION_HOURS,
  PRETRIP_DURATION_HOURS,
  DUTY,
} from './constants.js';

import { HOS_RULES } from './rules.js';

/**
 * Compute a duty-status timeline for a planned trip.
 *
 * @param {object} params
 * @param {number} params.routeDistanceMiles
 * @param {number} params.routeDurationHours
 * @param {number} [params.cycleHoursUsed]
 * @param {Date|string} [params.departureTime]
 * @param {object} [params.pickupLocation]
 * @param {object} [params.dropoffLocation]
 * @param {number} [params.averageSpeedMph]
 * @returns {{ segments: Array, warnings: Array, summary: object }}
 */
export function computeDutyTimeline({
  routeDistanceMiles,
  routeDurationHours,
  cycleHoursUsed = 0,
  departureTime = new Date(),
  pickupLocation = null,
  dropoffLocation = null,
  averageSpeedMph = null,
}) {
  const startClock = new Date(departureTime);
  if (isNaN(startClock.getTime())) {
    throw new Error('Invalid departureTime date provided');
  }

  if (cycleHoursUsed >= CYCLE_LIMIT_HOURS) {
    throw new Error(
      `Cannot legally start trip: cycle hours used (${cycleHoursUsed}) ` +
      `already meets or exceeds the ${CYCLE_LIMIT_HOURS}-hour limit. ` +
      `A ${RESTART_HOURS}-hour restart is required first.`
    );
  }

  const avgSpeed = averageSpeedMph || (routeDurationHours > 0 ? routeDistanceMiles / routeDurationHours : 60);
  const warnings = [];
  const segments = [];

  let clock = new Date(startClock);
  let dayClock14 = 0;
  let driveClock11 = 0;
  let cumulativeDriveSinceBreak = 0;
  let milesSinceFuel = 0;
  let cycleHoursRemaining = CYCLE_LIMIT_HOURS - cycleHoursUsed;
  let milesRemaining = routeDistanceMiles;
  let windowOpen = false;

  function addSegment(dutyStatus, durationHours, label, options = {}) {
    const start = new Date(clock);
    const end = new Date(clock.getTime() + durationHours * 3600000);
    segments.push({
      dutyStatus,
      start,
      end,
      durationHours: round2(durationHours),
      annotation: label,
      location: options.location || null,
      bracketed: options.bracketed || false,
    });
    clock = end;
    return durationHours;
  }

  function consumeOnDuty(hours) {
    if (!windowOpen) {
      windowOpen = true;
    }
    dayClock14 += hours;
    cycleHoursRemaining -= hours;
  }

  // Pre-trip inspection
  addSegment(DUTY.ON_DUTY_NOT_DRIVING, PRETRIP_DURATION_HOURS, 'Pre-trip inspection', {
    location: pickupLocation,
  });
  consumeOnDuty(PRETRIP_DURATION_HOURS);

  // Pickup
  addSegment(DUTY.ON_DUTY_NOT_DRIVING, PICKUP_DURATION_HOURS, 'Pickup', {
    location: pickupLocation,
  });
  consumeOnDuty(PICKUP_DURATION_HOURS);

  const MAX_ITERATIONS = 500;
  let iterations = 0;

  while (milesRemaining > 0.1 && iterations < MAX_ITERATIONS) {
    iterations++;

    const hoursToFinish = milesRemaining / avgSpeed;
    const hoursUntilFuel = (FUEL_STOP_INTERVAL_MILES - milesSinceFuel) / avgSpeed;

    const maxDriveChunk = Math.min(
      MAX_DRIVING_HOURS - driveClock11,
      MAX_WINDOW_HOURS - dayClock14,
      BREAK_AFTER_DRIVING_HOURS - cumulativeDriveSinceBreak,
      hoursUntilFuel > 0 ? hoursUntilFuel : 0,
      cycleHoursRemaining,
      hoursToFinish,
    );

    if (maxDriveChunk <= 0.001) {
      if (cumulativeDriveSinceBreak >= BREAK_AFTER_DRIVING_HOURS - 0.001) {
        addSegment(DUTY.OFF_DUTY, BREAK_DURATION_HOURS, '30-min break (required)', {
          bracketed: true,
        });
        cumulativeDriveSinceBreak = 0;
        dayClock14 += BREAK_DURATION_HOURS;
      } else if (
        driveClock11 >= MAX_DRIVING_HOURS - 0.001 ||
        dayClock14 >= MAX_WINDOW_HOURS - 0.001 ||
        cycleHoursRemaining <= 0.001
      ) {
        addSegment(DUTY.OFF_DUTY, RESET_HOURS, '10-hr off-duty reset');
        driveClock11 = 0;
        dayClock14 = 0;
        cumulativeDriveSinceBreak = 0;
        windowOpen = false;

        const consecutiveOffDuty = getTrailingOffDutyHours(segments);
        if (consecutiveOffDuty >= RESTART_HOURS) {
          cycleHoursRemaining = CYCLE_LIMIT_HOURS;
          warnings.push(
            `34-hr restart triggered at ${clock.toISOString()} — cycle hours reset to ${CYCLE_LIMIT_HOURS}`
          );
        }
      } else {
        addSegment(DUTY.OFF_DUTY, BREAK_DURATION_HOURS, 'Mandatory rest');
        dayClock14 += BREAK_DURATION_HOURS;
        cumulativeDriveSinceBreak = 0;
      }
      continue;
    }

    const driveHours = Math.max(maxDriveChunk, 0.001);
    const driveMiles = driveHours * avgSpeed;

    addSegment(DUTY.DRIVING, driveHours, 'Driving');
    driveClock11 += driveHours;
    consumeOnDuty(driveHours);
    cumulativeDriveSinceBreak += driveHours;
    milesSinceFuel += driveMiles;
    milesRemaining -= driveMiles;

    if (milesSinceFuel >= FUEL_STOP_INTERVAL_MILES - 0.1 && milesRemaining > 1) {
      addSegment(DUTY.ON_DUTY_NOT_DRIVING, FUEL_STOP_DURATION_HOURS, 'Fuel stop');
      consumeOnDuty(FUEL_STOP_DURATION_HOURS);
      milesSinceFuel = 0;
    }
  }

  if (iterations >= MAX_ITERATIONS) {
    warnings.push('Engine hit safety limit — timeline output capped.');
  }

  // Dropoff
  if (dayClock14 + DROPOFF_DURATION_HOURS > MAX_WINDOW_HOURS || cycleHoursRemaining < DROPOFF_DURATION_HOURS) {
    addSegment(DUTY.OFF_DUTY, RESET_HOURS, '10-hr off-duty reset (before drop-off)');
    driveClock11 = 0;
    dayClock14 = 0;
    cumulativeDriveSinceBreak = 0;
    windowOpen = false;
  }

  addSegment(DUTY.ON_DUTY_NOT_DRIVING, DROPOFF_DURATION_HOURS, 'Drop-off', {
    location: dropoffLocation,
  });
  consumeOnDuty(DROPOFF_DURATION_HOURS);

  const totalDriving = segments
    .filter(s => s.dutyStatus === DUTY.DRIVING)
    .reduce((sum, s) => sum + s.durationHours, 0);
  const totalOnDuty = segments
    .filter(s => s.dutyStatus === DUTY.ON_DUTY_NOT_DRIVING)
    .reduce((sum, s) => sum + s.durationHours, 0);
  const totalOffDuty = segments
    .filter(s => s.dutyStatus === DUTY.OFF_DUTY || s.dutyStatus === DUTY.SLEEPER_BERTH)
    .reduce((sum, s) => sum + s.durationHours, 0);
  const tripDuration = (clock - startClock) / 3600000;

  const summary = {
    totalDrivingHours: round2(totalDriving),
    totalOnDutyNotDrivingHours: round2(totalOnDuty),
    totalOffDutyHours: round2(totalOffDuty),
    totalTripHours: round2(tripDuration),
    totalMiles: round2(routeDistanceMiles),
    numberOfSegments: segments.length,
    departureTime: startClock.toISOString(),
    arrivalTime: clock.toISOString(),
    cycleHoursUsedAtEnd: round2(cycleHoursUsed + totalDriving + totalOnDuty),
  };

  return { segments, warnings, summary };
}

/**
 * Predicts when an HOS violation will occur based on active driving speed.
 */
export function predictViolations({ driveRemainingMins, shiftRemainingMins, speedMph }) {
  if (speedMph <= 0) return null;
  const minRemaining = Math.min(driveRemainingMins, shiftRemainingMins);
  if (minRemaining <= 0) return { willViolateInMins: 0, distanceToViolationMiles: 0 };

  const distanceMiles = (minRemaining / 60) * speedMph;
  return {
    willViolateInMins: Math.round(minRemaining),
    distanceToViolationMiles: round2(distanceMiles),
  };
}

function getTrailingOffDutyHours(segments) {
  let hours = 0;
  for (let i = segments.length - 1; i >= 0; i--) {
    const seg = segments[i];
    if (seg.dutyStatus === DUTY.OFF_DUTY || seg.dutyStatus === DUTY.SLEEPER_BERTH) {
      hours += seg.durationHours;
    } else {
      break;
    }
  }
  return hours;
}

function round2(n) {
  return Math.round(n * 100) / 100;
}
