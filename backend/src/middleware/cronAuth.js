const crypto = require('crypto');
const { cronSyncToken } = require('../config/env');

const readBearerToken = (headerValue = '') => {
  const value = String(headerValue || '').trim();
  if (!value.toLowerCase().startsWith('bearer ')) {
    return '';
  }

  return value.slice(7).trim();
};

const safeCompare = (left, right) => {
  const leftBuffer = Buffer.from(String(left || ''), 'utf8');
  const rightBuffer = Buffer.from(String(right || ''), 'utf8');

  if (!leftBuffer.length || leftBuffer.length !== rightBuffer.length) {
    return false;
  }

  return crypto.timingSafeEqual(leftBuffer, rightBuffer);
};

const cronAuth = (req, res, next) => {
  if (!cronSyncToken) {
    return res.status(503).json({ message: 'Cron sync endpoint is not configured.' });
  }

  const providedToken = String(
    req.header('X-Cron-Token')
    || readBearerToken(req.header('Authorization'))
    || ''
  ).trim();

  if (!safeCompare(providedToken, cronSyncToken)) {
    return res.status(401).json({ message: 'Invalid cron token.' });
  }

  req.cronAuth = { trigger: 'external-cron' };
  next();
};

module.exports = cronAuth;
