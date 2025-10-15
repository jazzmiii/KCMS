import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Layout from '../../components/Layout';
import clubService from '../../services/clubService';
import eventService from '../../services/eventService';
import recruitmentService from '../../services/recruitmentService';
import userService from '../../services/userService';
import { getClubLogoUrl, getClubLogoPlaceholder } from '../../utils/imageUtils';
import '../../styles/Dashboard.css';

const StudentDashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    myClubsCount: 0,
    activeClubs: 0,
    upcomingEvents: 0,
    openRecruitments: 0,
  });
  const [allClubs, setAllClubs] = useState([]);
  const [myClubsList, setMyClubsList] = useState([]);
  const [upcomingEvents, setUpcomingEvents] = useState([]);
  const [openRecruitments, setOpenRecruitments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      // Add timestamp to bypass stale cache
      const timestamp = Date.now();
      const [myClubsRes, allClubsRes, eventsRes, recruitmentsRes] = await Promise.all([
        userService.getMyClubs(), // Get student's clubs (where they are member/core/president)
        clubService.listClubs({ limit: 8, status: 'active', _t: timestamp }), // Get all active clubs
        eventService.list({ limit: 10, status: 'published', upcoming: true }), // ✅ Only future events
        recruitmentService.list({ limit: 5, status: 'open' }),
      ]);

      // Backend: successResponse(res, { clubs }) → { data: { clubs: [{ club, role }] } }
      const studentClubs = myClubsRes.data?.clubs || [];
      setMyClubsList(studentClubs);
      
      // Backend: successResponse(res, { total, clubs }) → { data: { total, clubs } }
      const activeClubs = allClubsRes.data?.clubs || [];
      setAllClubs(activeClubs);
      
      // Backend: successResponse(res, { total, events }) → { data: { total, events } }
      setUpcomingEvents(eventsRes.data?.events || []);
      
      // Backend: successResponse(res, { total, items }) → { data: { total, items } }
      setOpenRecruitments(recruitmentsRes.data?.items || []);

      setStats({
        myClubsCount: studentClubs.length,
        activeClubs: allClubsRes.data?.total || 0, // Use total from backend (13), not array length (8)
        upcomingEvents: eventsRes.data?.total || 0,
        openRecruitments: recruitmentsRes.data?.total || 0,
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
              <h3>{stats.myClubsCount}/3</h3>
              <p>My Clubs</p>
              {stats.myClubsCount >= 3 && <small style={{ color: '#f59e0b' }}>Maximum reached</small>}
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
          <div className="stat-card">
            <div className="stat-icon">🏛️</div>
            <div className="stat-content">
              <h3>{stats.activeClubs}</h3>
              <p>Active Clubs</p>
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
            <h2>🎯 My Clubs ({myClubsList.length}/3)</h2>
            {myClubsList.length < 3 && (
              <Link to="/recruitments" className="view-all">Join More Clubs →</Link>
            )}
          </div>
          {loading ? (
            <div className="loading">Loading...</div>
          ) : myClubsList.length > 0 ? (
            <div className="clubs-grid">
              {myClubsList.map((membership) => (
                <div key={membership.club._id} className="club-card-small" style={{ border: '2px solid #4f46e5' }}>
                  <div className="club-logo-small">
                    {getClubLogoUrl(membership.club) ? (
                      <img src={getClubLogoUrl(membership.club)} alt={membership.club.name} />
                    ) : (
                      <div className="club-logo-placeholder">{getClubLogoPlaceholder(membership.club)}</div>
                    )}
                  </div>
                  <div className="club-info">
                    <h3>{membership.club.name}</h3>
                    <span className="club-category">{membership.club.category}</span>
                    <span className={`badge ${
                      membership.role === 'president' ? 'badge-danger' : 
                      membership.role === 'core' || membership.role.includes('lead') ? 'badge-warning' : 
                      'badge-info'
                    }`} style={{ marginTop: '4px', textTransform: 'capitalize' }}>
                      {membership.role}
                    </span>
                  </div>
                  {/* ✅ Smart routing: members see detail page, core team sees dashboard */}
                  {membership.role === 'member' ? (
                    <Link to={`/clubs/${membership.club._id}`} className="btn btn-outline btn-sm">
                      View Club
                    </Link>
                  ) : (
                    <Link to={`/clubs/${membership.club._id}/dashboard`} className="btn btn-primary btn-sm">
                      Dashboard
                    </Link>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="no-data">
              <p>You haven't joined any clubs yet.</p>
              <Link to="/recruitments" className="btn btn-primary">Apply to Clubs</Link>
            </div>
          )}
        </div>

        {/* Explore All Clubs */}
        <div className="dashboard-section">
          <div className="section-header">
            <h2>🔍 Explore Clubs</h2>
            <Link to="/clubs" className="view-all">View All →</Link>
          </div>
          {loading ? (
            <div className="loading">Loading...</div>
          ) : allClubs.length > 0 ? (
            <div className="clubs-grid">
              {allClubs.map((club) => (
                <div key={club._id} className="club-card-small">
                  <div className="club-logo-small">
                    {getClubLogoUrl(club) ? (
                      <img src={getClubLogoUrl(club)} alt={club.name} />
                    ) : (
                      <div className="club-logo-placeholder">{getClubLogoPlaceholder(club)}</div>
                    )}
                  </div>
                  <div className="club-info">
                    <h3>{club.name}</h3>
                    <span className="club-category">{club.category}</span>
                  </div>
                  <Link to={`/clubs/${club._id}`} className="btn btn-outline btn-sm">
                    View Details
                  </Link>
                </div>
              ))}
            </div>
          ) : (
            <p className="no-data">No clubs available</p>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default StudentDashboard;
