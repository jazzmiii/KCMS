import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Layout from '../../components/Layout';
import clubService from '../../services/clubService';
import eventService from '../../services/eventService';
import userService from '../../services/userService';
import recruitmentService from '../../services/recruitmentService';
import { getClubLogoUrl, getClubLogoPlaceholder } from '../../utils/imageUtils';
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
  const [members, setMembers] = useState([]);
  const [showAddMemberModal, setShowAddMemberModal] = useState(false);
  const [selectedMember, setSelectedMember] = useState(null);
  const [showEditRoleModal, setShowEditRoleModal] = useState(false);

  useEffect(() => {
    fetchClubDashboardData();
  }, [clubId]);

  useEffect(() => {
    if (activeTab === 'members' && clubId) {
      fetchMembers();
    }
  }, [activeTab, clubId]);

  const fetchClubDashboardData = async () => {
    try {
      const [clubRes, eventsRes, recruitmentsRes, myClubsRes] = await Promise.all([
        clubService.getClub(clubId),
        eventService.list({ club: clubId, limit: 10 }),
        recruitmentService.list({ club: clubId, limit: 10 }),
        userService.getMyClubs() // Get all user's clubs with roles
      ]);

      // Backend: successResponse(res, { club }) → { status, data: { club } }
      const clubData = clubRes.data?.club;
      setClub(clubData);
      
      // Backend: successResponse(res, { total, events }) → { status, data: { total, events } }
      const eventsData = eventsRes.data?.events || [];
      // Backend: successResponse(res, { total, items }) → { status, data: { total, items } }
      const recruitmentsData = recruitmentsRes.data?.items || [];
      
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
      // Backend: successResponse(res, { clubs }) → { status, data: { clubs } }
      const myClubs = myClubsRes.data?.clubs || [];
      const membership = myClubs.find(c => c.club?._id === clubId);
      
      if (membership) {
        // ✅ Backend returns: { club, role }
        // role can be: 'member' | 'core' | 'vicePresident' | 'secretary' | 'treasurer' | 'leadPR' | 'leadTech' | 'president'
        const role = membership.role;
        setUserRole(role); // Store role for display
        
        // ✅ Define core team roles
        const coreRoles = ['core', 'vicePresident', 'secretary', 'treasurer', 'leadPR', 'leadTech'];
        
        // ✅ Determine management permissions based on role hierarchy
        const isPresident = role === 'president';
        const isCoreTeam = coreRoles.includes(role);
        const isAdmin = user?.roles?.global === 'admin';
        
        // ✅ Coordinators can only VIEW if assigned to this club
        const isAssignedCoordinator = user?.roles?.global === 'coordinator' && 
                                       clubData?.coordinator?._id === user._id;
        
        // ✅ President has full management rights, core team has limited rights
        setCanManage(isPresident || isCoreTeam || isAdmin || isAssignedCoordinator);
      } else {
        // Check if user is admin or assigned coordinator
        const isAdmin = user?.roles?.global === 'admin';
        const isAssignedCoordinator = user?.roles?.global === 'coordinator' && 
                                       clubData?.coordinator?._id === user._id;
        setCanManage(isAdmin || isAssignedCoordinator);
      }
    } catch (error) {
      console.error('Error fetching club dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMembers = async () => {
    try {
      console.log('Fetching members for club:', clubId);
      const response = await clubService.getMembers(clubId);
      console.log('Members response:', response);
      console.log('Members data:', response.data);
      
      // Backend returns: {data: {members: {total, page, limit, members: []}}}
      const membersData = response.data?.members;
      console.log('Extracted members data:', membersData);
      
      // Extract the actual array
      if (membersData && membersData.members && Array.isArray(membersData.members)) {
        console.log('Setting members array:', membersData.members);
        setMembers(membersData.members);
      } else if (Array.isArray(membersData)) {
        console.log('Members data is already an array:', membersData);
        setMembers(membersData);
      } else {
        console.warn('Unexpected members data format, setting empty array');
        setMembers([]);
      }
    } catch (error) {
      console.error('Error fetching members:', error);
      console.error('Error details:', error.response?.data);
      setMembers([]);
    }
  };

  const handleRemoveMember = async (memberId) => {
    if (!window.confirm('Are you sure you want to remove this member?')) return;
    
    try {
      await clubService.removeMember(clubId, memberId);
      alert('Member removed successfully');
      fetchMembers();
      fetchClubDashboardData(); // Refresh stats
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to remove member');
    }
  };

  const handleEditRole = (member) => {
    setSelectedMember(member);
    setShowEditRoleModal(true);
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
    console.log('Access denied - canManage:', canManage, 'user:', user);
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

  console.log('Rendering dashboard - activeTab:', activeTab, 'members:', members);

  return (
    <Layout>
      <div className="club-dashboard">
        {/* Club Header */}
        <div className="club-dashboard-header">
          <div className="club-header-content">
            <div className="club-logo-container">
              {getClubLogoUrl(club) ? (
                <img src={getClubLogoUrl(club)} alt={club.name} className="club-logo" />
              ) : (
                <div className="club-logo-placeholder">
                  {getClubLogoPlaceholder(club)}
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
                      <strong>Coordinator:</strong> {club.coordinator?.profile?.name || 'N/A'}
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
                <h2>Club Members ({members?.length || 0})</h2>
                {/* ✅ Only admin and core team can add members (NOT coordinators) */}
                {canManage && user?.roles?.global !== 'coordinator' && (
                  <button 
                    className="btn btn-primary" 
                    onClick={() => setShowAddMemberModal(true)}
                  >
                    + Add Member
                  </button>
                )}
              </div>
              
              <div className="members-grid">
                {!members || members.length === 0 ? (
                  <div className="info-card">
                    <p className="text-muted">No members found. Add members to get started.</p>
                  </div>
                ) : (
                  members.map((member) => member && member._id ? (
                    <div key={member._id} className="member-card">
                      <div className="member-avatar">
                        {member.user?.profile?.name?.charAt(0) || member.user?.email?.charAt(0) || 'U'}
                      </div>
                      <div className="member-info">
                        <h4>{member.user?.profile?.name || member.user?.email || 'Unknown'}</h4>
                        <p className="member-email">{member.user?.email || ''}</p>
                        <span className={`badge badge-${member.role === 'president' ? 'primary' : 'secondary'}`}>
                          {member.role || 'member'}
                        </span>
                        <span className={`badge badge-${member.status === 'approved' ? 'success' : 'warning'}`}>
                          {member.status || 'pending'}
                        </span>
                      </div>
                      {canManage && (
                        <div className="member-actions">
                          <button 
                            className="btn btn-sm btn-secondary"
                            onClick={() => handleEditRole(member)}
                          >
                            Edit Role
                          </button>
                          <button 
                            className="btn btn-sm btn-danger"
                            onClick={() => handleRemoveMember(member._id)}
                          >
                            Remove
                          </button>
                        </div>
                      )}
                    </div>
                  ) : null)
                )}
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

      {/* Add Member Modal */}
      {showAddMemberModal && (
        <AddMemberModal
          clubId={clubId}
          onClose={() => setShowAddMemberModal(false)}
          onSuccess={() => {
            fetchMembers();
            fetchClubDashboardData();
            setShowAddMemberModal(false);
          }}
        />
      )}

      {/* Edit Role Modal */}
      {showEditRoleModal && selectedMember && (
        <EditRoleModal
          clubId={clubId}
          member={selectedMember}
          onClose={() => {
            setShowEditRoleModal(false);
            setSelectedMember(null);
          }}
          onSuccess={() => {
            fetchMembers();
            setShowEditRoleModal(false);
            setSelectedMember(null);
          }}
        />
      )}
    </Layout>
  );
};

// Add Member Modal Component
const AddMemberModal = ({ clubId, onClose, onSuccess }) => {
  const [userId, setUserId] = useState('');
  const [role, setRole] = useState('member');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [users, setUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [fetchingUsers, setFetchingUsers] = useState(true);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setFetchingUsers(true);
    try {
      // Backend validator max limit is 100
      const response = await userService.listUsers({ limit: 100 });
      console.log('Users API response:', response);
      // Backend: successResponse(res, { total, users }) → { status, data: { total, users } }
      setUsers(response.data?.users || []);
    } catch (err) {
      console.error('Error fetching users:', err);
      setError('Failed to load users. Please try again.');
    } finally {
      setFetchingUsers(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!userId) {
      setError('Please select a user');
      return;
    }
    
    setLoading(true);
    setError('');

    try {
      await clubService.addMember(clubId, { userId, role });
      alert('Member added successfully!');
      onSuccess();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to add member');
    } finally {
      setLoading(false);
    }
  };

  // Fixed: rollNumber is direct property, not inside profile
  const filteredUsers = users.filter(u => {
    if (!searchTerm) return false; // Only show users when searching
    
    const searchLower = searchTerm.toLowerCase().trim();
    if (!searchLower) return false;
    
    const rollNumber = (u.rollNumber || '').toLowerCase();
    const email = (u.email || '').toLowerCase();
    const name = (u.profile?.name || '').toLowerCase();
    
    return rollNumber.includes(searchLower) || 
           email.includes(searchLower) ||
           name.includes(searchLower);
  });

  const roles = [
    { value: 'member', label: 'Member' },
    { value: 'core', label: 'Core Team' },
    { value: 'president', label: 'President' },
    { value: 'vicePresident', label: 'Vice President' },
    { value: 'secretary', label: 'Secretary' },
    { value: 'treasurer', label: 'Treasurer' },
    { value: 'leadPR', label: 'Lead PR' },
    { value: 'leadTech', label: 'Lead Tech' }
  ];

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Add Member</h2>
          <button className="btn-close" onClick={onClose}>×</button>
        </div>

        {error && <div className="alert alert-error">{error}</div>}

        <form onSubmit={handleSubmit} className="form">
          <div className="form-group">
            <label>Search User *</label>
            <input
              type="text"
              className="form-control"
              placeholder="Type roll number, name, or email to search..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setUserId(''); // Reset selection when search changes
              }}
              autoFocus
            />
            <small className="form-hint">
              {fetchingUsers ? 'Loading users...' : 
               searchTerm ? `${filteredUsers.length} user(s) found` : 
               'Start typing to search users'}
            </small>
          </div>

          <div className="form-group">
            <label>Select User *</label>
            <select
              className="form-control"
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              required
              disabled={!searchTerm || filteredUsers.length === 0}
            >
              <option value="">
                {!searchTerm ? '-- Search first to see users --' :
                 filteredUsers.length === 0 ? '-- No users found --' :
                 '-- Select a user --'}
              </option>
              {filteredUsers.map(u => (
                <option key={u._id} value={u._id}>
                  {u.rollNumber || 'No Roll Number'} | {u.profile?.name || 'No Name'} | {u.email}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Role *</label>
            <select
              className="form-control"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              required
            >
              {roles.map(r => (
                <option key={r.value} value={r.value}>
                  {r.label}
                </option>
              ))}
            </select>
            <small className="form-hint">
              Select the role for this member in the club
            </small>
          </div>

          <div className="modal-actions">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button 
              type="submit" 
              className="btn btn-primary" 
              disabled={loading || !userId}
            >
              {loading ? 'Adding...' : 'Add Member'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Edit Role Modal Component
const EditRoleModal = ({ clubId, member, onClose, onSuccess }) => {
  const [role, setRole] = useState(member.role);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const roles = ['member', 'core', 'president', 'vicePresident', 'secretary', 'treasurer', 'leadPR', 'leadTech'];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await clubService.updateMemberRole(clubId, member._id, { role });
      alert('Role updated successfully!');
      onSuccess();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update role');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Edit Member Role</h2>
          <button className="btn-close" onClick={onClose}>×</button>
        </div>

        {error && <div className="alert alert-error">{error}</div>}

        <form onSubmit={handleSubmit} className="form">
          <div className="form-group">
            <label>Member</label>
            <input
              type="text"
              value={member.user?.profile?.name || 'Unknown'}
              disabled
            />
          </div>

          <div className="form-group">
            <label>New Role *</label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              required
            >
              {roles.map(r => (
                <option key={r} value={r}>
                  {r.charAt(0).toUpperCase() + r.slice(1)}
                </option>
              ))}
            </select>
          </div>

          <div className="modal-actions">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Updating...' : 'Update Role'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ClubDashboard;
