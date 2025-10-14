import React from 'react';
import { Navigate, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute = ({ 
  children, 
  requiredRole,           // Global role: 'admin', 'coordinator', 'student'
  requiredClubRole,       // Single club role: 'president', 'core', 'member'
  requiredClubRoles,      // Array of club roles: ['president', 'core']
  clubIdParam = 'clubId'  // URL param name for clubId (default: 'clubId')
}) => {
  const { user, loading, hasClubRole, hasAnyClubRole } = useAuth();
  const params = useParams();

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Loading...</p>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Check global role
  if (requiredRole && user.roles?.global !== requiredRole) {
    return <Navigate to="/dashboard" replace />;
  }

  // Check single club role
  if (requiredClubRole) {
    const clubId = params[clubIdParam];
    if (!clubId) {
      console.error(`ProtectedRoute: clubIdParam '${clubIdParam}' not found in URL params`);
      return <Navigate to="/dashboard" replace />;
    }
    
    if (!hasClubRole(clubId, requiredClubRole)) {
      return <Navigate to="/dashboard" replace />;
    }
  }

  // Check multiple club roles (user must have at least one)
  if (requiredClubRoles && requiredClubRoles.length > 0) {
    const clubId = params[clubIdParam];
    if (!clubId) {
      console.error(`ProtectedRoute: clubIdParam '${clubIdParam}' not found in URL params`);
      return <Navigate to="/dashboard" replace />;
    }
    
    if (!hasAnyClubRole(clubId, requiredClubRoles)) {
      return <Navigate to="/dashboard" replace />;
    }
  }

  return children;
};

export default ProtectedRoute;
