// server/src/routes/certifications.js
// ═══════════════════════════════════════════════════════════════════
// Driver Certification (End-of-Day Log Signing) API
// ═══════════════════════════════════════════════════════════════════

import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import { enforceTenantScope } from '../middleware/tenantScope.js';
import { query } from '../config/db.js';
import { syncLimiter } from '../middleware/rateLimiter.js';

const router = Router();

/**
 * POST /api/certifications
 * Submit end-of-day driver signature to lock daily log sheet
 */
router.post('/', authenticate, enforceTenantScope, syncLimiter, async (req, res) => {
  try {
    const { dailyLogSheetId, signatureData, certificationText } = req.body;

    if (!dailyLogSheetId || !signatureData) {
      return res.status(400).json({ error: 'dailyLogSheetId and signatureData are required' });
    }

    const driverId = req.user.driverId;
    const carrierId = req.carrierId;

    const result = await query(
      `INSERT INTO driver_certifications
       (daily_log_sheet_id, driver_id, carrier_id, signature_data, certification_text, ip_address, user_agent)
       VALUES ($1, $2, $3, $4, COALESCE($5, 'I hereby certify that my data entries and my record of duty status for this 24-hour period are true and correct.'), $6, $7)
       RETURNING *`,
      [
        dailyLogSheetId,
        driverId,
        carrierId,
        signatureData,
        certificationText || null,
        req.ip,
        req.headers['user-agent'] || null,
      ]
    );

    res.status(201).json({ certification: result.rows[0], locked: true });
  } catch (err) {
    console.error('Certification error:', err);
    if (err.code === '23505') { // Unique violation
      return res.status(409).json({ error: 'Daily log sheet has already been certified' });
    }
    res.status(500).json({ error: 'Failed to certify log sheet' });
  }
});

export default router;
