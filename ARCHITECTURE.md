# 🏗️ KMIT Clubs Hub - System Architecture

## 📐 High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         CLIENT LAYER                             │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │              React Frontend (Port 3000)                   │  │
│  │  ┌────────────┐  ┌────────────┐  ┌────────────┐         │  │
│  │  │  Student   │  │    Core    │  │Coordinator │         │  │
│  │  │ Dashboard  │  │ Dashboard  │  │ Dashboard  │         │  │
│  │  └────────────┘  └────────────┘  └────────────┘         │  │
│  │  ┌────────────┐  ┌────────────┐  ┌────────────┐         │  │
│  │  │   Admin    │  │   Clubs    │  │   Events   │         │  │
│  │  │ Dashboard  │  │   Pages    │  │   Pages    │         │  │
│  │  └────────────┘  └────────────┘  └────────────┘         │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ HTTP/HTTPS (Axios)
                              │ JWT Authentication
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                         API LAYER                                │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │           Express.js Backend (Port 5000)                  │  │
│  │  ┌────────────┐  ┌────────────┐  ┌────────────┐         │  │
│  │  │    Auth    │  │   Clubs    │  │   Events   │         │  │
│  │  │  Module    │  │   Module   │  │   Module   │         │  │
│  │  └────────────┘  └────────────┘  └────────────┘         │  │
│  │  ┌────────────┐  ┌────────────┐  ┌────────────┐         │  │
│  │  │Recruitment │  │   Users    │  │Notification│         │  │
│  │  │  Module    │  │   Module   │  │   Module   │         │  │
│  │  └────────────┘  └────────────┘  └────────────┘         │  │
│  │                                                            │  │
│  │  Middlewares: Auth, RBAC, Validation, Rate Limiting      │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                              │
                    ┌─────────┴─────────┐
                    │                   │
                    ▼                   ▼
┌──────────────────────────┐  ┌──────────────────────────┐
│     DATABASE LAYER       │  │     CACHE LAYER          │
│  ┌────────────────────┐  │  │  ┌────────────────────┐  │
│  │   MongoDB          │  │  │  │   Redis            │  │
│  │   (Port 27017)     │  │  │  │   (Port 6379)      │  │
│  │                    │  │  │  │                    │  │
│  │  Collections:      │  │  │  │  Uses:             │  │
│  │  - users           │  │  │  │  - Sessions        │  │
│  │  - clubs           │  │  │  │  - Cache           │  │
│  │  - events          │  │  │  │  - Job Queues      │  │
│  │  - recruitments    │  │  │  │  - Rate Limiting   │  │
│  │  - applications    │  │  │  │                    │  │
│  │  - notifications   │  │  │  └────────────────────┘  │
│  └────────────────────┘  │  └──────────────────────────┘
└──────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────────────────────────────┐
│                    EXTERNAL SERVICES                             │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐                │
│  │ Cloudinary │  │ Nodemailer │  │  BullMQ    │                │
│  │(File Upload)│  │  (Email)   │  │ (Jobs)     │                │
│  └────────────┘  └────────────┘  └────────────┘                │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🔄 Request Flow

### 1. Authentication Flow

```
User Registration:
┌──────┐     ┌──────────┐     ┌─────────┐     ┌──────────┐
│Client│────▶│ Backend  │────▶│MongoDB  │────▶│Nodemailer│
│      │     │/register │     │Save User│     │Send OTP  │
└──────┘     └──────────┘     └─────────┘     └──────────┘
   │              │                                  │
   │◀─────────────┴──────────────────────────────────┘
   │         OTP Sent Response
   │
   │         OTP Verification:
   ├────────────────────────────────────────────────────────┐
   │                                                         │
   ▼                                                         ▼
┌──────────┐     ┌─────────┐     ┌──────────┐     ┌──────────┐
│ Backend  │────▶│MongoDB  │────▶│  Redis   │────▶│  JWT     │
│/verify   │     │Verify   │     │Store     │     │Generate  │
│          │     │User     │     │Session   │     │Tokens    │
└──────────┘     └─────────┘     └──────────┘     └──────────┘
```

### 2. Dashboard Data Flow

```
Dashboard Load:
┌──────┐     ┌──────────┐     ┌─────────┐     ┌──────────┐
│Client│────▶│ Backend  │────▶│  Redis  │────▶│MongoDB   │
│      │     │Verify JWT│     │Check    │     │Fetch     │
│      │     │          │     │Cache    │     │Data      │
└──────┘     └──────────┘     └─────────┘     └──────────┘
   │              │                │                │
   │◀─────────────┴────────────────┴────────────────┘
   │         Dashboard Data (JSON)
   │
   ▼
┌──────────────────────────────────────────┐
│  React Component Renders Data            │
│  - Stats Cards                            │
│  - Quick Actions                          │
│  - Data Tables/Cards                      │
└──────────────────────────────────────────┘
```

