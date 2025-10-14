import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import Layout from '../../components/Layout';
import settingsService from '../../services/settingsService';
import '../../styles/Dashboard.css';
import './SystemSettings.css';

const SystemSettings = () => {
  const { user } = useAuth();
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('recruitment');
  const [hasChanges, setHasChanges] = useState(false);
  const [message, setMessage] = useState(null);

  const tabs = [
    { id: 'recruitment', label: 'Recruitment', icon: '📋' },
    { id: 'events', label: 'Events & Budget', icon: '🎉' },
    { id: 'fileUploads', label: 'File Uploads', icon: '📁' },
    { id: 'notifications', label: 'Notifications', icon: '🔔' },
    { id: 'security', label: 'Security', icon: '🔒' },
    { id: 'clubs', label: 'Clubs', icon: '🏢' },
    { id: 'academicYear', label: 'Academic Year', icon: '📅' },
    { id: 'accreditation', label: 'Accreditation', icon: '🏆' }
  ];

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const response = await settingsService.getSettings();
      // Backend: successResponse(res, { settings }) → response.data.settings
      setSettings(response.data.settings);
    } catch (error) {
      console.error('Error fetching settings:', error);
      setMessage({ type: 'error', text: 'Failed to load settings' });
    } finally {
      setLoading(false);
    }
  };

  const updateNestedValue = (obj, path, value) => {
    const keys = path.split('.');
    const lastKey = keys.pop();
    const target = keys.reduce((acc, key) => acc[key], obj);
    target[lastKey] = value;
    return { ...obj };
  };

  const handleChange = (path, value) => {
    setSettings(prev => updateNestedValue({ ...prev }, path, value));
    setHasChanges(true);
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const response = await settingsService.updateSettings(settings);
      // Backend: successResponse(res, { settings }, 'Settings updated successfully')
      setSettings(response.data.settings);
      setHasChanges(false);
      setMessage({ type: 'success', text: response.message || 'Settings updated successfully!' });
      setTimeout(() => setMessage(null), 3000);
    } catch (error) {
      console.error('Error saving settings:', error);
      setMessage({ type: 'error', text: error.response?.data?.message || 'Failed to save settings' });
    } finally {
      setSaving(false);
    }
  };

  const handleReset = async () => {
    if (!window.confirm('Are you sure you want to reset all settings to defaults? This action cannot be undone.')) {
      return;
    }

    try {
      setSaving(true);
      const response = await settingsService.resetToDefaults();
      setSettings(response.data.settings);
      setHasChanges(false);
      setMessage({ type: 'success', text: 'Settings reset to defaults!' });
      setTimeout(() => setMessage(null), 3000);
    } catch (error) {
      console.error('Error resetting settings:', error);
      setMessage({ type: 'error', text: 'Failed to reset settings' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="dashboard">
          <div className="loading">Loading settings...</div>
        </div>
      </Layout>
    );
  }

  if (!settings) {
    return (
      <Layout>
        <div className="dashboard">
          <div className="error">Failed to load settings</div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="dashboard settings-page">
        <div className="dashboard-header">
          <div>
            <h1>⚙️ System Settings</h1>
            <p>Configure global system parameters</p>
          </div>
          <div className="header-actions">
            <button 
              className="btn btn-outline"
              onClick={handleReset}
              disabled={saving}
            >
              Reset to Defaults
            </button>
            <button 
              className="btn btn-primary"
              onClick={handleSave}
              disabled={!hasChanges || saving}
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>

        {message && (
          <div className={`alert alert-${message.type}`}>
            {message.text}
          </div>
        )}

        {hasChanges && (
          <div className="alert alert-warning">
            ⚠️ You have unsaved changes
          </div>
        )}

        <div className="settings-container">
          <div className="settings-tabs">
            {tabs.map(tab => (
              <button
                key={tab.id}
                className={`settings-tab ${activeTab === tab.id ? 'active' : ''}`}
                onClick={() => setActiveTab(tab.id)}
              >
                <span className="tab-icon">{tab.icon}</span>
                <span className="tab-label">{tab.label}</span>
              </button>
            ))}
          </div>

          <div className="settings-content">
            {activeTab === 'recruitment' && (
              <RecruitmentTab settings={settings.recruitment} onChange={handleChange} />
            )}
            {activeTab === 'events' && (
              <EventsTab settings={settings.events} onChange={handleChange} />
            )}
            {activeTab === 'fileUploads' && (
              <FileUploadsTab settings={settings.fileUploads} onChange={handleChange} />
            )}
            {activeTab === 'notifications' && (
              <NotificationsTab settings={settings.notifications} onChange={handleChange} />
            )}
            {activeTab === 'security' && (
              <SecurityTab settings={settings.security} onChange={handleChange} />
            )}
            {activeTab === 'clubs' && (
              <ClubsTab settings={settings.clubs} onChange={handleChange} />
            )}
            {activeTab === 'academicYear' && (
              <AcademicYearTab settings={settings.academicYear} onChange={handleChange} />
            )}
            {activeTab === 'accreditation' && (
              <AccreditationTab settings={settings.accreditation} onChange={handleChange} />
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
};

// Tab Components
const RecruitmentTab = ({ settings, onChange }) => (
  <div className="settings-section">
    <h2>Recruitment Settings</h2>
    <p className="section-description">Configure recruitment windows and application limits</p>

    <div className="form-group">
      <label className="checkbox-label">
        <input
          type="checkbox"
          checked={settings.enabled}
          onChange={(e) => onChange('recruitment.enabled', e.target.checked)}
        />
        <span>Enable Recruitment System</span>
      </label>
    </div>

    <div className="form-row">
      <div className="form-group">
        <label>Start Date</label>
        <input
          type="date"
          value={settings.startDate ? new Date(settings.startDate).toISOString().split('T')[0] : ''}
          onChange={(e) => onChange('recruitment.startDate', e.target.value)}
          className="form-control"
        />
      </div>
      <div className="form-group">
        <label>End Date</label>
        <input
          type="date"
          value={settings.endDate ? new Date(settings.endDate).toISOString().split('T')[0] : ''}
          onChange={(e) => onChange('recruitment.endDate', e.target.value)}
          className="form-control"
        />
      </div>
    </div>

    <div className="form-group">
      <label>Max Applications Per Student</label>
      <input
        type="number"
        min="1"
        max="10"
        value={settings.maxApplicationsPerStudent}
        onChange={(e) => onChange('recruitment.maxApplicationsPerStudent', parseInt(e.target.value))}
        className="form-control"
      />
      <small>Students can apply to this many clubs simultaneously</small>
    </div>

    <div className="form-group">
      <label className="checkbox-label">
        <input
          type="checkbox"
          checked={settings.allowCrossYearRecruitment}
          onChange={(e) => onChange('recruitment.allowCrossYearRecruitment', e.target.checked)}
        />
        <span>Allow Cross-Year Recruitment</span>
      </label>
    </div>
  </div>
);

const EventsTab = ({ settings, onChange }) => (
  <div className="settings-section">
    <h2>Events & Budget Settings</h2>
    <p className="section-description">Configure event limits and budget thresholds</p>

    <div className="form-group">
      <label>Max Events Per Club Per Month</label>
      <input
        type="number"
        min="1"
        value={settings.maxEventsPerClubPerMonth}
        onChange={(e) => onChange('events.maxEventsPerClubPerMonth', parseInt(e.target.value))}
        className="form-control"
      />
    </div>

    <h3>Budget Limits (₹)</h3>
    <div className="form-row">
      <div className="form-group">
        <label>Technical</label>
        <input
          type="number"
          value={settings.budgetLimits.technical}
          onChange={(e) => onChange('events.budgetLimits.technical', parseInt(e.target.value))}
          className="form-control"
        />
      </div>
      <div className="form-group">
        <label>Cultural</label>
        <input
          type="number"
          value={settings.budgetLimits.cultural}
          onChange={(e) => onChange('events.budgetLimits.cultural', parseInt(e.target.value))}
          className="form-control"
        />
      </div>
      <div className="form-group">
        <label>Sports</label>
        <input
          type="number"
          value={settings.budgetLimits.sports}
          onChange={(e) => onChange('events.budgetLimits.sports', parseInt(e.target.value))}
          className="form-control"
        />
      </div>
    </div>

    <div className="form-row">
      <div className="form-group">
        <label>Auto-Publish Threshold (₹)</label>
        <input
          type="number"
          value={settings.autoPublishThreshold}
          onChange={(e) => onChange('events.autoPublishThreshold', parseInt(e.target.value))}
          className="form-control"
        />
        <small>Events ≤ this amount auto-publish after coordinator approval</small>
      </div>
      <div className="form-group">
        <label>Admin Approval Threshold (₹)</label>
        <input
          type="number"
          value={settings.requireAdminApprovalThreshold}
          onChange={(e) => onChange('events.requireAdminApprovalThreshold', parseInt(e.target.value))}
          className="form-control"
        />
        <small>Events greater than this amount require admin approval</small>
      </div>
    </div>
  </div>
);

const FileUploadsTab = ({ settings, onChange }) => (
  <div className="settings-section">
    <h2>File Upload Settings</h2>
    <p className="section-description">Configure file size limits and allowed formats</p>

    <h3>Max File Sizes (MB)</h3>
    <div className="form-row">
      <div className="form-group">
        <label>Images</label>
        <input
          type="number"
          value={settings.maxFileSizes.image / 1024 / 1024}
          onChange={(e) => onChange('fileUploads.maxFileSizes.image', parseFloat(e.target.value) * 1024 * 1024)}
          className="form-control"
          step="0.5"
        />
      </div>
      <div className="form-group">
        <label>Documents</label>
        <input
          type="number"
          value={settings.maxFileSizes.document / 1024 / 1024}
          onChange={(e) => onChange('fileUploads.maxFileSizes.document', parseFloat(e.target.value) * 1024 * 1024)}
          className="form-control"
          step="0.5"
        />
      </div>
      <div className="form-group">
        <label>Videos</label>
        <input
          type="number"
          value={settings.maxFileSizes.video / 1024 / 1024}
          onChange={(e) => onChange('fileUploads.maxFileSizes.video', parseFloat(e.target.value) * 1024 * 1024)}
          className="form-control"
          step="5"
        />
      </div>
    </div>

    <h3>Allowed Formats</h3>
    <div className="form-group">
      <label>Image Formats</label>
      <input
        type="text"
        value={settings.allowedFormats.image.join(', ')}
        onChange={(e) => onChange('fileUploads.allowedFormats.image', e.target.value.split(',').map(s => s.trim()))}
        className="form-control"
      />
      <small>Comma-separated (e.g., jpg, png, webp)</small>
    </div>
  </div>
);

const NotificationsTab = ({ settings, onChange }) => (
  <div className="settings-section">
    <h2>Notification Settings</h2>
    <p className="section-description">Configure email and SMS notifications</p>

    <h3>Email Settings</h3>
    <div className="form-group">
      <label className="checkbox-label">
        <input
          type="checkbox"
          checked={settings.email.enabled}
          onChange={(e) => onChange('notifications.email.enabled', e.target.checked)}
        />
        <span>Enable Email Notifications</span>
      </label>
    </div>

    <div className="form-row">
      <div className="form-group">
        <label>From Name</label>
        <input
          type="text"
          value={settings.email.fromName}
          onChange={(e) => onChange('notifications.email.fromName', e.target.value)}
          className="form-control"
        />
      </div>
      <div className="form-group">
        <label>From Email</label>
        <input
          type="email"
          value={settings.email.fromEmail}
          onChange={(e) => onChange('notifications.email.fromEmail', e.target.value)}
          className="form-control"
        />
      </div>
    </div>

    <h3>Notification Types</h3>
    {Object.entries(settings.types).map(([key, value]) => (
      <div key={key} className="form-group">
        <label className="checkbox-label">
          <input
            type="checkbox"
            checked={value}
            onChange={(e) => onChange(`notifications.types.${key}`, e.target.checked)}
          />
          <span>{key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}</span>
        </label>
      </div>
    ))}
  </div>
);

const SecurityTab = ({ settings, onChange }) => (
  <div className="settings-section">
    <h2>Security Settings</h2>
    <p className="section-description">Configure session, login, and password policies</p>

    <h3>Session Settings</h3>
    <div className="form-group">
      <label>Session Timeout (seconds)</label>
      <input
        type="number"
        min="300"
        max="86400"
        value={settings.session.timeout}
        onChange={(e) => onChange('security.session.timeout', parseInt(e.target.value))}
        className="form-control"
      />
      <small>300 seconds (5 min) to 86400 seconds (24 hours)</small>
    </div>

    <h3>Login Settings</h3>
    <div className="form-row">
      <div className="form-group">
        <label>Max Login Attempts</label>
        <input
          type="number"
          min="3"
          max="10"
          value={settings.login.maxAttempts}
          onChange={(e) => onChange('security.login.maxAttempts', parseInt(e.target.value))}
          className="form-control"
        />
      </div>
      <div className="form-group">
        <label>Lockout Duration (seconds)</label>
        <input
          type="number"
          min="300"
          max="3600"
          value={settings.login.lockoutDuration}
          onChange={(e) => onChange('security.login.lockoutDuration', parseInt(e.target.value))}
          className="form-control"
        />
      </div>
    </div>

    <h3>Password Policy</h3>
    <div className="form-group">
      <label>Minimum Length</label>
      <input
        type="number"
        min="6"
        max="20"
        value={settings.password.minLength}
        onChange={(e) => onChange('security.password.minLength', parseInt(e.target.value))}
        className="form-control"
      />
    </div>

    {['requireUppercase', 'requireLowercase', 'requireNumbers', 'requireSpecialChar'].map(field => (
      <div key={field} className="form-group">
        <label className="checkbox-label">
          <input
            type="checkbox"
            checked={settings.password[field]}
            onChange={(e) => onChange(`security.password.${field}`, e.target.checked)}
          />
          <span>{field.replace('require', 'Require ').replace(/([A-Z])/g, ' $1')}</span>
        </label>
      </div>
    ))}
  </div>
);

const ClubsTab = ({ settings, onChange }) => (
  <div className="settings-section">
    <h2>Club Settings</h2>
    <p className="section-description">Configure club creation and membership limits</p>

    <div className="form-row">
      <div className="form-group">
        <label>Max Members Per Club</label>
        <input
          type="number"
          min="10"
          value={settings.maxMembersPerClub}
          onChange={(e) => onChange('clubs.maxMembersPerClub', parseInt(e.target.value))}
          className="form-control"
        />
      </div>
      <div className="form-group">
        <label>Min Members to Create</label>
        <input
          type="number"
          min="5"
          value={settings.minMembersToCreate}
          onChange={(e) => onChange('clubs.minMembersToCreate', parseInt(e.target.value))}
          className="form-control"
        />
      </div>
    </div>

    <div className="form-group">
      <label>Club Categories (comma-separated)</label>
      <input
        type="text"
        value={settings.clubCategories.join(', ')}
        onChange={(e) => onChange('clubs.clubCategories', e.target.value.split(',').map(s => s.trim()))}
        className="form-control"
      />
    </div>
  </div>
);

const AcademicYearTab = ({ settings, onChange }) => (
  <div className="settings-section">
    <h2>Academic Year Settings</h2>
    <p className="section-description">Configure academic year and semester dates</p>

    <div className="form-group">
      <label>Current Academic Year</label>
      <input
        type="text"
        value={settings.current}
        onChange={(e) => onChange('academicYear.current', e.target.value)}
        className="form-control"
        placeholder="2024-2025"
      />
      <small>Format: YYYY-YYYY</small>
    </div>

    <div className="form-row">
      <div className="form-group">
        <label>Start Month</label>
        <select
          value={settings.startMonth}
          onChange={(e) => onChange('academicYear.startMonth', parseInt(e.target.value))}
          className="form-control"
        >
          {Array.from({ length: 12 }, (_, i) => (
            <option key={i + 1} value={i + 1}>
              {new Date(2000, i, 1).toLocaleString('default', { month: 'long' })}
            </option>
          ))}
        </select>
      </div>
      <div className="form-group">
        <label>End Month</label>
        <select
          value={settings.endMonth}
          onChange={(e) => onChange('academicYear.endMonth', parseInt(e.target.value))}
          className="form-control"
        >
          {Array.from({ length: 12 }, (_, i) => (
            <option key={i + 1} value={i + 1}>
              {new Date(2000, i, 1).toLocaleString('default', { month: 'long' })}
            </option>
          ))}
        </select>
      </div>
    </div>
  </div>
);

const AccreditationTab = ({ settings, onChange }) => (
  <div className="settings-section">
    <h2>Accreditation Settings</h2>
    <p className="section-description">Configure institution details and NAAC/NBA information</p>

    <div className="form-group">
      <label>Institution Name</label>
      <input
        type="text"
        value={settings.institutionName}
        onChange={(e) => onChange('accreditation.institutionName', e.target.value)}
        className="form-control"
      />
    </div>

    <div className="form-row">
      <div className="form-group">
        <label>Institution Code</label>
        <input
          type="text"
          value={settings.institutionCode}
          onChange={(e) => onChange('accreditation.institutionCode', e.target.value)}
          className="form-control"
        />
      </div>
      <div className="form-group">
        <label>NAAC Grade</label>
        <select
          value={settings.naacGrade}
          onChange={(e) => onChange('accreditation.naacGrade', e.target.value)}
          className="form-control"
        >
          {['A++', 'A+', 'A', 'B++', 'B+', 'B', 'C', 'D'].map(grade => (
            <option key={grade} value={grade}>{grade}</option>
          ))}
        </select>
      </div>
    </div>

    <div className="form-group">
      <label className="checkbox-label">
        <input
          type="checkbox"
          checked={settings.nbaAccredited}
          onChange={(e) => onChange('accreditation.nbaAccredited', e.target.checked)}
        />
        <span>NBA Accredited</span>
      </label>
    </div>
  </div>
);

export default SystemSettings;
