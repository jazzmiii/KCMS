import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Layout from '../../components/Layout';
import clubService from '../../services/clubService';
import eventService from '../../services/eventService';
import '../../styles/Forms.css';

const CreateEventPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [myClubs, setMyClubs] = useState([]);
  const [formData, setFormData] = useState({
    clubId: '',
    name: '',
    description: '',
    objectives: '',
    date: '',
    time: '',
    duration: '',
    venue: '',
    capacity: '',
    expectedAttendees: '',
    isPublic: true,
    budget: '',
    guestSpeakers: '',
  });
  const [files, setFiles] = useState({
    proposal: null,
    budgetBreakdown: null,
    venuePermission: null,
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchMyClubs();
  }, []);

  const fetchMyClubs = async () => {
    try {
      const response = await clubService.listClubs();
      const managedClubs = response.data.clubs?.filter(club => 
        user?.clubRoles?.some(cr => 
          cr.clubId === club._id && 
          (cr.roles.includes('president') || cr.roles.includes('core'))
        )
      ) || [];
      setMyClubs(managedClubs);
    } catch (error) {
      console.error('Error fetching clubs:', error);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value,
    });
    setError('');
  };

  const handleFileChange = (e) => {
    setFiles({
      ...files,
      [e.target.name]: e.target.files[0],
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const formDataToSend = new FormData();
      
      // Combine date and time
      const dateTime = new Date(`${formData.date}T${formData.time}`);
      formDataToSend.append('clubId', formData.clubId);
      formDataToSend.append('name', formData.name);
      formDataToSend.append('description', formData.description);
      formDataToSend.append('objectives', formData.objectives);
      formDataToSend.append('date', dateTime.toISOString());
      formDataToSend.append('duration', formData.duration);
      formDataToSend.append('venue', formData.venue);
      formDataToSend.append('capacity', formData.capacity);
      formDataToSend.append('expectedAttendees', formData.expectedAttendees);
      formDataToSend.append('isPublic', formData.isPublic);
      
      if (formData.budget) formDataToSend.append('budget', formData.budget);
      if (formData.guestSpeakers) {
        const speakers = formData.guestSpeakers.split(',').map(s => s.trim());
        formDataToSend.append('guestSpeakers', JSON.stringify(speakers));
      }

      // Append files
      if (files.proposal) formDataToSend.append('proposal', files.proposal);
      if (files.budgetBreakdown) formDataToSend.append('budgetBreakdown', files.budgetBreakdown);
      if (files.venuePermission) formDataToSend.append('venuePermission', files.venuePermission);

      const response = await eventService.create(formDataToSend);
      alert('Event created successfully!');
      navigate(`/events/${response.data.event._id}`);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create event. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="form-page">
        <div className="form-container">
          <div className="form-header">
            <h1>Create Event</h1>
            <p>Organize a new event for your club</p>
          </div>

          {error && <div className="alert alert-error">{error}</div>}

          <form onSubmit={handleSubmit} className="form">
            <div className="form-group">
              <label htmlFor="clubId">Select Club *</label>
              <select
                id="clubId"
                name="clubId"
                value={formData.clubId}
                onChange={handleChange}
                required
              >
                <option value="">Choose a club</option>
                {myClubs.map((club) => (
                  <option key={club._id} value={club._id}>
                    {club.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="name">Event Name *</label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="Enter event name"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="description">Description *</label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="Describe the event"
                rows="3"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="objectives">Objectives *</label>
              <textarea
                id="objectives"
                name="objectives"
                value={formData.objectives}
                onChange={handleChange}
                placeholder="What are the objectives of this event?"
                rows="2"
                required
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="date">Date *</label>
                <input
                  type="date"
                  id="date"
                  name="date"
                  value={formData.date}
                  onChange={handleChange}
                  min={new Date().toISOString().split('T')[0]}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="time">Time *</label>
                <input
                  type="time"
                  id="time"
                  name="time"
                  value={formData.time}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="duration">Duration (hours) *</label>
                <input
                  type="number"
                  id="duration"
                  name="duration"
                  value={formData.duration}
                  onChange={handleChange}
                  placeholder="e.g., 2"
                  min="0.5"
                  step="0.5"
                  required
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="venue">Venue *</label>
                <input
                  type="text"
                  id="venue"
                  name="venue"
                  value={formData.venue}
                  onChange={handleChange}
                  placeholder="e.g., Auditorium"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="capacity">Venue Capacity *</label>
                <input
                  type="number"
                  id="capacity"
                  name="capacity"
                  value={formData.capacity}
                  onChange={handleChange}
                  placeholder="e.g., 200"
                  min="1"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="expectedAttendees">Expected Attendees *</label>
                <input
                  type="number"
                  id="expectedAttendees"
                  name="expectedAttendees"
                  value={formData.expectedAttendees}
                  onChange={handleChange}
                  placeholder="e.g., 150"
                  min="1"
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label>
                <input
                  type="checkbox"
                  name="isPublic"
                  checked={formData.isPublic}
                  onChange={handleChange}
                />
                <span>Open to all students (uncheck for members only)</span>
              </label>
            </div>

            <div className="form-group">
              <label htmlFor="budget">Budget (₹)</label>
              <input
                type="number"
                id="budget"
                name="budget"
                value={formData.budget}
                onChange={handleChange}
                placeholder="Enter budget if required"
                min="0"
              />
            </div>

            <div className="form-group">
              <label htmlFor="guestSpeakers">Guest Speakers (comma-separated)</label>
              <input
                type="text"
                id="guestSpeakers"
                name="guestSpeakers"
                value={formData.guestSpeakers}
                onChange={handleChange}
                placeholder="e.g., Dr. John Doe, Prof. Jane Smith"
              />
            </div>

            <div className="form-group">
              <label htmlFor="proposal">Event Proposal (PDF)</label>
              <input
                type="file"
                id="proposal"
                name="proposal"
                accept=".pdf"
                onChange={handleFileChange}
              />
            </div>

            <div className="form-group">
              <label htmlFor="budgetBreakdown">Budget Breakdown (PDF)</label>
              <input
                type="file"
                id="budgetBreakdown"
                name="budgetBreakdown"
                accept=".pdf"
                onChange={handleFileChange}
              />
            </div>

            <div className="form-group">
              <label htmlFor="venuePermission">Venue Permission (PDF)</label>
              <input
                type="file"
                id="venuePermission"
                name="venuePermission"
                accept=".pdf"
                onChange={handleFileChange}
              />
            </div>

            <div className="form-actions">
              <button
                type="button"
                onClick={() => navigate('/events')}
                className="btn btn-outline"
              >
                Cancel
              </button>
              <button type="submit" className="btn btn-primary" disabled={loading}>
                {loading ? 'Creating...' : 'Create Event'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </Layout>
  );
};

export default CreateEventPage;
