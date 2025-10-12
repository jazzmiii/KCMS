const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const config = require('./config');

const healthRoutes = require('./modules/health/health.routes');
const authRoutes = require('./modules/auth/auth.routes');
const userRoutes = require('./modules/user/user.routes');
const clubRoutes = require('./modules/club/club.routes');
const eventRoutes = require('./modules/event/event.routes');
const documentRoutes = require('./modules/document/document.routes');
const recruitmentRoutes = require('./modules/recruitment/recruitment.routes');
const notificationRoutes = require('./modules/notification/notification.routes');
const reportRoutes = require('./modules/reports/report.routes');
const searchRoutes = require('./modules/search/search.routes');

const error = require('./middlewares/error');

const app = express();

// Security + observability
app.use(helmet({
  contentSecurityPolicy: config.NODE_ENV === 'production' ? undefined : false,
  crossOriginEmbedderPolicy: false
}));

// CORS Configuration
const corsOptions = {
  origin: config.CORS_ORIGINS ? 
    config.CORS_ORIGINS.split(',').map(origin => origin.trim()) : 
    (config.NODE_ENV === 'production' ? false : '*'),
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
};
app.use(cors(corsOptions));

// Rate Limiting
const limiter = rateLimit({
  windowMs: config.RATE_LIMIT_WINDOW_MS,
  max: config.RATE_LIMIT_MAX_REQUESTS,
  message: {
    status: 'error',
    message: 'Too many requests from this IP, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(limiter);

// Logging
if (config.NODE_ENV !== 'test') {
  app.use(morgan(config.LOG_FORMAT));
}

// Parsers
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true, limit: '2mb' }));

// Routes - All routes are prefixed with /api
app.use('/api/health', healthRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/clubs', clubRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/documents', documentRoutes);
app.use('/api/recruitments', recruitmentRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/search', searchRoutes);

// 404
app.use((req, res) => res.status(404).json({ message: 'Not Found' }));

// Error handler
app.use(error);

module.exports = app;
