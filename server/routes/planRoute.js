const express = require('express');
const { generateCyclingRoute } = require('../services/deepseek');
const { validateRequest } = require('../validators/routeRequest');
const { planRouteLimiter } = require('../middleware/rateLimiter');
const router = express.Router();

router.post('/plan-route', planRouteLimiter, validateRequest, async (req, res, next) => {
  try {
    const { start, end, preferences } = req.validated;
    const routeData = await generateCyclingRoute(start, end, preferences);
    res.json({ success: true, data: routeData });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
