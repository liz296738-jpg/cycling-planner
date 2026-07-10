const rateLimit = require('express-rate-limit');

const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: '请求过于频繁，请稍后再试', status: 429 },
});

const planRouteLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: '路线规划请求过于频繁，请5分钟后再试', status: 429, retryAfter: 300 },
});

module.exports = { globalLimiter, planRouteLimiter };
