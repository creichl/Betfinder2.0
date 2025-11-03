// AdminRoute.js - Protected Route für Admin-Zugriff
import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const AdminRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        fontSize: '18px',
        color: '#666'
      }}>
        Laden...
      </div>
    );
  }

  // Nicht eingeloggt -> zum Login
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Kein Admin -> zum Dashboard
  if (user.role !== 'admin') {
    return <Navigate to="/dashboard" replace />;
  }

  // Admin -> Zugriff erlaubt
  return children;
};

export default AdminRoute;
