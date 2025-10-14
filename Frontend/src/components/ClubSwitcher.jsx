import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import userService from '../services/userService';
import { getClubLogoUrl, getClubLogoPlaceholder } from '../utils/imageUtils';
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

  const handleClubSelect = (clubData) => {
    // Management roles go to dashboard, regular members go to public page
    const managementRoles = ['core', 'president', 'coordinator'];
    
    // Handle both old and new API response formats
    const clubId = clubData.club?._id || clubData._id;
    const role = clubData.role || clubData.userRole;
    
    if (managementRoles.includes(role)) {
      navigate(`/clubs/${clubId}/dashboard`);
    } else {
      navigate(`/clubs/${clubId}`);
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
                    {getClubLogoUrl(club) ? (
                      <img src={getClubLogoUrl(club)} alt={club.name} />
                    ) : (
                      <div className="logo-placeholder">{getClubLogoPlaceholder(club)}</div>
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
