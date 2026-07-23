// server/tests/splitDailyLogs.test.js
// ═══════════════════════════════════════════════════════════════════
// Daily log splitter tests — midnight boundary splitting (G6)
// ═══════════════════════════════════════════════════════════════════

import { splitIntoDailyLogSheets } from '../src/engine/splitDailyLogs.js';

// ── Helper: build a segment ─────────────────────────────────────
function seg(dutyStatus, startISO, endISO, annotation = '') {
  return {
    dutyStatus,
    start: new Date(startISO),
    end: new Date(endISO),
    durationHours: (new Date(endISO) - new Date(startISO)) / 3600000,
    annotation,
    location: null,
    bracketed: false,
  };
}

// ═══════════════════════════════════════════════════════════════════
// TEST: Single-day trip — totals sum to 1440
// ═══════════════════════════════════════════════════════════════════
test('Single-day trip: totals sum to exactly 1440 minutes', () => {
  const segments = [
    seg('off_duty',              '2026-07-22T00:00:00Z', '2026-07-22T06:00:00Z', 'Rest'),
    seg('on_duty_not_driving',   '2026-07-22T06:00:00Z', '2026-07-22T07:00:00Z', 'Pickup'),
    seg('driving',               '2026-07-22T07:00:00Z', '2026-07-22T15:00:00Z', 'Driving'),
    seg('on_duty_not_driving',   '2026-07-22T15:00:00Z', '2026-07-22T16:00:00Z', 'Drop-off'),
    seg('off_duty',              '2026-07-22T16:00:00Z', '2026-07-23T00:00:00Z', 'Rest'),
  ];

  const sheets = splitIntoDailyLogSheets(segments);
  expect(sheets.length).toBe(1);

  const day = sheets[0];
  const total = day.totals.off_duty + day.totals.sleeper_berth +
                day.totals.driving + day.totals.on_duty_not_driving;
  expect(total).toBe(1440);

  // Verify individual totals
  expect(day.totals.driving).toBe(480);           // 8h = 480 min
  expect(day.totals.on_duty_not_driving).toBe(120); // 2h = 120 min
  expect(day.totals.off_duty).toBe(840);           // 14h = 840 min
  expect(day.totals.sleeper_berth).toBe(0);
});

// ═══════════════════════════════════════════════════════════════════
// TEST: Segment straddling midnight — correctly split
// ═══════════════════════════════════════════════════════════════════
test('Segment straddling midnight is split across two sheets', () => {
  const segments = [
    seg('off_duty',  '2026-07-22T00:00:00Z', '2026-07-22T08:00:00Z', 'Rest'),
    seg('driving',   '2026-07-22T08:00:00Z', '2026-07-22T19:00:00Z', 'Driving'),
    // This segment straddles midnight:
    seg('off_duty',  '2026-07-22T19:00:00Z', '2026-07-23T05:00:00Z', '10-hr reset'),
    seg('driving',   '2026-07-23T05:00:00Z', '2026-07-23T10:00:00Z', 'Driving day 2'),
    seg('off_duty',  '2026-07-23T10:00:00Z', '2026-07-24T00:00:00Z', 'Rest'),
  ];

  const sheets = splitIntoDailyLogSheets(segments);
  expect(sheets.length).toBe(2);

  // Day 1: 2026-07-22
  const day1 = sheets[0];
  expect(day1.logDate).toBe('2026-07-22');
  const total1 = day1.totals.off_duty + day1.totals.sleeper_berth +
                 day1.totals.driving + day1.totals.on_duty_not_driving;
  expect(total1).toBe(1440);

  // Day 1 off-duty: 8h (00-08) + 5h (19-00) = 13h = 780 min
  expect(day1.totals.off_duty).toBe(780);
  // Day 1 driving: 11h (08-19) = 660 min
  expect(day1.totals.driving).toBe(660);

  // Day 2: 2026-07-23
  const day2 = sheets[1];
  expect(day2.logDate).toBe('2026-07-23');
  const total2 = day2.totals.off_duty + day2.totals.sleeper_berth +
                 day2.totals.driving + day2.totals.on_duty_not_driving;
  expect(total2).toBe(1440);

  // Day 2 off-duty: 5h (00-05) + 14h (10-00) = 19h = 1140 min
  expect(day2.totals.off_duty).toBe(1140);
  // Day 2 driving: 5h (05-10) = 300 min
  expect(day2.totals.driving).toBe(300);
});

// ═══════════════════════════════════════════════════════════════════
// TEST: No double-counted or missing minutes
// ═══════════════════════════════════════════════════════════════════
test('No double-counted or missing minutes across all sheets', () => {
  const segments = [
    seg('off_duty',              '2026-07-22T00:00:00Z', '2026-07-22T06:00:00Z'),
    seg('on_duty_not_driving',   '2026-07-22T06:00:00Z', '2026-07-22T07:25:00Z'),
    seg('driving',               '2026-07-22T07:25:00Z', '2026-07-22T15:25:00Z'),
    seg('off_duty',              '2026-07-22T15:25:00Z', '2026-07-22T15:55:00Z'),
    seg('driving',               '2026-07-22T15:55:00Z', '2026-07-22T18:55:00Z'),
    seg('on_duty_not_driving',   '2026-07-22T18:55:00Z', '2026-07-22T19:55:00Z'),
    seg('off_duty',              '2026-07-22T19:55:00Z', '2026-07-23T05:55:00Z'),
    seg('driving',               '2026-07-23T05:55:00Z', '2026-07-23T10:55:00Z'),
    seg('off_duty',              '2026-07-23T10:55:00Z', '2026-07-24T00:00:00Z'),
  ];

  const sheets = splitIntoDailyLogSheets(segments);

  // Every sheet must sum to exactly 1440
  for (const sheet of sheets) {
    const total = sheet.totals.off_duty + sheet.totals.sleeper_berth +
                  sheet.totals.driving + sheet.totals.on_duty_not_driving;
    expect(total).toBe(1440);
  }

  // Total driving across all sheets should equal total driving in input
  const inputDrivingMin = segments
    .filter(s => s.dutyStatus === 'driving')
    .reduce((sum, s) => sum + s.durationHours * 60, 0);
  const sheetDrivingMin = sheets.reduce((sum, s) => sum + s.totals.driving, 0);
  // Allow 1-minute rounding tolerance
  expect(Math.abs(sheetDrivingMin - inputDrivingMin)).toBeLessThanOrEqual(1);
});

// ═══════════════════════════════════════════════════════════════════
// TEST: Empty segments array
// ═══════════════════════════════════════════════════════════════════
test('Empty segments returns empty array', () => {
  const sheets = splitIntoDailyLogSheets([]);
  expect(sheets).toEqual([]);
});

test('Null segments returns empty array', () => {
  const sheets = splitIntoDailyLogSheets(null);
  expect(sheets).toEqual([]);
});
