// src/workers/hosWorker.js
// ═══════════════════════════════════════════════════════════════════
// Web Worker — runs HOS validation off the main thread so the UI
// stays at 60 fps during complex multi-day calculations.
//
// Message protocol:
//   postMessage({ type: 'validate', blocks, cycleHoursUsedPrior })
//   → responds with { type: 'result', clocks, violations, warnings, complianceStatus }
// ═══════════════════════════════════════════════════════════════════

const HOS_LIMITS = {
  MAX_DRIVING_HOURS: 11.0,
  MAX_WINDOW_HOURS: 14.0,
  BREAK_AFTER_DRIVING_HOURS: 8.0,
  BREAK_DURATION_HOURS: 0.5,
  CYCLE_LIMIT_HOURS: 70.0,
  RESET_HOURS: 10.0,
};

function fmtMin(mins) {
  const h = Math.floor(Math.abs(mins) / 60);
  const m = Math.round(Math.abs(mins) % 60);
  return `${h}h ${String(m).padStart(2, '0')}m`;
}

function validateTimeline(blocks, cycleHoursUsedPrior = 15) {
  const sorted = [...blocks].sort((a, b) => a.startMin - b.startMin);

  let totalDrivingMins = 0;
  let totalOnDutyMins = 0;
  let totalSleeperMins = 0;
  let totalOffDutyMins = 0;
  let driveSinceBreak = 0;
  let shiftWindowStart = -1;

  const violations = [];
  const warnings = [];

  for (const b of sorted) {
    const dur = Math.max(0, b.endMin - b.startMin);
    if (dur === 0) continue;

    switch (b.dutyStatus) {
      case 'driving':
        totalDrivingMins += dur;
        driveSinceBreak += dur;
        if (shiftWindowStart === -1) shiftWindowStart = b.startMin;
        break;
      case 'on_duty_not_driving':
        totalOnDutyMins += dur;
        if (shiftWindowStart === -1) shiftWindowStart = b.startMin;
        break;
      case 'sleeper_berth':
        totalSleeperMins += dur;
        if (dur >= 30) driveSinceBreak = 0;
        if (dur >= HOS_LIMITS.RESET_HOURS * 60) shiftWindowStart = -1;
        break;
      case 'off_duty':
        totalOffDutyMins += dur;
        if (dur >= 30) driveSinceBreak = 0;
        if (dur >= HOS_LIMITS.RESET_HOURS * 60) shiftWindowStart = -1;
        break;
    }
  }

  const lastBlock = sorted[sorted.length - 1];
  const currentMin = lastBlock ? lastBlock.endMin : 0;
  const shiftElapsed = shiftWindowStart >= 0 ? currentMin - shiftWindowStart : 0;

  const driveLimitMins = HOS_LIMITS.MAX_DRIVING_HOURS * 60;
  const shiftLimitMins = HOS_LIMITS.MAX_WINDOW_HOURS * 60;
  const breakLimitMins = HOS_LIMITS.BREAK_AFTER_DRIVING_HOURS * 60;
  const cycleLimitMins = HOS_LIMITS.CYCLE_LIMIT_HOURS * 60;
  const cycleUsedPriorMins = cycleHoursUsedPrior * 60;

  const driveRemaining = Math.max(0, driveLimitMins - totalDrivingMins);
  const shiftRemaining = Math.max(0, shiftLimitMins - shiftElapsed);
  const breakCountdown = Math.max(0, breakLimitMins - driveSinceBreak);
  const cycleRemaining = Math.max(0, cycleLimitMins - cycleUsedPriorMins - totalDrivingMins - totalOnDutyMins);

  const nextMandatoryBreak = breakCountdown > 0 && breakCountdown < breakLimitMins
    ? currentMin + breakCountdown
    : null;

  // Violations
  if (totalDrivingMins > driveLimitMins) {
    violations.push({
      rule: '§395.3(a)(3)(i)', title: '11-Hour Driving Limit',
      description: `Drove ${fmtMin(totalDrivingMins)} — exceeds ${fmtMin(driveLimitMins)} limit.`,
      severity: 'critical',
    });
  }
  if (shiftElapsed > shiftLimitMins) {
    violations.push({
      rule: '§395.3(a)(2)', title: '14-Hour Driving Window',
      description: `Shift window is ${fmtMin(shiftElapsed)} — exceeds ${fmtMin(shiftLimitMins)} limit.`,
      severity: 'critical',
    });
  }
  if (driveSinceBreak > breakLimitMins) {
    violations.push({
      rule: '§395.3(a)(3)(ii)', title: '30-Minute Rest Break',
      description: `Drove ${fmtMin(driveSinceBreak)} without a 30-minute break.`,
      severity: 'major',
    });
  }
  const totalCycleUsed = cycleUsedPriorMins + totalDrivingMins + totalOnDutyMins;
  if (totalCycleUsed > cycleLimitMins) {
    violations.push({
      rule: '§395.3(b)', title: '70-Hour / 8-Day Cycle',
      description: `Cycle usage is ${fmtMin(totalCycleUsed)} — exceeds ${fmtMin(cycleLimitMins)} limit.`,
      severity: 'critical',
    });
  }

  // Warnings
  if (driveRemaining > 0 && driveRemaining <= 60) {
    warnings.push({ rule: '§395.3(a)(3)(i)', title: 'Approaching 11-Hour Limit', description: `Only ${fmtMin(driveRemaining)} remaining.`, severity: 'warning' });
  }
  if (shiftRemaining > 0 && shiftRemaining <= 60) {
    warnings.push({ rule: '§395.3(a)(2)', title: 'Approaching 14-Hour Window', description: `Only ${fmtMin(shiftRemaining)} remaining.`, severity: 'warning' });
  }
  if (breakCountdown > 0 && breakCountdown <= 30) {
    warnings.push({ rule: '§395.3(a)(3)(ii)', title: '30-Minute Break Due Soon', description: `Break required within ${fmtMin(breakCountdown)}.`, severity: 'warning' });
  }

  let complianceStatus = 'legal';
  if (warnings.length > 0) complianceStatus = 'warning';
  if (violations.length > 0) complianceStatus = 'violation';

  return {
    clocks: {
      driveRemaining, shiftRemaining, breakCountdown, cycleRemaining,
      nextMandatoryBreak,
      nextResetAvailable: currentMin + HOS_LIMITS.RESET_HOURS * 60,
      driveSinceBreak, shiftElapsed,
      totalDrivingMins, totalOnDutyMins, totalOffDutyMins, totalSleeperMins,
    },
    violations,
    warnings,
    complianceStatus,
  };
}

// ── Worker message handler ────────────────────────────────────────
self.onmessage = function (e) {
  const { type, blocks, cycleHoursUsedPrior } = e.data;

  if (type === 'validate') {
    const result = validateTimeline(blocks, cycleHoursUsedPrior);
    self.postMessage({ type: 'result', ...result });
  }
};
