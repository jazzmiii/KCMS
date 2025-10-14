import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Layout from '../../components/Layout';
import eventService from '../../services/eventService';
import '../../styles/Events.css';

const EventsPage = () => {
  const { user } = useAuth();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('published');

  useEffect(() => {
    fetchEvents();
  }, [filter]);

  const fetchEvents = async () => {
    setLoading(true);
    try {
      const params = {};
      if (filter !== 'all') params.status = filter;

      const response = await eventService.list(params);
      setEvents(response.data?.data?.events || []);
    } catch (error) {
      console.error('Error fetching events:', error);
    } finally {
      setLoading(false);
    }
  };

  const canCreateEvent = user?.roles?.scoped?.some(cr => 
    cr.role === 'president' || cr.role === 'core'
  ) || user?.roles?.global === 'admin';

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'published': return 'badge-success';
      case 'ongoing': return 'badge-info';
      case 'completed': return 'badge-secondary';
      case 'pending_coordinator': return 'badge-warning';
      default: return 'badge-info';
    }
  };

  return (
    <Layout>
      <div className="events-page">
        <div className="page-header">
          <div>
            <h1>Events</h1>
            <p>Discover and participate in exciting club events</p>
          </div>
          {canCreateEvent && (
            <Link to="/events/create" className="btn btn-primary">
              + Create Event
            </Link>
          )}
        </div>

        {/* Filters */}
        <div className="filters-section">
          <div className="filter-buttons">
            <button
              className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
              onClick={() => setFilter('all')}
            >
              All
            </button>
            <button
              className={`filter-btn ${filter === 'published' ? 'active' : ''}`}
              onClick={() => setFilter('published')}
            >
              Upcoming
            </button>
            <button
              className={`filter-btn ${filter === 'ongoing' ? 'active' : ''}`}
              onClick={() => setFilter('ongoing')}
            >
              Ongoing
            </button>
            <button
              className={`filter-btn ${filter === 'completed' ? 'active' : ''}`}
              onClick={() => setFilter('completed')}
            >
              Completed
            </button>
          </div>
        </div>

        {/* Events List */}
        {loading ? (
          <div className="loading-container">
            <div className="spinner"></div>
            <p>Loading events...</p>
          </div>
        ) : events.length > 0 ? (
          <div className="events-grid">
            {events.map((event) => {
              const eventDate = new Date(event.dateTime || event.date);
              const isValidDate = !isNaN(eventDate.getTime());
              
              return (
              <div key={event._id} className="event-card">
                <div className="event-card-header">
                  <div className="event-date-badge">
                    <span className="day">{isValidDate ? eventDate.getDate() : '--'}</span>
                    <span className="month">
                      {isValidDate ? eventDate.toLocaleString('default', { month: 'short' }) : '---'}
                    </span>
                  </div>
                  <span className={`badge ${getStatusBadgeClass(event.status)}`}>
                    {event.status}
                  </span>
                </div>

                <div className="event-card-body">
                  <h3>{event.title || event.name}</h3>
                  <p className="event-club">{event.club?.name || 'Unknown Club'}</p>
                  <p className="event-description">{event.description}</p>

                  <div className="event-meta">
                    <div className="meta-item">
                      <span className="meta-icon">📍</span>
                      <span>{event.venue || 'TBA'}</span>
                    </div>
                    <div className="meta-item">
                      <span className="meta-icon">🕐</span>
                      <span>
                        {isValidDate ? eventDate.toLocaleTimeString('en-US', { 
                          hour: '2-digit', 
                          minute: '2-digit' 
                        }) : 'Time TBA'}
                      </span>
                    </div>
                    <div className="meta-item">
                      <span className="meta-icon">👥</span>
                      <span>{event.expectedAttendees || event.capacity || 0} expected</span>
                    </div>
                  </div>
                </div>

                <div className="event-card-footer">
                  <Link to={`/events/${event._id}`} className="btn btn-outline btn-block">
                    View Details
                  </Link>
                </div>
              </div>
            );
            })}
          </div>
        ) : (
          <div className="no-results">
            <p>No events found</p>
            {filter !== 'all' && (
              <button onClick={() => setFilter('all')} className="btn btn-outline">
                View All Events
              </button>
            )}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default EventsPage;
