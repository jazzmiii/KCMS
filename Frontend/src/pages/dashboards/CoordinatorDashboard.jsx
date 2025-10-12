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
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [clubsRes, eventsRes] = await Promise.all([
        clubService.listClubs({ coordinator: user._id }),
        eventService.list({ status: 'pending_coordinator' }),
      ]);

      setAssignedClubs(clubsRes.data.clubs || []);
      setPendingEvents(eventsRes.data.events || []);

      setStats({
        assignedClubs: clubsRes.data.total || 0,
        pendingEvents: eventsRes.data.total || 0,
        totalEvents: eventsRes.data.total || 0,
      });
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApproveEvent = async (eventId) => {
    try {
      await eventService.changeStatus(eventId, 'approved');
      alert('Event approved successfully!');
      fetchDashboardData();
    } catch (error) {
      alert('Failed to approve event');
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
                      <td>{event.name}</td>
                      <td>{event.clubId?.name || 'N/A'}</td>
                      <td>{new Date(event.date).toLocaleDateString()}</td>
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
                            Approve
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="no-data">No pending approvals</p>
          )}
        </div>

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
