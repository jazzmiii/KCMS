import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Layout from '../../components/Layout';
import clubService from '../../services/clubService';
import eventService from '../../services/eventService';
import recruitmentService from '../../services/recruitmentService';
import userService from '../../services/userService';
import '../../styles/ClubDashboard.css';

const ClubDashboard = () => {
  const { clubId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [club, setClub] = useState(null);
  const [stats, setStats] = useState({
    totalMembers: 0,
    upcomingEvents: 0,
    activeRecruitments: 0,
    pendingApplications: 0,
  });
  const [events, setEvents] = useState([]);
  const [recruitments, setRecruitments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [userRole, setUserRole] = useState(null);
  const [canManage, setCanManage] = useState(false);

  useEffect(() => {
    fetchClubDashboardData();
  }, [clubId]);

  const fetchClubDashboardData = async () => {
    try {
      const [clubRes, eventsRes, recruitmentsRes, myClubsRes] = await Promise.all([
        clubService.getClub(clubId),
        eventService.list({ club: clubId, limit: 10 }),
        recruitmentService.list({ club: clubId, limit: 10 }),
        userService.getMyClubs() // Get all user's clubs with roles
      ]);

      const clubData = clubRes.data.club || clubRes.data;
      setClub(clubData);
      
      const eventsData = eventsRes.data.events || [];
      const recruitmentsData = recruitmentsRes.data.recruitments || [];
      
      setEvents(eventsData);
      setRecruitments(recruitmentsData);

      // Calculate stats
      const upcomingEventsCount = eventsData.filter(e => 
        ['published', 'approved'].includes(e.status)
      ).length;
      
      const activeRecruitmentsCount = recruitmentsData.filter(r => 
        r.status === 'open'
      ).length;
      
      const pendingAppsCount = recruitmentsData.reduce((sum, rec) => 
        sum + (rec.applicationCount || 0), 0
      );

      setStats({
        totalMembers: clubData.memberCount || 0,
        upcomingEvents: upcomingEventsCount,
        activeRecruitments: activeRecruitmentsCount,
        pendingApplications: pendingAppsCount,
      });

      // Check if user has permission to manage this club
      const myClubs = myClubsRes.data.clubs || [];
      const membership = myClubs.find(c => c._id === clubId);
      
      if (membership) {
        setUserRole(membership.userRole);
        const managementRoles = ['core', 'president', 'vicePresident', 'secretary', 'treasurer', 'leadPR', 'leadTech'];
        const hasManagementRole = managementRoles.includes(membership.userRole);
        const isAdmin = user?.roles?.global === 'admin' || user?.roles?.global === 'coordinator';
        setCanManage(hasManagementRole || isAdmin);
      } else {
        // Check if user is admin/coordinator
        const isAdmin = user?.roles?.global === 'admin' || user?.roles?.global === 'coordinator';
        setCanManage(isAdmin);
      }
    } catch (error) {
      console.error('Error fetching club dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Loading club dashboard...</p>
        </div>
      </Layout>
    );
  }

  if (!club) {
    return (
      <Layout>
        <div className="error-container">
          <h2>Club not found</h2>
          <Link to="/clubs" className="btn btn-primary">Back to Clubs</Link>
        </div>
      </Layout>
    );
  }

  if (!canManage) {
    return (
      <Layout>
        <div className="error-container">
          <h2>Access Denied</h2>
          <p>You don't have permission to manage this club</p>
          <Link to="/clubs" className="btn btn-primary">Back to Clubs</Link>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="club-dashboard">
        {/* Club Header */}
        <div className="club-dashboard-header">
          <div className="club-header-content">
            <div className="club-logo-container">
              {club.logo ? (
                <img src={club.logo} alt={club.name} className="club-logo" />
              ) : (
                <div className="club-logo-placeholder">
                  {club.name.charAt(0)}
                </div>
              )}
            </div>
            <div className="club-info">
              <h1>{club.name}</h1>
              <p className="club-category">{club.category}</p>
              {userRole && (
                <div className="user-roles">
                  <span className="role-badge">{userRole}</span>
                </div>
              )}
            </div>
          </div>
          <div className="header-actions">
            <Link to={`/clubs/${clubId}/edit`} className="btn btn-outline">
              ⚙️ Edit Club
            </Link>
            <Link to={`/clubs/${clubId}`} className="btn btn-outline">
              👁️ View Public Page
            </Link>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="stats-grid">
          <div className="stat-card stat-primary">
            <div className="stat-icon">👥</div>
            <div className="stat-content">
              <h3>{stats.totalMembers}</h3>
              <p>Total Members</p>
            </div>
          </div>
          <div className="stat-card stat-success">
            <div className="stat-icon">📅</div>
            <div className="stat-content">
              <h3>{stats.upcomingEvents}</h3>
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
            <div className="stat-icon">📋</div>
            <div className="stat-content">
              <h3>{stats.pendingApplications}</h3>
              <p>Pending Applications</p>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="quick-actions-section">
          <h2>Quick Actions</h2>
          <div className="actions-grid">
            <button 
              onClick={() => navigate(`/events/create?clubId=${clubId}`)} 
              className="action-card action-primary"
            >
              <span className="action-icon">➕</span>
              <h3>Create Event</h3>
              <p>Organize a new event</p>
            </button>
            <button 
              onClick={() => navigate(`/recruitments/create?clubId=${clubId}`)} 
              className="action-card action-success"
            >
              <span className="action-icon">📝</span>
              <h3>Start Recruitment</h3>
              <p>Recruit new members</p>
            </button>
            <button 
              onClick={() => setActiveTab('members')} 
              className="action-card action-info"
            >
              <span className="action-icon">👥</span>
              <h3>Manage Members</h3>
              <p>View and manage members</p>
            </button>
            <button 
              onClick={() => setActiveTab('documents')} 
              className="action-card action-warning"
            >
              <span className="action-icon">📄</span>
              <h3>Documents</h3>
              <p>Upload and manage docs</p>
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="tabs">
          <button
            className={`tab ${activeTab === 'overview' ? 'active' : ''}`}
            onClick={() => setActiveTab('overview')}
          >
            Overview
          </button>
          <button
            className={`tab ${activeTab === 'events' ? 'active' : ''}`}
            onClick={() => setActiveTab('events')}
          >
            Events ({events.length})
          </button>
          <button
            className={`tab ${activeTab === 'recruitments' ? 'active' : ''}`}
            onClick={() => setActiveTab('recruitments')}
          >
            Recruitments ({recruitments.length})
          </button>
          <button
            className={`tab ${activeTab === 'members' ? 'active' : ''}`}
            onClick={() => setActiveTab('members')}
          >
            Members ({stats.totalMembers})
          </button>
          <button
            className={`tab ${activeTab === 'documents' ? 'active' : ''}`}
            onClick={() => setActiveTab('documents')}
          >
            Documents
          </button>
        </div>

        {/* Tab Content */}
        <div className="tab-content">
          {activeTab === 'overview' && (
            <div className="overview-section">
              <div className="overview-grid">
                <div className="info-card">
                  <h3>About {club.name}</h3>
                  <p>{club.description || 'No description available'}</p>
                  <div className="club-details">
                    <div className="detail-item">
                      <strong>Category:</strong> {club.category}
                    </div>
                    <div className="detail-item">
                      <strong>Status:</strong> 
                      <span className={`badge badge-${club.status === 'active' ? 'success' : 'warning'}`}>
                        {club.status}
                      </span>
                    </div>
                    <div className="detail-item">
                      <strong>Coordinator:</strong> {club.coordinatorId?.name || 'N/A'}
                    </div>
                  </div>
                </div>

                <div className="info-card">
                  <h3>Recent Activity</h3>
                  <div className="activity-list">
                    {events.slice(0, 3).map((event) => (
                      <div key={event._id} className="activity-item">
                        <span className="activity-icon">📅</span>
                        <div className="activity-info">
                          <p><strong>{event.title}</strong></p>
                          <p className="activity-meta">
                            {new Date(event.dateTime).toLocaleDateString()} • {event.status}
                          </p>
                        </div>
                      </div>
                    ))}
                    {events.length === 0 && (
                      <p className="no-data">No recent activity</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'events' && (
            <div className="events-section">
              <div className="section-header">
                <h2>Club Events</h2>
                <Link to={`/events/create?clubId=${clubId}`} className="btn btn-primary">
                  + Create Event
                </Link>
              </div>
              {events.length > 0 ? (
                <div className="events-list">
                  {events.map((event) => (
                    <div key={event._id} className="event-card">
                      <div className="event-date-badge">
                        <span className="day">{new Date(event.dateTime).getDate()}</span>
                        <span className="month">
                          {new Date(event.dateTime).toLocaleString('default', { month: 'short' })}
                        </span>
                      </div>
                      <div className="event-details">
                        <h3>{event.title}</h3>
                        <p className="event-description">{event.description}</p>
                        <div className="event-meta">
                          <span>📍 {event.venue || 'TBA'}</span>
                          <span>🕐 {new Date(event.dateTime).toLocaleTimeString('en-US', { 
                            hour: '2-digit', 
                            minute: '2-digit' 
                          })}</span>
                          <span className={`badge badge-${
                            event.status === 'published' ? 'success' : 
                            event.status === 'approved' ? 'info' : 'warning'
                          }`}>
                            {event.status}
                          </span>
                        </div>
                      </div>
                      <div className="event-actions">
                        <Link to={`/events/${event._id}`} className="btn btn-outline btn-sm">
                          View Details
                        </Link>
                        <Link to={`/events/${event._id}/edit`} className="btn btn-primary btn-sm">
                          Edit
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="no-data">
                  <p>No events created yet</p>
                  <Link to={`/events/create?clubId=${clubId}`} className="btn btn-primary">
                    Create Your First Event
                  </Link>
                </div>
              )}
            </div>
          )}

          {activeTab === 'recruitments' && (
            <div className="recruitments-section">
              <div className="section-header">
                <h2>Recruitments</h2>
                <Link to={`/recruitments/create?clubId=${clubId}`} className="btn btn-primary">
                  + Start Recruitment
                </Link>
              </div>
              {recruitments.length > 0 ? (
                <div className="recruitments-grid">
                  {recruitments.map((recruitment) => (
                    <div key={recruitment._id} className="recruitment-card">
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
                      <div className="card-actions">
                        <Link to={`/recruitments/${recruitment._id}`} className="btn btn-outline btn-sm">
                          View Details
                        </Link>
                        <Link to={`/recruitments/${recruitment._id}/applications`} className="btn btn-primary btn-sm">
                          Review Applications
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="no-data">
                  <p>No recruitments yet</p>
                  <Link to={`/recruitments/create?clubId=${clubId}`} className="btn btn-primary">
                    Start Your First Recruitment
                  </Link>
                </div>
              )}
            </div>
          )}

          {activeTab === 'members' && (
            <div className="members-section">
              <div className="section-header">
                <h2>Club Members</h2>
                <button className="btn btn-primary">+ Add Member</button>
              </div>
              <div className="info-card">
                <p>Total Members: {stats.totalMembers}</p>
                <p className="text-muted">Member management feature coming soon...</p>
              </div>
            </div>
          )}

          {activeTab === 'documents' && (
            <div className="documents-section">
              <div className="section-header">
                <h2>Club Documents</h2>
                <button className="btn btn-primary">+ Upload Document</button>
              </div>
              <div className="info-card">
                <p className="text-muted">Document management feature coming soon...</p>
                <p>You'll be able to upload and manage:</p>
                <ul>
                  <li>Meeting minutes</li>
                  <li>Event reports</li>
                  <li>Budget documents</li>
                  <li>Member lists</li>
                  <li>Certificates and achievements</li>
                </ul>
              </div>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default ClubDashboard;
