/**
 * Centralized Role Constants for Frontend
 * Must match backend: Backend/src/middlewares/permission.js
 */

/**
 * Core team roles (all positions that are considered "core" level)
 * These roles have elevated permissions compared to regular members
 */
export const CORE_ROLES = [
  'core',          // Generic core member role
  'vicePresident', // Vice President
  'secretary',     // Secretary
  'treasurer',     // Treasurer
  'leadPR',        // PR Lead
  'leadTech'       // Tech Lead
];

/**
 * All management roles (core team + president)
 */
export const CORE_AND_PRESIDENT = [...CORE_ROLES, 'president'];

/**
 * President only (for president-restricted actions)
 */
export const PRESIDENT_ONLY = ['president'];

/**
 * Check if a user has any core team role (including president)
 * @param {Object} user - User object with roles
 * @param {string} clubId - Optional club ID to check specific club membership
 * @returns {boolean}
 */
export const hasCoreMemberRole = (user, clubId = null) => {
  if (!user?.roles?.scoped) return false;
  
  return user.roles.scoped.some(cr => {
    const hasRole = CORE_AND_PRESIDENT.includes(cr.role);
    if (clubId) {
      return hasRole && cr.club?.toString() === clubId;
    }
    return hasRole;
  });
};

/**
 * Check if a user is a president
 * @param {Object} user - User object with roles
 * @param {string} clubId - Optional club ID to check specific club
 * @returns {boolean}
 */
export const isPresident = (user, clubId = null) => {
  if (!user?.roles?.scoped) return false;
  
  return user.roles.scoped.some(cr => {
    const isPresident = cr.role === 'president';
    if (clubId) {
      return isPresident && cr.club?.toString() === clubId;
    }
    return isPresident;
  });
};

/**
 * Check if a user is an admin
 * @param {Object} user - User object with roles
 * @returns {boolean}
 */
export const isAdmin = (user) => {
  return user?.roles?.global === 'admin';
};

/**
 * Check if a user can create events/recruitments (Core team + President + Admin)
 * @param {Object} user - User object with roles
 * @returns {boolean}
 */
export const canCreateEvents = (user) => {
  return hasCoreMemberRole(user) || isAdmin(user);
};

/**
 * Check if a user can create recruitments (Core team + President + Admin)
 * @param {Object} user - User object with roles
 * @returns {boolean}
 */
export const canCreateRecruitments = (user) => {
  return hasCoreMemberRole(user) || isAdmin(user);
};
