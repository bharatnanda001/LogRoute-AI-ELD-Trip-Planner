// src/engine/hosEngine.js
// ═══════════════════════════════════════════════════════════════════
// FMCSA Hours of Service (HOS) Engine — 49 CFR Part 395
// Imports pure calculation primitives from shared package.
// ═══════════════════════════════════════════════════════════════════

import {
  DUTY,
  HOS_LIMITS,
  RULE_SETS,
  SPECIAL_CATEGORY,
  HOS_EXCEPTIONS,
  FMCSA_EVENT_TYPES,
  computeDutyTimeline as computeTimelineShared,
} from '../../packages/shared/hos/index.js';

export { DUTY, HOS_LIMITS, RULE_SETS, SPECIAL_CATEGORY, HOS_EXCEPTIONS, FMCSA_EVENT_TYPES };

export function computeDutyTimeline(params) {
  return computeTimelineShared(params);
}

/**
 * Splits a continuous duty timeline into midnight-to-midnight calendar daily log sheets.
 */
export function splitIntoDailyLogSheets(segments) {
  if (!segments || segments.length === 0) return [];

  const tripStart = new Date(segments[0].start);
  const tripEnd = new Date(segments[segments.length - 1].end);

  const startDate = new Date(Date.UTC(tripStart.getUTCFullYear(), tripStart.getUTCMonth(), tripStart.getUTCDate()));
  const adjustedEnd = new Date(tripEnd.getTime() - 1);
  const endDate = new Date(Date.UTC(adjustedEnd.getUTCFullYear(), adjustedEnd.getUTCMonth(), adjustedEnd.getUTCDate()));

  const sheets = [];
  let currentDate = new Date(startDate);

  while (currentDate <= endDate) {
    const dayStr = formatDate(currentDate);
    const dayStart = new Date(currentDate);
    const dayEnd = new Date(currentDate);
    dayEnd.setUTCDate(dayEnd.getUTCDate() + 1);

    const daySegments = [];

    for (const seg of segments) {
      const segStart = new Date(seg.start);
      const segEnd = new Date(seg.end);

      if (segEnd <= dayStart || segStart >= dayEnd) continue;

      const portionStart = segStart < dayStart ? dayStart : segStart;
      const portionEnd = segEnd > dayEnd ? dayEnd : segEnd;

      const durationMs = portionEnd - portionStart;
      if (durationMs <= 0) continue;

      daySegments.push({
        ...seg,
        start: portionStart,
        end: portionEnd,
        portionMinutes: durationMs / 60000,
        startMin: Math.max(0, (portionStart - dayStart) / 60000),
        endMin: Math.min(1440, (portionEnd - dayStart) / 60000),
      });
    }

    const totals = { driving: 0, onDuty: 0, sleeper: 0, offDuty: 0 };
    for (const s of daySegments) {
      const mins = s.portionMinutes;
      if (s.dutyStatus === 'driving') totals.driving += mins;
      else if (s.dutyStatus === 'on_duty_not_driving') totals.onDuty += mins;
      else if (s.dutyStatus === 'sleeper_berth') totals.sleeper += mins;
      else if (s.dutyStatus === 'off_duty') totals.offDuty += mins;
    }

    sheets.push({
      logDate: dayStr,
      segments: daySegments,
      totals,
    });

    currentDate.setUTCDate(currentDate.getUTCDate() + 1);
  }

  return sheets;
}

function formatDate(d) {
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, '0');
  const day = String(d.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}
