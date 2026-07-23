// server/src/services/eldService.js
// ═══════════════════════════════════════════════════════════════════
// ELD Data Persistence Service (ESM)
// ═══════════════════════════════════════════════════════════════════

import { query } from '../config/db.js';

export async function saveLog(driverId, logSheet, metadata) {
  const { date = new Date().toISOString().split('T')[0] } = metadata;
  const result = await query(
    `INSERT INTO daily_logs (driver_id, log_date, log_sheet, metadata)
     VALUES ($1, $2, $3, $4)
     RETURNING id;`,
    [driverId, date, JSON.stringify(logSheet), JSON.stringify(metadata)]
  );
  return result.rows[0]?.id;
}

export async function fetchLog(driverId, date) {
  const result = await query(
    `SELECT log_sheet, metadata FROM daily_logs WHERE driver_id = $1 AND log_date = $2;`,
    [driverId, date]
  );
  if (result.rowCount === 0) return null;
  return { logSheet: result.rows[0].log_sheet, metadata: result.rows[0].metadata };
}

export async function fetchDriverProfile(driverId) {
  try {
    const result = await query(`SELECT * FROM drivers WHERE id = $1;`, [driverId]);
    if (result.rowCount === 0) {
      return {
        id: driverId,
        name: 'John Smith',
        carrier: 'LogRoute AI Fleet LLC',
        vehicle: 'Unit 4417',
        trailer: 'Trailer 8809',
        cycleHoursUsed: 0,
        homeTerminalTz: 'US/Central',
      };
    }
    return result.rows[0];
  } catch (_) {
    return {
      id: driverId,
      name: 'John Smith',
      carrier: 'LogRoute AI Fleet LLC',
      vehicle: 'Unit 4417',
      trailer: 'Trailer 8809',
      cycleHoursUsed: 0,
      homeTerminalTz: 'US/Central',
    };
  }
}
