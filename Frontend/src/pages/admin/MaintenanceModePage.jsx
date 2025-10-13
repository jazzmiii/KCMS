import React, { useState, useEffect } from 'react';
import Layout from '../../components/Layout';
import adminService from '../../services/adminService';
import { useAuth } from '../../context/AuthContext';
import '../../styles/Dashboard.css';

const MaintenanceModePage = () => {
  const { hasRole } = useAuth();
  const [maintenanceInfo, setMaintenanceInfo] = useState(null);
  const [systemStats, setSystemStats] = useState(null);
  const [backupStats, setBackupStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [maintenanceForm, setMaintenanceForm] = useState({
    reason: '',
    estimatedEnd: '',
    message: ''
  });

  const [backupType, setBackupType] = useState('daily');
  const [restorePath, setRestorePath] = useState('');

  useEffect(() => {
    if (hasRole('admin')) {
      fetchData();
    }
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [maintenance, stats, backups] = await Promise.all([
        adminService.getMaintenanceStatus(),
        adminService.getSystemStats(),
        adminService.getBackupStats()
      ]);
      
      setMaintenanceInfo(maintenance.data);
      setSystemStats(stats.data);
      setBackupStats(backups.data);
    } catch (err) {
      console.error('Error fetching data:', err);
      setError('Failed to load system data');
    } finally {
      setLoading(false);
    }
  };

  const handleEnableMaintenance = async () => {
    if (!maintenanceForm.reason) {
      setError('Please provide a reason for maintenance');
      return;
    }

    try {
      setLoading(true);
      await adminService.enableMaintenance(maintenanceForm);
      setSuccess('Maintenance mode enabled successfully');
      fetchData();
      setMaintenanceForm({ reason: '', estimatedEnd: '', message: '' });
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to enable maintenance mode');
    } finally {
      setLoading(false);
    }
  };

  const handleDisableMaintenance = async () => {
    if (!window.confirm('Are you sure you want to disable maintenance mode?')) {
      return;
    }

    try {
      setLoading(true);
      await adminService.disableMaintenance();
      setSuccess('Maintenance mode disabled successfully');
      fetchData();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to disable maintenance mode');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateBackup = async () => {
    if (!window.confirm(`Create a ${backupType} backup? This may take a few minutes.`)) {
      return;
    }

    try {
      setLoading(true);
      await adminService.createBackup(backupType);
      setSuccess(`${backupType} backup created successfully`);
      fetchData();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create backup');
    } finally {
      setLoading(false);
    }
  };

  const handleRestoreBackup = async () => {
    if (!restorePath) {
      setError('Please provide backup path');
      return;
    }

    if (!window.confirm('⚠️ WARNING: This will restore the database from the backup and may overwrite current data. Are you sure?')) {
      return;
    }

    try {
      setLoading(true);
      await adminService.restoreBackup(restorePath);
      setSuccess('Backup restored successfully');
      setRestorePath('');
      fetchData();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to restore backup');
    } finally {
      setLoading(false);
    }
  };

  if (!hasRole('admin')) {
    return (
      <Layout>
        <div className="unauthorized">
          <h2>Access Denied</h2>
          <p>You don't have permission to access this page.</p>
        </div>
      </Layout>
    );
  }

  if (loading && !systemStats) {
    return (
      <Layout>
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Loading system management...</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="dashboard">
        <div className="dashboard-header">
          <h1>⚙️ System Management</h1>
          <p>Manage maintenance mode, backups, and system settings</p>
        </div>

        {error && <div className="alert alert-error">{error}</div>}
        {success && <div className="alert alert-success">{success}</div>}

        {/* System Stats */}
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon">👥</div>
            <div className="stat-content">
              <h3>{systemStats?.users || 0}</h3>
              <p>Total Users</p>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">🏢</div>
            <div className="stat-content">
              <h3>{systemStats?.clubs || 0}</h3>
              <p>Total Clubs</p>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">📅</div>
            <div className="stat-content">
              <h3>{systemStats?.events || 0}</h3>
              <p>Total Events</p>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">💾</div>
            <div className="stat-content">
              <h3>{systemStats?.database ? (systemStats.database.dataSize / 1024 / 1024).toFixed(2) : 0} MB</h3>
              <p>Database Size</p>
            </div>
          </div>
        </div>

        {/* Maintenance Mode */}
        <div className="dashboard-section">
          <h2>🚧 Maintenance Mode</h2>
          
          {maintenanceInfo?.enabled ? (
            <div className="maintenance-active">
              <div className="alert alert-warning">
                <strong>⚠️ Maintenance Mode is ACTIVE</strong>
                <p>{maintenanceInfo.info?.message || 'System is under maintenance'}</p>
                <p><strong>Reason:</strong> {maintenanceInfo.info?.reason}</p>
                {maintenanceInfo.info?.estimatedEnd && (
                  <p><strong>Estimated End:</strong> {new Date(maintenanceInfo.info.estimatedEnd).toLocaleString()}</p>
                )}
                <p><strong>Started:</strong> {maintenanceInfo.info?.startedAt ? new Date(maintenanceInfo.info.startedAt).toLocaleString() : 'Unknown'}</p>
              </div>
              <button onClick={handleDisableMaintenance} className="btn btn-success">
                Disable Maintenance Mode
              </button>
            </div>
          ) : (
            <div className="maintenance-form">
              <p>Enable maintenance mode to perform system updates or maintenance.</p>
              <div className="form-group">
                <label>Reason *</label>
                <input
                  type="text"
                  value={maintenanceForm.reason}
                  onChange={(e) => setMaintenanceForm({...maintenanceForm, reason: e.target.value})}
                  placeholder="e.g., Database migration, System upgrade"
                />
              </div>
              <div className="form-group">
                <label>Custom Message</label>
                <input
                  type="text"
                  value={maintenanceForm.message}
                  onChange={(e) => setMaintenanceForm({...maintenanceForm, message: e.target.value})}
                  placeholder="e.g., We'll be back soon!"
                />
              </div>
              <div className="form-group">
                <label>Estimated End Time</label>
                <input
                  type="datetime-local"
                  value={maintenanceForm.estimatedEnd}
                  onChange={(e) => setMaintenanceForm({...maintenanceForm, estimatedEnd: e.target.value})}
                />
              </div>
              <button onClick={handleEnableMaintenance} className="btn btn-warning">
                Enable Maintenance Mode
              </button>
            </div>
          )}
        </div>

        {/* Backup Management */}
        <div className="dashboard-section">
          <h2>💾 Backup Management</h2>
          
          {backupStats && (
            <div className="backup-stats">
              <p><strong>Daily Backups:</strong> {backupStats.daily?.count || 0} (Latest: {backupStats.daily?.latest || 'None'})</p>
              <p><strong>Weekly Backups:</strong> {backupStats.weekly?.count || 0} (Latest: {backupStats.weekly?.latest || 'None'})</p>
              <p><strong>Monthly Backups:</strong> {backupStats.monthly?.count || 0} (Latest: {backupStats.monthly?.latest || 'None'})</p>
            </div>
          )}

          <div className="backup-actions">
            <h3>Create Manual Backup</h3>
            <div className="form-group">
              <label>Backup Type</label>
              <select value={backupType} onChange={(e) => setBackupType(e.target.value)}>
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
              </select>
            </div>
            <button onClick={handleCreateBackup} className="btn btn-primary" disabled={loading}>
              Create Backup
            </button>
          </div>

          <div className="backup-restore">
            <h3>⚠️ Restore from Backup</h3>
            <div className="form-group">
              <label>Backup Path</label>
              <input
                type="text"
                value={restorePath}
                onChange={(e) => setRestorePath(e.target.value)}
                placeholder="e.g., backups/daily/daily-backup-2025-01-12.tar.gz"
              />
            </div>
            <button onClick={handleRestoreBackup} className="btn btn-danger" disabled={loading || !restorePath}>
              Restore Backup
            </button>
          </div>
        </div>

        {/* Database Info */}
        {systemStats?.database && (
          <div className="dashboard-section">
            <h2>🗄️ Database Statistics</h2>
            <div className="table-container">
              <table className="data-table">
                <tbody>
                  <tr>
                    <td><strong>Collections</strong></td>
                    <td>{systemStats.database.collections}</td>
                  </tr>
                  <tr>
                    <td><strong>Data Size</strong></td>
                    <td>{(systemStats.database.dataSize / 1024 / 1024).toFixed(2)} MB</td>
                  </tr>
                  <tr>
                    <td><strong>Index Size</strong></td>
                    <td>{(systemStats.database.indexSize / 1024 / 1024).toFixed(2)} MB</td>
                  </tr>
                  <tr>
                    <td><strong>Storage Size</strong></td>
                    <td>{(systemStats.database.storageSize / 1024 / 1024).toFixed(2)} MB</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default MaintenanceModePage;
