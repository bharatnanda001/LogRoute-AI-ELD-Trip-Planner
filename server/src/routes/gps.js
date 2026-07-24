// server/src/routes/gps.js
// ═══════════════════════════════════════════════════════════════════
// GPS Position History API
// ═══════════════════════════════════════════════════════════════════

import { Router } from 'express';
import { syncLimiter } from '../middleware/rateLimiter.js';
import { authenticate } from '../middleware/auth.js';
import { enforceTenantScope } from '../middleware/tenantScope.js';
import { query } from '../config/db.js';

const router = Router();

/**
 * POST /api/gps/batch
 * Batch insert GPS positions recorded offline or live
 */
router.post('/batch', authenticate, enforceTenantScope, syncLimiter, async (req, res) => {
  try {
    const { positions } = req.body;
    if (!Array.isArray(positions) || positions.length === 0) {
      return res.status(400).json({ error: 'Array of positions is required' });
    }

    const driverId = req.user.driverId;
    const carrierId = req.carrierId;

    if (!driverId) {
      return res.status(403).json({ error: 'Driver profile required to log GPS data' });
    }

    let inserted = 0;
    for (const p of positions) {
      await query(
        `INSERT INTO gps_positions 
         (driver_id, carrier_id, latitude, longitude, speed_mph, heading, accuracy_m, recorded_at, source)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
        [
          driverId,
          carrierId,
          p.latitude,
          p.longitude,
          p.speedMph || 0,
          p.heading || 0,
          p.accuracyM || null,
          p.recordedAt || new Date().toISOString(),
          p.source || 'browser_gps',
        ]
      );
      inserted++;
    }

    res.status(201).json({ success: true, count: inserted });
  } catch (err) {
    console.error('GPS Batch error:', err);
    res.status(500).json({ error: 'Failed to record GPS batch' });
  }
});

/**
 * GET /api/gps/history
 * Fetch GPS breadcrumb history for playback/audit
 */
router.get('/history', authenticate, enforceTenantScope, syncLimiter, async (req, res) => {
  try {
    const { driverId, startTime, endTime, limit = 1000 } = req.query;
    const targetDriver = driverId || req.user.driverId;

    const result = await query(
      `SELECT id, driver_id, latitude, longitude, speed_mph, heading, recorded_at, source
       FROM gps_positions
       WHERE carrier_id = $1
         AND ($2::uuid IS NULL OR driver_id = $2)
         AND ($3::timestamptz IS NULL OR recorded_at >= $3)
         AND ($4::timestamptz IS NULL OR recorded_at <= $4)
       ORDER BY recorded_at ASC
       LIMIT $5`,
      [req.carrierId, targetDriver || null, startTime || null, endTime || null, Math.min(limit, 5000)]
    );

    res.json({ positions: result.rows });
  } catch (err) {
    console.error('GPS history fetch error:', err);
    res.status(500).json({ error: 'Failed to fetch GPS history' });
  }
});

export default router;
