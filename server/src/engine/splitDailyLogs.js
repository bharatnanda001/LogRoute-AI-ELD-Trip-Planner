// server/src/engine/splitDailyLogs.js
// ═══════════════════════════════════════════════════════════════════
// Splits a continuous duty-status timeline into midnight-bounded
// daily log sheets per §395.8(f)(8).
//
// Each sheet covers exactly one calendar day (midnight to midnight)
// in the driver's home-terminal time zone.
//
// Segments that straddle midnight are split into two portions:
// one for each day, mapped via daily_log_segment_map.
// ═══════════════════════════════════════════════════════════════════

import { DUTY } from './constants.js';

/**
 * @param {DutySegment[]} segments — ordered array from computeDutyTimeline()
 * @param {string} timezone — IANA time zone for the driver's home terminal
 *                            (default 'UTC' — production should use the real tz)
 * @returns {DailyLogSheet[]} — one per calendar day, covering the whole trip
 */
export function splitIntoDailyLogSheets(segments, timezone = 'UTC') {
  if (!segments || segments.length === 0) {
    return [];
  }

  // ── Determine the date range ────────────────────────────────────
  const tripStart = segments[0].start;
  const tripEnd = segments[segments.length - 1].end;

  // Get the calendar dates this trip spans (in the given timezone)
  const startDate = toCalendarDate(tripStart, timezone);
  // If tripEnd is exactly midnight, it belongs to the previous day's sheet
  const adjustedEnd = new Date(tripEnd.getTime() - 1);
  const endDate = toCalendarDate(adjustedEnd, timezone);

  const sheets = [];
  let currentDate = new Date(startDate);

  while (currentDate <= endDate) {
    const dayStr = formatDate(currentDate);
    const dayStart = midnightUTC(currentDate);
    const nextDay = new Date(currentDate);
    nextDay.setUTCDate(nextDay.getUTCDate() + 1);
    const dayEnd = midnightUTC(nextDay);

    // ── Clip segments to this day's boundaries ──────────────────
    const daySegments = [];

    for (const seg of segments) {
      // Skip segments entirely outside this day
      if (seg.end <= dayStart || seg.start >= dayEnd) continue;

      // Clip start/end to day boundaries
      const portionStart = seg.start < dayStart ? dayStart : new Date(seg.start);
      const portionEnd = seg.end > dayEnd ? dayEnd : new Date(seg.end);

      const durationMs = portionEnd - portionStart;
      if (durationMs <= 0) continue;

      daySegments.push({
        ...seg,
        // Clipped times for this day only
        portionStart,
        portionEnd,
        portionMinutes: durationMs / 60000,
        // Original segment reference (for daily_log_segment_map)
        originalStart: seg.start,
        originalEnd: seg.end,
        isClipped: seg.start < dayStart || seg.end > dayEnd,
      });
    }

    // ── Compute per-status totals ───────────────────────────────
    const totals = {
      off_duty: 0,
      sleeper_berth: 0,
      driving: 0,
      on_duty_not_driving: 0,
    };

    daySegments.forEach(seg => {
      if (totals[seg.dutyStatus] !== undefined) {
        totals[seg.dutyStatus] += seg.portionMinutes;
      }
    });

    // ── Fill unaccounted time as off-duty ────────────────────────
    // If segments don't cover the full 24 hours, the gaps are off-duty
    const totalAccountedMinutes = Object.values(totals).reduce((a, b) => a + b, 0);
    const gapMinutes = 1440 - totalAccountedMinutes;
    if (gapMinutes > 0.01) {
      totals.off_duty += gapMinutes;
    }

    // Round to whole minutes to match DB constraint
    totals.off_duty = Math.round(totals.off_duty);
    totals.sleeper_berth = Math.round(totals.sleeper_berth);
    totals.driving = Math.round(totals.driving);
    totals.on_duty_not_driving = Math.round(totals.on_duty_not_driving);

    // Adjust rounding errors to ensure exactly 1440
    const totalRounded = totals.off_duty + totals.sleeper_berth +
                          totals.driving + totals.on_duty_not_driving;
    if (totalRounded !== 1440) {
      // Push rounding diff into off_duty (the "residual" category)
      totals.off_duty += (1440 - totalRounded);
    }

    sheets.push({
      logDate: dayStr,
      periodStartTime: dayStart,
      periodEndTime: dayEnd,
      segments: daySegments,
      totals,
      totalMilesDriven: daySegments
        .filter(s => s.dutyStatus === DUTY.DRIVING)
        .reduce((sum, s) => sum + (s.portionMinutes / 60) * (s.avgSpeed || 0), 0),
    });

    // Advance to next day
    currentDate.setUTCDate(currentDate.getUTCDate() + 1);
  }

  return sheets;
}

// ═══════════════════════════════════════════════════════════════════
// Helpers
// ═══════════════════════════════════════════════════════════════════

/**
 * Get the calendar date (as a Date at 00:00 UTC) for a given instant.
 * For simplicity, this uses UTC. In production, convert to home-terminal TZ first.
 */
function toCalendarDate(date, timezone) {
  // Using UTC for now — a production implementation would use
  // Intl.DateTimeFormat with the timezone to get the local date
  const d = new Date(date);
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
}

/**
 * Get midnight (00:00 UTC) for a given Date
 */
function midnightUTC(date) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

/**
 * Format a Date as YYYY-MM-DD
 */
function formatDate(date) {
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, '0');
  const d = String(date.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}
