// src/hooks/useHosClock.js
// ═══════════════════════════════════════════════════════════════════
// Real-time HOS clock hook — Enterprise Commercial ELD Engine
// Personal Conveyance, Yard Moves, HOS Exceptions, & Split Sleeper
// ═══════════════════════════════════════════════════════════════════

import { useMemo } from 'react';
import { HOS_LIMITS, RULE_SETS } from '../engine/hosEngine.js';
import { getLast7Days } from '../services/timeService.js';

export default function useHosClock(blocksInput = [], optionsInput = {}) {
  const blocks = Array.isArray(blocksInput)
    ? blocksInput
    : (blocksInput && Array.isArray(blocksInput.segments)
        ? blocksInput.segments
        : (blocksInput && Array.isArray(blocksInput.blocks)
            ? blocksInput.blocks
            : []));

  const opts = (typeof optionsInput === 'object' && optionsInput !== null && Object.keys(optionsInput).length > 0)
    ? optionsInput
    : (typeof blocksInput === 'object' && blocksInput !== null ? blocksInput : {});

  const cycleHoursUsedPrior = opts.cycleHoursUsedPrior !== undefined ? opts.cycleHoursUsedPrior : 15;
  const ruleSetKey = opts.ruleSet || 'interstate_70_8';
  const exceptions = opts.exceptions || { adverseDriving: false, sixteenHourException: false, shortHaulExemption: false };

  return useMemo(() => {
    const sorted = Array.isArray(blocks) ? [...blocks].sort((a, b) => (a.startMin || 0) - (b.startMin || 0)) : [];

    let totalDrivingMins = 0;
    let totalOnDutyMins = 0;
    let totalSleeperMins = 0;
    let totalOffDutyMins = 0;
    let pcMins = 0; // Personal Conveyance (Off-duty)
    let ymMins = 0; // Yard Move (On-duty not driving)

    let driveSinceBreak = 0;
    let shiftWindowStart = -1;

    const violations = [];
    const warnings = [];

    // Base limits from rule set
    const activeRuleConfig = RULE_SETS[ruleSetKey?.toUpperCase()] || RULE_SETS.INTERSTATE_70_8;
    let baseDriveLimitHours = activeRuleConfig.maxDriving || 11;
    let baseWindowLimitHours = activeRuleConfig.maxWindow || 14;

    // Apply HOS Exceptions (+2h for Adverse Driving / 16h exception)
    if (exceptions.adverseDriving) {
      baseDriveLimitHours += 2; // 11h -> 13h
      baseWindowLimitHours += 2; // 14h -> 16h
    } else if (exceptions.sixteenHourException) {
      baseWindowLimitHours = Math.max(baseWindowLimitHours, 16); // 14h -> 16h
    }

    for (const b of sorted) {
      const dur = Math.max(0, (b.endMin || 0) - (b.startMin || 0));
      if (dur === 0) continue;

      if (b.specialCategory === 'personal_conveyance') {
        pcMins += dur;
        totalOffDutyMins += dur;
        continue;
      }

      if (b.specialCategory === 'yard_move') {
        ymMins += dur;
        totalOnDutyMins += dur;
        continue;
      }

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
          break;

        case 'off_duty':
        default:
          totalOffDutyMins += dur;
          if (dur >= 30) driveSinceBreak = 0;
          break;
      }
    }

    const driveLimitMins = baseDriveLimitHours * 60;
    const windowLimitMins = baseWindowLimitHours * 60;
    const breakLimitMins = 8 * 60; // 8 continuous hours driving before break
    const cycleLimitMins = (activeRuleConfig.maxCycleHours || 70) * 60;

    const driveRemaining = Math.max(0, driveLimitMins - totalDrivingMins);
    
    let shiftElapsed = 0;
    if (shiftWindowStart !== -1) {
      const lastBlock = sorted[sorted.length - 1];
      shiftElapsed = (lastBlock ? lastBlock.endMin : 1440) - shiftWindowStart;
    }
    const shiftRemaining = Math.max(0, windowLimitMins - shiftElapsed);

    const breakCountdown = Math.max(0, breakLimitMins - driveSinceBreak);

    const cycleUsedPriorMins = cycleHoursUsedPrior * 60;
    const totalCycleDutyMins = cycleUsedPriorMins + totalDrivingMins + totalOnDutyMins;
    const cycleRemaining = Math.max(0, cycleLimitMins - totalCycleDutyMins);

    // Rule 1: Driving Limit
    if (totalDrivingMins > driveLimitMins) {
      violations.push({
        rule: `${baseDriveLimitHours}-Hour Driving Limit`,
        description: `Exceeded maximum driving time by ${Math.round((totalDrivingMins - driveLimitMins) / 60)}h ${Math.round((totalDrivingMins - driveLimitMins) % 60)}m.`,
      });
    } else if (driveRemaining <= 60 && driveRemaining > 0) {
      warnings.push({
        rule: `${baseDriveLimitHours}-Hour Driving Limit`,
        description: `Approaching driving limit: ${Math.round(driveRemaining)} minutes remaining.`,
      });
    }

    // Rule 2: Duty Window Limit
    if (shiftElapsed > windowLimitMins) {
      violations.push({
        rule: `${baseWindowLimitHours}-Hour Duty Window`,
        description: `Shift window exceeded by ${Math.round((shiftElapsed - windowLimitMins) / 60)}h ${Math.round((shiftElapsed - windowLimitMins) % 60)}m.`,
      });
    }

    // Rule 3: 30-Minute Break Rule (Exempt if Short-Haul 150 Air-Mile)
    if (!exceptions.shortHaulExemption) {
      if (driveSinceBreak > breakLimitMins) {
        violations.push({
          rule: '30-Minute Rest Break',
          description: `Driven ${Math.round(driveSinceBreak / 60)}h continuous without a mandatory 30-minute break.`,
        });
      } else if (breakCountdown <= 45 && breakCountdown > 0) {
        warnings.push({
          rule: '30-Minute Rest Break',
          description: `Mandatory 30-minute break required in ${Math.round(breakCountdown)} minutes.`,
        });
      }
    }

    const complianceStatus = violations.length > 0 ? 'violation' : warnings.length > 0 ? 'warning' : 'legal';

    // Calculate dynamic 7-day rolling calendar dates
    const dynamic7Days = getLast7Days();
    const recap7Day = dynamic7Days.map((item, idx) => ({
      day: item.day,
      date: item.date,
      hoursOnDuty: idx === 6 ? (totalDrivingMins + totalOnDutyMins) / 60 : item.defaultHours,
    }));

    return {
      clocks: {
        driveRemaining,
        shiftRemaining,
        breakCountdown,
        cycleRemaining,
        cycleUsed: (cycleUsedPriorMins + totalDrivingMins + totalOnDutyMins) / 60,
        totalDrivingHours: totalDrivingMins / 60,
        totalOnDutyHours: (totalDrivingMins + totalOnDutyMins) / 60,
        personalConveyanceHours: pcMins / 60,
        yardMoveHours: ymMins / 60,
        baseDriveLimitHours,
        baseWindowLimitHours,
      },
      violations,
      warnings,
      complianceStatus,
      splitSleeperPairing: {
        isEligible: totalSleeperMins >= 180,
        pairingType: totalSleeperMins >= 420 ? '7/3 Split' : '8/2 Split',
        qualifyingPeriodMinutes: totalSleeperMins,
      },
      recap7Day,
    };
  }, [blocks, cycleHoursUsedPrior, ruleSetKey, exceptions]);
}
