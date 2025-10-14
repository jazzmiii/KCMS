import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Layout from '../../components/Layout';
import eventService from '../../services/eventService';
import '../../styles/Events.css';

const EventDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [rsvpLoading, setRsvpLoading] = useState(false);

  useEffect(() => {
    fetchEventDetails();
  }, [id]);

  const fetchEventDetails = async () => {
    try {
      const response = await eventService.getById(id);
      // Backend: successResponse(res, { event }) → { status, data: { event: {...} } }
      // eventService returns response.data → { status, data: { event: {...} } }
      setEvent(response.data.event);
    } catch (error) {
      console.error('Error fetching event details:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRSVP = async () => {
    setRsvpLoading(true);
    try {
      await eventService.rsvp(id);
      alert('RSVP successful!');
      fetchEventDetails();
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to RSVP');
    } finally {
      setRsvpLoading(false);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Loading event details...</p>
        </div>
      </Layout>
    );
  }

  if (!event) {
    return (
      <Layout>
        <div className="error-container">
          <h2>Event not found</h2>
          <button onClick={() => navigate('/events')} className="btn btn-primary">
            Back to Events
          </button>
        </div>
      </Layout>
    );
  }

  const canManage = user?.roles?.scoped?.some(cr => 
    cr.club?.toString() === event.clubId?._id?.toString() && 
    (cr.role === 'president' || cr.role === 'core')
  ) || user?.roles?.global === 'admin' || user?.roles?.global === 'coordinator';

  const isPublished = event.status === 'published';

  return (
    <Layout>
      <div className="event-detail-page">
        <div className="event-detail-header">
          <div className="event-date-large">
            <span className="day">{new Date(event.date).getDate()}</span>
            <span className="month">
              {new Date(event.date).toLocaleString('default', { month: 'short' })}
            </span>
            <span className="year">{new Date(event.date).getFullYear()}</span>
          </div>

          <div className="event-header-info">
            <div className="event-title-row">
              <h1>{event.name}</h1>
              <span className={`badge badge-lg badge-${
                event.status === 'published' ? 'success' : 
                event.status === 'ongoing' ? 'info' : 
                event.status === 'completed' ? 'secondary' : 'warning'
              }`}>
                {event.status}
              </span>
            </div>
            <p className="event-club-large">{event.clubId?.name || 'Unknown Club'}</p>
            <p className="event-description-large">{event.description}</p>

            <div className="event-meta-large">
              <div className="meta-item">
                <span className="meta-icon">📍</span>
                <span>{event.venue} (Capacity: {event.capacity})</span>
              </div>
              <div className="meta-item">
                <span className="meta-icon">🕐</span>
                <span>
                  {new Date(event.date).toLocaleString('en-US', { 
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </span>
              </div>
              <div className="meta-item">
                <span className="meta-icon">⏱️</span>
                <span>Duration: {event.duration} hours</span>
              </div>
              <div className="meta-item">
                <span className="meta-icon">👥</span>
                <span>{event.expectedAttendees} expected attendees</span>
              </div>
            </div>

            <div className="event-actions">
              {isPublished && !canManage && (
                <button 
                  onClick={handleRSVP} 
                  className="btn btn-primary"
                  disabled={rsvpLoading}
                >
                  {rsvpLoading ? 'Processing...' : 'RSVP Now'}
                </button>
              )}
              {canManage && (
                <button className="btn btn-outline">
                  Manage Event
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="event-detail-content">
          <div className="info-card">
            <h3>Event Objectives</h3>
            <p>{event.objectives || 'No objectives specified'}</p>
          </div>

          {event.isPublic !== undefined && (
            <div className="info-card">
              <h3>Audience</h3>
              <p>{event.isPublic ? 'Open to all students' : 'Members only'}</p>
            </div>
          )}

          {event.budget && (
            <div className="info-card">
              <h3>Budget</h3>
              <p>₹{event.budget}</p>
            </div>
          )}

          {event.guestSpeakers && event.guestSpeakers.length > 0 && (
            <div className="info-card">
              <h3>Guest Speakers</h3>
              <ul>
                {event.guestSpeakers.map((speaker, index) => (
                  <li key={index}>{speaker}</li>
                ))}
              </ul>
            </div>
          )}

          {canManage && (
            <div className="info-card">
              <h3>Management Actions</h3>
              <div className="management-actions">
                <button className="btn btn-outline">View Attendance</button>
                <button className="btn btn-outline">Upload Photos</button>
                <button className="btn btn-outline">Generate Report</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default EventDetailPage;
