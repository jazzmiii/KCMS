import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import notificationService from '../../services/notificationService';

/**
 * Create Notification Page (Admin Only)
 * Backend Gap Implementation - Admin notification creation
 */
const CreateNotificationPage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const [formData, setFormData] = useState({
    type: 'system',
    priority: 'MEDIUM',
    title: '',
    message: '',
    targetUsers: 'all', // 'all', 'students', 'coordinators', 'admins', 'specific'
    specificUsers: '',
    link: '',
    expiresAt: ''
  });

  const notificationTypes = [
    { value: 'system', label: 'System', icon: '🔔' },
    { value: 'announcement', label: 'Announcement', icon: '⚠️' },
    { value: 'event', label: 'Event', icon: '📅' },
    { value: 'recruitment', label: 'Recruitment', icon: '👥' }
  ];

  const priorities = [
    { value: 'LOW', label: 'Low', color: 'bg-gray-100 text-gray-800' },
    { value: 'MEDIUM', label: 'Medium', color: 'bg-blue-100 text-blue-800' },
    { value: 'HIGH', label: 'High', color: 'bg-orange-100 text-orange-800' },
    { value: 'URGENT', label: 'Urgent', color: 'bg-red-100 text-red-800' }
  ];

  const targetAudiences = [
    { value: 'all', label: 'All Users' },
    { value: 'students', label: 'All Students' },
    { value: 'coordinators', label: 'All Coordinators' },
    { value: 'admins', label: 'All Admins' },
    { value: 'specific', label: 'Specific Users' }
  ];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.title || !formData.message) {
      setError('Title and message are required');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Prepare data based on target audience
      const notificationData = {
        type: formData.type,
        priority: formData.priority,
        title: formData.title,
        message: formData.message,
        link: formData.link || undefined,
        expiresAt: formData.expiresAt || undefined
      };

      // Add target users if specific
      if (formData.targetUsers === 'specific' && formData.specificUsers) {
        notificationData.targetUsers = formData.specificUsers
          .split(',')
          .map(id => id.trim())
          .filter(id => id);
      } else {
        // For role-based targeting, backend will handle
        notificationData.targetRole = formData.targetUsers;
      }

      await notificationService.createNotification(notificationData);
      
      setSuccess(true);
      
      // Reset form after success
      setTimeout(() => {
        navigate('/admin/notifications');
      }, 2000);

    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create notification');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-4xl">📤</span>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Notification Sent!
          </h2>
          <p className="text-gray-600 mb-6">
            The notification has been created and sent to targeted users.
          </p>
          <p className="text-sm text-gray-500">
            Redirecting...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate(-1)}
            className="text-blue-600 hover:text-blue-700 mb-4 flex items-center"
          >
            ← Back
          </button>
          <h1 className="text-3xl font-bold text-gray-900">
            Create System Notification
          </h1>
          <p className="text-gray-600 mt-2">
            Send notifications to users across the system
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-lg p-6 space-y-6">
          {/* Notification Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Notification Type
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {notificationTypes.map((type) => (
                <button
                  key={type.value}
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, type: type.value }))}
                  className={`p-3 border-2 rounded-lg flex flex-col items-center justify-center transition-colors ${
                    formData.type === type.value
                      ? 'border-blue-600 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <span className="text-2xl mb-1">{type.icon}</span>
                  <span className="text-sm font-medium">{type.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Priority */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Priority
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {priorities.map((priority) => (
                <button
                  key={priority.value}
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, priority: priority.value }))}
                  className={`p-3 border-2 rounded-lg font-medium transition-colors ${
                    formData.priority === priority.value
                      ? 'border-blue-600 ' + priority.color
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  {priority.label}
                </button>
              ))}
            </div>
            <p className="text-xs text-gray-500 mt-2">
              URGENT notifications cannot be unsubscribed from
            </p>
          </div>

          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Title *
            </label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              required
              placeholder="Enter notification title"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Message */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Message *
            </label>
            <textarea
              name="message"
              value={formData.message}
              onChange={handleChange}
              required
              rows="4"
              placeholder="Enter notification message"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Target Audience */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Target Audience
            </label>
            <select
              name="targetUsers"
              value={formData.targetUsers}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {targetAudiences.map((audience) => (
                <option key={audience.value} value={audience.value}>
                  {audience.label}
                </option>
              ))}
            </select>
          </div>

          {/* Specific Users (if selected) */}
          {formData.targetUsers === 'specific' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                User IDs (comma-separated)
              </label>
              <input
                type="text"
                name="specificUsers"
                value={formData.specificUsers}
                onChange={handleChange}
                placeholder="e.g., 507f1f77bcf86cd799439011, 507f191e810c19729de860ea"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <p className="text-xs text-gray-500 mt-1">
                Enter MongoDB ObjectIds separated by commas
              </p>
            </div>
          )}

          {/* Link (Optional) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Action Link (Optional)
            </label>
            <input
              type="text"
              name="link"
              value={formData.link}
              onChange={handleChange}
              placeholder="/events/123 or https://example.com"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <p className="text-xs text-gray-500 mt-1">
              Users will be redirected to this URL when clicking the notification
            </p>
          </div>

          {/* Expiration (Optional) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Expires At (Optional)
            </label>
            <input
              type="datetime-local"
              name="expiresAt"
              value={formData.expiresAt}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <p className="text-xs text-gray-500 mt-1">
              Notification will be automatically removed after this date
            </p>
          </div>

          {/* Submit Button */}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  Sending...
                </>
              ) : (
                <>
                  <span className="mr-2">📤</span>
                  Send Notification
                </>
              )}
            </button>
          </div>
        </form>

        {/* Info Box */}
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start">
            <span className="text-xl mr-3">🔔</span>
            <div className="text-sm text-blue-800">
              <p className="font-medium mb-1">About System Notifications</p>
              <ul className="list-disc list-inside space-y-1">
                <li>Notifications are sent immediately to all targeted users</li>
                <li>Users will receive in-app and email notifications</li>
                <li>URGENT notifications cannot be unsubscribed from</li>
                <li>Non-URGENT notifications respect user preferences</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateNotificationPage;
