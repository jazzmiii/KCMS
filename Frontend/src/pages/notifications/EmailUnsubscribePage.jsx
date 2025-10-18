import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import notificationService from '../../services/notificationService';

/**
 * Email Unsubscribe Page
 * Handles email unsubscribe preferences via token from email links
 * Backend Gap Implementation - Workplan Line 368
 */
const EmailUnsubscribePage = () => {
  const { token } = useParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [preferences, setPreferences] = useState(null);
  const [userEmail, setUserEmail] = useState('');

  // Notification type display names
  const notificationTypes = {
    recruitment_open: {
      label: 'Recruitment Open',
      description: 'Notifications when new club recruitments are open'
    },
    recruitment_closing: {
      label: 'Recruitment Closing',
      description: 'Reminders when recruitments are about to close'
    },
    application_status: {
      label: 'Application Status',
      description: 'Updates about your recruitment applications'
    },
    event_reminder: {
      label: 'Event Reminders',
      description: 'Reminders for events you\'ve RSVP\'d to'
    },
    role_assigned: {
      label: 'Role Assignments',
      description: 'Notifications when you\'re assigned a new role'
    }
  };

  // Load preferences on mount
  useEffect(() => {
    loadPreferences();
  }, [token]);

  const loadPreferences = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await notificationService.getUnsubscribePreferences(token);
      setPreferences(response.data.preferences);
      setUserEmail(response.data.email);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load preferences. Invalid or expired link.');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleType = async (type) => {
    try {
      setError(null);
      setSuccess(null);
      
      const isCurrentlyUnsubscribed = preferences[type] === false;
      
      if (isCurrentlyUnsubscribed) {
        // Resubscribe
        await notificationService.resubscribe(token, type);
        setPreferences(prev => ({ ...prev, [type]: true }));
        setSuccess(`Resubscribed to ${notificationTypes[type].label}`);
      } else {
        // Unsubscribe
        await notificationService.unsubscribeFromType(token, type);
        setPreferences(prev => ({ ...prev, [type]: false }));
        setSuccess(`Unsubscribed from ${notificationTypes[type].label}`);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update preference');
    }
  };

  const handleUnsubscribeAll = async () => {
    if (!window.confirm('Are you sure you want to unsubscribe from all non-urgent notifications?')) {
      return;
    }

    try {
      setError(null);
      setSuccess(null);
      await notificationService.unsubscribeAll(token);
      
      // Update all preferences to false (except those that can't be unsubscribed)
      const updatedPrefs = { ...preferences };
      Object.keys(notificationTypes).forEach(type => {
        updatedPrefs[type] = false;
      });
      setPreferences(updatedPrefs);
      setSuccess('Successfully unsubscribed from all non-urgent notifications');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to unsubscribe from all');
    }
  };

  const handleResubscribeAll = async () => {
    try {
      setError(null);
      setSuccess(null);
      
      // Resubscribe to all types
      const promises = Object.keys(notificationTypes).map(type => 
        notificationService.resubscribe(token, type)
      );
      
      await Promise.all(promises);
      
      // Update all preferences to true
      const updatedPrefs = { ...preferences };
      Object.keys(notificationTypes).forEach(type => {
        updatedPrefs[type] = true;
      });
      setPreferences(updatedPrefs);
      setSuccess('Successfully resubscribed to all notifications');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to resubscribe to all');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading preferences...</p>
        </div>
      </div>
    );
  }

  if (error && !preferences) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
          <span className="text-6xl mx-auto mb-4 block">❌</span>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Invalid Link</h1>
          <p className="text-gray-600 mb-6">{error}</p>
          <p className="text-sm text-gray-500">
            This unsubscribe link may have expired or is invalid. 
            Please use the latest unsubscribe link from your email.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="bg-blue-100 p-4 rounded-full">
              <span className="text-5xl">📧</span>
            </div>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Email Preferences
          </h1>
          <p className="text-gray-600">
            Manage your KMIT Clubs Hub email notifications
          </p>
          {userEmail && (
            <p className="text-sm text-gray-500 mt-2">
              {userEmail}
            </p>
          )}
        </div>

        {/* Success Message */}
        {success && (
          <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4 flex items-start">
            <span className="text-xl text-green-600 mr-3 flex-shrink-0">✅</span>
            <div>
              <p className="text-green-800 font-medium">{success}</p>
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 flex items-start">
            <span className="text-xl text-red-600 mr-3 flex-shrink-0">⚠️</span>
            <div>
              <p className="text-red-800 font-medium">{error}</p>
            </div>
          </div>
        )}

        {/* Preferences Card */}
        <div className="bg-white rounded-lg shadow-lg overflow-hidden mb-6">
          <div className="bg-blue-600 px-6 py-4">
            <div className="flex items-center text-white">
              <span className="text-xl mr-2">⚙️</span>
              <h2 className="text-xl font-semibold">Notification Preferences</h2>
            </div>
            <p className="text-blue-100 text-sm mt-1">
              Choose which email notifications you want to receive
            </p>
          </div>

          <div className="p-6">
            <div className="space-y-4">
              {Object.entries(notificationTypes).map(([type, info]) => (
                <div
                  key={type}
                  className="flex items-start justify-between p-4 border border-gray-200 rounded-lg hover:border-gray-300 transition-colors"
                >
                  <div className="flex-1">
                    <h3 className="font-medium text-gray-900">{info.label}</h3>
                    <p className="text-sm text-gray-600 mt-1">{info.description}</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer ml-4">
                    <input
                      type="checkbox"
                      checked={preferences[type] !== false}
                      onChange={() => handleToggleType(type)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>
              ))}
            </div>

            {/* Important Notice */}
            <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-start">
                <span className="text-xl text-yellow-600 mr-3 flex-shrink-0">⚠️</span>
                <div className="text-sm text-yellow-800">
                  <p className="font-medium mb-1">Important Notice</p>
                  <p>
                    Some notifications marked as "URGENT" (such as critical system updates 
                    or important account notifications) cannot be unsubscribed from and will 
                    always be sent.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h3 className="font-semibold text-gray-900 mb-4">Quick Actions</h3>
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={handleUnsubscribeAll}
              className="flex-1 px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
            >
              Unsubscribe from All
            </button>
            <button
              onClick={handleResubscribeAll}
              className="flex-1 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
            >
              Resubscribe to All
            </button>
          </div>
          <p className="text-xs text-gray-500 mt-3 text-center">
            Changes are saved automatically
          </p>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center text-sm text-gray-500">
          <p>
            You're receiving emails because you're a member of KMIT Clubs Hub.
          </p>
          <p className="mt-2">
            If you have any questions, please contact the administrator.
          </p>
        </div>
      </div>
    </div>
  );
};

export default EmailUnsubscribePage;
