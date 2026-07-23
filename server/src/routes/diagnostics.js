// server/src/routes/diagnostics.js
// ═══════════════════════════════════════════════════════════════════
// ELD Diagnostics & Malfunctions API
// ═══════════════════════════════════════════════════════════════════

import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import { enforceTenantScope } from '../middleware/tenantScope.js';
import { query } from '../config/db.js';

const router = Router();

/**
 * POST /api/diagnostics
 * Log diagnostic event (e.g. gps_lost, power_interrupt, engine_sync_lost)
 */
router.post('/', authenticate, enforceTenantScope, async (req, res) => {
  try {
    const { diagnosticCode, severity = 'warning', description, latitude, longitude, vehicleId } = req.body;

    if (!diagnosticCode) {
      return res.status(400).json({ error: 'diagnosticCode is required' });
    }

    const driverId = req.user.driverId;
    const carrierId = req.carrierId;

    const result = await query(
      `INSERT INTO eld_diagnostics
       (driver_id, carrier_id, vehicle_id, diagnostic_code, severity, description, latitude, longitude)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [driverId, carrierId, vehicleId || null, diagnosticCode, severity, description || null, latitude || null, longitude || null]
    );

    res.status(201).json({ diagnostic: result.rows[0] });
  } catch (err) {
    console.error('Diagnostic logging error:', err);
    res.status(500).json({ error: 'Failed to record diagnostic event' });
  }
});

/**
 * PATCH /api/diagnostics/:id/resolve
 * Resolve an active diagnostic event
 */
router.patch('/:id/resolve', authenticate, enforceTenantScope, async (req, res) => {
  try {
    const { id } = req.params;

    const result = await query(
      `UPDATE eld_diagnostics
       SET is_active = FALSE, resolved_at = now()
       WHERE id = $1 AND carrier_id = $2
       RETURNING *`,
      [id, req.carrierId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Diagnostic event not found' });
    }

    res.json({ diagnostic: result.rows[0] });
  } catch (err) {
    console.error('Diagnostic resolution error:', err);
    res.status(500).json({ error: 'Failed to resolve diagnostic event' });
  }
});

/**
 * GET /api/diagnostics
 * List diagnostic events
 */
router.get('/', authenticate, enforceTenantScope, async (req, res) => {
  try {
    const { activeOnly } = req.query;

    const result = await query(
      `SELECT * FROM eld_diagnostics
       WHERE carrier_id = $1
         AND ($2::boolean IS NULL OR is_active = $2)
       ORDER BY started_at DESC`,
      [req.carrierId, activeOnly === 'true' ? true : null]
    );

    res.json({ diagnostics: result.rows });
  } catch (err) {
    console.error('Diagnostics query error:', err);
    res.status(500).json({ error: 'Failed to fetch diagnostic events' });
  }
});

export default router;
