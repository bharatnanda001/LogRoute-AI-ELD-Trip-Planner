// server/src/middleware/rbac.js
// ═══════════════════════════════════════════════════════════════════
// Role-Based Access Control (RBAC) Middleware
// Roles: system_admin > carrier_admin > dispatcher > driver > auditor
// ═══════════════════════════════════════════════════════════════════

const ROLE_HIERARCHY = {
  system_admin: 5,
  carrier_admin: 4,
  dispatcher: 3,
  driver: 2,
  auditor: 1,
};

/**
 * Middleware factory enforcing that the authenticated user has at least one of the allowed roles.
 * @param  {...string} allowedRoles
 */
export function requireRole(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user || !req.user.role) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const userRole = req.user.role;

    // Direct match or system_admin override
    if (userRole === 'system_admin' || allowedRoles.includes(userRole)) {
      return next();
    }

    return res.status(403).json({
      error: `Access denied. Requires one of roles: [${allowedRoles.join(', ')}]. Your role is '${userRole}'.`,
    });
  };
}

/**
 * Middleware factory enforcing minimum role level based on hierarchy.
 * @param {string} minRole
 */
export function requireMinRole(minRole) {
  return (req, res, next) => {
    if (!req.user || !req.user.role) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const userLevel = ROLE_HIERARCHY[req.user.role] || 0;
    const minLevel = ROLE_HIERARCHY[minRole] || 99;

    if (userLevel >= minLevel) {
      return next();
    }

    return res.status(403).json({
      error: `Access denied. Minimum role required: '${minRole}'. Your role is '${req.user.role}'.`,
    });
  };
}
