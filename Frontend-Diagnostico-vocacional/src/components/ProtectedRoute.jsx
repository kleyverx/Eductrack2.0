import React, { useContext } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { AuthContext } from '../context/AuthContext';
import { homePathForRole } from '../utils/roles';

/**
 * Ruta protegida con control de rol.
 *
 * - Sin sesión válida → redirige a /auth.
 * - Con sesión pero rol no permitido → redirige al home de su propio rol.
 * - Con sesión y rol permitido → renderiza las rutas hijas (<Outlet/>).
 *
 * @param {{ allowedRoles?: string[] }} props  Roles permitidos. Si se omite,
 *        basta con estar autenticado (cualquier rol).
 */
const ProtectedRoute = ({ allowedRoles }) => {
  const { user, loading, isAuthenticated } = useContext(AuthContext);

  // Mientras se resuelve el estado inicial del token, evitamos parpadeos.
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600 dark:text-indigo-400" />
      </div>
    );
  }

  if (!isAuthenticated()) {
    return <Navigate to="/auth" replace />;
  }

  // Si la ruta exige roles concretos y el del usuario no está, lo enviamos a su panel.
  if (allowedRoles && allowedRoles.length > 0 && !allowedRoles.includes(user?.role)) {
    return <Navigate to={homePathForRole(user?.role)} replace />;
  }

  return <Outlet />;
};

export default ProtectedRoute;
