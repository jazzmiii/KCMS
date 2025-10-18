/**
 * Centralized Role Constants for Frontend
 * Must match backend: Backend/src/middlewares/permission.js
 * 
 * ⚠️ CRITICAL: user.roles.scoped is EMPTY ARRAY in User model
 * Always use clubMemberships array passed as parameter, NOT user.roles.scoped
 */

/**
 * Role display names mapping
 * president → Sr Club Head, vicePresident → Jr Club Head
 */
export const ROLE_DISPLAY_NAMES = {
  president: 'Sr Club Head',
  vicePresident: 'Jr Club Head',
  core: 'Core Team',
  secretary: 'Secretary',
  treasurer: 'Treasurer',
  leadPR: 'Lead - PR',
  leadTech: 'Lead - Tech',
  member: 'Member'
};

/**
 * Core team roles (all positions that are considered "core" level)
 * These roles have elevated permissions compared to regular members
 */
export const CORE_ROLES = [
  'core',          // Generic core member role
  'vicePresident', // Vice President (Jr Club Head)
  'secretary',     // Secretary
  'treasurer',     // Treasurer
  'leadPR',        // PR Lead
  'leadTech'       // Tech Lead
];

/**
 * Leadership roles (President + Vice President)
 * ⚠️ IMPORTANT: President and Vice President have SAME permissions
 */
export const LEADERSHIP_ROLES = ['president', 'vicePresident'];

/**
 * All management roles (core team + leadership)
 */
export const CORE_AND_LEADERSHIP = [...CORE_ROLES, ...LEADERSHIP_ROLES];

/**
 * Backward compatibility alias
 */
export const CORE_AND_PRESIDENT = CORE_AND_LEADERSHIP;

/**
 * President only (for president-restricted actions)
 */
export const PRESIDENT_ONLY = ['president'];

/**
 * Check if a user has any core team role (including leadership)
 * ⚠️ CRITICAL: Must pass clubMemberships array, NOT user.roles.scoped (which is empty)
 * @param {Array} clubMemberships - Array of club memberships from AuthContext
 * @param {string} clubId - Optional club ID to check specific club membership
 * @returns {boolean}
 */
export const hasCoreMemberRole = (clubMemberships, clubId = null) => {
  if (!clubMemberships || !Array.isArray(clubMemberships)) return false;
  
  return clubMemberships.some(membership => {
    const hasRole = CORE_AND_LEADERSHIP.includes(membership.role);
    if (clubId) {
      const memberClubId = membership.club?._id?.toString() || membership.club?.toString();
      return hasRole && memberClubId === clubId?.toString();
    }
    return hasRole;
  });
};

/**
 * Check if a user is in leadership (president OR vice president)
 * ⚠️ IMPORTANT: President and Vice President have SAME permissions
 * ⚠️ CRITICAL: Must pass clubMemberships array, NOT user.roles.scoped
 * @param {Array} clubMemberships - Array of club memberships from AuthContext
 * @param {string} clubId - Optional club ID to check specific club
 * @returns {boolean}
 */
export const isLeadership = (clubMemberships, clubId = null) => {
  if (!clubMemberships || !Array.isArray(clubMemberships)) return false;
  
  return clubMemberships.some(membership => {
    const isLeader = LEADERSHIP_ROLES.includes(membership.role);
    if (clubId) {
      const memberClubId = membership.club?._id?.toString() || membership.club?.toString();
      return isLeader && memberClubId === clubId?.toString();
    }
    return isLeader;
  });
};

/**
 * Backward compatibility: isPresident now checks for leadership
 * @deprecated Use isLeadership instead
 */
export const isPresident = isLeadership;

/**
 * Check if a user is an admin
 * @param {Object} user - User object with roles
 * @returns {boolean}
 */
export const isAdmin = (user) => {
  return user?.roles?.global === 'admin';
};

/**
 * Check if user has club membership with specific role
 * @param {Array} clubMemberships - Array of club memberships from AuthContext
 * @param {string} clubId - Club ID to check
 * @param {string|string[]} roles - Single role or array of roles to check
 * @returns {boolean}
 */
export const hasClubRole = (clubMemberships, clubId, roles) => {
  if (!clubMemberships || !Array.isArray(clubMemberships)) return false;
  if (!clubId) return false;
  
  const roleArray = Array.isArray(roles) ? roles : [roles];
  
  return clubMemberships.some(membership => {
    const memberClubId = membership.club?._id?.toString() || membership.club?.toString();
    return memberClubId === clubId?.toString() && roleArray.includes(membership.role);
  });
};

/**
 * Check if a user can create events/recruitments (Core team + Leadership + Admin)
 * @param {Object} user - User object with global role
 * @param {Array} clubMemberships - Array of club memberships from AuthContext
 * @param {string} clubId - Optional club ID to check specific club
 * @returns {boolean}
 */
export const canCreateEvents = (user, clubMemberships, clubId = null) => {
  if (isAdmin(user)) return true;
  if (clubId) {
    return hasCoreMemberRole(clubMemberships, clubId);
  }
  return hasCoreMemberRole(clubMemberships);
};

/**
 * Check if a user can create recruitments (Core team + Leadership + Admin)
 * @param {Object} user - User object with global role
 * @param {Array} clubMemberships - Array of club memberships from AuthContext
 * @param {string} clubId - Optional club ID to check specific club
 * @returns {boolean}
 */
export const canCreateRecruitments = (user, clubMemberships, clubId = null) => {
  if (isAdmin(user)) return true;
  if (clubId) {
    // For recruitments, only leadership and core can create
    return hasCoreMemberRole(clubMemberships, clubId);
  }
  return hasCoreMemberRole(clubMemberships);
};

/**
 * Check if user can manage club (Leadership + Admin + Assigned Coordinator)
 * @param {Object} user - User object
 * @param {Array} clubMemberships - Array of club memberships
 * @param {string} clubId - Club ID
 * @param {string} coordinatorId - Club's coordinator ID
 * @returns {boolean}
 */
export const canManageClub = (user, clubMemberships, clubId, coordinatorId = null) => {
  // Admin has full access
  if (isAdmin(user)) return true;
  
  // Assigned coordinator has access
  if (user?.roles?.global === 'coordinator' && coordinatorId) {
    const userId = user._id?.toString() || user._id;
    return coordinatorId?.toString() === userId;
  }
  
  // Leadership and core team have access
  return hasCoreMemberRole(clubMemberships, clubId);
};
