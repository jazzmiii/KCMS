// src/utils/rbac.js

/**
 * Check if user has one of the given global roles
 * @param {Object} user.roles.global
 * @param {string[]} allowed
 */
function hasGlobalRole(user, allowed = []) {
  return allowed.includes(user.roles.global);
}

/**
 * Check if user has one of the given scoped roles in a specific club
 * @param {Object} user.roles.scoped - array [{ club, role }]
 * @param {string} clubId
 * @param {string[]} allowed
 */
function hasScopedRole(user, clubId, allowed = []) {
  if (!Array.isArray(user.roles.scoped)) return false;
  return user.roles.scoped.some(
    (entry) => entry.club.toString() === clubId && allowed.includes(entry.role)
  );
}

module.exports = { hasGlobalRole, hasScopedRole };