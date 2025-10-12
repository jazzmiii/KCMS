import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import notificationService from '../services/notificationService';
import ClubSwitcher from './ClubSwitcher';
import '../styles/Layout.css';

const Layout = ({ children }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [unreadCount, setUnreadCount] = useState(0);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 30000); // Poll every 30s
    return () => clearInterval(interval);
  }, []);

  const fetchUnreadCount = async () => {
    try {
      const response = await notificationService.countUnread();
      setUnreadCount(response.data.count || 0);
    } catch (error) {
      console.error('Error fetching unread count:', error);
    }
  };

  const fetchNotifications = async () => {
    try {
      const response = await notificationService.list({ limit: 10 });
      setNotifications(response.data.notifications || []);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  };

  const handleNotificationClick = async () => {
    setShowNotifications(!showNotifications);
    if (!showNotifications) {
      await fetchNotifications();
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const getDashboardLink = () => {
    if (user?.globalRoles?.includes('admin')) return '/admin/dashboard';
    if (user?.globalRoles?.includes('coordinator')) return '/coordinator/dashboard';
    if (user?.clubRoles?.some(cr => cr.roles.includes('core') || cr.roles.includes('president'))) {
      return '/core/dashboard';
    }
    return '/dashboard';
  };

  return (
    <div className="layout">
      <nav className="navbar-dashboard">
        <div className="navbar-content">
          <div className="navbar-left">
            <Link to={getDashboardLink()} className="logo">
              KMIT Clubs Hub
            </Link>
            <div className="nav-links">
              <Link to="/clubs" className="nav-link">Clubs</Link>
              <Link to="/events" className="nav-link">Events</Link>
              <Link to="/recruitments" className="nav-link">Recruitments</Link>
              {user?.globalRoles?.includes('admin') && (
                <Link to="/admin/users" className="nav-link">Users</Link>
              )}
            </div>
          </div>

          <div className="navbar-right">
            {/* Club Switcher - Only show for core members */}
            <ClubSwitcher />

            {/* Notifications */}
            <div className="notification-wrapper">
              <button className="icon-btn" onClick={handleNotificationClick}>
                <span className="icon">🔔</span>
                {unreadCount > 0 && <span className="badge">{unreadCount}</span>}
              </button>

              {showNotifications && (
                <div className="notification-dropdown">
                  <div className="notification-header">
                    <h3>Notifications</h3>
                    <button onClick={() => setShowNotifications(false)}>✕</button>
                  </div>
                  <div className="notification-list">
                    {notifications.length > 0 ? (
                      notifications.map((notif) => (
                        <div key={notif._id} className={`notification-item ${notif.read ? 'read' : 'unread'}`}>
                          <div className="notification-content">
                            <p className="notification-title">{notif.title}</p>
                            <p className="notification-message">{notif.message}</p>
                            <span className="notification-time">
                              {new Date(notif.createdAt).toLocaleString()}
                            </span>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="no-notifications">No notifications</p>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* User Menu */}
            <div className="user-menu-wrapper">
              <button className="user-btn" onClick={() => setShowUserMenu(!showUserMenu)}>
                <span className="user-avatar">{user?.name?.charAt(0) || 'U'}</span>
                <span className="user-name">{user?.name}</span>
              </button>

              {showUserMenu && (
                <div className="user-dropdown">
                  <div className="user-info">
                    <p className="user-name-full">{user?.name}</p>
                    <p className="user-email">{user?.email}</p>
                    <span className="user-role">
                      {user?.globalRoles?.join(', ') || 'Student'}
                    </span>
                  </div>
                  <div className="user-menu-divider"></div>
                  <Link to="/profile" className="user-menu-item" onClick={() => setShowUserMenu(false)}>
                    Profile
                  </Link>
                  <Link to={getDashboardLink()} className="user-menu-item" onClick={() => setShowUserMenu(false)}>
                    Dashboard
                  </Link>
                  <div className="user-menu-divider"></div>
                  <button onClick={handleLogout} className="user-menu-item logout">
                    Logout
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>

      <main className="main-content">{children}</main>

      <footer className="footer-dashboard">
        <p>&copy; 2024 KMIT Clubs Hub. All rights reserved.</p>
      </footer>
    </div>
  );
};

export default Layout;
