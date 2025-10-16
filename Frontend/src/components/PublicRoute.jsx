// components/PublicRoute.jsx
import React from 'react';
import { Navigate } from 'react-router-dom';

const PublicRoute = ({ children }) => {
  const token = localStorage.getItem('token') || sessionStorage.getItem('token');

  // If user already logged in → redirect to dashboard
  if (token) {
    return <Navigate to="/" replace />;
  }

  // Otherwise, allow access (for non-logged-in users)
  return children;
};

export default PublicRoute;
