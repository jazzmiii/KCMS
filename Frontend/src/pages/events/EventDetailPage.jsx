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
      console.log('📊 Event API Response:', response);
      
      // ✅ FIX: Axios returns full response object
      // Structure: response.data = { status, data: { event } }
      const eventData = response.data?.data?.event || response.data?.event;
      console.log('✅ Event Data:', eventData);
      
      if (!eventData) {
        console.error('❌ No event data in response:', response);
        setEvent(null);
      } else {
        setEvent(eventData);
      }
    } catch (error) {
      console.error('❌ Error fetching event details:', error);
      console.error('Error response:', error.response);
      setEvent(null);
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

  const handleSubmitForApproval = async () => {
    if (!window.confirm('Submit this event for coordinator approval?')) return;
    
    try {
      await eventService.changeStatus(id, 'submit');
      alert('Event submitted for approval!');
      fetchEventDetails();
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to submit event');
    }
  };

  const handleApproveEvent = async () => {
    if (!window.confirm('Approve this event?')) return;
    
    try {
      await eventService.changeStatus(id, 'approve');
      alert('Event approved successfully!');
      fetchEventDetails();
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to approve event');
    }
  };

  const handleAdminApprove = async () => {
    if (!window.confirm('Approve this event as Admin?')) return;
    
    try {
      await eventService.changeStatus(id, 'approve'); // ✅ Use 'approve' not 'approveAdmin'
      alert('Event approved by Admin successfully!');
      fetchEventDetails();
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to approve event');
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

  // ✅ Use backend-provided permission flag (SINGLE SOURCE OF TRUTH)
  const canManage = event?.canManage || false;
  
  // ✅ Check if coordinator is assigned to THIS event's club
  const isCoordinatorForClub = user?.roles?.global === 'coordinator' && 
                                event?.club?.coordinator === user._id;

  const isPublished = event?.status === 'published';

  return (
    <Layout>
      <div className="event-detail-page">
        <div className="event-detail-header">
          <div className="event-date-large">
            <span className="day">{event?.dateTime ? new Date(event.dateTime).getDate() : '--'}</span>
            <span className="month">
              {event?.dateTime ? new Date(event.dateTime).toLocaleString('default', { month: 'short' }) : '--'}
            </span>
            <span className="year">{event?.dateTime ? new Date(event.dateTime).getFullYear() : '--'}</span>
          </div>

          <div className="event-header-info">
            <div className="event-title-row">
              <h1>{event?.title || 'Event Details'}</h1>
              <span className={`badge badge-lg badge-${
                event?.status === 'published' ? 'success' : 
                event?.status === 'ongoing' ? 'info' : 
                event?.status === 'completed' ? 'secondary' : 'warning'
              }`}>
                {event?.status || 'N/A'}
              </span>
            </div>
            <p className="event-club-large">{event?.club?.name || 'Unknown Club'}</p>
            <p className="event-description-large">{event?.description || 'No description available'}</p>

            <div className="event-meta-large">
              <div className="meta-item">
                <span className="meta-icon">📍</span>
                <span>{event?.venue || 'TBD'} (Capacity: {event?.capacity || 'N/A'})</span>
              </div>
              <div className="meta-item">
                <span className="meta-icon">🕐</span>
                <span>
                  {event?.dateTime ? new Date(event.dateTime).toLocaleString('en-US', { 
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  }) : 'Date TBD'}
                </span>
              </div>
              <div className="meta-item">
                <span className="meta-icon">⏱️</span>
                <span>Duration: {event?.duration || 'TBD'} hours</span>
              </div>
              <div className="meta-item">
                <span className="meta-icon">👥</span>
                <span>{event?.expectedAttendees || 'N/A'} expected attendees</span>
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
              
              {/* Club Core/President actions */}
              {canManage && event?.status === 'draft' && (
                <button 
                  onClick={handleSubmitForApproval}
                  className="btn btn-primary"
                >
                  Submit for Approval
                </button>
              )}
              
              {/* Coordinator approval button */}
              {isCoordinatorForClub && event?.status === 'pending_coordinator' && (
                <button 
                  onClick={handleApproveEvent}
                  className="btn btn-success"
                >
                  ✓ Approve Event
                </button>
              )}
              
              {/* Admin approval button */}
              {user?.roles?.global === 'admin' && event?.status === 'pending_admin' && (
                <button 
                  onClick={handleAdminApprove}
                  className="btn btn-success"
                >
                  ✓ Approve as Admin
                </button>
              )}
              
              {/* Status transition buttons for ongoing events */}
              {canManage && event?.status === 'published' && (
                <button 
                  onClick={async () => {
                    try {
                      await eventService.changeStatus(id, 'start');
                      alert('Event started!');
                      fetchEventDetails();
                    } catch (err) {
                      alert(err.response?.data?.message || 'Failed to start event');
                    }
                  }}
                  className="btn btn-primary"
                >
                  Start Event
                </button>
              )}
              
              {canManage && event?.status === 'ongoing' && (
                <button 
                  onClick={async () => {
                    try {
                      await eventService.changeStatus(id, 'complete');
                      alert('Event completed!');
                      fetchEventDetails();
                    } catch (err) {
                      alert(err.response?.data?.message || 'Failed to complete event');
                    }
                  }}
                  className="btn btn-success"
                >
                  Complete Event
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="event-detail-content">
          <div className="info-card">
            <h3>Event Objectives</h3>
            <p>{event?.objectives || 'No objectives specified'}</p>
          </div>

          {event?.isPublic !== undefined && (
            <div className="info-card">
              <h3>Audience</h3>
              <p>{event?.isPublic ? 'Open to all students' : 'Members only'}</p>
            </div>
          )}

          {event?.budget && (
            <div className="info-card">
              <h3>Budget</h3>
              <p>₹{event?.budget}</p>
            </div>
          )}

          {event?.guestSpeakers && event?.guestSpeakers.length > 0 && (
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
