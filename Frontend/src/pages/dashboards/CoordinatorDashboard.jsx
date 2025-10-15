import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Layout from '../../components/Layout';
import clubService from '../../services/clubService';
import eventService from '../../services/eventService';
import '../../styles/Dashboard.css';

const CoordinatorDashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    assignedClubs: 0,
    pendingEvents: 0,
    totalEvents: 0,
  });
  const [assignedClubs, setAssignedClubs] = useState([]);
  const [pendingEvents, setPendingEvents] = useState([]);
  const [pendingSettingsClubs, setPendingSettingsClubs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      // Add timestamp to bypass stale cache
      const timestamp = Date.now();
      
      const [clubsRes, allPendingEventsRes, allEventsRes] = await Promise.all([
        clubService.listClubs({ coordinator: user._id, _t: timestamp }),
        eventService.list({ status: 'pending_coordinator', limit: 100 }),
        eventService.list({ limit: 100 }), // Get all events to count coordinator's events (max 100)
      ]);

      // Backend: successResponse(res, { total, clubs }) → { status, data: { total, clubs } }
      const assignedClubs = clubsRes.data?.clubs || [];
      const assignedClubIds = assignedClubs.map(c => c._id);
      
      // ✅ Filter pending events to only show events from assigned clubs
      const myPendingEvents = (allPendingEventsRes.data?.events || []).filter(event => 
        assignedClubIds.includes(event.club?._id)
      );
      
      const coordinatorEvents = (allEventsRes.data?.events || []).filter(event => 
        assignedClubIds.includes(event.club?._id)
      );

      // ✅ Count clubs with pending settings changes (president changed sensitive data)
      const clubsWithPendingSettings = assignedClubs.filter(club => club.pendingSettings);

      setAssignedClubs(assignedClubs);
      setPendingEvents(myPendingEvents);
      setPendingSettingsClubs(clubsWithPendingSettings);

      setStats({
        assignedClubs: clubsRes.data?.total || 0,
        // ✅ Pending = Events pending coordinator + Club settings pending approval
        pendingEvents: myPendingEvents.length + clubsWithPendingSettings.length,
        totalEvents: coordinatorEvents.length,
      });
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApproveEvent = async (eventId) => {
    try {
      await eventService.changeStatus(eventId, 'approve');
      alert('Event approved successfully!');
      fetchDashboardData();
    } catch (error) {
      alert('Failed to approve event: ' + (error.response?.data?.message || error.message));
    }
  };

  const handleRejectEvent = async (eventId) => {
    const reason = prompt('Please provide a reason for rejection (minimum 10 characters):');
    if (!reason || reason.length < 10) {
      alert('Rejection reason must be at least 10 characters');
      return;
    }

    try {
      await eventService.changeStatus(eventId, 'reject', { reason });
      alert('Event rejected successfully');
      fetchDashboardData();
    } catch (error) {
      alert('Failed to reject event: ' + (error.response?.data?.message || error.message));
    }
  };

  return (
    <Layout>
      <div className="dashboard">
        <div className="dashboard-header">
          <div>
            <h1>Coordinator Dashboard 👨‍🏫</h1>
            <p>Manage your assigned clubs and approve events</p>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="stats-grid">
          <div className="stat-card stat-primary">
            <div className="stat-icon">🏢</div>
            <div className="stat-content">
              <h3>{stats.assignedClubs}</h3>
              <p>Assigned Clubs</p>
            </div>
          </div>
          <div className="stat-card stat-warning">
            <div className="stat-icon">⏳</div>
            <div className="stat-content">
              <h3>{stats.pendingEvents}</h3>
              <p>Pending Approvals</p>
            </div>
          </div>
          <div className="stat-card stat-success">
            <div className="stat-icon">✅</div>
            <div className="stat-content">
              <h3>{stats.totalEvents}</h3>
              <p>Total Events</p>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="quick-actions">
          <h2>Quick Actions</h2>
          <div className="actions-grid">
            <Link to="/clubs" className="action-card action-primary">
              <span className="action-icon">🏢</span>
              <h3>My Clubs</h3>
              <p>View assigned clubs</p>
            </Link>
            <Link to="/events" className="action-card action-warning">
              <span className="action-icon">📅</span>
              <h3>Pending Events</h3>
              <p>Review and approve events</p>
            </Link>
            <Link to="/recruitments" className="action-card action-info">
              <span className="action-icon">📝</span>
              <h3>Recruitments</h3>
              <p>Monitor club recruitments</p>
            </Link>
          </div>
        </div>

        {/* Pending Event Approvals */}
        <div className="dashboard-section">
          <div className="section-header">
            <h2>⏳ Pending Event Approvals</h2>
            <Link to="/events" className="view-all">View All →</Link>
          </div>
          {loading ? (
            <div className="loading">Loading...</div>
          ) : pendingEvents.length > 0 ? (
            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Event Name</th>
                    <th>Club</th>
                    <th>Date</th>
                    <th>Venue</th>
                    <th>Budget</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {pendingEvents.map((event) => (
                    <tr key={event._id}>
                      <td>{event.title}</td>
                      <td>{event.club?.name || 'N/A'}</td>
                      <td>{new Date(event.dateTime).toLocaleDateString()}</td>
                      <td>{event.venue}</td>
                      <td>₹{event.budget || 0}</td>
                      <td>
                        <div className="action-buttons">
                          <Link to={`/events/${event._id}`} className="btn btn-sm btn-outline">
                            View
                          </Link>
                          <button 
                            onClick={() => handleApproveEvent(event._id)}
                            className="btn btn-sm btn-success"
                          >
                            ✓ Approve
                          </button>
                          <button 
                            onClick={() => handleRejectEvent(event._id)}
                            className="btn btn-sm btn-danger"
                          >
                            ✗ Reject
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="no-data">No pending event approvals</p>
          )}
        </div>

        {/* Pending Club Settings Approvals */}
        {pendingSettingsClubs.length > 0 && (
          <div className="dashboard-section">
            <div className="section-header">
              <h2>⚙️ Pending Club Settings Approvals</h2>
              <Link to="/clubs" className="view-all">View All →</Link>
            </div>
            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Club Name</th>
                    <th>Category</th>
                    <th>Changed Fields</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {pendingSettingsClubs.map((club) => {
                    const changedFields = club.pendingSettings 
                      ? Object.keys(club.pendingSettings).join(', ') 
                      : 'Multiple fields';
                    return (
                      <tr key={club._id}>
                        <td>
                          <div className="table-cell-with-icon">
                            {club.logoUrl ? (
                              <img src={club.logoUrl} alt={club.name} className="table-icon" />
                            ) : (
                              <div className="table-icon-placeholder">{club.name.charAt(0)}</div>
                            )}
                            <span>{club.name}</span>
                          </div>
                        </td>
                        <td><span className="badge badge-info">{club.category}</span></td>
                        <td>
                          <span className="badge badge-warning">{changedFields}</span>
                          {/* Show pending values */}
                          <div style={{ fontSize: '0.85rem', color: '#666', marginTop: '0.25rem' }}>
                            {club.pendingSettings && Object.entries(club.pendingSettings).map(([key, value]) => (
                              <div key={key}>
                                <strong>{key}:</strong> {value}
                              </div>
                            ))}
                          </div>
                        </td>
                        <td>
                          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                            <button 
                              onClick={async () => {
                                if (!window.confirm('Approve these changes?')) return;
                                try {
                                  await clubService.approveSettings(club._id);
                                  alert('✅ Changes approved successfully!');
                                  window.location.reload();
                                } catch (err) {
                                  alert(err.response?.data?.message || 'Failed to approve changes');
                                }
                              }}
                              className="btn btn-sm btn-success"
                            >
                              ✓ Approve
                            </button>
                            <button 
                              onClick={async () => {
                                if (!window.confirm('Reject these changes?')) return;
                                try {
                                  await clubService.rejectSettings(club._id);
                                  alert('✅ Changes rejected');
                                  window.location.reload();
                                } catch (err) {
                                  alert(err.response?.data?.message || 'Failed to reject changes');
                                }
                              }}
                              className="btn btn-sm btn-danger"
                            >
                              ✗ Reject
                            </button>
                            <Link to={`/clubs/${club._id}`} className="btn btn-sm btn-outline">
                              View Club
                            </Link>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Assigned Clubs */}
        <div className="dashboard-section">
          <div className="section-header">
            <h2>🏢 Assigned Clubs</h2>
            <Link to="/clubs" className="view-all">View All →</Link>
          </div>
          {loading ? (
            <div className="loading">Loading...</div>
          ) : assignedClubs.length > 0 ? (
            <div className="clubs-grid">
              {assignedClubs.map((club) => (
                <div key={club._id} className="club-card">
                  <div className="club-logo">
                    {club.logo ? (
                      <img src={club.logo} alt={club.name} />
                    ) : (
                      <div className="club-logo-placeholder">{club.name.charAt(0)}</div>
                    )}
                  </div>
                  <h3>{club.name}</h3>
                  <span className="club-category">{club.category}</span>
                  <p>{club.description}</p>
                  <div className="club-stats">
                    <span>👥 {club.memberCount || 0} members</span>
                    <span>📅 {club.eventCount || 0} events</span>
                  </div>
                  <Link to={`/clubs/${club._id}`} className="btn btn-outline">
                    Manage Club
                  </Link>
                </div>
              ))}
            </div>
          ) : (
            <p className="no-data">No clubs assigned</p>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default CoordinatorDashboard;
