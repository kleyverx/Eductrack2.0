// src/components/Navbar.jsx
import React, { useContext, useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { User, Settings, LogOut, Menu, X, Home, FileText, Search } from 'lucide-react';

const Navbar = () => {
    const { isAuthenticated, logout, user } = useContext(AuthContext);
    const userIsAuthenticated = isAuthenticated(); // Llamar la función
    const [menuOpen, setMenuOpen] = useState(false);
    const [profileOpen, setProfileOpen] = useState(false);
    const navigate = useNavigate();
    const profileRef = useRef(null);

    // Debug: ver qué contiene el objeto user
    console.log('User object:', user);

    // Verificar si el usuario es admin
    // Ajusta estas propiedades según la estructura de tu JWT
    const isAdmin = user?.role === 'admin' || 
                   user?.roles?.includes('admin') || 
                   user?.userType === 'admin' ||
                   user?.isAdmin === true;

    const handleLogout = () => {
        logout();
        navigate('/login');
        setProfileOpen(false);
    };

    const handleProfileClick = () => {
        navigate(`/perfil/${user?.id}`);
        setProfileOpen(false);
    };

    // Función para navegar a los resultados del usuario
    const handleResultsClick = () => {
        if (user?.id) {
            navigate(`/perfil/${user.id}/resultados`);
        } else {
            console.error('No se encontró ID de usuario');
            // O podrías mostrar un mensaje de error al usuario
        }
        setMenuOpen(false);
    };

    // Cerrar modal al hacer click fuera
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (profileRef.current && !profileRef.current.contains(event.target)) {
                setProfileOpen(false);
            }
        };

        if (profileOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [profileOpen]);

    // Cerrar menús al cambiar de ruta
    useEffect(() => {
        setMenuOpen(false);
        setProfileOpen(false);
    }, [navigate]);

    // Manejo del click en el botón de menú
    return (
        <>
            {/* Navbar */}
            <nav className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white shadow-lg fixed top-0 left-0 right-0 z-50 h-16">
                <div className="max-w-7xl mx-auto px-4 h-full">
                    <div className="flex justify-between items-center h-full">
                        
                        {/* Logo y botón hamburguesa */}
                        <div className="flex items-center space-x-4">
                            <button
                                onClick={() => setMenuOpen(!menuOpen)}
                                className="p-2 rounded-lg hover:bg-white/10 transition-colors duration-200"
                            >
                                {menuOpen ? (
                                    <X className="w-6 h-6" />
                                ) : (
                                    <Menu className="w-6 h-6" />
                                )}
                            </button>
                            
                            <Link 
                                to="/" 
                                className="text-xl font-bold hover:text-blue-200 transition-colors duration-200"
                            >
                                Orientación Vocacional
                            </Link>
                        </div>

                        {/* Botones de autenticación */}
                        <div className="flex items-center space-x-2">
                            {userIsAuthenticated ? (
                                // Botón de perfil cuando está autenticado
                                <div className="relative" ref={profileRef}>
                                    <button
                                        onClick={() => setProfileOpen(!profileOpen)}
                                        className="flex items-center space-x-2 p-2 rounded-lg hover:bg-white/10 transition-colors duration-200"
                                    >
                                        <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                                            <User className="w-5 h-5" />
                                        </div>
                                        <span className="hidden md:block text-sm font-medium">
                                            {user?.name || 'Usuario'}
                                        </span>
                                    </button>

                                    {/* Modal de perfil */}
                                    {profileOpen && (
                                        <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-lg border border-gray-200 py-2 z-50">
                                            <div className="px-4 py-3 border-b border-gray-100">
                                                <div className="flex items-center space-x-3">
                                                    <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full flex items-center justify-center">
                                                        <User className="w-6 h-6 text-white" />
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-semibold text-gray-800">
                                                            {user?.name || 'Usuario'}
                                                        </p>
                                                        <p className="text-xs text-gray-500">
                                                            {user?.cedula|| 'usuario@email.com'}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                            
                                            <div className="py-2">
                                                <button
                                                    onClick={handleProfileClick}
                                                    className="flex items-center space-x-3 w-full px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 transition-colors duration-200"
                                                >
                                                    <Settings className="w-4 h-4" />
                                                    <span>Ver Perfil</span>
                                                </button>
                                                
                                                <button
                                                    onClick={handleLogout}
                                                    className="flex items-center space-x-3 w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors duration-200"
                                                >
                                                    <LogOut className="w-4 h-4" />
                                                    <span>Cerrar Sesión</span>
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                // Botones de login y registro cuando NO está autenticado
                                <>
                                    <Link
                                        to="/login"
                                        className="px-4 py-2 text-sm font-medium text-white hover:bg-white/10 rounded-lg transition-colors duration-200"
                                    >
                                        Iniciar Sesión
                                    </Link>
                                    <Link
                                        to="/register"
                                        className="px-4 py-2 text-sm font-medium bg-white/20 text-white hover:bg-white/30 rounded-lg transition-colors duration-200"
                                    >
                                        Registro
                                    </Link>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </nav>

            {/* Overlay para cerrar menú */}
            {menuOpen && (
                <div 
                    className="fixed inset-0 bg-black/20 z-40"
                    onClick={() => setMenuOpen(false)}
                />
            )}

            {/* Menú lateral */}
            <div className={`fixed top-16 left-0 h-full w-80 bg-white shadow-xl transform transition-transform duration-300 z-40 ${
                menuOpen ? 'translate-x-0' : '-translate-x-full'
            }`}>
                <div className="p-6">
                    <h3 className="text-lg font-bold text-gray-800 mb-6">Navegación</h3>
                    
                    <div className="space-y-3">
                        <Link
                            to="/"
                            onClick={() => setMenuOpen(false)}
                            className="flex items-center space-x-3 p-3 rounded-lg text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-colors duration-200"
                        >
                            <Home className="w-5 h-5" />
                            <span className="font-medium">Inicio</span>
                        </Link>

                        {/* Test y Resultados - solo para usuarios autenticados que NO son admin */}
                        {userIsAuthenticated && !isAdmin && (
                            <>
                                <Link
                                    to="/test"
                                    onClick={() => setMenuOpen(false)}
                                    className="flex items-center space-x-3 p-3 rounded-lg text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-colors duration-200"
                                >
                                    <FileText className="w-5 h-5" />
                                    <span className="font-medium">Test</span>
                                </Link>

                                {/* Cambié el Link por un button con onClick para manejar la navegación con ID */}
                                <button
                                    onClick={handleResultsClick}
                                    className="flex items-center space-x-3 p-3 rounded-lg text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-colors duration-200 w-full text-left"
                                >
                                    <FileText className="w-5 h-5" />
                                    <span className="font-medium">Resultados</span>
                                </button>
                            </>
                        )}

                        {!userIsAuthenticated ? (
                            <>
                                <div className="border-t border-gray-200 my-4"></div>
                                <Link
                                    to="/login"
                                    onClick={() => setMenuOpen(false)}
                                    className="flex items-center space-x-3 p-3 rounded-lg text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-colors duration-200"
                                >
                                    <User className="w-5 h-5" />
                                    <span className="font-medium">Iniciar Sesión</span>
                                </Link>

                                <Link
                                    to="/register"
                                    onClick={() => setMenuOpen(false)}
                                    className="flex items-center space-x-3 p-3 rounded-lg text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-colors duration-200"
                                >
                                    <User className="w-5 h-5" />
                                    <span className="font-medium">Registro</span>
                                </Link>
                            </>
                        ) : (
                            <>
                                {/* Sección de administración - solo visible para admins */}
                                {isAdmin && (
                                    <>
                                        <div className="border-t border-gray-200 my-4"></div>
                                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider px-3 mb-2">
                                            Administración
                                        </p>
                                        
                                        <Link
                                            to="/admin/tests"
                                            onClick={() => setMenuOpen(false)}
                                            className="flex items-center space-x-3 p-3 rounded-lg text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-colors duration-200"
                                        >
                                            <Settings className="w-5 h-5" />
                                            <span className="font-medium">Administrar Tests</span>
                                        </Link>

                                        <Link
                                            to="/admin/buscar-usuario"
                                            onClick={() => setMenuOpen(false)}
                                            className="flex items-center space-x-3 p-3 rounded-lg text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-colors duration-200"
                                        >
                                            <Search className="w-5 h-5" />
                                            <span className="font-medium">Buscar Usuario</span>
                                        </Link>
                                    </>
                                )}
                            </>
                        )}
                    </div>
                </div>
            </div>

            {/* Espaciador para el contenido */}
            <div className="h-16"></div>
        </>
    );
};

export default Navbar;