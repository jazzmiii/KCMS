const jwtUtil = require('../utils/jwt');
const { User } = require('../modules/auth/user.model');

/**
 * Optional Authentication Middleware
 * Extracts user info if token is present, but doesn't fail if not
 * Used for endpoints that are public but behavior changes if authenticated
 */
module.exports = async function optionalAuth(req, res, next) {
  try {
    const hdr = req.headers['authorization'] || '';
    const parts = hdr.split(' ');
    
    // If no auth header, continue without user
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      req.user = null;
      return next();
    }

    const token = parts[1];
    let payload;
    
    try {
      payload = jwtUtil.verify(token);
    } catch (err) {
      // Token invalid/expired - continue without user
      req.user = null;
      return next();
    }

    const user = await User.findById(payload.id || payload.sub).lean();
    if (!user) {
      req.user = null;
      return next();
    }

    // ✅ Fetch user's club memberships from Membership collection (SINGLE SOURCE OF TRUTH)
    const { Membership } = require('../modules/club/membership.model');
    const memberships = await Membership.find({
      user: user._id,
      status: 'approved'
    }).populate('club', 'name').lean();

    // Transform memberships to match old roles.scoped format for frontend compatibility
    const scopedRoles = memberships.map(m => ({
      club: m.club._id,
      role: m.role,
      clubName: m.club.name
    }));

    req.user = {
      id: user._id,
      rollNumber: user.rollNumber,
      email: user.email,
      roles: {
        global: (user.roles?.global || '').toString(),
        scoped: scopedRoles // ✅ Populated from Membership collection
      },
      status: user.status,
    };
    
    return next();
  } catch (err) {
    // On any error, continue without user
    req.user = null;
    return next();
  }
};
