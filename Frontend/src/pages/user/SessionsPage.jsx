import React, { useState, useEffect } from 'react';
import Layout from '../../components/Layout';
import userService from '../../services/userService';
import { formatDistanceToNow } from 'date-fns';
import '../../styles/Profile.css';

const SessionsPage = () => {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetchSessions();
  }, []);

  const fetchSessions = async () => {
    try {
      setLoading(true);
      const response = await userService.listSessions();
      setSessions(response.data.sessions || []);
    } catch (err) {
      setError('Failed to load sessions');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleRevokeSession = async (sessionId) => {
    if (!window.confirm('Are you sure you want to revoke this session? You will be logged out on that device.')) {
      return;
    }

    try {
      await userService.revokeSession(sessionId);
      setSuccess('Session revoked successfully');
      fetchSessions();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to revoke session');
    }
  };

  const getDeviceIcon = (userAgent) => {
    if (!userAgent) return '💻';
    if (userAgent.includes('Mobile')) return '📱';
    if (userAgent.includes('Tablet')) return '📱';
    return '💻';
  };

  const getBrowserName = (userAgent) => {
    if (!userAgent) return 'Unknown Browser';
    if (userAgent.includes('Chrome')) return 'Chrome';
    if (userAgent.includes('Firefox')) return 'Firefox';
    if (userAgent.includes('Safari')) return 'Safari';
    if (userAgent.includes('Edge')) return 'Edge';
    return 'Unknown Browser';
  };

  if (loading) {
    return (
      <Layout>
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Loading sessions...</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="profile-page">
        <div className="profile-header">
          <h1>Active Sessions</h1>
          <p>Manage your login sessions across devices</p>
        </div>

        {error && <div className="alert alert-error">{error}</div>}
        {success && <div className="alert alert-success">{success}</div>}

        <div className="profile-content">
          {sessions.length === 0 ? (
            <div className="profile-card">
              <p>No active sessions found</p>
            </div>
          ) : (
            <div className="sessions-list">
              {sessions.map((session) => (
                <div key={session._id} className="profile-card session-item">
                  <div className="session-header">
                    <div className="session-icon">
                      {getDeviceIcon(session.userAgent)}
                    </div>
                    <div className="session-info">
                      <h3>{getBrowserName(session.userAgent)}</h3>
                      <p className="session-device">{session.userAgent || 'Unknown Device'}</p>
                      <p className="session-ip">IP: {session.lastIp || 'Unknown'}</p>
                      <p className="session-time">
                        Last active: {formatDistanceToNow(new Date(session.lastUsed), { addSuffix: true })}
                      </p>
                      <p className="session-created">
                        Created: {new Date(session.createdAt).toLocaleString()}
                      </p>
                      {!session.revokedAt && session.expiresAt && (
                        <p className="session-expires">
                          Expires: {new Date(session.expiresAt).toLocaleString()}
                        </p>
                      )}
                    </div>
                  </div>
                  
                  {session.isCurrent ? (
                    <span className="badge badge-success">Current Session</span>
                  ) : !session.revokedAt ? (
                    <button 
                      onClick={() => handleRevokeSession(session._id)}
                      className="btn btn-danger btn-sm"
                    >
                      Revoke
                    </button>
                  ) : (
                    <span className="badge badge-secondary">Revoked</span>
                  )}
                </div>
              ))}
            </div>
          )}

          <div className="profile-card">
            <h3>⚠️ Security Tips</h3>
            <ul>
              <li>Revoke sessions from devices you no longer use</li>
              <li>If you see suspicious activity, revoke all sessions and change your password</li>
              <li>Sessions expire automatically after 7 days of inactivity</li>
              <li>Use strong passwords and enable two-factor authentication</li>
            </ul>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default SessionsPage;
