import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import Layout from '../../components/Layout';
import userService from '../../services/userService';
import '../../styles/Profile.css';

const ProfilePage = () => {
  const { user, updateUser } = useAuth();
  const [profile, setProfile] = useState(null);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    department: '',
    year: '',
    batch: '',
  });
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const response = await userService.getMe();
      setProfile(response.data.user);
      setFormData({
        name: response.data.user.profile?.name || '',
        phone: response.data.user.profile?.phone || '',
        department: response.data.user.profile?.department || '',
        year: response.data.user.profile?.year || '',
        batch: response.data.user.profile?.batch || '',
      });
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handlePasswordChange = (e) => {
    setPasswordData({
      ...passwordData,
      [e.target.name]: e.target.value,
    });
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      const response = await userService.updateMe(formData);
      setProfile(response.data.user);
      updateUser(response.data.user);
      setSuccess('Profile updated successfully!');
      setEditing(false);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update profile');
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    try {
      await userService.changePassword({
        oldPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword,
        confirmPassword: passwordData.confirmPassword,
      });
      setSuccess('Password changed successfully!');
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setShowPasswordForm(false);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to change password');
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Loading profile...</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="profile-page">
        <div className="profile-header">
          <h1>My Profile</h1>
          <p>Manage your account information</p>
        </div>

        {error && <div className="alert alert-error">{error}</div>}
        {success && <div className="alert alert-success">{success}</div>}

        <div className="profile-content">
          <div className="profile-card">
            <div className="profile-avatar">
              <div className="avatar-large">
                {profile?.profile?.name?.charAt(0) || 'U'}
              </div>
              <h2>{profile?.profile?.name}</h2>
              <p className="profile-role">
                {profile?.roles?.global || 'Student'}
              </p>
            </div>

            <div className="profile-info">
              <div className="info-row">
                <span className="info-label">Email:</span>
                <span className="info-value">{profile?.email}</span>
              </div>
              <div className="info-row">
                <span className="info-label">Roll Number:</span>
                <span className="info-value">{profile?.rollNumber}</span>
              </div>
              <div className="info-row">
                <span className="info-label">Department:</span>
                <span className="info-value">{profile?.profile?.department || 'Not set'}</span>
              </div>
              <div className="info-row">
                <span className="info-label">Year:</span>
                <span className="info-value">{profile?.profile?.year || 'Not set'}</span>
              </div>
              <div className="info-row">
                <span className="info-label">Phone:</span>
                <span className="info-value">{profile?.profile?.phone || 'Not set'}</span>
              </div>
              <div className="info-row">
                <span className="info-label">Batch:</span>
                <span className="info-value">{profile?.profile?.batch || 'Not set'}</span>
              </div>
            </div>

            <div className="profile-actions">
              <button onClick={() => setEditing(!editing)} className="btn btn-primary">
                {editing ? 'Cancel' : 'Edit Profile'}
              </button>
              <button 
                onClick={() => setShowPasswordForm(!showPasswordForm)} 
                className="btn btn-outline"
              >
                Change Password
              </button>
            </div>
          </div>

          {editing && (
            <div className="profile-card">
              <h3>Edit Profile</h3>
              <form onSubmit={handleUpdateProfile} className="profile-form">
                <div className="form-group">
                  <label htmlFor="name">Full Name</label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="department">Department</label>
                  <input
                    type="text"
                    id="department"
                    name="department"
                    value={formData.department}
                    onChange={handleChange}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="year">Year</label>
                  <select
                    id="year"
                    name="year"
                    value={formData.year}
                    onChange={handleChange}
                  >
                    <option value="">Select Year</option>
                    <option value="1">1</option>
                    <option value="2">2</option>
                    <option value="3">3</option>
                    <option value="4">4</option>
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="phone">Phone Number</label>
                  <input
                    type="tel"
                    id="phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="batch">Batch</label>
                  <input
                    type="text"
                    id="batch"
                    name="batch"
                    value={formData.batch}
                    onChange={handleChange}
                    placeholder="e.g., 2022-2026"
                  />
                </div>

                <button type="submit" className="btn btn-primary">
                  Save Changes
                </button>
              </form>
            </div>
          )}

          {showPasswordForm && (
            <div className="profile-card">
              <h3>Change Password</h3>
              <form onSubmit={handleChangePassword} className="profile-form">
                <div className="form-group">
                  <label htmlFor="currentPassword">Current Password</label>
                  <input
                    type="password"
                    id="currentPassword"
                    name="currentPassword"
                    value={passwordData.currentPassword}
                    onChange={handlePasswordChange}
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="newPassword">New Password</label>
                  <input
                    type="password"
                    id="newPassword"
                    name="newPassword"
                    value={passwordData.newPassword}
                    onChange={handlePasswordChange}
                    required
                  />
                  <small className="form-hint">
                    Min 8 chars, 1 uppercase, 1 lowercase, 1 number, 1 special character
                  </small>
                </div>

                <div className="form-group">
                  <label htmlFor="confirmPassword">Confirm New Password</label>
                  <input
                    type="password"
                    id="confirmPassword"
                    name="confirmPassword"
                    value={passwordData.confirmPassword}
                    onChange={handlePasswordChange}
                    required
                  />
                </div>

                <button type="submit" className="btn btn-primary">
                  Change Password
                </button>
              </form>
            </div>
          )}

          {profile?.roles?.scoped && profile.roles.scoped.length > 0 && (
            <div className="profile-card">
              <h3>My Club Roles</h3>
              <div className="club-roles-list">
                {profile.roles.scoped.map((scopedRole, index) => (
                  <div key={index} className="club-role-item">
                    <span className="club-name">{scopedRole.club?.name || 'Unknown Club'}</span>
                    <div className="role-badges">
                      <span className="badge badge-info">{scopedRole.role}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default ProfilePage;
