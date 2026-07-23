// server/src/routes/dvir.js
// ═══════════════════════════════════════════════════════════════════
// Driver Vehicle Inspection Reports (DVIR) API
// ═══════════════════════════════════════════════════════════════════

import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import { enforceTenantScope } from '../middleware/tenantScope.js';
import { requireRole } from '../middleware/rbac.js';
import { query } from '../config/db.js';

const router = Router();

/**
 * POST /api/dvir
 * Create a pre-trip or post-trip DVIR
 */
router.post('/', authenticate, enforceTenantScope, async (req, res) => {
  try {
    const {
      vehicleId,
      trailerId,
      inspectionType,
      inspectionDate,
      odometerMiles,
      locationText,
      defects = [],
      conditionSafe,
      driverSignature,
    } = req.body;

    if (!vehicleId || !inspectionType || conditionSafe === undefined) {
      return res.status(400).json({ error: 'vehicleId, inspectionType, and conditionSafe are required' });
    }

    const driverId = req.user.driverId;
    const carrierId = req.carrierId;
    const hasDefects = defects.length > 0;

    const result = await query(
      `INSERT INTO dvir_reports
       (driver_id, carrier_id, vehicle_id, trailer_id, inspection_type, inspection_date,
        odometer_miles, location_text, defects, condition_safe, has_defects, driver_signature, driver_signed_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, now())
       RETURNING *`,
      [
        driverId,
        carrierId,
        vehicleId,
        trailerId || null,
        inspectionType,
        inspectionDate || new Date().toISOString().split('T')[0],
        odometerMiles || null,
        locationText || '',
        JSON.stringify(defects),
        conditionSafe,
        hasDefects,
        driverSignature || null,
      ]
    );

    res.status(201).json({ dvir: result.rows[0] });
  } catch (err) {
    console.error('DVIR creation error:', err);
    res.status(500).json({ error: 'Failed to submit DVIR' });
  }
});

/**
 * GET /api/dvir
 * Fetch DVIR reports
 */
router.get('/', authenticate, enforceTenantScope, async (req, res) => {
  try {
    const { vehicleId, driverId, fromDate, toDate } = req.query;

    const result = await query(
      `SELECT d.*, v.unit_number as vehicle_number
       FROM dvir_reports d
       JOIN vehicles v ON v.id = d.vehicle_id
       WHERE d.carrier_id = $1
         AND ($2::uuid IS NULL OR d.vehicle_id = $2)
         AND ($3::uuid IS NULL OR d.driver_id = $3)
         AND ($4::date IS NULL OR d.inspection_date >= $4)
         AND ($5::date IS NULL OR d.inspection_date <= $5)
       ORDER BY d.created_at DESC`,
      [req.carrierId, vehicleId || null, driverId || null, fromDate || null, toDate || null]
    );

    res.json({ reports: result.rows });
  } catch (err) {
    console.error('DVIR query error:', err);
    res.status(500).json({ error: 'Failed to fetch DVIR reports' });
  }
});

/**
 * PATCH /api/dvir/:id/mechanic-review
 * Mechanic repair signoff
 */
router.patch('/:id/mechanic-review', authenticate, enforceTenantScope, requireRole('carrier_admin', 'dispatcher', 'system_admin'), async (req, res) => {
  try {
    const { id } = req.params;
    const { mechanicName, mechanicNotes, mechanicSignature, repairsCompleted } = req.body;

    const result = await query(
      `UPDATE dvir_reports
       SET mechanic_name = $1,
           mechanic_notes = $2,
           mechanic_signature = $3,
           repairs_completed = $4,
           mechanic_signed_at = now(),
           repairs_completed_at = CASE WHEN $4 = true THEN now() ELSE NULL END,
           updated_at = now()
       WHERE id = $5 AND carrier_id = $6
       RETURNING *`,
      [mechanicName, mechanicNotes, mechanicSignature, repairsCompleted, id, req.carrierId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'DVIR report not found' });
    }

    res.json({ dvir: result.rows[0] });
  } catch (err) {
    console.error('DVIR mechanic review error:', err);
    res.status(500).json({ error: 'Failed to process mechanic signoff' });
  }
});

export default router;
