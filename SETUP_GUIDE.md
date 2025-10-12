# KMIT Clubs Hub - Complete Setup Guide

This guide will help you set up and run the complete KMIT Clubs Hub application with both backend and frontend.

## Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v16 or higher) - [Download](https://nodejs.org/)
- **MongoDB** (v5 or higher) - [Download](https://www.mongodb.com/try/download/community)
- **Redis** (v6 or higher) - [Download](https://redis.io/download)
- **Git** - [Download](https://git-scm.com/)

## Project Structure

```
kmit-clubs-hub/
├── Backend/          # Node.js + Express backend
└── Frontend/         # React frontend
```

## Backend Setup

### 1. Navigate to Backend Directory

```bash
cd Backend
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Environment Variables

Create a `.env` file in the Backend directory:

```env
# Server Configuration
NODE_ENV=development
PORT=5000

# Database
MONGODB_URI=mongodb://localhost:27017/kmit-clubs-hub

# Redis
REDIS_URL=redis://localhost:6379

# JWT Secrets
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRY=15m
REFRESH_TOKEN_SECRET=your-super-secret-refresh-token-key-change-this
REFRESH_TOKEN_EXPIRY=7d

# Email Configuration (for OTP)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-specific-password
EMAIL_FROM=KMIT Clubs Hub <noreply@kmitclubs.com>

# Cloudinary (for file uploads)
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret

# Workers
START_WORKERS=true
```

### 4. Start MongoDB

```bash
# Windows
mongod

# Linux/Mac
sudo systemctl start mongod
```

### 5. Start Redis

```bash
# Windows
redis-server

# Linux/Mac
sudo systemctl start redis
```

### 6. Start Backend Server

```bash
# Development mode with auto-reload
npm run dev

# Production mode
npm start
```

The backend will be running at `http://localhost:5000`

## Frontend Setup

### 1. Navigate to Frontend Directory

Open a new terminal and navigate to the Frontend directory:

```bash
cd Frontend
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Environment Variables (Optional)

Create a `.env` file in the Frontend directory:

```env
VITE_API_URL=http://localhost:5000/api
```

### 4. Start Frontend Development Server

```bash
npm run dev
```

The frontend will be running at `http://localhost:3000`

## Accessing the Application

1. Open your browser and navigate to `http://localhost:3000`
2. You'll see the homepage with options to login or register

## Creating Your First Admin User

Since the system uses role-based access, you'll need to create an admin user first.

### Option 1: Register and Manually Update Database

1. Register a new user through the UI
2. Complete the OTP verification and profile setup
3. Connect to MongoDB and update the user's role:

```javascript
// In MongoDB shell or Compass
db.users.updateOne(
  { email: "your-email@example.com" },
  { $set: { globalRoles: ["admin"] } }
)
```

### Option 2: Use Backend Script (if available)

```bash
cd Backend
node scripts/createAdmin.js
```

## Testing the Application

### 1. Register a New Student

- Go to Register page
- Enter roll number (format: 22BD1A0501)
- Enter email and password
- Verify OTP (check email)
- Complete profile

### 2. Create a Club (Admin)

- Login as admin
- Go to Admin Dashboard
- Click "Create Club"
- Fill in club details
- Upload logo (optional)

### 3. Create a Recruitment (Club President/Core)

- Login as club president
- Go to Recruitments
- Click "Create Recruitment"
- Fill in details and submit

### 4. Apply to a Club (Student)

- Login as student
- Browse Recruitments
- Click on open recruitment
- Fill application form
- Submit

### 5. Create an Event (Club Core)

- Login as club core member
- Go to Events
- Click "Create Event"
- Fill event details
- Submit for approval

## API Endpoints Overview

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/verify-otp` - Verify OTP
- `POST /api/auth/complete-profile` - Complete user profile
- `POST /api/auth/login` - Login
- `POST /api/auth/logout` - Logout
- `POST /api/auth/refresh-token` - Refresh access token
- `POST /api/auth/forgot-password` - Request password reset
- `POST /api/auth/reset-password` - Reset password

### Clubs
- `GET /api/clubs` - List all clubs
- `POST /api/clubs` - Create club (Admin)
- `GET /api/clubs/:id` - Get club details
- `PATCH /api/clubs/:id/settings` - Update club settings
- `PATCH /api/clubs/:id/approve` - Approve club

### Recruitments
- `GET /api/recruitments` - List recruitments
- `POST /api/recruitments` - Create recruitment
- `GET /api/recruitments/:id` - Get recruitment details
- `POST /api/recruitments/:id/apply` - Apply to recruitment
- `GET /api/recruitments/:id/applications` - List applications
- `PATCH /api/recruitments/:id/applications/:appId` - Review application

### Events
- `GET /api/events` - List events
- `POST /api/events` - Create event
- `GET /api/events/:id` - Get event details
- `POST /api/events/:id/rsvp` - RSVP to event
- `PATCH /api/events/:id/status` - Change event status

### Users
- `GET /api/users/me` - Get current user profile
- `PATCH /api/users/me` - Update profile
- `PUT /api/users/me/password` - Change password
- `GET /api/users` - List all users (Admin)

### Notifications
- `GET /api/notifications` - Get user notifications
- `PATCH /api/notifications/:id/read` - Mark as read
- `POST /api/notifications/read-all` - Mark all as read
- `GET /api/notifications/count-unread` - Get unread count

## Troubleshooting

### Backend Issues

**MongoDB Connection Error**
```
Error: connect ECONNREFUSED 127.0.0.1:27017
```
Solution: Ensure MongoDB is running

**Redis Connection Error**
```
Error: Redis connection failed
```
Solution: Ensure Redis is running

**Port Already in Use**
```
Error: Port 5000 is already in use
```
Solution: Change PORT in .env or kill the process using that port

### Frontend Issues

**API Connection Error**
```
Network Error
```
Solution: Ensure backend is running on port 5000

**Module Not Found**
```
Cannot find module 'react'
```
Solution: Run `npm install` in Frontend directory

## Production Deployment

### Backend Deployment

1. Set `NODE_ENV=production` in .env
2. Use a process manager like PM2:
```bash
npm install -g pm2
pm2 start src/server.js --name kmit-backend
```

3. Set up reverse proxy with Nginx
4. Use MongoDB Atlas for database
5. Use Redis Cloud for Redis
6. Set up SSL certificates

### Frontend Deployment

1. Build the frontend:
```bash
npm run build
```

2. Deploy the `dist/` folder to:
   - Vercel
   - Netlify
   - AWS S3 + CloudFront
   - Any static hosting service

3. Update `VITE_API_URL` to production backend URL

## Security Checklist

- [ ] Change all default secrets in .env
- [ ] Enable HTTPS in production
- [ ] Set up CORS properly
- [ ] Enable rate limiting
- [ ] Set up database backups
- [ ] Enable MongoDB authentication
- [ ] Use Redis password
- [ ] Set up monitoring and logging
- [ ] Enable helmet security headers
- [ ] Validate all user inputs

## Support

For issues or questions:
- Check the documentation
- Review error logs
- Contact the development team

## License

MIT License - see LICENSE file for details
