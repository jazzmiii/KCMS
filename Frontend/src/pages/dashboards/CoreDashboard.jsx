import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Layout from '../../components/Layout';
import userService from '../../services/userService';
import eventService from '../../services/eventService';
import recruitmentService from '../../services/recruitmentService';
import '../../styles/Dashboard.css';

const CoreDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    myClubs: 0,
    myEvents: 0,
    activeRecruitments: 0,
    pendingApplications: 0,
  });
  const [myClubs, setMyClubs] = useState([]);
  const [upcomingEvents, setUpcomingEvents] = useState([]);
  const [myRecruitments, setMyRecruitments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      // Get clubs where user has management role (core member or higher)
      const managementRoles = ['core', 'president', 'vicePresident', 'secretary', 'treasurer', 'leadPR', 'leadTech'];
      const clubsRes = await userService.getMyClubs(managementRoles);
      // Backend: successResponse(res, { clubs }) → { status, data: { clubs } }
      const userClubs = clubsRes.data?.clubs || [];
      const clubIds = userClubs.map(c => c._id);

      const [eventsRes, recruitmentsRes] = await Promise.all([
        eventService.list({ limit: 100, status: 'published' }),
        recruitmentService.list({ limit: 100 }),
      ]);

      // Filter events from user's clubs
      // Backend: successResponse(res, { total, events }) → { status, data: { total, events } }
      const userEvents = eventsRes.data?.events?.filter(event =>
        clubIds.includes(event.club?._id)
      ) || [];

      // Filter recruitments from user's clubs
      // Backend: successResponse(res, { total, items }) → { status, data: { total, items } }
      const userRecruitments = recruitmentsRes.data?.items?.filter(rec =>
        clubIds.includes(rec.club?._id)
      ) || [];

      setMyClubs(userClubs);
      setUpcomingEvents(userEvents);
      setMyRecruitments(userRecruitments);

      // Calculate stats
      const pendingApps = userRecruitments.reduce((sum, rec) => 
        sum + (rec.applicationCount || 0), 0
      );

      setStats({
        myClubs: userClubs.length,
        myEvents: userEvents.length,
        activeRecruitments: userRecruitments.filter(r => r.status === 'open').length,
        pendingApplications: pendingApps,
      });
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="dashboard">
        <div className="dashboard-header">
          <div>
            <h1>Core Member Dashboard 🌟</h1>
            <p>Manage your club activities and responsibilities</p>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="stats-grid">
          <div className="stat-card stat-primary">
            <div className="stat-icon">🏢</div>
            <div className="stat-content">
              <h3>{stats.myClubs}</h3>
              <p>My Clubs</p>
            </div>
          </div>
          <div className="stat-card stat-success">
            <div className="stat-icon">📅</div>
            <div className="stat-content">
              <h3>{stats.myEvents}</h3>
              <p>Upcoming Events</p>
            </div>
          </div>
          <div className="stat-card stat-info">
            <div className="stat-icon">📝</div>
            <div className="stat-content">
              <h3>{stats.activeRecruitments}</h3>
              <p>Active Recruitments</p>
            </div>
          </div>
          <div className="stat-card stat-warning">
            <div className="stat-icon">👥</div>
            <div className="stat-content">
              <h3>{stats.pendingApplications}</h3>
              <p>Pending Applications</p>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="quick-actions">
          <h2>Quick Actions</h2>
          <div className="actions-grid">
            <Link to="/events/create" className="action-card action-primary">
              <span className="action-icon">➕</span>
              <h3>Create Event</h3>
              <p>Organize a new event for your club</p>
            </Link>
            <Link to="/recruitments/create" className="action-card action-success">
              <span className="action-icon">📝</span>
              <h3>Start Recruitment</h3>
              <p>Begin recruiting new members</p>
            </Link>
            <Link to="/clubs" className="action-card action-info">
              <span className="action-icon">🏢</span>
              <h3>Manage Clubs</h3>
              <p>View and manage your clubs</p>
            </Link>
            <Link to="/events" className="action-card action-warning">
              <span className="action-icon">📊</span>
              <h3>View Reports</h3>
              <p>Check club performance</p>
            </Link>
          </div>
        </div>

        {/* My Clubs */}
        <div className="dashboard-section">
          <div className="section-header">
            <h2>🏢 My Clubs</h2>
            <Link to="/clubs" className="view-all">View All →</Link>
          </div>
          {loading ? (
            <div className="loading">Loading...</div>
          ) : myClubs.length > 0 ? (
            <div className="clubs-grid">
              {myClubs.map((club) => (
                <div key={club._id} className="club-card">
                  <div className="club-logo">
                    {club.logoUrl ? (
                      <img src={club.logoUrl} alt={club.name} />
                    ) : (
                      <div className="club-logo-placeholder">{club.name.charAt(0)}</div>
                    )}
                  </div>
                  <h3>{club.name}</h3>
                  <span className="club-category">{club.category}</span>
                  <div className="role-badges">
                    <span className="badge badge-primary">{club.userRole}</span>
                  </div>
                  <p>{club.description}</p>
                  <div className="club-actions">
                    <Link to={`/clubs/${club._id}/dashboard`} className="btn btn-primary">
                      Open Dashboard →
                    </Link>
                    <Link to={`/clubs/${club._id}`} className="btn btn-outline">
                      View Details
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="no-data">You are not a core member of any club yet</p>
          )}
        </div>

        {/* My Recruitments */}
        <div className="dashboard-section">
          <div className="section-header">
            <h2>📝 My Recruitments</h2>
            <Link to="/recruitments" className="view-all">View All →</Link>
          </div>
          {loading ? (
            <div className="loading">Loading...</div>
          ) : myRecruitments.length > 0 ? (
            <div className="cards-grid">
              {myRecruitments.map((recruitment) => (
                <div key={recruitment._id} className="card">
                  <div className="card-header">
                    <h3>{recruitment.title}</h3>
                    <span className={`badge badge-${
                      recruitment.status === 'open' ? 'success' : 
                      recruitment.status === 'closing_soon' ? 'warning' : 'secondary'
                    }`}>
                      {recruitment.status}
                    </span>
                  </div>
                  <p className="card-description">{recruitment.description}</p>
                  <div className="card-meta">
                    <span>📅 Ends: {new Date(recruitment.endDate).toLocaleDateString()}</span>
                    <span>👥 {recruitment.applicationCount || 0} applications</span>
                  </div>
                  <div className="action-buttons">
                    <Link to={`/recruitments/${recruitment._id}`} className="btn btn-outline btn-sm">
                      View
                    </Link>
                    <Link to={`/recruitments/${recruitment._id}/applications`} className="btn btn-primary btn-sm">
                      Review Applications
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="no-data">No active recruitments</p>
          )}
        </div>

        {/* Upcoming Events */}
        <div className="dashboard-section">
          <div className="section-header">
            <h2>📅 Upcoming Events</h2>
            <Link to="/events" className="view-all">View All →</Link>
          </div>
          {loading ? (
            <div className="loading">Loading...</div>
          ) : upcomingEvents.length > 0 ? (
            <div className="events-list">
              {upcomingEvents.map((event) => (
                <div key={event._id} className="event-item">
                  <div className="event-date-badge">
                    <span className="day">{new Date(event.dateTime).getDate()}</span>
                    <span className="month">
                      {new Date(event.dateTime).toLocaleString('default', { month: 'short' })}
                    </span>
                  </div>
                  <div className="event-info">
                    <h3>{event.title}</h3>
                    <p>📍 {event.venue}</p>
                    <p>🕐 {new Date(event.dateTime).toLocaleTimeString('en-US', { 
                      hour: '2-digit', 
                      minute: '2-digit' 
                    })}</p>
                    <span className={`badge badge-${
                      event.status === 'published' ? 'success' : 'warning'
                    }`}>
                      {event.status}
                    </span>
                  </div>
                  <Link to={`/events/${event._id}`} className="btn btn-outline btn-sm">
                    Manage Event
                  </Link>
                </div>
              ))}
            </div>
          ) : (
            <p className="no-data">No upcoming events</p>
          )}
        </div>

        {/* Tips for Core Members */}
        <div className="dashboard-section">
          <div className="info-card">
            <h3>💡 Tips for Core Members</h3>
            <ul style={{ paddingLeft: '1.5rem', color: 'var(--text-secondary)' }}>
              <li>Regularly check and respond to recruitment applications</li>
              <li>Plan events well in advance and get necessary approvals</li>
              <li>Keep club members engaged with regular activities</li>
              <li>Maintain good communication with coordinators</li>
              <li>Document all events with photos and reports</li>
              <li>Track attendance and participation metrics</li>
            </ul>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default CoreDashboard;