### 3. Event Creation Flow

```
Create Event:
┌──────┐     ┌──────────┐     ┌─────────┐     ┌──────────┐
│Client│────▶│ Backend  │────▶│Cloudinary│───▶│MongoDB   │
│Form  │     │Validate  │     │Upload    │    │Save      │
│      │     │RBAC Check│     │Files     │    │Event     │
└──────┘     └──────────┘     └─────────┘     └──────────┘
   │              │                │                │
   │              │                │                ▼
   │              │                │         ┌──────────┐
   │              │                │         │  BullMQ  │
   │              │                │         │Add Job   │
   │              │                │         └──────────┘
   │              │                │                │
   │              │                │                ▼
   │              │                │         ┌──────────┐
   │              │                │         │Notification│
   │              │                │         │Worker    │
   │◀─────────────┴────────────────┴─────────┴──────────┘
   │         Success Response + Notifications Sent
```

---

## 🗂️ Frontend Architecture

```
Frontend/
│
├── src/
│   │
│   ├── main.jsx                    # Entry Point
│   │   └─▶ Renders App with AuthProvider
│   │
│   ├── App.jsx                     # Router Configuration
│   │   ├─▶ Public Routes (/, /login, /register)
│   │   ├─▶ Protected Routes (/dashboard, /clubs, /events)
│   │   └─▶ Role-Based Routes (/admin/*, /coordinator/*)
│   │
│   ├── context/
│   │   └── AuthContext.jsx         # Global Auth State
│   │       ├─▶ User State
│   │       ├─▶ Login/Logout Functions
│   │       └─▶ Role Checking Functions
│   │
│   ├── components/
│   │   ├── Layout.jsx              # Main Layout
│   │   │   ├─▶ Navbar with Notifications
│   │   │   ├─▶ User Menu
│   │   │   └─▶ Footer
│   │   └── ProtectedRoute.jsx      # Route Guard
│   │       └─▶ Checks Authentication & Roles
│   │
│   ├── services/                   # API Layer
│   │   ├── api.js                  # Axios Instance
│   │   │   ├─▶ Request Interceptor (Add JWT)
│   │   │   └─▶ Response Interceptor (Refresh Token)
│   │   ├── authService.js          # Auth APIs
│   │   ├── clubService.js          # Club APIs
│   │   ├── eventService.js         # Event APIs
│   │   ├── recruitmentService.js   # Recruitment APIs
│   │   ├── userService.js          # User APIs
│   │   └── notificationService.js  # Notification APIs
│   │
│   ├── pages/
│   │   ├── auth/                   # Authentication Pages
│   │   │   ├── LoginPage.jsx
│   │   │   ├── RegisterPage.jsx
│   │   │   ├── VerifyOtpPage.jsx
│   │   │   ├── CompleteProfilePage.jsx
│   │   │   ├── ForgotPasswordPage.jsx
│   │   │   └── ResetPasswordPage.jsx
│   │   │
│   │   ├── dashboards/             # Role-Based Dashboards
│   │   │   ├── StudentDashboard.jsx
│   │   │   ├── CoreDashboard.jsx
│   │   │   ├── CoordinatorDashboard.jsx
│   │   │   └── AdminDashboard.jsx
│   │   │
│   │   ├── clubs/                  # Club Management
│   │   │   ├── ClubsPage.jsx
│   │   │   ├── ClubDetailPage.jsx
│   │   │   └── CreateClubPage.jsx
│   │   │
│   │   ├── events/                 # Event Management
│   │   │   ├── EventsPage.jsx
│   │   │   ├── EventDetailPage.jsx
│   │   │   └── CreateEventPage.jsx
│   │   │
│   │   ├── recruitments/           # Recruitment System
│   │   │   ├── RecruitmentsPage.jsx
│   │   │   ├── RecruitmentDetailPage.jsx
│   │   │   ├── CreateRecruitmentPage.jsx
│   │   │   └── ApplicationsPage.jsx
│   │   │
│   │   └── user/                   # User Management
│   │       ├── ProfilePage.jsx
│   │       └── UsersManagementPage.jsx
│   │
│   └── styles/                     # CSS Modules
│       ├── global.css              # Global Styles
│       ├── HomePage.css
│       ├── Auth.css
│       ├── Layout.css
│       ├── Dashboard.css
│       ├── Clubs.css
│       ├── Events.css
│       ├── Recruitments.css
│       ├── Applications.css
│       ├── Forms.css
│       ├── Profile.css
│       └── ...
```

---

## 🔧 Backend Architecture

