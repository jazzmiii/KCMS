import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import Layout from '../../components/Layout';
import auditService from '../../services/auditService';
import '../../styles/Dashboard.css';
import './AuditLogs.css';

const AuditLogs = () => {
  const { user } = useAuth();
  const [logs, setLogs] = useState([]);
  const [statistics, setStatistics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  
  // Filters
  const [filters, setFilters] = useState({
    user: '',
    action: '',
    severity: '',
    status: '',
    from: '',
    to: '',
    page: 1,
    limit: 20
  });
  
  // Pagination
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const limit = 20;

  useEffect(() => {
    fetchLogs();
    fetchStatistics();
  }, [page]);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const response = await auditService.list({ ...filters, page, limit });
      // Backend: successResponse(res, { total, page, limit, items })
      setLogs(response.data.items || []);
      setTotal(response.data.total || 0);
    } catch (error) {
      console.error('Error fetching audit logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStatistics = async () => {
    try {
      const response = await auditService.getStatistics();
      // Backend: successResponse(res, { statistics })
      setStatistics(response.data.statistics);
    } catch (error) {
      console.error('Error fetching statistics:', error);
    }
  };

  const handleFilterChange = (field, value) => {
    setFilters(prev => ({ ...prev, [field]: value }));
  };

  const handleApplyFilters = () => {
    setPage(1);
    fetchLogs();
  };

  const handleResetFilters = () => {
    setFilters({
      user: '',
      action: '',
      severity: '',
      status: '',
      from: '',
      to: '',
      page: 1,
      limit: 20
    });
    setPage(1);
    setTimeout(fetchLogs, 0);
  };

  const handleExport = async () => {
    try {
      setExporting(true);
      const blob = await auditService.exportCSV(filters);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `audit-logs-${new Date().toISOString()}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error exporting logs:', error);
      alert('Failed to export logs');
    } finally {
      setExporting(false);
    }
  };

  const totalPages = Math.ceil(total / limit);

  return (
    <Layout>
      <div className="dashboard audit-logs-page">
        <div className="dashboard-header">
          <div>
            <h1>📋 Audit Logs</h1>
            <p>View and analyze system activity logs</p>
          </div>
          <div className="header-actions">
            <button 
              className="btn btn-outline"
              onClick={handleExport}
              disabled={exporting}
            >
              {exporting ? 'Exporting...' : '📥 Export CSV'}
            </button>
          </div>
        </div>

        {/* Statistics */}
        {statistics && (
          <div className="stats-grid">
            <div className="stat-card-small">
              <h4>Total Logs</h4>
              <div className="stat-value">{statistics.totalLogs}</div>
            </div>
            <div className="stat-card-small">
              <h4>Low Severity</h4>
              <div className="stat-value">{statistics.bySeverity?.LOW || 0}</div>
            </div>
            <div className="stat-card-small">
              <h4>Medium Severity</h4>
              <div className="stat-value">{statistics.bySeverity?.MEDIUM || 0}</div>
            </div>
            <div className="stat-card-small">
              <h4>High Severity</h4>
              <div className="stat-value">{statistics.bySeverity?.HIGH || 0}</div>
            </div>
            <div className="stat-card-small">
              <h4>Critical</h4>
              <div className="stat-value">{statistics.bySeverity?.CRITICAL || 0}</div>
            </div>
            <div className="stat-card-small">
              <h4>Success Rate</h4>
              <div className="stat-value">
                {statistics.byStatus?.success && statistics.totalLogs 
                  ? Math.round((statistics.byStatus.success / statistics.totalLogs) * 100)
                  : 0}%
              </div>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="audit-filters">
          <h3>Filters</h3>
          <div className="filter-row">
            <div className="filter-group">
              <label>Action</label>
              <input
                type="text"
                value={filters.action}
                onChange={(e) => handleFilterChange('action', e.target.value)}
                placeholder="e.g., USER_LOGIN"
                className="form-control"
              />
            </div>
            <div className="filter-group">
              <label>Severity</label>
              <select
                value={filters.severity}
                onChange={(e) => handleFilterChange('severity', e.target.value)}
                className="form-control"
              >
                <option value="">All</option>
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
                <option value="CRITICAL">Critical</option>
              </select>
            </div>
            <div className="filter-group">
              <label>Status</label>
              <select
                value={filters.status}
                onChange={(e) => handleFilterChange('status', e.target.value)}
                className="form-control"
              >
                <option value="">All</option>
                <option value="success">Success</option>
                <option value="failure">Failure</option>
              </select>
            </div>
            <div className="filter-group">
              <label>From Date</label>
              <input
                type="date"
                value={filters.from}
                onChange={(e) => handleFilterChange('from', e.target.value)}
                className="form-control"
              />
            </div>
            <div className="filter-group">
              <label>To Date</label>
              <input
                type="date"
                value={filters.to}
                onChange={(e) => handleFilterChange('to', e.target.value)}
                className="form-control"
              />
            </div>
          </div>
          <div className="filter-actions">
            <button className="btn btn-primary" onClick={handleApplyFilters}>
              Apply Filters
            </button>
            <button className="btn btn-outline" onClick={handleResetFilters}>
              Reset
            </button>
          </div>
        </div>

        {/* Audit Table */}
        <div className="audit-table-container">
          {loading ? (
            <div style={{ padding: '48px', textAlign: 'center' }}>
              Loading logs...
            </div>
          ) : logs.length === 0 ? (
            <div className="no-logs">
              No audit logs found matching your filters
            </div>
          ) : (
            <>
              <table className="audit-table">
                <thead>
                  <tr>
                    <th>Timestamp</th>
                    <th>User</th>
                    <th>Action</th>
                    <th>Target</th>
                    <th>Severity</th>
                    <th>Status</th>
                    <th>IP Address</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map((log) => (
                    <tr key={log._id}>
                      <td>
                        <div className="timestamp">
                          {new Date(log.createdAt).toLocaleString()}
                        </div>
                      </td>
                      <td>
                        <div className="user-info">
                          <span className="user-name">
                            {log.user?.profile?.name || 'System'}
                          </span>
                          <span className="user-email">
                            {log.user?.email || 'N/A'}
                          </span>
                        </div>
                      </td>
                      <td>
                        <span className="action-badge">{log.action}</span>
                      </td>
                      <td>{log.target || 'N/A'}</td>
                      <td>
                        <span className={`severity-badge severity-${log.severity}`}>
                          {log.severity}
                        </span>
                      </td>
                      <td>
                        <span className={`status-badge status-${log.status}`}>
                          {log.status}
                        </span>
                      </td>
                      <td>{log.ip || 'N/A'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Pagination */}
              <div className="pagination-container">
                <div className="pagination-info">
                  Showing {((page - 1) * limit) + 1} to {Math.min(page * limit, total)} of {total} logs
                </div>
                <div className="pagination-buttons">
                  <button
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                  >
                    Previous
                  </button>
                  
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum;
                    if (totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (page <= 3) {
                      pageNum = i + 1;
                    } else if (page >= totalPages - 2) {
                      pageNum = totalPages - 4 + i;
                    } else {
                      pageNum = page - 2 + i;
                    }
                    
                    return (
                      <button
                        key={pageNum}
                        onClick={() => setPage(pageNum)}
                        className={page === pageNum ? 'active' : ''}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                  
                  <button
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                  >
                    Next
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default AuditLogs;
