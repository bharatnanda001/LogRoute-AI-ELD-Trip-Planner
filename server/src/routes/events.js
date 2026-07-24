// server/src/routes/events.js
// ═══════════════════════════════════════════════════════════════════
// Immutable FMCSA Event Log API
// ═══════════════════════════════════════════════════════════════════

import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import { enforceTenantScope } from '../middleware/tenantScope.js';
import { query } from '../config/db.js';
import { syncLimiter } from '../middleware/rateLimiter.js';

const router = Router();

/**
 * POST /api/events
 * Record an immutable ELD event (status_change, login, logout, edit, etc.)
 */
router.post('/', authenticate, enforceTenantScope, syncLimiter, async (req, res) => {
  try {
    const {
      eventType,
      eventCode,
      previousValue,
      newValue,
      latitude,
      longitude,
      odometerMiles,
      engineHours,
      annotation,
      origin = 'driver',
    } = req.body;

    if (!eventType) {
      return res.status(400).json({ error: 'eventType is required' });
    }

    const driverId = req.user.driverId;
    const carrierId = req.carrierId;

    const result = await query(
      `INSERT INTO eld_events
       (driver_id, carrier_id, event_type, event_code, previous_value, new_value,
        latitude, longitude, odometer_miles, engine_hours, annotation, origin)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
       RETURNING *`,
      [
        driverId,
        carrierId,
        eventType,
        eventCode || null,
        previousValue ? JSON.stringify(previousValue) : null,
        newValue ? JSON.stringify(newValue) : null,
        latitude || null,
        longitude || null,
        odometerMiles || null,
        engineHours || null,
        annotation || null,
        origin,
      ]
    );

    res.status(201).json({ event: result.rows[0] });
  } catch (err) {
    console.error('Event creation error:', err);
    res.status(500).json({ error: 'Failed to record event' });
  }
});

/**
 * GET /api/events
 * Fetch immutable event audit trail
 */
router.get('/', authenticate, enforceTenantScope, syncLimiter, async (req, res) => {
  try {
    const { driverId, eventType, from, to, limit = 500 } = req.query;
    const targetDriver = driverId || req.user.driverId;

    const result = await query(
      `SELECT * FROM eld_events
       WHERE carrier_id = $1
         AND ($2::uuid IS NULL OR driver_id = $2)
         AND ($3::varchar IS NULL OR event_type = $3)
         AND ($4::timestamptz IS NULL OR recorded_at >= $4)
         AND ($5::timestamptz IS NULL OR recorded_at <= $5)
       ORDER BY sequence_id ASC
       LIMIT $6`,
      [req.carrierId, targetDriver || null, eventType || null, from || null, to || null, Math.min(limit, 2000)]
    );

    res.json({ events: result.rows });
  } catch (err) {
    console.error('Events query error:', err);
    res.status(500).json({ error: 'Failed to fetch event log' });
  }
});

export default router;