```
Backend/
│
├── src/
│   │
│   ├── server.js                   # Entry Point
│   │   ├─▶ Connect MongoDB
│   │   ├─▶ Connect Redis
│   │   ├─▶ Start Express Server
│   │   └─▶ Start Workers (if enabled)
│   │
│   ├── app.js                      # Express App Configuration
│   │   ├─▶ Global Middleware (helmet, cors, morgan)
│   │   ├─▶ Route Registration
│   │   └─▶ Error Handler
│   │
│   ├── middlewares/
│   │   ├── auth.js                 # JWT Verification
│   │   ├── permission.js           # RBAC Checks
│   │   ├── validate.js             # Input Validation
│   │   ├── error.js                # Error Handler
│   │   └── rateLimit.js            # Rate Limiting
│   │
│   ├── modules/                    # Feature Modules
│   │   │
│   │   ├── auth/
│   │   │   ├── auth.routes.js      # Routes
│   │   │   ├── auth.controller.js  # Business Logic
│   │   │   ├── auth.service.js     # Data Access
│   │   │   ├── auth.validators.js  # Validation Rules
│   │   │   └── auth.model.js       # Mongoose Model
│   │   │
│   │   ├── club/
│   │   │   ├── club.routes.js
│   │   │   ├── club.controller.js
│   │   │   ├── club.service.js
│   │   │   ├── club.validators.js
│   │   │   └── club.model.js
│   │   │
│   │   ├── event/
│   │   │   ├── event.routes.js
│   │   │   ├── event.controller.js
│   │   │   ├── event.service.js
│   │   │   ├── event.validators.js
│   │   │   └── event.model.js
│   │   │
│   │   ├── recruitment/
│   │   │   ├── recruitment.routes.js
│   │   │   ├── recruitment.controller.js
│   │   │   ├── recruitment.service.js
│   │   │   ├── recruitment.validators.js
│   │   │   └── recruitment.model.js
│   │   │
│   │   └── ... (user, notification, document, reports, etc.)
│   │
│   ├── queues/
│   │   ├── notification.queue.js   # Notification Queue
│   │   └── audit.queue.js          # Audit Log Queue
│   │
│   ├── workers/
│   │   ├── notification.worker.js  # Process Notifications
│   │   └── audit.worker.js         # Process Audit Logs
│   │
│   └── utils/
│       ├── jwt.js                  # JWT Utilities
│       ├── email.js                # Email Utilities
│       ├── upload.js               # File Upload
│       └── logger.js               # Winston Logger
│
└── config/
    ├── index.js                    # Config Loader
    ├── development.js              # Dev Config
    └── production.js               # Prod Config
```

---

## 🔐 Security Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    SECURITY LAYERS                           │
│                                                              │
│  1. Network Layer                                           │
│     ├─▶ HTTPS/TLS Encryption                               │
│     ├─▶ CORS Configuration                                 │
│     └─▶ Rate Limiting                                       │
│                                                              │
│  2. Application Layer                                       │
│     ├─▶ Helmet.js (Security Headers)                       │
│     ├─▶ Input Validation (Joi)                             │
│     ├─▶ XSS Protection                                      │
│     └─▶ CSRF Protection                                     │
│                                                              │
│  3. Authentication Layer                                    │
│     ├─▶ JWT Tokens (15min expiry)                          │
│     ├─▶ Refresh Tokens (7 days)                            │
│     ├─▶ Password Hashing (bcrypt)                          │
│     └─▶ OTP Verification                                    │
│                                                              │
│  4. Authorization Layer                                     │
│     ├─▶ Role-Based Access Control (RBAC)                   │
│     ├─▶ Global Roles (admin, coordinator, student)         │
│     ├─▶ Club Roles (president, core, member)               │
│     └─▶ Permission Checks on Every Request                 │
│                                                              │
│  5. Data Layer                                              │
│     ├─▶ MongoDB Authentication                             │
│     ├─▶ Redis Password                                      │
│     ├─▶ Encrypted Sensitive Data                           │
│     └─▶ Audit Logging                                       │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## 📊 Data Models

### User Model
```javascript
{
  _id: ObjectId,
  rollNumber: String (unique, indexed),
  email: String (unique, indexed),
  password: String (hashed),
  name: String,
  department: String,
  year: Number,
  batch: String,
  phone: String,
  globalRoles: [String], // ['student', 'admin', 'coordinator']
  clubRoles: [{
    clubId: ObjectId,
    roles: [String] // ['member', 'core', 'president']
  }],
  status: String, // 'pending_otp', 'verified', 'active', 'suspended'
  createdAt: Date,
  updatedAt: Date
}
```

