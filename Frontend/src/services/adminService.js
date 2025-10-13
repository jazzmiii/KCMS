import api from './api';

const adminService = {
  // Maintenance Mode
  getMaintenanceStatus: async () => {
    const response = await api.get('/admin/maintenance');
    return response.data;
  },

  enableMaintenance: async (data) => {
    const response = await api.post('/admin/maintenance/enable', data);
    return response.data;
  },

  disableMaintenance: async () => {
    const response = await api.post('/admin/maintenance/disable');
    return response.data;
  },

  // System Stats
  getSystemStats: async () => {
    const response = await api.get('/admin/stats');
    return response.data;
  },

  // Backups
  getBackupStats: async () => {
    const response = await api.get('/admin/backups/stats');
    return response.data;
  },

  createBackup: async (type) => {
    const response = await api.post('/admin/backups/create', { type });
    return response.data;
  },

  restoreBackup: async (backupPath) => {
    const response = await api.post('/admin/backups/restore', { backupPath });
    return response.data;
  },
};

export default adminService;
