require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const path = require('path');
const { globalLimiter } = require('./middleware/rateLimiter');
const { errorHandler } = require('./middleware/errorHandler');
const planRouteRouter = require('./routes/planRoute');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "https://unpkg.com"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com", "https://unpkg.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "https://*.basemaps.cartocdn.com", "data:"],
      connectSrc: ["'self'", "https://*.basemaps.cartocdn.com", "https://api.deepseek.com"],
    },
  },
}));
app.use(cors());
app.use(express.json());
app.use(globalLimiter);

app.use(express.static(path.join(__dirname, '..', 'public')));

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use('/api', planRouteRouter);

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'index.html'));
});

app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
