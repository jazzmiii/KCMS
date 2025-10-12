const { getReadiness, getLiveness } = require('./health.service');

exports.live = async (req, res, next) => {
  try {
    const data = getLiveness();
    return res.status(200).json(data);
  } catch (err) {
    return next(err);
  }
};

exports.ready = async (req, res, next) => {
  try {
    const data = await getReadiness();
    const code = data.ok ? 200 : 503;
    return res.status(code).json(data);
  } catch (err) {
    return next(err);
  }
};
