import React, { createContext, useEffect, useState } from 'react';
import { jwtDecode } from 'jwt-decode';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true); // Para manejar el estado de carga inicial

  // Función para verificar si el token es válido y no ha expirado
  const isTokenValid = (token) => {
    if (!token) return false;
    
    try {
      const decoded = jwtDecode(token);
      const currentTime = Date.now() / 1000; // Tiempo actual en segundos
      
      // Verificar si el token ha expirado
      if (decoded.exp && decoded.exp < currentTime) {
        return false;
      }
      
      return true;
    } catch (error) {
      console.error('Error al decodificar token:', error);
      return false;
    }
  };

  // Función para determinar si el usuario está autenticado
  const isAuthenticated = () => {
    return user !== null && token !== null && isTokenValid(token);
  };

  // Cargar token del localStorage al iniciar la app
  useEffect(() => {
    const tokenLocal = localStorage.getItem('token');
    
    if (tokenLocal && typeof tokenLocal === 'string') {
      if (isTokenValid(tokenLocal)) {
        try {
          const decoded = jwtDecode(tokenLocal);
          setUser(decoded);
          setToken(tokenLocal);
        } catch (error) {
          console.error('Token inválido:', error);
          localStorage.removeItem('token');
        }
      } else {
        // Token expirado o inválido
        console.log('Token expirado o inválido, eliminando...');
        localStorage.removeItem('token');
      }
    }
    
    setLoading(false); // Terminar el estado de carga
  }, []);

  // Función para iniciar sesión
  const login = (userData, token) => {
    if (isTokenValid(token)) {
      setUser(userData);
      setToken(token);
      localStorage.setItem('token', token);
    } else {
      console.error('Intento de login con token inválido');
    }
  };

  // Función para cerrar sesión
  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('token');
  };

  // Verificar periódicamente si el token sigue siendo válido
  useEffect(() => {
    if (!token) return;

    const interval = setInterval(() => {
      if (!isTokenValid(token)) {
        console.log('Token expirado, cerrando sesión automáticamente...');
        logout();
      }
    }, 60000); // Verificar cada minuto

    return () => clearInterval(interval);
  }, [token]);

  const value = {
    user,
    token,
    loading,
    login,
    logout,
    isAuthenticated,
    isTokenValid
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};