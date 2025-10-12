const jwt = require('jsonwebtoken');
const { User } = require('../modules/auth/user.model');

module.exports = async function auth(req, res, next) {
  try {
    const hdr = req.headers['authorization'] || '';
    const parts = hdr.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      return res.status(401).json({ message: 'Missing or invalid Authorization header' });
    }

    const token = parts[1];
    let payload;
    try {
      payload = jwt.verify(token, require('../config').JWT_SECRET);
    } catch (err) {
      const reason = err.name === 'TokenExpiredError' ? 'expired' : 'invalid';
      return res.status(401).json({ message: 'Unauthorized token', reason });
    }

    const user = await User.findById(payload.sub).lean();
    if (!user) return res.status(401).json({ message: 'User not found' });

    req.user = {
      id: user._id.toString(),
      email: user.email,
      roles: {
        global: (user.roles?.global || '').toString(),
        scoped: Array.isArray(user.roles?.scoped) ? user.roles.scoped : [],
      },
      status: user.status,
    };

    return next();
  } catch (err) {
    return next(err);
  }
};
