import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';

// Public Pages
import HomePage from './pages/public/HomePage';
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import VerifyOtpPage from './pages/auth/VerifyOtpPage';
import CompleteProfilePage from './pages/auth/CompleteProfilePage';
import ForgotPasswordPage from './pages/auth/ForgotPasswordPage';
import ResetPasswordPage from './pages/auth/ResetPasswordPage';

// Protected Pages
import StudentDashboard from './pages/dashboards/StudentDashboard';
import AdminDashboard from './pages/dashboards/AdminDashboard';
import CoordinatorDashboard from './pages/dashboards/CoordinatorDashboard';
import CoreDashboard from './pages/dashboards/CoreDashboard';

// Club Pages
import ClubsPage from './pages/clubs/ClubsPage';
import ClubDetailPage from './pages/clubs/ClubDetailPage';
import ClubDashboard from './pages/clubs/ClubDashboard';
import CreateClubPage from './pages/clubs/CreateClubPage';
import EditClubPage from './pages/clubs/EditClubPage';

// Recruitment Pages
import RecruitmentsPage from './pages/recruitments/RecruitmentsPage';
import RecruitmentDetailPage from './pages/recruitments/RecruitmentDetailPage';
import CreateRecruitmentPage from './pages/recruitments/CreateRecruitmentPage';
import ApplicationsPage from './pages/recruitments/ApplicationsPage';

// Event Pages
import EventsPage from './pages/events/EventsPage';
import EventDetailPage from './pages/events/EventDetailPage';
import CreateEventPage from './pages/events/CreateEventPage';

// User Pages
import ProfilePage from './pages/user/ProfilePage';
import UsersManagementPage from './pages/user/UsersManagementPage';
import SessionsPage from './pages/user/SessionsPage';
import NotificationPreferencesPage from './pages/user/NotificationPreferencesPage';

// Notification Pages
import NotificationsPage from './pages/notifications/NotificationsPage';

// Admin Pages
import MaintenanceModePage from './pages/admin/MaintenanceModePage';

// Reports Pages
import ReportsPage from './pages/reports/ReportsPage';

// Media Pages
import GalleryPage from './pages/media/GalleryPage';

// Search Pages
import SearchPage from './pages/search/SearchPage';

// Components
import ProtectedRoute from './components/ProtectedRoute';
import NotFound from './pages/NotFound';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/verify-otp" element={<VerifyOtpPage />} />
          <Route path="/complete-profile" element={<CompleteProfilePage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />

          {/* Protected Routes - Dashboards */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <StudentDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/dashboard"
            element={
              <ProtectedRoute requiredRole="admin">
                <AdminDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/coordinator/dashboard"
            element={
              <ProtectedRoute requiredRole="coordinator">
                <CoordinatorDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/core/dashboard"
            element={
              <ProtectedRoute>
                <CoreDashboard />
              </ProtectedRoute>
            }
          />

          {/* Club Routes */}
          <Route
            path="/clubs"
            element={
              <ProtectedRoute>
                <ClubsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/clubs/:clubId"
            element={
              <ProtectedRoute>
                <ClubDetailPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/clubs/:clubId/dashboard"
            element={
              <ProtectedRoute>
                <ClubDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/clubs/create"
            element={
              <ProtectedRoute requiredRole="admin">
                <CreateClubPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/clubs/:clubId/edit"
            element={
              <ProtectedRoute>
                <EditClubPage />
              </ProtectedRoute>
            }
          />

          {/* Recruitment Routes */}
          <Route
            path="/recruitments"
            element={
              <ProtectedRoute>
                <RecruitmentsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/recruitments/:id"
            element={
              <ProtectedRoute>
                <RecruitmentDetailPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/recruitments/create"
            element={
              <ProtectedRoute>
                <CreateRecruitmentPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/recruitments/:id/applications"
            element={
              <ProtectedRoute>
                <ApplicationsPage />
              </ProtectedRoute>
            }
          />

          {/* Event Routes */}
          <Route
            path="/events"
            element={
              <ProtectedRoute>
                <EventsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/events/:id"
            element={
              <ProtectedRoute>
                <EventDetailPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/events/create"
            element={
              <ProtectedRoute>
                <CreateEventPage />
              </ProtectedRoute>
            }
          />

          {/* User Routes */}
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <ProfilePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile/sessions"
            element={
              <ProtectedRoute>
                <SessionsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile/preferences"
            element={
              <ProtectedRoute>
                <NotificationPreferencesPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/users"
            element={
              <ProtectedRoute requiredRole="admin">
                <UsersManagementPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/system"
            element={
              <ProtectedRoute requiredRole="admin">
                <MaintenanceModePage />
              </ProtectedRoute>
            }
          />

          {/* Notification Routes */}
          <Route
            path="/notifications"
            element={
              <ProtectedRoute>
                <NotificationsPage />
              </ProtectedRoute>
            }
          />

          {/* Reports Routes */}
          <Route
            path="/reports"
            element={
              <ProtectedRoute>
                <ReportsPage />
              </ProtectedRoute>
            }
          />

          {/* Media/Gallery Routes */}
          <Route
            path="/gallery"
            element={
              <ProtectedRoute>
                <GalleryPage />
              </ProtectedRoute>
            }
          />

          {/* Search Routes */}
          <Route
            path="/search"
            element={
              <ProtectedRoute>
                <SearchPage />
              </ProtectedRoute>
            }
          />

          {/* 404 */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
