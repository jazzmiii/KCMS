import React, { useState, useEffect } from 'react';
import Layout from '../../components/Layout';
import userService from '../../services/userService';
import '../../styles/UsersManagement.css';

const UsersManagementPage = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');

  useEffect(() => {
    fetchUsers();
  }, [search, roleFilter]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const params = {};
      if (search) params.search = search;
      if (roleFilter !== 'all') params.role = roleFilter;

      const response = await userService.listUsers(params);
      setUsers(response.data.users || []);
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = async (userId, newRole) => {
    try {
      // Optimistically update UI
      setUsers(prevUsers => 
        prevUsers.map(user => 
          user._id === userId 
            ? { ...user, roles: { ...user.roles, global: newRole } }
            : user
        )
      );
      
      await userService.changeUserRole(userId, { global: newRole });
      alert('User role updated successfully!');
    } catch (error) {
      alert('Failed to update user role');
      // Revert on error
      fetchUsers();
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!confirm('⚠️ WARNING: This will permanently delete the user from the database. This action cannot be undone. Are you sure?')) return;

    try {
      await userService.deleteUser(userId);
      // Remove user from local state immediately
      setUsers(prevUsers => prevUsers.filter(user => user._id !== userId));
      alert('User deleted permanently from database!');
    } catch (error) {
      alert('Failed to delete user');
      // Refresh on error
      fetchUsers();
    }
  };

  return (
    <Layout>
      <div className="users-management-page">
        <div className="page-header">
          <div>
            <h1>User Management</h1>
            <p>Manage all users in the system</p>
          </div>
        </div>

        {/* Filters */}
        <div className="filters-section">
          <div className="search-box">
            <input
              type="text"
              placeholder="Search by name, email, or roll number..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="filter-buttons">
            <button
              className={`filter-btn ${roleFilter === 'all' ? 'active' : ''}`}
              onClick={() => setRoleFilter('all')}
            >
              All
            </button>
            <button
              className={`filter-btn ${roleFilter === 'student' ? 'active' : ''}`}
              onClick={() => setRoleFilter('student')}
            >
              Students
            </button>
            <button
              className={`filter-btn ${roleFilter === 'coordinator' ? 'active' : ''}`}
              onClick={() => setRoleFilter('coordinator')}
            >
              Coordinators
            </button>
            <button
              className={`filter-btn ${roleFilter === 'admin' ? 'active' : ''}`}
              onClick={() => setRoleFilter('admin')}
            >
              Admins
            </button>
          </div>
        </div>

        {/* Users Table */}
        {loading ? (
          <div className="loading-container">
            <div className="spinner"></div>
            <p>Loading users...</p>
          </div>
        ) : users.length > 0 ? (
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Roll Number</th>
                  <th>Department</th>
                  <th>Year</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user._id}>
                    <td>{user.profile?.name || 'N/A'}</td>
                    <td>{user.email}</td>
                    <td>{user.rollNumber}</td>
                    <td>{user.profile?.department || 'N/A'}</td>
                    <td>{user.profile?.year || 'N/A'}</td>
                    <td>
                      <select
                        value={user.roles?.global || 'student'}
                        onChange={(e) => handleRoleChange(user._id, e.target.value)}
                        className="role-select"
                      >
                        <option value="student">Student</option>
                        <option value="coordinator">Coordinator</option>
                        <option value="admin">Admin</option>
                      </select>
                    </td>
                    <td>
                      <span className={`badge badge-${user.status === 'profile_complete' ? 'success' : 'warning'}`}>
                        {user.status}
                      </span>
                    </td>
                    <td>
                      <div className="action-buttons">
                        <button
                          onClick={() => handleDeleteUser(user._id)}
                          className="btn btn-sm btn-danger"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="no-results">
            <p>No users found</p>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default UsersManagementPage;
