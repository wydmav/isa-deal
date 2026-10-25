// ──────────────────────────────────────────────
// Penya Play Booking OS — Server
// OS: "helmet for HTTP security headers"
// OS: "CORS origins explicitly whitelisted. No wildcard."
// OS: "rate limiting (100 requests per 15 minutes per IP)"
// OS: "express.json({ limit: '10kb' }) to mitigate DoS payload floods"
// ──────────────────────────────────────────────

require('dotenv').config();

const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const cookieParser = require('cookie-parser');

const { errorHandler } = require('./middleware/errorHandler');

const app = express();
const PORT = parseInt(process.env.PORT, 10) || 4000;

// ── Security middleware ──

// OS: "Helmet.js for HTTP security headers"
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      connectSrc: ["'self'"],
    },
  },
}));

// OS: "CORS origins shall be explicitly whitelisted. No wildcard."
const allowedOrigins = (process.env.PP_CORS_ORIGINS || 'http://localhost:3000').split(',');
app.use(cors({
  origin: allowedOrigins,
  credentials: true,
  methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// OS: "cookie parser for HttpOnly JWT"
app.use(cookieParser());

// OS: "express.json({ limit: '10kb' })"
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: false, limit: '10kb' }));

// OS: "rate limiting"
const limiter = rateLimit({
  windowMs: parseInt(process.env.PP_RATE_LIMIT_WINDOW, 10) || 900000,
  max: parseInt(process.env.PP_RATE_LIMIT_MAX, 10) || 100,
  message: { error: 'Too many requests' },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/', limiter);

// ── API Routes ──

app.use('/api/auth', require('./routes/auth.routes'));
app.use('/api/performers', require('./routes/performer.routes'));
app.use('/api/bookings', require('./routes/booking.routes'));
app.use('/api/messages', require('./routes/message.routes'));
app.use('/api/reviews', require('./routes/review.routes'));
app.use('/api/admin', require('./routes/admin.routes'));

// ── Health check ──
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ── 404 handler ──
app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// ── Error handler (must be last) ──
app.use(errorHandler);

// ──────────────────────────────────────────────
// Start Server
// ──────────────────────────────────────────────

app.listen(PORT, () => {
  console.log('');
  console.log('╔════════════════════════════════════════════╗');
  console.log('║        PENYA PLAY BOOKING OS               ║');
  console.log('║              Phase 1 — MVP                 ║');
  console.log('╚════════════════════════════════════════════╝');
  console.log('');
  console.log('✅ SERVER STATUS: RUNNING');
  console.log(`🌐 API URL: http://localhost:${PORT}`);
  console.log(`🏥 Health Check: http://localhost:${PORT}/api/health`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🚪 Port: ${PORT}`);
  console.log(
    `💳 Payments: ${
      process.env.PP_PAYMENTS_ENABLED === 'true'
        ? 'ENABLED'
        : 'DISABLED (manual only)'
    }`
  );
  console.log(`🔐 CORS Allowed: ${allowedOrigins.join(', ')}`);
  console.log('');
  console.log('🚀 Penya Play Backend is ready to accept requests');
  console.log('');
});