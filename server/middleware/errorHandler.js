const errorHandler = (err, req, res, next) => {
  const status = err.status || 500;
  const message = err.message || '服务器内部错误';

  console.error(`[${new Date().toISOString()}] ${status} - ${message}`);

  if (err.name === 'DeepSeekAPIError') {
    return res.status(status).json({
      error: 'AI 服务暂时不可用，请稍后重试',
      status,
      details: process.env.NODE_ENV === 'development' ? err.details : undefined,
    });
  }

  console.error('Unhandled error:', err);
  res.status(status).json({ error: message, status });
};

class DeepSeekAPIError extends Error {
  constructor(message, status = 502, details = null) {
    super(message);
    this.name = 'DeepSeekAPIError';
    this.status = status;
    this.details = details;
  }
}

module.exports = { errorHandler, DeepSeekAPIError };
