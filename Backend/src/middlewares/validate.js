// src/middlewares/validate.js
module.exports = (schema, property = 'body') => (req, res, next) => {
  const { error, value } = schema.validate(req[property], {
    abortEarly: false,
    stripUnknown: true
  });
  if (error) {
    const msg = error.details.map(d => d.message).join(', ');
    console.error('❌ Validation Error:', {
      path: req.path,
      property,
      data: req[property],
      errors: error.details.map(d => ({ field: d.path.join('.'), message: d.message }))
    });
    const err = new Error(msg);
    err.statusCode = 400;
    return next(err);
  }
  req[property] = value;
  next();
};