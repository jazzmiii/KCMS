# KMIT Clubs Hub - Backend API

[![Node.js](https://img.shields.io/badge/Node.js-18.x-green.svg)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/Express-4.18-blue.svg)](https://expressjs.com/)
[![MongoDB](https://img.shields.io/badge/MongoDB-7.0-green.svg)](https://www.mongodb.com/)
[![Redis](https://img.shields.io/badge/Redis-7.x-red.svg)](https://redis.io/)

Enterprise-grade backend API for KMIT Clubs Management System with comprehensive RBAC, event management, recruitment automation, and real-time notifications.

---

## 📋 Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Getting Started](#getting-started)
- [Project Structure](#project-structure)
- [API Documentation](#api-documentation)
- [Configuration](#configuration)
- [Scripts](#scripts)
- [Testing](#testing)
- [Deployment](#deployment)
- [Security](#security)

---

## ✨ Features

### Core Modules
- **Authentication & Authorization** - JWT-based auth with OTP verification, session management, forgot password
- **Role-Based Access Control (RBAC)** - Global roles (student, coordinator, admin) + club-scoped roles (member, core, president)
- **Club Management** - Create, manage, approve clubs with coordinator workflow
- **Recruitment System** - Automated recruitment lifecycle with application tracking and bulk selection
- **Event Management** - Event creation, approval workflow, QR-based attendance, budget tracking
- **Notification System** - Multi-channel notifications (in-app, email) with queue-based batching
- **Media & Documents** - Cloudinary integration for uploads, gallery management, albums
- **Reports & Analytics** - Dashboard metrics, NAAC/NBA reports, audit logs with PDF/Excel export
- **Search & Discovery** - Global search, advanced filters, club/user recommendations
- **System Administration** - User management, system settings, backup automation

### Technical Features
- **Queue System** - BullMQ + Redis for background jobs (notifications, recruitment automation, audit logging)
- **Real-time Processing** - Worker-based architecture for scalable async operations
- **Security** - Rate limiting, input validation (Joi), bcrypt password hashing, helmet security headers
- **Performance** - Redis caching, database indexing, connection pooling
- **Audit Trail** - Comprehensive audit logging with 2-year retention

---

## 🛠️ Tech Stack

| Category | Technology |
|----------|-----------|
| **Runtime** | Node.js 18+ |
| **Framework** | Express.js 4.18 |
| **Database** | MongoDB 7.0 (Mongoose ODM) |
| **Cache/Queue** | Redis 7.x + BullMQ |
| **Authentication** | JWT (jsonwebtoken) |
| **Validation** | Joi 17.x |
| **File Upload** | Multer + Cloudinary |
| **Email** | Nodemailer (SMTP) |
| **Reports** | PDFKit, ExcelJS |
| **Security** | Helmet, bcrypt, express-rate-limit |
| **Logging** | Winston, Morgan |
| **Testing** | Jest, Supertest |

---

## 🚀 Getting Started

### Prerequisites
- Node.js >= 18.x
- MongoDB >= 7.0
- Redis >= 7.x
- npm or yarn

### Installation

1. **Clone the repository**
```bash
git clone <repository-url>
cd kmit-clubs/Backend
```

2. **Install dependencies**
```bash
npm install
```

3. **Configure environment variables**
```bash
cp .env.example .env
# Edit .env with your configuration
```

4. **Start MongoDB and Redis**
```bash
# MongoDB
mongod --dbpath /path/to/data

# Redis
redis-server
```

5. **Seed initial data (optional)**
```bash
npm run seed
```

6. **Start development server**
```bash
npm run dev
```

The API will be available at `http://localhost:5000`

---

## 📁 Project Structure

```
Backend/
├── config/                    # Environment-specific configurations
│   ├── index.js              # Main config loader
│   ├── development.js        # Development overrides
│   ├── production.js         # Production settings
│   └── staging.js            # Staging settings
├── scripts/                   # Utility scripts
│   ├── backup.js             # Automated database backup
│   └── seed.js               # Database seeding
├── src/
│   ├── app.js                # Express app setup
│   ├── server.js             # Server entry point
│   ├── config/               # Runtime configuration
│   │   ├── index.js          # Config aggregator
│   │   ├── db.js             # Database connection
│   │   └── redis.js          # Redis connection
│   ├── middlewares/          # Express middlewares
│   │   ├── auth.js           # Authentication middleware
│   │   ├── permission.js     # RBAC permission checks
│   │   ├── validate.js       # Request validation
│   │   ├── rateLimit.js      # Rate limiting
│   │   └── error.js          # Error handler
│   ├── modules/              # Feature modules
│   │   ├── auth/             # Authentication & user management
│   │   ├── club/             # Club management
│   │   ├── recruitment/      # Recruitment system
│   │   ├── event/            # Event management
│   │   ├── notification/     # Notification system
│   │   ├── document/         # Media & documents
│   │   ├── reports/          # Reports & analytics
│   │   ├── search/           # Search & discovery
│   │   ├── user/             # User operations
│   │   ├── audit/            # Audit logging
│   │   └── health/           # Health checks
│   ├── queues/               # Queue definitions
│   │   ├── notification.queue.js
│   │   ├── recruitment.queue.js
│   │   └── audit.queue.js
│   ├── workers/              # Background workers
│   │   ├── bootstrap.js      # Worker initialization
│   │   ├── notification.worker.js
│   │   ├── recruitment.worker.js
│   │   ├── audit.worker.js
│   │   └── notification.batcher.js
│   ├── utils/                # Utility functions
│   │   ├── cloudinary.js     # File upload
│   │   ├── crypto.js         # Encryption helpers
│   │   ├── emailTemplates.js # Email templates
│   │   ├── logger.js         # Winston logger
│   │   ├── mail.js           # Email sender
│   │   ├── qrcode.js         # QR code generation
│   │   ├── rbac.js           # RBAC utilities
│   │   ├── reportGenerator.js# PDF/Excel generation
│   │   ├── response.js       # API response helpers
│   │   └── token.js          # JWT utilities
│   └── tests/                # Test suites
│       └── mocks/            # Test mocks
└── package.json
```

---

## 📡 API Documentation

### Base URL
```
Development: http://localhost:5000/api
Production: https://your-domain.com/api
```

### Module Endpoints

| Module | Endpoints | Description |
|--------|-----------|-------------|
| **Auth** | `/auth/*` | Registration, login, OTP, password reset |
| **Users** | `/users/*` | User management, profile, sessions |
| **Clubs** | `/clubs/*` | Club CRUD, members, settings, analytics |
| **Events** | `/events/*` | Events, attendance, budget, RSVP |
| **Recruitment** | `/recruitments/*` | Recruitment lifecycle, applications |
| **Notifications** | `/notifications/*` | List, mark read, preferences |
| **Documents** | `/documents/*` | Upload, gallery, albums, download |
| **Reports** | `/reports/*` | Dashboard, NAAC/NBA, annual reports |
| **Search** | `/search/*` | Global search, recommendations |
| **Health** | `/health/*` | Liveness, readiness probes |

### Authentication
Include JWT token in Authorization header:
```
Authorization: Bearer <your-jwt-token>
```

---

## ⚙️ Configuration

### Environment Variables

See `.env.example` for complete configuration. Key variables:

```bash
# Server
NODE_ENV=production
PORT=5000

# Database
MONGODB_URI=mongodb://localhost:27017/KCMS

# Redis
REDIS_URL=redis://localhost:6379

# JWT
JWT_SECRET=your-secret-key
JWT_EXPIRY=15m
REFRESH_TOKEN_SECRET=your-refresh-secret
REFRESH_TOKEN_EXPIRY=7d

# Email
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password

# Cloudinary
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
```

---

## 📜 Scripts

```bash
# Development
npm run dev              # Start with nodemon (hot reload)

# Production
npm start                # Start production server

# Workers
npm run worker:audit     # Start audit worker separately

# Testing
npm test                 # Run tests with coverage
npm run lint             # Run ESLint

# Database
node scripts/seed.js     # Seed initial data
node scripts/backup.js   # Manual backup
```

### Automated Backup (Cron)
```bash
# Daily backup at 2 AM
0 2 * * * /usr/bin/node /path/to/Backend/scripts/backup.js
```

---

## 🧪 Testing

```bash
# Run all tests with coverage
npm test

# Watch mode
npm test -- --watch

# Specific test file
npm test -- auth.test.js
```

**Coverage Thresholds:** 70% (branches, functions, lines, statements)

---

## 🚢 Deployment

### Production Checklist

1. **Environment Configuration**
   - [ ] Set `NODE_ENV=production`
   - [ ] Configure production MongoDB URI
   - [ ] Set strong JWT secrets
   - [ ] Configure SMTP credentials
   - [ ] Set CORS origins
   - [ ] Configure Cloudinary

2. **Security**
   - [ ] Enable HTTPS only
   - [ ] Set appropriate rate limits
   - [ ] Configure helmet security headers
   - [ ] Review CORS settings
   - [ ] Enable audit logging

3. **Performance**
   - [ ] Configure Redis caching
   - [ ] Set up connection pooling
   - [ ] Enable gzip compression
   - [ ] Configure worker concurrency

4. **Monitoring**
   - [ ] Set up logging (Winston)
   - [ ] Configure health checks
   - [ ] Set up backup automation
   - [ ] Monitor queue performance

### Docker Deployment (Optional)

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 5000
CMD ["node", "src/server.js"]
```

---

## 🔒 Security

### Implemented Measures

- **Authentication:** JWT with refresh tokens (15min + 7 days)
- **Password Security:** bcrypt hashing (12 rounds)
- **Rate Limiting:** 100 requests per 15 minutes (configurable)
- **Input Validation:** Joi schemas on all endpoints
- **Security Headers:** Helmet.js (XSS, CSRF protection)
- **CORS:** Configurable allowed origins
- **Session Management:** Device tracking, concurrent session limits
- **Audit Logging:** All sensitive operations logged
- **HTTPS:** Enforced in production

### Security Best Practices

1. Never commit `.env` file
2. Rotate JWT secrets regularly
3. Use strong passwords for admin accounts
4. Monitor audit logs for suspicious activity
5. Keep dependencies updated
6. Enable 2FA for admin accounts (future enhancement)

---

## 📊 Performance Optimization

- **Database Indexing:** All frequently queried fields indexed
- **Redis Caching:** Session data, frequently accessed resources
- **Connection Pooling:** MongoDB connection pool (min: 2, max: 10)
- **Queue System:** BullMQ for async operations
- **Pagination:** Default 20 items per page
- **Lazy Loading:** On-demand data fetching

---

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

---

## 📝 License

This project is proprietary software for KMIT Clubs Hub.

---

## 📧 Support

For issues or questions:
- Email: support@kmit-clubs.com
- Documentation: [Wiki](https://github.com/your-repo/wiki)
- Issues: [GitHub Issues](https://github.com/your-repo/issues)

---

**Built with ❤️ for KMIT Clubs Hub**
