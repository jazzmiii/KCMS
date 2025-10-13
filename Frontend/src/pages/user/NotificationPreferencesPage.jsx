import React, { useState, useEffect } from 'react';
import Layout from '../../components/Layout';
import userService from '../../services/userService';
import '../../styles/Profile.css';

const NotificationPreferencesPage = () => {
  const [preferences, setPreferences] = useState({
    email: {
      enabled: true,
      types: {
        recruitment_open: true,
        recruitment_closing: true,
        application_status: true,
        event_reminder: true,
        approval_required: true,
        role_assigned: true,
        system_maintenance: true,
        budget_approved: true,
        budget_rejected: true,
      }
    },
    inApp: {
      enabled: true,
      types: {
        recruitment_open: true,
        recruitment_closing: true,
        application_status: true,
        event_reminder: true,
        approval_required: true,
        role_assigned: true,
        system_maintenance: true,
        budget_approved: true,
        budget_rejected: true,
      }
    },
    digest: {
      enabled: false,
      frequency: 'daily', // daily, weekly
      time: '08:00'
    }
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const notificationTypes = [
    { key: 'recruitment_open', label: 'New Recruitments', description: 'When a new recruitment opens' },
    { key: 'recruitment_closing', label: 'Recruitment Closing', description: 'Reminders before recruitment closes' },
    { key: 'application_status', label: 'Application Updates', description: 'Your application status changes' },
    { key: 'event_reminder', label: 'Event Reminders', description: 'Upcoming events you registered for' },
    { key: 'approval_required', label: 'Approval Requests', description: 'Items requiring your approval' },
    { key: 'role_assigned', label: 'Role Changes', description: 'When your roles are updated' },
    { key: 'system_maintenance', label: 'System Alerts', description: 'System maintenance and updates' },
    { key: 'budget_approved', label: 'Budget Approvals', description: 'Budget requests approved' },
    { key: 'budget_rejected', label: 'Budget Rejections', description: 'Budget requests rejected' },
  ];

  const handleToggleChannel = (channel) => {
    setPreferences({
      ...preferences,
      [channel]: {
        ...preferences[channel],
        enabled: !preferences[channel].enabled
      }
    });
  };

  const handleToggleType = (channel, type) => {
    setPreferences({
      ...preferences,
      [channel]: {
        ...preferences[channel],
        types: {
          ...preferences[channel].types,
          [type]: !preferences[channel].types[type]
        }
      }
    });
  };

  const handleToggleDigest = () => {
    setPreferences({
      ...preferences,
      digest: {
        ...preferences.digest,
        enabled: !preferences.digest.enabled
      }
    });
  };

  const handleDigestChange = (field, value) => {
    setPreferences({
      ...preferences,
      digest: {
        ...preferences.digest,
        [field]: value
      }
    });
  };

  const handleSave = async () => {
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      await userService.updatePreferences(preferences);
      setSuccess('Preferences saved successfully!');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save preferences');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="profile-page">
        <div className="profile-header">
          <h1>Notification Preferences</h1>
          <p>Manage how you receive notifications</p>
        </div>

        {error && <div className="alert alert-error">{error}</div>}
        {success && <div className="alert alert-success">{success}</div>}

        <div className="profile-content">
          {/* Email Notifications */}
          <div className="profile-card">
            <div className="preference-header">
              <h3>📧 Email Notifications</h3>
              <label className="switch">
                <input
                  type="checkbox"
                  checked={preferences.email.enabled}
                  onChange={() => handleToggleChannel('email')}
                />
                <span className="slider"></span>
              </label>
            </div>

            {preferences.email.enabled && (
              <div className="notification-types">
                {notificationTypes.map((type) => (
                  <div key={type.key} className="notification-type-item">
                    <div className="type-info">
                      <strong>{type.label}</strong>
                      <p>{type.description}</p>
                    </div>
                    <label className="switch">
                      <input
                        type="checkbox"
                        checked={preferences.email.types[type.key]}
                        onChange={() => handleToggleType('email', type.key)}
                      />
                      <span className="slider"></span>
                    </label>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* In-App Notifications */}
          <div className="profile-card">
            <div className="preference-header">
              <h3>🔔 In-App Notifications</h3>
              <label className="switch">
                <input
                  type="checkbox"
                  checked={preferences.inApp.enabled}
                  onChange={() => handleToggleChannel('inApp')}
                />
                <span className="slider"></span>
              </label>
            </div>

            {preferences.inApp.enabled && (
              <div className="notification-types">
                {notificationTypes.map((type) => (
                  <div key={type.key} className="notification-type-item">
                    <div className="type-info">
                      <strong>{type.label}</strong>
                      <p>{type.description}</p>
                    </div>
                    <label className="switch">
                      <input
                        type="checkbox"
                        checked={preferences.inApp.types[type.key]}
                        onChange={() => handleToggleType('inApp', type.key)}
                      />
                      <span className="slider"></span>
                    </label>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Digest Settings */}
          <div className="profile-card">
            <div className="preference-header">
              <h3>📅 Daily/Weekly Digest</h3>
              <label className="switch">
                <input
                  type="checkbox"
                  checked={preferences.digest.enabled}
                  onChange={handleToggleDigest}
                />
                <span className="slider"></span>
              </label>
            </div>

            {preferences.digest.enabled && (
              <div className="digest-settings">
                <div className="form-group">
                  <label>Frequency</label>
                  <select
                    value={preferences.digest.frequency}
                    onChange={(e) => handleDigestChange('frequency', e.target.value)}
                  >
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Preferred Time</label>
                  <input
                    type="time"
                    value={preferences.digest.time}
                    onChange={(e) => handleDigestChange('time', e.target.value)}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Save Button */}
          <div className="profile-actions">
            <button
              onClick={handleSave}
              className="btn btn-primary"
              disabled={loading}
            >
              {loading ? 'Saving...' : 'Save Preferences'}
            </button>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default NotificationPreferencesPage;
