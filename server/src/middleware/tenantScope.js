// server/src/middleware/tenantScope.js
// ═══════════════════════════════════════════════════════════════════
// Multi-Tenant Carrier Row Isolation Middleware
// Ensures requests extract `carrierId` from JWT/params and scope DB operations
// ═══════════════════════════════════════════════════════════════════

/**
 * Ensures request has an active carrier context attached.
 * System admins bypass single-carrier locks.
 */
export function enforceTenantScope(req, res, next) {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  // System admin can act across carriers if explicitly passed, or Defaults
  if (req.user.role === 'system_admin') {
    req.carrierId = req.headers['x-carrier-id'] || req.query.carrierId || req.user.carrierId;
    return next();
  }

  // Non-system admins must operate within their assigned carrier
  const carrierId = req.user.carrierId;
  if (!carrierId) {
    return res.status(403).json({ error: 'User is not assigned to a carrier organization' });
  }

  req.carrierId = carrierId;
  next();
}
