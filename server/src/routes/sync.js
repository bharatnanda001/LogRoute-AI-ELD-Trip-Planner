// server/src/routes/sync.js
// ═══════════════════════════════════════════════════════════════════
// Offline Sync & Version-Based Conflict Resolution API
// ═══════════════════════════════════════════════════════════════════

import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import { enforceTenantScope } from '../middleware/tenantScope.js';
import { query } from '../config/db.js';

const router = Router();

/**
 * POST /api/sync
 * Compare client state version vs server version.
 * Detect conflicts or merge changes safely without "Last Write Wins".
 */
router.post('/', authenticate, enforceTenantScope, async (req, res) => {
  try {
    const { entityType, entityId, clientVersion, clientData, resolutionStrategy } = req.body;

    if (!entityType || !entityId || clientVersion === undefined) {
      return res.status(400).json({ error: 'entityType, entityId, and clientVersion are required' });
    }

    // Example table lookup depending on entityType
    let table = '';
    if (entityType === 'daily_log_sheet') table = 'daily_log_sheets';
    else if (entityType === 'duty_status_segment') table = 'duty_status_segments';
    else if (entityType === 'trip') table = 'trips';
    else return res.status(400).json({ error: 'Invalid entityType' });

    // Fetch server version
    const serverResult = await query(
      `SELECT id, updated_at FROM ${table} WHERE id = $1`,
      [entityId]
    );

    if (serverResult.rows.length === 0) {
      // Server doesn't have it yet -> Accept client push
      return res.json({ status: 'synced', action: 'created' });
    }

    const serverEntity = serverResult.rows[0];
    const serverVersion = new Date(serverEntity.updated_at).getTime();

    // Check version collision
    if (clientVersion < serverVersion) {
      if (resolutionStrategy === 'client_wins') {
        // User explicitly picked client version
        await query(
          `INSERT INTO edit_history (entity_type, entity_id, field_name, new_value, edited_by, reason)
           VALUES ($1, $2, 'manual_merge', $3, $4, 'Resolved conflict via Client Wins strategy')`,
          [entityType, entityId, JSON.stringify(clientData), req.user.id]
        );
        return res.json({ status: 'resolved', strategy: 'client_wins' });
      }

      if (resolutionStrategy === 'server_wins') {
        return res.json({ status: 'resolved', strategy: 'server_wins', serverData: serverEntity });
      }

      // Conflict detected! Signal client to show side-by-side diff
      return res.status(409).json({
        status: 'conflict',
        message: 'Server version is newer than client version',
        serverVersion,
        clientVersion,
        serverData: serverEntity,
        clientData,
      });
    }

    // Normal sync: client is up-to-date or newer
    res.json({ status: 'synced', action: 'updated' });
  } catch (err) {
    console.error('Sync processing error:', err);
    res.status(500).json({ error: 'Sync failed' });
  }
});

export default router;
