import React, { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

// Componente LogoutButton
const LogoutButton = () => {
  const { logout } = useContext(AuthContext);
  const navigate = useNavigate();

  // Maneja el evento de cierre de sesión
  const handleLogout = () => {
    logout();
    navigate('/login'); // Redirige a la página de login o inicio
  };

  // Renderiza el botón de cierre de sesión
  return (
    <button onClick={handleLogout} className="bg-red-600 text-white px-4 py-2 rounded">
      Cerrar sesión
    </button>
  );
};

export default LogoutButton;