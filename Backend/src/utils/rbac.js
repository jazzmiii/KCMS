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
 * Check if user has club role via Membership collection (SINGLE SOURCE OF TRUTH)
 * @param {string} userId - User ID
 * @param {string} clubId - Club ID
 * @param {string[]} allowed - Array of allowed roles
 * @returns {Promise<boolean>}
 */
async function hasClubMembership(userId, clubId, allowed = []) {
  if (!userId || !clubId) return false;
  
  try {
    const { Membership } = require('../modules/club/membership.model');
    const membership = await Membership.findOne({
      user: userId,
      club: clubId,
      status: 'approved'
    });
    
    if (!membership) return false;
    
    // If no specific roles required, any approved membership is OK
    if (allowed.length === 0) return true;
    
    // Check if user's role matches any of the allowed roles
    return allowed.includes(membership.role);
  } catch (error) {
    console.error('Error checking club membership:', error);
    return false;
  }
}

module.exports = { hasGlobalRole, hasClubMembership };