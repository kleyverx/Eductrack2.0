import React, { useContext } from 'react';
import { Navigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { homePathForRole } from '../utils/roles';

/**
 * Redirige al usuario al panel correspondiente según su rol.
 * Si no está autenticado, va a /auth.
 */
const HomeRedirect = () => {
  const { user, loading, isAuthenticated } = useContext(AuthContext);

  if (loading) return null;
  if (!isAuthenticated()) return <Navigate to="/auth" replace />;

  return <Navigate to={homePathForRole(user?.role)} replace />;
};

export default HomeRedirect;
