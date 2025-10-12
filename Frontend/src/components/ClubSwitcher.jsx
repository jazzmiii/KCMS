import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import userService from '../services/userService';
import '../styles/ClubSwitcher.css';

const ClubSwitcher = () => {
  const navigate = useNavigate();
  const [myClubs, setMyClubs] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchMyClubs();
  }, []);

  const fetchMyClubs = async () => {
    setLoading(true);
    try {
      // Get ALL clubs where user is a member (including regular members)
      const response = await userService.getMyClubs();
      setMyClubs(response.data.clubs || []);
    } catch (error) {
      console.error('Error fetching clubs:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleClubSelect = (club) => {
    // Management roles go to dashboard, regular members go to public page
    const managementRoles = ['core', 'president', 'vicePresident', 'secretary', 'treasurer', 'leadPR', 'leadTech'];
    
    if (managementRoles.includes(club.userRole)) {
      navigate(`/clubs/${club._id}/dashboard`);
    } else {
      navigate(`/clubs/${club._id}`);
    }
    setIsOpen(false);
  };

  if (myClubs.length === 0) {
    return null; // Don't show if user is not a member of any club
  }

  return (
    <div className="club-switcher">
      <button 
        className="club-switcher-toggle"
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className="icon">🎯</span>
        <span className="label">My Clubs ({myClubs.length})</span>
        <span className="arrow">{isOpen ? '▲' : '▼'}</span>
      </button>

      {isOpen && (
        <div className="club-switcher-dropdown">
          <div className="dropdown-header">
            <h4>Switch Club Dashboard</h4>
            <button onClick={() => setIsOpen(false)} className="close-btn">✕</button>
          </div>
          
          {loading ? (
            <div className="dropdown-loading">Loading...</div>
          ) : (
            <div className="clubs-list">
              {myClubs.map((club) => (
                <button
                  key={club._id}
                  className="club-item"
                  onClick={() => handleClubSelect(club)}
                >
                  <div className="club-logo">
                    {club.logoUrl ? (
                      <img src={club.logoUrl} alt={club.name} />
                    ) : (
                      <div className="logo-placeholder">{club.name.charAt(0)}</div>
                    )}
                  </div>
                  <div className="club-info">
                    <div className="club-name">{club.name}</div>
                    <div className="club-meta">
                      <span className="category">{club.category}</span>
                      <span className="role-badge">{club.userRole}</span>
                    </div>
                  </div>
                  <span className="arrow-icon">→</span>
                </button>
              ))}
            </div>
          )}

          <div className="dropdown-footer">
            <button 
              onClick={() => {
                navigate('/clubs');
                setIsOpen(false);
              }}
              className="view-all-btn"
            >
              View All Clubs
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClubSwitcher;
