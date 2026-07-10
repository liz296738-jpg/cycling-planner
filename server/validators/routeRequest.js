const validateRequest = (req, res, next) => {
  const { start, end, preferences } = req.body;
  const errors = [];

  if (!start || typeof start !== 'string' || start.trim().length < 2 || start.trim().length > 100) {
    errors.push({ field: 'start', message: '起点需为2-100个字符' });
  }
  if (!end || typeof end !== 'string' || end.trim().length < 2 || end.trim().length > 100) {
    errors.push({ field: 'end', message: '终点需为2-100个字符' });
  }

  if (preferences) {
    if (preferences.maxDistance !== undefined) {
      const d = Number(preferences.maxDistance);
      if (isNaN(d) || d < 5 || d > 200) {
        errors.push({ field: 'preferences.maxDistance', message: '距离范围需在5-200公里之间' });
      }
    }
    if (preferences.maxElevation !== undefined) {
      const e = Number(preferences.maxElevation);
      if (isNaN(e) || e < 0 || e > 5000) {
        errors.push({ field: 'preferences.maxElevation', message: '爬升范围需在0-5000米之间' });
      }
    }
    if (preferences.surfaceType && !['paved', 'gravel', 'mixed'].includes(preferences.surfaceType)) {
      errors.push({ field: 'preferences.surfaceType', message: '路面类型无效' });
    }
    if (preferences.difficulty && !['easy', 'moderate', 'challenging'].includes(preferences.difficulty)) {
      errors.push({ field: 'preferences.difficulty', message: '难度类型无效' });
    }
  }

  if (errors.length > 0) {
    return res.status(400).json({ error: '输入参数有误', status: 400, details: errors });
  }

  req.validated = {
    start: start.trim(),
    end: end.trim(),
    preferences: preferences || {},
  };
  next();
};

module.exports = { validateRequest };
