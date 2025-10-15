import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../../components/Layout';
import notificationService from '../../services/notificationService';
import { formatDistanceToNow } from 'date-fns';
import { 
  FaBell, 
  FaCheckCircle, 
  FaExclamationCircle, 
  FaInfoCircle,
  FaCalendarAlt,
  FaUserPlus,
  FaCog,
  FaCheckDouble
} from 'react-icons/fa';
import '../../styles/Notifications.css';

function NotificationsPage() {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('all'); // all, unread, read
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    fetchNotifications();
  }, [filter, page]);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const params = {
        page,
        limit: 20
      };
      
      if (filter === 'unread') {
        params.read = false;
      } else if (filter === 'read') {
        params.read = true;
      }

      const response = await notificationService.list(params);
      setNotifications(response.data.items || []);
      setTotalPages(Math.ceil(response.data.total / 20));
      setError(null);
    } catch (err) {
      console.error('Error fetching notifications:', err);
      setError('Failed to load notifications');
    } finally {
      setLoading(false);
    }
  };

  const handleMarkRead = async (id, currentReadStatus) => {
    try {
      await notificationService.markRead(id, !currentReadStatus);
      // Update local state - use isRead to match backend
      setNotifications(notifications.map(n => 
        n._id === id ? { ...n, isRead: !currentReadStatus, read: !currentReadStatus } : n
      ));
    } catch (err) {
      console.error('Error marking notification:', err);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await notificationService.markAllRead();
      setNotifications(notifications.map(n => ({ ...n, isRead: true, read: true })));
    } catch (err) {
      console.error('Error marking all read:', err);
    }
  };

  const handleNotificationClick = (notification) => {
    // Mark as read - check both isRead and read for compatibility
    if (!notification.isRead && !notification.read) {
      handleMarkRead(notification._id, false);
    }

    // Navigate based on notification type
    const payload = notification.payload || {};
    switch (notification.type) {
      case 'recruitment_open':
        if (payload.recruitmentId) {
          navigate(`/recruitments/${payload.recruitmentId}`);
        }
        break;
      case 'recruitment_closing':
        if (payload.recruitmentId) {
          navigate(`/recruitments/${payload.recruitmentId}`);
        }
        break;
      case 'application_status':
        if (payload.applicationId) {
          navigate('/profile'); // Or specific application page
        }
        break;
      case 'event_reminder':
        if (payload.eventId) {
          navigate(`/events/${payload.eventId}`);
        }
        break;
      case 'approval_required':
        // Navigate to the specific event that needs approval
        if (payload.eventId) {
          navigate(`/events/${payload.eventId}`);
        } else {
          // Fallback to dashboard
          navigate('/dashboard');
        }
        break;
      case 'role_assigned':
        navigate('/profile');
        break;
      default:
        break;
    }
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'recruitment_open':
      case 'recruitment_closing':
        return <FaUserPlus className="notification-icon recruitment" />;
      case 'application_status':
        return <FaCheckCircle className="notification-icon success" />;
      case 'event_reminder':
        return <FaCalendarAlt className="notification-icon event" />;
      case 'approval_required':
        return <FaExclamationCircle className="notification-icon warning" />;
      case 'role_assigned':
        return <FaUserPlus className="notification-icon info" />;
      case 'system_maintenance':
        return <FaCog className="notification-icon system" />;
      default:
        return <FaInfoCircle className="notification-icon default" />;
    }
  };

  const getPriorityClass = (priority) => {
    switch (priority) {
      case 'URGENT':
        return 'priority-urgent';
      case 'HIGH':
        return 'priority-high';
      case 'MEDIUM':
        return 'priority-medium';
      case 'LOW':
        return 'priority-low';
      default:
        return '';
    }
  };

  const unreadCount = notifications.filter(n => !n.isRead && !n.read).length;

  return (
    <Layout>
      <div className="notifications-page">
        <div className="notifications-header">
          <div className="header-left">
            <FaBell className="page-icon" />
            <h1>Notifications</h1>
            {unreadCount > 0 && (
              <span className="unread-badge">{unreadCount}</span>
            )}
          </div>
          <button 
            className="btn btn-secondary"
            onClick={handleMarkAllRead}
            disabled={unreadCount === 0}
          >
            <FaCheckDouble /> Mark All as Read
          </button>
        </div>

        <div className="notifications-filters">
          <button 
            className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
            onClick={() => { setFilter('all'); setPage(1); }}
          >
            All
          </button>
          <button 
            className={`filter-btn ${filter === 'unread' ? 'active' : ''}`}
            onClick={() => { setFilter('unread'); setPage(1); }}
          >
            Unread ({unreadCount})
          </button>
          <button 
            className={`filter-btn ${filter === 'read' ? 'active' : ''}`}
            onClick={() => { setFilter('read'); setPage(1); }}
          >
            Read
          </button>
        </div>

        {loading && page === 1 ? (
          <div className="loading">Loading notifications...</div>
        ) : error ? (
          <div className="error-message">{error}</div>
        ) : notifications.length === 0 ? (
          <div className="empty-state">
            <FaBell className="empty-icon" />
            <h3>No Notifications</h3>
            <p>You're all caught up!</p>
          </div>
        ) : (
          <>
            <div className="notifications-list">
              {notifications.map(notification => {
                const isRead = notification.isRead || notification.read;
                return (
                  <div 
                    key={notification._id}
                    className={`notification-item ${!isRead ? 'unread' : ''} ${getPriorityClass(notification.priority)}`}
                    onClick={() => handleNotificationClick(notification)}
                  >
                    <div className="notification-icon-wrapper">
                      {getNotificationIcon(notification.type)}
                    </div>
                    
                    <div className="notification-content">
                      <div className="notification-header">
                        <h4>{notification.title || getDefaultTitle(notification.type)}</h4>
                        <span className="notification-time">
                          {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                        </span>
                      </div>
                      
                      <p className="notification-message">
                        {notification.message || getDefaultMessage(notification)}
                      </p>

                      {notification.priority === 'URGENT' && (
                        <span className="priority-badge urgent">URGENT</span>
                      )}
                      {notification.priority === 'HIGH' && (
                        <span className="priority-badge high">HIGH</span>
                      )}
                    </div>

                    <button 
                      className="mark-read-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleMarkRead(notification._id, isRead);
                      }}
                      title={isRead ? 'Mark as unread' : 'Mark as read'}
                    >
                      {isRead ? '○' : '●'}
                    </button>
                  </div>
                );
              })}
            </div>

            {totalPages > 1 && (
              <div className="pagination">
                <button 
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="btn btn-secondary"
                >
                  Previous
                </button>
                <span className="page-info">Page {page} of {totalPages}</span>
                <button 
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="btn btn-secondary"
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </Layout>
  );
}

function getDefaultTitle(type) {
  const titles = {
    recruitment_open: 'New Recruitment Open',
    recruitment_closing: 'Recruitment Closing Soon',
    application_status: 'Application Update',
    event_reminder: 'Upcoming Event',
    approval_required: 'Approval Required',
    role_assigned: 'New Role Assigned',
    system_maintenance: 'System Maintenance'
  };
  return titles[type] || 'Notification';
}

function getDefaultMessage(notification) {
  const { type, payload = {} } = notification;
  
  switch (type) {
    case 'recruitment_open':
      return `${payload.title || 'A recruitment'} is now open for applications.`;
    case 'recruitment_closing':
      return `${payload.title || 'A recruitment'} is closing in ${payload.hoursLeft || 24} hours.`;
    case 'application_status':
      return `Your application status has been updated to: ${payload.status || 'pending'}`;
    case 'event_reminder':
      return `${payload.title || 'An event'} is coming up soon!`;
    case 'approval_required':
      return `${payload.title || 'An item'} requires your approval.`;
    case 'role_assigned':
      return `You have been assigned a new role.`;
    case 'system_maintenance':
      return 'System maintenance is scheduled.';
    default:
      return 'You have a new notification.';
  }
}

export default NotificationsPage;
