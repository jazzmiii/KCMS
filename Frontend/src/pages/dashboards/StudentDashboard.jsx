import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Layout from '../../components/Layout';
import clubService from '../../services/clubService';
import eventService from '../../services/eventService';
import recruitmentService from '../../services/recruitmentService';
import '../../styles/Dashboard.css';

const StudentDashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    myClubs: 0,
    upcomingEvents: 0,
    openRecruitments: 0,
  });
  const [myClubs, setMyClubs] = useState([]);
  const [upcomingEvents, setUpcomingEvents] = useState([]);
  const [openRecruitments, setOpenRecruitments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [clubsRes, eventsRes, recruitmentsRes] = await Promise.all([
        clubService.listClubs({ limit: 4 }),
        eventService.list({ limit: 5, status: 'published' }),
        recruitmentService.list({ limit: 5, status: 'open' }),
      ]);

      setMyClubs(clubsRes.data.clubs || []);
      setUpcomingEvents(eventsRes.data.events || []);
      setOpenRecruitments(recruitmentsRes.data.recruitments || []);

      setStats({
        myClubs: clubsRes.data.total || 0,
        upcomingEvents: eventsRes.data.total || 0,
        openRecruitments: recruitmentsRes.data.total || 0,
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
            <h1>Welcome back, {user?.name}! 👋</h1>
            <p>Here's what's happening with your clubs and events</p>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon">🎯</div>
            <div className="stat-content">
              <h3>{stats.myClubs}</h3>
              <p>Active Clubs</p>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">📅</div>
            <div className="stat-content">
              <h3>{stats.upcomingEvents}</h3>
              <p>Upcoming Events</p>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">📝</div>
            <div className="stat-content">
              <h3>{stats.openRecruitments}</h3>
              <p>Open Recruitments</p>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="quick-actions">
          <h2>Quick Actions</h2>
          <div className="actions-grid">
            <Link to="/clubs" className="action-card">
              <span className="action-icon">🔍</span>
              <h3>Explore Clubs</h3>
              <p>Discover new clubs to join</p>
            </Link>
            <Link to="/recruitments" className="action-card">
              <span className="action-icon">✍️</span>
              <h3>Apply to Clubs</h3>
              <p>View open recruitments</p>
            </Link>
            <Link to="/events" className="action-card">
              <span className="action-icon">🎉</span>
              <h3>Browse Events</h3>
              <p>Find exciting events</p>
            </Link>
            <Link to="/profile" className="action-card">
              <span className="action-icon">👤</span>
              <h3>My Profile</h3>
              <p>Update your information</p>
            </Link>
          </div>
        </div>

        {/* Open Recruitments */}
        <div className="dashboard-section">
          <div className="section-header">
            <h2>🔥 Open Recruitments</h2>
            <Link to="/recruitments" className="view-all">View All →</Link>
          </div>
          {loading ? (
            <div className="loading">Loading...</div>
          ) : openRecruitments.length > 0 ? (
            <div className="cards-grid">
              {openRecruitments.map((recruitment) => (
                <div key={recruitment._id} className="card">
                  <div className="card-header">
                    <h3>{recruitment.title}</h3>
                    <span className="badge badge-success">Open</span>
                  </div>
                  <p className="card-description">{recruitment.description}</p>
                  <div className="card-meta">
                    <span>📅 Closes: {new Date(recruitment.endDate).toLocaleDateString()}</span>
                  </div>
                  <Link to={`/recruitments/${recruitment._id}`} className="btn btn-primary btn-sm">
                    Apply Now
                  </Link>
                </div>
              ))}
            </div>
          ) : (
            <p className="no-data">No open recruitments at the moment</p>
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
                    <span className="day">{new Date(event.date).getDate()}</span>
                    <span className="month">
                      {new Date(event.date).toLocaleString('default', { month: 'short' })}
                    </span>
                  </div>
                  <div className="event-info">
                    <h3>{event.name}</h3>
                    <p>📍 {event.venue}</p>
                    <p>🕐 {new Date(event.date).toLocaleTimeString('en-US', { 
                      hour: '2-digit', 
                      minute: '2-digit' 
                    })}</p>
                  </div>
                  <Link to={`/events/${event._id}`} className="btn btn-outline btn-sm">
                    View Details
                  </Link>
                </div>
              ))}
            </div>
          ) : (
            <p className="no-data">No upcoming events</p>
          )}
        </div>

        {/* My Clubs */}
        <div className="dashboard-section">
          <div className="section-header">
            <h2>🎯 Clubs</h2>
            <Link to="/clubs" className="view-all">View All →</Link>
          </div>
          {loading ? (
            <div className="loading">Loading...</div>
          ) : myClubs.length > 0 ? (
            <div className="clubs-grid">
              {myClubs.map((club) => (
                <div key={club._id} className="club-card-small">
                  <div className="club-logo-small">
                    {club.logo ? (
                      <img src={club.logo} alt={club.name} />
                    ) : (
                      <div className="club-logo-placeholder">{club.name.charAt(0)}</div>
                    )}
                  </div>
                  <div className="club-info">
                    <h3>{club.name}</h3>
                    <span className="club-category">{club.category}</span>
                  </div>
                  <Link to={`/clubs/${club._id}`} className="btn btn-outline btn-sm">
                    View
                  </Link>
                </div>
              ))}
            </div>
          ) : (
            <p className="no-data">No clubs found</p>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default StudentDashboard;
