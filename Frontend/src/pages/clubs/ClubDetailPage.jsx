import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Layout from '../../components/Layout';
import clubService from '../../services/clubService';
import eventService from '../../services/eventService';
import '../../styles/Clubs.css';

const ClubDetailPage = () => {
  const { clubId } = useParams();
  const { user } = useAuth();
  const [club, setClub] = useState(null);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('about');

  useEffect(() => {
    fetchClubDetails();
  }, [clubId]);

  const fetchClubDetails = async () => {
    try {
      const [clubRes, eventsRes] = await Promise.all([
        clubService.getClub(clubId),
        eventService.list({ clubId, limit: 10 }),
      ]);
      setClub(clubRes.data.club);
      setEvents(eventsRes.data.events || []);
    } catch (error) {
      console.error('Error fetching club details:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Loading club details...</p>
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

  const canManage = user?.roles?.global === 'admin' || 
                    user?.roles?.global === 'coordinator' ||
                    user?.clubRoles?.some(cr => cr.clubId === clubId && cr.roles.includes('president'));

  return (
    <Layout>
      <div className="club-detail-page">
        {/* Club Header */}
        <div className="club-header">
          <div className="club-header-content">
            <div className="club-logo-large">
              {club.logo ? (
                <img src={club.logo} alt={club.name} />
              ) : (
                <div className="club-logo-placeholder-large">
                  {club.name.charAt(0)}
                </div>
              )}
            </div>
            <div className="club-header-info">
              <div className="club-title-row">
                <h1>{club.name}</h1>
                <span className={`badge badge-${club.status === 'active' ? 'success' : 'warning'}`}>
                  {club.status}
                </span>
              </div>
              <span className="club-category-large">{club.category}</span>
              <p className="club-description-large">{club.description}</p>
              
              <div className="club-meta">
                <div className="meta-item">
                  <span className="meta-icon">👥</span>
                  <span>{club.memberCount || 0} Members</span>
                </div>
                <div className="meta-item">
                  <span className="meta-icon">📅</span>
                  <span>{events.length} Events</span>
                </div>
                <div className="meta-item">
                  <span className="meta-icon">👨‍🏫</span>
                  <span>Coordinator: {club.coordinatorId?.name || 'N/A'}</span>
                </div>
              </div>

              <div className="club-actions">
                {canManage && (
                  <Link to={`/clubs/${clubId}/edit`} className="btn btn-primary">
                    Edit Club
                  </Link>
                )}
                <Link to="/recruitments" className="btn btn-outline">
                  View Recruitments
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="tabs">
          <button
            className={`tab ${activeTab === 'about' ? 'active' : ''}`}
            onClick={() => setActiveTab('about')}
          >
            About
          </button>
          <button
            className={`tab ${activeTab === 'events' ? 'active' : ''}`}
            onClick={() => setActiveTab('events')}
          >
            Events
          </button>
          <button
            className={`tab ${activeTab === 'members' ? 'active' : ''}`}
            onClick={() => setActiveTab('members')}
          >
            Members
          </button>
        </div>

        {/* Tab Content */}
        <div className="tab-content">
          {activeTab === 'about' && (
            <div className="about-section">
              <div className="info-card">
                <h3>Vision</h3>
                <p>{club.vision || 'No vision statement available'}</p>
              </div>
              <div className="info-card">
                <h3>Mission</h3>
                <p>{club.mission || 'No mission statement available'}</p>
              </div>
              {club.socialMedia && Object.keys(club.socialMedia).length > 0 && (
                <div className="info-card">
                  <h3>Connect With Us</h3>
                  <div className="social-links">
                    {club.socialMedia.instagram && (
                      <a href={club.socialMedia.instagram} target="_blank" rel="noopener noreferrer" className="social-link">
                        📷 Instagram
                      </a>
                    )}
                    {club.socialMedia.twitter && (
                      <a href={club.socialMedia.twitter} target="_blank" rel="noopener noreferrer" className="social-link">
                        🐦 Twitter
                      </a>
                    )}
                    {club.socialMedia.linkedin && (
                      <a href={club.socialMedia.linkedin} target="_blank" rel="noopener noreferrer" className="social-link">
                        💼 LinkedIn
                      </a>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'events' && (
            <div className="events-section">
              {events.length > 0 ? (
                <div className="events-list">
                  {events.map((event) => (
                    <div key={event._id} className="event-card">
                      <div className="event-date-badge">
                        <span className="day">{new Date(event.date).getDate()}</span>
                        <span className="month">
                          {new Date(event.date).toLocaleString('default', { month: 'short' })}
                        </span>
                      </div>
                      <div className="event-details">
                        <h3>{event.name}</h3>
                        <p className="event-description">{event.description}</p>
                        <div className="event-meta">
                          <span>📍 {event.venue}</span>
                          <span>🕐 {new Date(event.date).toLocaleTimeString('en-US', { 
                            hour: '2-digit', 
                            minute: '2-digit' 
                          })}</span>
                          <span className={`badge badge-${event.status === 'published' ? 'success' : 'warning'}`}>
                            {event.status}
                          </span>
                        </div>
                      </div>
                      <Link to={`/events/${event._id}`} className="btn btn-outline">
                        View Details
                      </Link>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="no-data">
                  <p>No events scheduled yet</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'members' && (
            <div className="members-section">
              <div className="info-card">
                <h3>Club Members</h3>
                <p>Member list is only visible to club members and coordinators.</p>
                {canManage && (
                  <div className="member-stats">
                    <p>Total Members: {club.memberCount || 0}</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default ClubDetailPage;
