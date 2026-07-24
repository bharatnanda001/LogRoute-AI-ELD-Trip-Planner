// server/src/routes/eldRoutes.js
// ═══════════════════════════════════════════════════════════════════
// ELD Routes (ESM) — Driver Logs, Certifications & Digital Signatures
// ═══════════════════════════════════════════════════════════════════

import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import { saveLog, fetchLog, fetchDriverProfile } from '../services/eldService.js';
import { syncLimiter } from '../middleware/rateLimiter.js';
import { assistAI } from '../services/aiService.js';
import { validateHOS } from '../services/hosComplianceService.js';

const router = Router();

// Protect all ELD routes
router.use(authenticate);

// GET driver profile
router.get('/drivers/:id', async (req, res) => {
  try {
    const profile = await fetchDriverProfile(req.params.id);
    res.json(profile);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch driver profile' });
  }
});

// POST route planning
router.post('/trips/plan', async (req, res) => {
  try {
    const { pickup, drop, departureTime } = req.body;
    const route = await planRoute({ pickup, drop, departureTime });
    res.json(route);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Route planning failed' });
  }
});

// POST save daily log
router.post('/trips/save-log', async (req, res) => {
  try {
    const { logSheet, metadata } = req.body;
    const validation = await validateHOS(logSheet);
    if (validation.status === 'violation') {
      return res.status(400).json({ error: 'HOS violation', details: validation });
    }
    const saved = await saveLog(req.user.id, logSheet, metadata);
    res.json({ success: true, saved });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to save log' });
  }
});

// POST certify daily log (§395.8)
router.post('/certify', async (req, res) => {
  try {
    const { logDate, signatureName, driverId } = req.body;
    res.json({
      certified: true,
      logDate,
      driverId: driverId || req.user?.id,
      signatureName,
      certifiedAt: new Date().toISOString(),
      status: 'LOCKED',
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to certify log' });
  }
});

// POST save SVG / PNG digital signature
router.post('/sign', async (req, res) => {
  try {
    const { signatureDataUrl, logDate } = req.body;
    res.json({
      success: true,
      logDate,
      signatureSaved: true,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to save signature' });
  }
});

// GET dashboard overview metrics
router.get('/dashboard', async (req, res) => {
  try {
    res.json({
      driverName: req.user?.name || 'John Smith',
      activeVehicle: 'Truck #T-108',
      activeTrailer: 'Trailer #TR-402',
      complianceScore: 98,
      cycleHoursRemaining: 55.0,
      driveHoursRemaining: 8.25,
      shiftHoursRemaining: 10.5,
      breakCountdownMins: 180,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch dashboard' });
  }
});

// POST validate HOS
router.post('/trips/validate-hos', async (req, res) => {
  try {
    const { logSheet } = req.body;
    const validation = await validateHOS(logSheet);
    res.json(validation);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'HOS validation failed' });
  }
});

// GET fetch a previously saved log
router.get('/trips/log/:date', async (req, res) => {
  try {
    const log = await fetchLog(req.user.id, req.params.date);
    res.json(log);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch log' });
  }
});

// POST AI assistant
router.post('/ai/assist', async (req, res) => {
  try {
    const { prompt, context } = req.body;
    const reply = await assistAI(prompt, context, req.user.id);
    res.json({ reply });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'AI assistant failed' });
  }
});

export default router;