### Club Model
```javascript
{
  _id: ObjectId,
  name: String (unique),
  category: String, // 'technical', 'cultural', 'sports', 'arts', 'social'
  description: String,
  vision: String,
  mission: String,
  logo: String (URL),
  coordinatorId: ObjectId (ref: User),
  status: String, // 'draft', 'pending_approval', 'active', 'archived'
  memberCount: Number,
  eventCount: Number,
  socialMedia: {
    instagram: String,
    twitter: String,
    linkedin: String
  },
  createdAt: Date,
  updatedAt: Date
}
```

### Event Model
```javascript
{
  _id: ObjectId,
  clubId: ObjectId (ref: Club),
  name: String,
  description: String,
  objectives: String,
  date: Date,
  duration: Number,
  venue: String,
  capacity: Number,
  expectedAttendees: Number,
  isPublic: Boolean,
  budget: Number,
  guestSpeakers: [String],
  status: String, // 'draft', 'pending_coordinator', 'pending_admin', 'approved', 'published', 'ongoing', 'completed'
  documents: {
    proposal: String,
    budgetBreakdown: String,
    venuePermission: String
  },
  rsvps: [ObjectId],
  attendance: [ObjectId],
  createdAt: Date,
  updatedAt: Date
}
```

### Recruitment Model
```javascript
{
  _id: ObjectId,
  clubId: ObjectId (ref: Club),
  title: String,
  description: String,
  startDate: Date,
  endDate: Date,
  positions: Number,
  eligibility: String,
  customQuestions: [String],
  status: String, // 'draft', 'scheduled', 'open', 'closing_soon', 'closed', 'selection_done'
  applicationCount: Number,
  createdAt: Date,
  updatedAt: Date
}
```

---

## 🔄 State Management

### Frontend State
```
┌─────────────────────────────────────────┐
│         React Context API               │
│                                          │
│  AuthContext                            │
│  ├─▶ user (current user object)        │
│  ├─▶ loading (auth loading state)      │
│  ├─▶ login() function                  │
│  ├─▶ logout() function                 │
│  ├─▶ hasRole() function                │
│  └─▶ hasClubRole() function            │
│                                          │
│  Component State (useState)             │
│  ├─▶ Local UI state                    │
│  ├─▶ Form data                         │
│  └─▶ Loading/error states              │
│                                          │
│  Server State (API calls)               │
│  ├─▶ Fetched from backend              │
│  ├─▶ Cached in component               │
│  └─▶ Refreshed on actions              │
└─────────────────────────────────────────┘
```

---

## 🚀 Deployment Architecture

### Production Setup
```
┌──────────────────────────────────────────────────────────┐
│                    PRODUCTION                             │
│                                                           │
│  Frontend (Vercel/Netlify)                               │
│  ├─▶ Static files served via CDN                        │
│  ├─▶ Environment: VITE_API_URL=https://api.domain.com   │
│  └─▶ HTTPS enabled                                       │
│                                                           │
│  Backend (AWS EC2 / DigitalOcean)                        │
│  ├─▶ PM2 Process Manager                                │
│  ├─▶ Nginx Reverse Proxy                                │
│  ├─▶ SSL Certificate (Let's Encrypt)                    │
│  └─▶ Environment: NODE_ENV=production                    │
│                                                           │
│  Database (MongoDB Atlas)                                │
│  ├─▶ Replica Set (3 nodes)                              │
│  ├─▶ Automated Backups                                  │
│  └─▶ Connection Pooling                                 │
│                                                           │
│  Cache (Redis Cloud)                                     │
│  ├─▶ High Availability                                  │
│  ├─▶ Persistence Enabled                                │
│  └─▶ Password Protected                                 │
│                                                           │
│  File Storage (Cloudinary)                               │
│  ├─▶ Image Optimization                                 │
│  ├─▶ CDN Delivery                                       │
│  └─▶ Automatic Backups                                  │
└──────────────────────────────────────────────────────────┘
```

---

## 📈 Performance Optimization

### Frontend
- Code splitting by route
- Lazy loading components
- Image optimization
- CSS minification
- Gzip compression
- Browser caching

### Backend
- Database indexing
- Redis caching
- Connection pooling
- Query optimization
- Response compression
- Rate limiting

---

## 🎯 Scalability Strategy

### Horizontal Scaling
```
Load Balancer
     │
     ├─▶ Backend Instance 1
     ├─▶ Backend Instance 2
     ├─▶ Backend Instance 3
     └─▶ Backend Instance N
          │
          ├─▶ MongoDB Replica Set
          └─▶ Redis Cluster
```

### Microservices Ready
- Modular architecture
- Independent modules
- API Gateway ready
- Service mesh compatible

---

This architecture provides a solid foundation for a scalable, secure, and maintainable club management system! 🚀
