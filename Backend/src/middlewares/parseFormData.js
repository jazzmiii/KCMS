/**
 * Middleware to parse FormData fields to correct types
 * FormData sends everything as strings, so we need to convert them
 */
module.exports = function parseFormData(req, res, next) {
  // Parse JSON string for guestSpeakers
  if (req.body.guestSpeakers && typeof req.body.guestSpeakers === 'string') {
    try {
      req.body.guestSpeakers = JSON.parse(req.body.guestSpeakers);
    } catch (e) {
      // If parsing fails, leave as is (validator will catch it)
    }
  }
  
  // Parse boolean for isPublic
  if (req.body.isPublic !== undefined) {
    req.body.isPublic = req.body.isPublic === 'true' || req.body.isPublic === true;
  }
  
  // Parse numbers
  const numberFields = ['duration', 'capacity', 'expectedAttendees', 'budget'];
  numberFields.forEach(field => {
    if (req.body[field] !== undefined && req.body[field] !== '') {
      req.body[field] = Number(req.body[field]);
    }
  });
  
  next();
};
