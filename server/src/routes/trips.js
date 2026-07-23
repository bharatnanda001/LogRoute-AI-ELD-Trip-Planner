// server/src/routes/trips.js
// ═══════════════════════════════════════════════════════════════════
// Trip planning API — POST /api/trips, GET /api/trips/:id
// ═══════════════════════════════════════════════════════════════════

import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import { computeDutyTimeline } from '../engine/hosEngine.js';
import { splitIntoDailyLogSheets } from '../engine/splitDailyLogs.js';
import { getRoute, geocode } from '../services/routeService.js';

const router = Router();

/**
 * POST /api/trips
 * Body: {
 *   currentLocation: string,
 *   pickupLocation: string,
 *   dropoffLocation: string,
 *   cycleHoursUsed: number (0–70)
 * }
 *
 * Returns the computed route, duty-status timeline, and daily log sheets.
 */
router.post('/', authenticate, async (req, res) => {
  try {
    const { currentLocation, pickupLocation, dropoffLocation, cycleHoursUsed } = req.body;

    // ── Validate inputs ──────────────────────────────────────────
    if (!currentLocation || !pickupLocation || !dropoffLocation) {
      return res.status(400).json({
        error: 'currentLocation, pickupLocation, and dropoffLocation are required',
      });
    }

    const cycle = parseFloat(cycleHoursUsed);
    if (isNaN(cycle) || cycle < 0 || cycle > 70) {
      return res.status(400).json({
        error: 'cycleHoursUsed must be a number between 0 and 70',
      });
    }

    // ── Geocode locations ────────────────────────────────────────
    const [currentGeo, pickupGeo, dropoffGeo] = await Promise.all([
      geocode(currentLocation),
      geocode(pickupLocation),
      geocode(dropoffLocation),
    ]);

    // ── Get route ────────────────────────────────────────────────
    const route = await getRoute([
      { lat: currentGeo.lat, lng: currentGeo.lng },
      { lat: pickupGeo.lat, lng: pickupGeo.lng },
      { lat: dropoffGeo.lat, lng: dropoffGeo.lng },
    ]);

    // ── Run HOS engine ──────────────────────────────────────────
    const { segments, warnings, summary } = computeDutyTimeline({
      routeDistanceMiles: route.distanceMiles,
      routeDurationHours: route.durationHours,
      cycleHoursUsed: cycle,
      departureTime: new Date(),
      pickupLocation: { city: pickupGeo.city, state: pickupGeo.state },
      dropoffLocation: { city: dropoffGeo.city, state: dropoffGeo.state },
    });

    // ── Split into daily log sheets ─────────────────────────────
    const dailyLogs = splitIntoDailyLogSheets(segments);

    // ── Return everything ───────────────────────────────────────
    res.json({
      route: {
        distanceMiles: route.distanceMiles,
        durationHours: route.durationHours,
        polyline: route.polyline,
        locations: {
          current: currentGeo,
          pickup: pickupGeo,
          dropoff: dropoffGeo,
        },
      },
      stops: segments.filter(s =>
        s.dutyStatus !== 'driving'
      ).map(s => ({
        type: s.annotation,
        dutyStatus: s.dutyStatus,
        start: s.start,
        end: s.end,
        durationHours: s.durationHours,
        location: s.location,
      })),
      dailyLogs,
      summary,
      warnings,
    });
  } catch (err) {
    console.error('Trip planning error:', err);

    // Surface HOS hard-gate errors as 422
    if (err.message.includes('Cannot legally start trip')) {
      return res.status(422).json({ error: err.message });
    }

    res.status(500).json({ error: 'Trip planning failed: ' + err.message });
  }
});

/**
 * POST /api/trips/preview
 * Same as POST /api/trips but does NOT require authentication.
 * For the demo / "try without login" flow (Epic E4).
 */
router.post('/preview', async (req, res) => {
  try {
    const { currentLocation, pickupLocation, dropoffLocation, cycleHoursUsed = 0 } = req.body;

    if (!currentLocation || !pickupLocation || !dropoffLocation) {
      return res.status(400).json({
        error: 'currentLocation, pickupLocation, and dropoffLocation are required',
      });
    }

    const cycle = parseFloat(cycleHoursUsed);
    if (isNaN(cycle) || cycle < 0 || cycle > 70) {
      return res.status(400).json({
        error: 'cycleHoursUsed must be a number between 0 and 70',
      });
    }

    const [currentGeo, pickupGeo, dropoffGeo] = await Promise.all([
      geocode(currentLocation),
      geocode(pickupLocation),
      geocode(dropoffLocation),
    ]);

    const route = await getRoute([
      { lat: currentGeo.lat, lng: currentGeo.lng },
      { lat: pickupGeo.lat, lng: pickupGeo.lng },
      { lat: dropoffGeo.lat, lng: dropoffGeo.lng },
    ]);

    const { segments, warnings, summary } = computeDutyTimeline({
      routeDistanceMiles: route.distanceMiles,
      routeDurationHours: route.durationHours,
      cycleHoursUsed: cycle,
      departureTime: new Date(),
      pickupLocation: { city: pickupGeo.city, state: pickupGeo.state },
      dropoffLocation: { city: dropoffGeo.city, state: dropoffGeo.state },
    });

    const dailyLogs = splitIntoDailyLogSheets(segments);

    res.json({
      route: {
        distanceMiles: route.distanceMiles,
        durationHours: route.durationHours,
        polyline: route.polyline,
        locations: {
          current: currentGeo,
          pickup: pickupGeo,
          dropoff: dropoffGeo,
        },
      },
      stops: segments.filter(s => s.dutyStatus !== 'driving').map(s => ({
        type: s.annotation,
        dutyStatus: s.dutyStatus,
        start: s.start,
        end: s.end,
        durationHours: s.durationHours,
        location: s.location,
      })),
      dailyLogs,
      summary,
      warnings,
    });
  } catch (err) {
    console.error('Trip preview error:', err);
    if (err.message.includes('Cannot legally start trip')) {
      return res.status(422).json({ error: err.message });
    }
    res.status(500).json({ error: 'Trip preview failed: ' + err.message });
  }
});

export default router;
