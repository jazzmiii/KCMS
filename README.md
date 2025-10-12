# 🎓 KMIT Clubs Hub

A comprehensive club management system for KMIT (Keshav Memorial Institute of Technology) that streamlines club activities, recruitment, event management, and student engagement.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Node](https://img.shields.io/badge/node-%3E%3D16.0.0-brightgreen.svg)
![React](https://img.shields.io/badge/react-18.2.0-blue.svg)

## 📋 Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Quick Start](#quick-start)
- [Project Structure](#project-structure)
- [Documentation](#documentation)
- [Screenshots](#screenshots)
- [Contributing](#contributing)
- [License](#license)

## ✨ Features

### 🔐 Authentication & Authorization
- Secure registration with roll number validation
- Email verification via OTP (10-minute expiry)
- JWT-based authentication with refresh tokens
- Password reset with OTP verification
- Role-based access control (Student, Coordinator, Admin)
- Session management with device tracking

### 🏢 Club Management
- Create and manage clubs with categories (Technical, Cultural, Sports, Arts, Social)
- Club profiles with vision, mission, and social media links
- Member management with role assignments
- Club approval workflow
- Activity tracking and reporting

### 📝 Recruitment System
- Create recruitment drives with custom questions
- Application submission and tracking
- Bulk application review
- Status management (Submitted, Selected, Rejected, Waitlisted)
- Automated notifications for applicants
- Recruitment analytics and reports

### 📅 Event Management
- Create and publish events with detailed information
- Event approval workflow (Coordinator → Admin)
- RSVP and attendance tracking
- Budget management and approval
- Event documentation with photos and reports
- QR code-based attendance

### 🔔 Notification System
- Real-time in-app notifications
- Email notifications for important updates
- Priority-based notification delivery
- Notification preferences and filtering
- Unread count tracking

### 📊 Analytics & Reports
- Dashboard with key metrics
- Club activity reports
- NAAC/NBA compliance reports
- Event participation analytics
- Recruitment statistics
- Exportable reports (PDF, Excel, CSV)

### 👥 User Management
- Student profiles with department and year
- Coordinator assignment to clubs
- Admin user management
- Role assignment and permissions
- User activity audit logs

## 🛠️ Tech Stack

### Backend
- **Runtime**: Node.js 16+
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose ODM
- **Cache**: Redis for sessions and queues
- **Authentication**: JWT (jsonwebtoken)
- **Validation**: Joi
- **File Upload**: Multer + Cloudinary
- **Email**: Nodemailer
- **Queue**: BullMQ
- **Security**: Helmet, bcrypt
- **Logging**: Winston

### Frontend
- **Library**: React 18
- **Routing**: React Router 6
- **HTTP Client**: Axios
- **Build Tool**: Vite
- **Styling**: CSS3 with CSS Variables
- **Icons**: React Icons
- **Date Handling**: date-fns

## 🚀 Quick Start

### Prerequisites

- Node.js 16+ and npm
- MongoDB 5+
- Redis 5+ (see [REDIS_SETUP.md](./REDIS_SETUP.md) for Windows setup)
- Docker (optional, for Redis via Docker)

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/yourusername/kmit-clubs-hub.git
cd kmit-clubs-hub
```

2. **Setup Redis** (Required - Windows users see [REDIS_SETUP.md](./REDIS_SETUP.md))
```bash
# Option 1: Using Docker (Recommended)
docker-compose up -d redis

# Option 2: Use Upstash (Cloud Redis) - Update REDIS_URL in .env
```

3. **Setup Backend**
```bash
cd Backend
npm install
cp .env.example .env
# Edit .env with your configuration (MongoDB, Redis, Email, etc.)
npm run dev
```

4. **Setup Frontend** (in a new terminal)
```bash
cd Frontend
npm install
npm run dev
```

5. **Access the application**
- Frontend: http://localhost:3000
- Backend API: http://localhost:5000

For detailed setup instructions, see [SETUP_GUIDE.md](./SETUP_GUIDE.md)

## 📁 Project Structure

```
kmit-clubs-hub/
├── Backend/
│   ├── config/              # Configuration files
│   ├── src/
│   │   ├── middlewares/     # Express middlewares
│   │   ├── modules/         # Feature modules
│   │   │   ├── auth/        # Authentication
│   │   │   ├── club/        # Club management
│   │   │   ├── event/       # Event management
│   │   │   ├── recruitment/ # Recruitment system
│   │   │   ├── user/        # User management
│   │   │   └── ...
│   │   ├── queues/          # Background job queues
│   │   ├── utils/           # Utility functions
│   │   ├── workers/         # Queue workers
│   │   ├── app.js           # Express app
│   │   └── server.js        # Server entry point
│   └── package.json
│
├── Frontend/
│   ├── src/
│   │   ├── components/      # Reusable components
│   │   ├── context/         # React contexts
│   │   ├── pages/           # Page components
│   │   │   ├── auth/        # Auth pages
│   │   │   ├── clubs/       # Club pages
│   │   │   ├── dashboards/  # Dashboards
│   │   │   ├── events/      # Event pages
│   │   │   ├── recruitments/# Recruitment pages
│   │   │   └── user/        # User pages
│   │   ├── services/        # API services
│   │   ├── styles/          # CSS files
│   │   ├── App.jsx          # Main app
│   │   └── main.jsx         # Entry point
│   └── package.json
│
├── SETUP_GUIDE.md           # Detailed setup guide
└── README.md                # This file
```

## 📚 Documentation

- [Setup Guide](./SETUP_GUIDE.md) - Complete installation and configuration
- [Redis Setup](./REDIS_SETUP.md) - Redis installation for Windows users
- [Backend README](./Backend/README.md) - Backend API documentation
- [Frontend README](./Frontend/README.md) - Frontend documentation
- [API Documentation](./Backend/docs/) - Detailed API endpoints

## 🎨 Key Pages

### Public Pages
- **Homepage**: Landing page with featured clubs and events
- **Login/Register**: Authentication pages with OTP verification
- **Password Reset**: Secure password recovery

### Student Dashboard
- Overview of clubs, events, and recruitments
- Quick actions for common tasks
- Personalized recommendations

### Admin Dashboard
- System-wide statistics
- User management
- Club and event approvals
- System configuration

### Coordinator Dashboard
- Assigned clubs overview
- Pending event approvals
- Club activity monitoring

### Club Pages
- Club directory with filtering
- Detailed club profiles
- Member management
- Activity timeline

### Recruitment Pages
- Open recruitments listing
- Application submission
- Application review interface
- Bulk actions for reviewers

### Event Pages
- Event calendar and listings
- Event details with RSVP
- Event creation and management
- Attendance tracking

## 🔒 Security Features

- Password hashing with bcrypt
- JWT token-based authentication
- Refresh token rotation
- Rate limiting on sensitive endpoints
- Input validation and sanitization
- XSS and CSRF protection
- Secure file upload handling
- Audit logging for sensitive operations

## 🌟 Highlights

- **Responsive Design**: Works seamlessly on desktop, tablet, and mobile
- **Real-time Updates**: Instant notifications and status updates
- **Scalable Architecture**: Modular design for easy feature additions
- **Role-Based Access**: Granular permissions for different user types
- **Comprehensive Workflow**: Complete lifecycle management for clubs, events, and recruitments
- **Analytics Ready**: Built-in reporting and analytics capabilities

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👥 Authors

- **Development Team** - Initial work

## 🙏 Acknowledgments

- KMIT for the opportunity to build this system
- All contributors who helped shape this project
- Open source community for amazing tools and libraries

## 📧 Contact

For questions or support, please contact:
- Email: support@kmitclubs.com
- Website: https://kmitclubs.com

---

Made with ❤️ for KMIT Students
