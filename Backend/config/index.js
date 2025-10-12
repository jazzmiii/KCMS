// root config loader (used by server.js & scripts)
require('dotenv').config();

const env = process.env.NODE_ENV || 'development';
const base = {
  PORT: process.env.PORT || 5000,
  MONGODB_URI: process.env.MONGODB_URI,
  REDIS_URL: process.env.REDIS_URL,
  JWT_SECRET: process.env.JWT_SECRET,
  JWT_EXPIRY: process.env.JWT_EXPIRY,
  REFRESH_TOKEN_SECRET: process.env.REFRESH_TOKEN_SECRET,
  REFRESH_TOKEN_EXPIRY: process.env.REFRESH_TOKEN_EXPIRY
};

const envConfig = require(`./${env}.js`);
module.exports = { ...base, ...envConfig };