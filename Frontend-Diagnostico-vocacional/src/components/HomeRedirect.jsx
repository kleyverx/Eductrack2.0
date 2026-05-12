import React, { useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

// Componente HomeRedirect
// Redirige al usuario a la página correspondiente según su rol
// Si es admin, va a /admin, si es usuario normal, va a /User
// Si no está autenticado, redirige a /login
const HomeRedirect = () => {
    const { user, isAuthenticated, loading } = useContext(AuthContext);
    const navigate = useNavigate();

    useEffect(() => {
        if (!loading) {
            if (isAuthenticated()) {
                if (user && user.role === 'admin') {
                    navigate('/admin', { replace: true });
                } else {
                    navigate('/User', { replace: true });
                }
            } else {
                navigate('/login', { replace: true });
            }
        }
    }, [user, isAuthenticated, loading, navigate]);

    return <div>Cargando...</div>;
};

export default HomeRedirect;