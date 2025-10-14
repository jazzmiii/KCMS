import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import eventRegistrationService from '../services/eventRegistrationService';
import '../styles/Registrations.css';

const PendingPerformerRegistrations = ({ clubId, eventId = null }) => {
  const [registrations, setRegistrations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPendingRegistrations();
  }, [clubId, eventId]);

  const fetchPendingRegistrations = async () => {
    try {
      const response = await eventRegistrationService.listClubPendingRegistrations(
        clubId,
        eventId
      );
      setRegistrations(response.data || []);
    } catch (error) {
      console.error('Error fetching pending registrations:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleReview = async (registrationId, status, rejectionReason = '') => {
    const action = status === 'approved' ? 'approve' : 'reject';
    if (!window.confirm(`Are you sure you want to ${action} this performer registration?`)) {
      return;
    }

    try {
      await eventRegistrationService.reviewRegistration(registrationId, {
        status,
        rejectionReason
      });

      alert(`Performer ${status === 'approved' ? 'approved' : 'rejected'} successfully!`);
      fetchPendingRegistrations();
    } catch (error) {
      alert(error.response?.data?.message || `Failed to ${action} registration`);
    }
  };

  if (loading) {
    return <div className="loading">Loading pending registrations...</div>;
  }

  if (registrations.length === 0) {
    return (
      <div className="no-data">
        <p>No pending performer registrations at the moment.</p>
      </div>
    );
  }

  return (
    <div className="pending-registrations">
      <h3>🎭 Pending Performer Registrations ({registrations.length})</h3>
      <p className="text-muted">Review and approve/reject performer applications</p>

      <div className="registrations-list">
        {registrations.map((registration) => (
          <div key={registration._id} className="registration-card">
            <div className="registration-header">
              <div className="student-info">
                <h4>{registration.user?.name || 'Unknown Student'}</h4>
                <small>{registration.user?.email}</small>
                <small>{registration.user?.rollNumber}</small>
              </div>
              <span className="badge badge-warning">Pending Review</span>
            </div>

            <div className="registration-body">
              <div className="registration-details">
                {!eventId && (
                  <p><strong>📅 Event:</strong> {registration.event?.title}</p>
                )}
                <p><strong>🎭 Performance Type:</strong> {registration.performanceType}</p>
                
                {registration.performanceDescription && (
                  <p><strong>Description:</strong> {registration.performanceDescription}</p>
                )}

                {registration.notes && (
                  <p><strong>📝 Notes:</strong> {registration.notes}</p>
                )}

                <p className="text-muted">
                  <strong>Registered:</strong>{' '}
                  {new Date(registration.createdAt).toLocaleString()}
                </p>
              </div>
            </div>

            <div className="registration-footer">
              <button
                className="btn btn-sm btn-success"
                onClick={() => handleReview(registration._id, 'approved')}
              >
                ✅ Approve
              </button>
              <button
                className="btn btn-sm btn-danger"
                onClick={() => {
                  const reason = prompt('Rejection reason (optional):');
                  if (reason !== null) { // null means cancelled
                    handleReview(registration._id, 'rejected', reason);
                  }
                }}
              >
                ❌ Reject
              </button>
              {!eventId && (
                <Link 
                  to={`/events/${registration.event?._id}`}
                  className="btn btn-sm btn-outline"
                >
                  View Event
                </Link>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PendingPerformerRegistrations;
