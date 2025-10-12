const { hasGlobalRole, hasScopedRole } = require('../utils/rbac');
const { errorResponse } = require('../utils/response');

function normalizeRole(r) {
  return (r || '').toString();
}

/**
 * Check if user has required global role
 * @param {Object} user - User object with roles
 * @param {string[]} allowed - Array of allowed global roles
 * @returns {boolean}
 */
function checkGlobalRole(user, allowed = []) {
  if (!user || !user.roles || !user.roles.global) return false;
  const role = normalizeRole(user.roles.global);
  return allowed.some(a => a === role);
}

/**
 * Check if user has required scoped role for a specific club
 * @param {Object} user - User object with roles
 * @param {string} clubId - Club ID to check
 * @param {string[]} allowed - Array of allowed scoped roles
 * @returns {boolean}
 */
function checkScopedRole(user, clubId, allowed = []) {
  if (!user || !user.roles || !user.roles.scoped) return false;
  if (!clubId) return false;
  return hasScopedRole(user, clubId, allowed);
}

/**
 * Comprehensive permission checker that handles both global and scoped roles
 * @param {Object} options - Permission options
 * @param {string[]} options.global - Required global roles
 * @param {string[]} options.scoped - Required scoped roles  
 * @param {string} options.clubParam - Parameter name for clubId (default: 'clubId')
 * @param {boolean} options.allowGlobalOverride - Allow global roles to override scoped (default: true)
 */
exports.permit = (options = {}) => {
  const { 
    global = [], 
    scoped = [], 
    clubParam = 'clubId',
    allowGlobalOverride = true 
  } = options;

  return (req, res, next) => {
    // Check authentication
    if (!req.user) {
      return errorResponse(res, 401, 'Authentication required');
    }

    // Check global roles first (if specified)
    if (global.length > 0) {
      const hasGlobal = checkGlobalRole(req.user, global);
      if (hasGlobal) {
        return next(); // Global role allows access
      }
      
      // If global roles are required and user doesn't have them, deny access
      if (!allowGlobalOverride) {
        return errorResponse(res, 403, 'Insufficient global permissions');
      }
    }

    // Check scoped roles (if specified)
    if (scoped.length > 0) {
      const clubId = req.params[clubParam] || req.body[clubParam] || req.query[clubParam];
      
      if (!clubId) {
        return errorResponse(res, 400, `${clubParam} is required for this operation`);
      }

      const hasScoped = checkScopedRole(req.user, clubId, scoped);
      if (!hasScoped) {
        return errorResponse(res, 403, `Insufficient club permissions for ${clubParam}: ${clubId}`);
      }
    }

    // If no specific roles required, allow authenticated user
    if (global.length === 0 && scoped.length === 0) {
      return next();
    }

    // If we reach here and no roles matched, deny access
    return errorResponse(res, 403, 'Access denied: insufficient permissions');
  };
};

/**
 * Require global roles only
 * @param {string[]} allowed - Array of allowed global roles
 */
exports.requireGlobal = (allowed = []) => {
  return exports.permit({ global: allowed, allowGlobalOverride: false });
};

/**
 * Require scoped roles only
 * @param {string[]} allowed - Array of allowed scoped roles
 * @param {string} clubParam - Parameter name for clubId
 */
exports.requireScoped = (allowed = [], clubParam = 'clubId') => {
  return exports.permit({ scoped: allowed, clubParam, allowGlobalOverride: false });
};

/**
 * Require either global OR scoped roles
 * @param {string[]} globalRoles - Required global roles
 * @param {string[]} scopedRoles - Required scoped roles
 * @param {string} clubParam - Parameter name for clubId
 */
exports.requireEither = (globalRoles = [], scopedRoles = [], clubParam = 'clubId') => {
  return exports.permit({ 
    global: globalRoles, 
    scoped: scopedRoles, 
    clubParam,
    allowGlobalOverride: true 
  });
};

/**
 * Club-specific permission checker
 * @param {string[]} roles - Required roles for the club
 * @param {string} clubParam - Parameter name for clubId
 */
exports.requireClubRole = (roles = [], clubParam = 'clubId') => {
  return exports.requireScoped(roles, clubParam);
};

/**
 * Admin-only access
 */
exports.requireAdmin = () => {
  return exports.requireGlobal(['admin']);
};

/**
 * Coordinator or Admin access
 */
exports.requireCoordinatorOrAdmin = () => {
  return exports.requireGlobal(['coordinator', 'admin']);
};
