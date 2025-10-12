# KMIT Clubs Hub - Frontend

Modern React-based frontend for the KMIT Clubs Hub management system.

## Features

- **User Authentication**: Complete registration, login, OTP verification, and password reset flows
- **Role-Based Dashboards**: Separate dashboards for Students, Coordinators, and Admins
- **Club Management**: Browse, create, and manage clubs with detailed views
- **Recruitment System**: Apply to clubs, manage applications, and review candidates
- **Event Management**: Create, browse, and RSVP to club events
- **Real-time Notifications**: Stay updated with in-app notifications
- **Profile Management**: Update personal information and change passwords
- **Responsive Design**: Works seamlessly on desktop, tablet, and mobile devices

## Tech Stack

- **React 18** - UI library
- **React Router 6** - Client-side routing
- **Axios** - HTTP client with interceptors
- **Vite** - Fast build tool and dev server
- **CSS3** - Custom styling with CSS variables

## Prerequisites

- Node.js 16+ and npm
- Backend server running on `http://localhost:5000`

## Installation

1. Navigate to the Frontend directory:
```bash
cd Frontend
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file (optional):
```bash
VITE_API_URL=http://localhost:5000/api
```

4. Start the development server:
```bash
npm run dev
```

The application will be available at `http://localhost:3000`

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build

## Project Structure

```
Frontend/
├── public/              # Static assets
├── src/
│   ├── components/      # Reusable components
│   │   ├── Layout.jsx
│   │   └── ProtectedRoute.jsx
│   ├── context/         # React context providers
│   │   └── AuthContext.jsx
│   ├── pages/           # Page components
│   │   ├── auth/        # Authentication pages
│   │   ├── clubs/       # Club pages
│   │   ├── dashboards/  # Dashboard pages
│   │   ├── events/      # Event pages
│   │   ├── public/      # Public pages
│   │   ├── recruitments/# Recruitment pages
│   │   └── user/        # User profile pages
│   ├── services/        # API service layer
│   │   ├── api.js
│   │   ├── authService.js
│   │   ├── clubService.js
│   │   ├── eventService.js
│   │   ├── notificationService.js
│   │   ├── recruitmentService.js
│   │   └── userService.js
│   ├── styles/          # CSS files
│   ├── App.jsx          # Main app component
│   └── main.jsx         # Entry point
├── index.html
├── package.json
└── vite.config.js
```

## Key Features Implementation

### Authentication Flow
1. **Registration**: Roll number validation, email verification with OTP
2. **Login**: Email/Roll number login with JWT tokens
3. **Password Reset**: OTP-based password recovery

### Role-Based Access
- **Student**: View clubs, apply to recruitments, RSVP to events
- **Coordinator**: Approve events, manage assigned clubs
- **Admin**: Full system access, user management, club creation

### API Integration
- Automatic token refresh on 401 errors
- Request/response interceptors
- Centralized error handling

## Environment Variables

Create a `.env` file in the Frontend directory:

```env
VITE_API_URL=http://localhost:5000/api
```

## Building for Production

```bash
npm run build
```

The build output will be in the `dist/` directory.

## Deployment

The built files can be deployed to any static hosting service:
- Vercel
- Netlify
- GitHub Pages
- AWS S3 + CloudFront

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## Contributing

1. Follow the existing code structure
2. Use meaningful component and variable names
3. Keep components small and focused
4. Write clean, maintainable CSS
5. Test on multiple screen sizes

## License

MIT License - see LICENSE file for details
