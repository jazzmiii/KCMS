import React, { useState } from 'react';
import eventRegistrationService from '../services/eventRegistrationService';
import '../styles/Modal.css';

const EventRegistrationModal = ({ event, onClose, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    registrationType: 'audience',
    club: '',
    performanceType: '',
    performanceDescription: '',
    notes: ''
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await eventRegistrationService.register(event._id, formData);
      
      if (formData.registrationType === 'audience') {
        alert('You have successfully registered for this event!');
      } else {
        alert('Performer registration submitted! The club president will review your application.');
      }
      
      if (onSuccess) onSuccess();
      onClose();
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to register');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });

    // Reset performer fields when switching to audience
    if (name === 'registrationType' && value === 'audience') {
      setFormData({
        ...formData,
        registrationType: 'audience',
        club: '',
        performanceType: '',
        performanceDescription: ''
      });
    }
  };

  const showPerformerRegistrations = event.allowPerformerRegistrations && 
                                     event.participatingClubs?.length > 0;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Register for {event.title}</h2>
          <button className="modal-close" onClick={onClose}>&times;</button>
        </div>

        <form onSubmit={handleSubmit} className="modal-body">
          <div className="form-group">
            <label>Registration Type *</label>
            <select
              name="registrationType"
              value={formData.registrationType}
              onChange={handleChange}
              required
            >
              <option value="audience">Attend as Audience</option>
              {showPerformerRegistrations && (
                <option value="performer">Register as Performer</option>
              )}
            </select>
            {formData.registrationType === 'audience' && (
              <small className="form-hint">You'll receive a confirmation immediately</small>
            )}
            {formData.registrationType === 'performer' && (
              <small className="form-hint">
                Your registration will be reviewed by the club president
              </small>
            )}
          </div>

          {formData.registrationType === 'performer' && (
            <>
              <div className="form-group">
                <label>Select Club *</label>
                <select
                  name="club"
                  value={formData.club}
                  onChange={handleChange}
                  required
                >
                  <option value="">-- Which club do you want to perform with? --</option>
                  {event.participatingClubs?.map(club => (
                    <option key={club._id} value={club._id}>
                      {club.name}
                    </option>
                  ))}
                </select>
                <small className="form-hint">
                  You must be a member of this club to perform
                </small>
              </div>

              <div className="form-group">
                <label>Performance Type *</label>
                <input
                  type="text"
                  name="performanceType"
                  value={formData.performanceType}
                  onChange={handleChange}
                  placeholder="e.g., Dance, Singing, Drama, Comedy"
                  required
                />
              </div>

              <div className="form-group">
                <label>Performance Description</label>
                <textarea
                  name="performanceDescription"
                  value={formData.performanceDescription}
                  onChange={handleChange}
                  placeholder="Describe what you'd like to perform (optional)..."
                  rows="3"
                />
              </div>
            </>
          )}

          <div className="form-group">
            <label>Notes</label>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              placeholder="Any additional information..."
              rows="2"
            />
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Registering...' : 'Register'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EventRegistrationModal;
