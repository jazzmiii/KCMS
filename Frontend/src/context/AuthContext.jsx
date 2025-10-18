import React, { createContext, useState, useContext, useEffect } from 'react';
import authService from '../services/authService';
import userService from '../services/userService';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [clubMemberships, setClubMemberships] = useState([]);
  const [loading, setLoading] = useState(true);
  const [membershipLoading, setMembershipLoading] = useState(false);

  useEffect(() => {
    // Check if user is logged in on mount
    const currentUser = authService.getCurrentUser();
    if (currentUser) {
      setUser(currentUser);
      // Fetch club memberships separately (user.roles.scoped is empty array)
      fetchClubMemberships();
    }
    setLoading(false);
  }, []);

  // Fetch club memberships from Recruitment/ClubMember model
  const fetchClubMemberships = async () => {
    try {
      setMembershipLoading(true);
      // Backend: GET /api/users/me/clubs returns [{ club, role }, ...]
      const response = await userService.getMyClubs();
      // Backend response: { status: 'success', data: { clubs: [{club, role}] } }
      setClubMemberships(response.data?.clubs || []);
    } catch (error) {
      console.error('Failed to fetch club memberships:', error);
      setClubMemberships([]);
    } finally {
      setMembershipLoading(false);
    }
  };

  const login = async (credentials) => {
    const response = await authService.login(credentials);
    setUser(response.data.user);
    // Fetch club memberships after login
    await fetchClubMemberships();
    return response;
  };

  const register = async (data) => {
    return await authService.register(data);
  };

  const logout = async () => {
    await authService.logout();
    setUser(null);
    setClubMemberships([]);
  };

  const updateUser = (userData) => {
    setUser(userData);
    localStorage.setItem('user', JSON.stringify(userData));
  };

  const hasRole = (role) => {
    if (!user) return false;
    return user.roles?.global === role;
  };

  // DEPRECATED: Use permission helpers from @shared/utils/helpers/permissions instead
  // These methods won't work because user.roles.scoped is empty array
  // Club memberships are fetched separately and stored in clubMemberships state
  const hasClubRole = (clubId, role) => {
    if (!user || !clubMemberships) return false;
    const membership = clubMemberships.find(m => m.club?.toString() === clubId?.toString());
    return membership?.role === role;
  };

  const hasAnyClubRole = (clubId, roles = []) => {
    if (!user || !roles.length || !clubMemberships) return false;
    const membership = clubMemberships.find(m => m.club?.toString() === clubId?.toString());
    return membership && roles.includes(membership.role);
  };

  const value = {
    user,
    clubMemberships,
    loading,
    membershipLoading,
    login,
    register,
    logout,
    updateUser,
    fetchClubMemberships,
    hasRole,
    hasClubRole, // Deprecated: Use permission helpers instead
    hasAnyClubRole, // Deprecated: Use permission helpers instead
    isAuthenticated: !!user,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;
