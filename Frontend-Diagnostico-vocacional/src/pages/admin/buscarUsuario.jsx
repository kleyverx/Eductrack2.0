import React, { useState, useContext } from 'react';
import { getUserByCedula } from '../../api/user';
import { AuthContext } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { User, Search, AlertCircle, Link } from 'lucide-react';

// Componente AdminBuscarUsuario
const AdminBuscarUsuario = () => {
  const [cedula, setCedula] = useState(''); 
  const [usuario, setUsuario] = useState(null); 
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const { token } = useContext(AuthContext);
  const navigate = useNavigate();

  // Función para buscar usuario por cédula
  const handleBuscar = async () => {
    if (!cedula.trim()) {
      setError('Por favor, ingresa una cédula válida.');
      setUsuario(null);
      return;
    }

    setLoading(true);
    setError(null);
    setUsuario(null);

    try {
      const data = await getUserByCedula(token, cedula.trim());

      if (!data || !data._id) {
        throw new Error('Usuario no encontrado');
      }

      setUsuario(data);
    } catch (err) {
      console.error(err);
      setError('Usuario no encontrado o error en el servidor.');
    } finally {
      setLoading(false);
    }
  };

  // Función para redirigir al perfil del usuario encontrado
  const irAlPerfil = () => {
    if (usuario && usuario._id) {
      navigate(`/admin/perfil/${usuario._id}`);
    }
  };

  // Renderizar el componente
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6 w-full">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-8 flex flex-col sm:flex-row items-start sm:items-center justify-between">
          <div className="flex items-center space-x-4 mb-4 sm:mb-0">
            <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full flex items-center justify-center">
              <User className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">Buscar Usuario</h1>
              <p className="text-gray-600 text-sm sm:text-base">Encuentra y gestiona el perfil de un usuario</p>
            </div>
          </div>
        </div>

        {/* Search Form */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
          <div className="flex items-center space-x-3 mb-6">
            <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
              <Search className="w-5 h-5 text-white" />
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-gray-800">Buscar por Cédula</h2>
          </div>
          <div className="flex flex-col space-y-4 sm:flex-row sm:space-y-0 sm:space-x-4">
            <input
              type="text"
              value={cedula}
              onChange={(e) => setCedula(e.target.value)}
              placeholder="Número de cédula"
              className="flex-1 px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              onClick={handleBuscar}
              disabled={loading}
              className={`flex items-center justify-center space-x-2 px-6 py-3 rounded-xl transition-all shadow-lg text-white font-medium w-full sm:w-auto ${
                loading
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700'
              }`}
            >
              {loading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              ) : (
                <Search className="w-4 h-4" />
              )}
              <span>{loading ? 'Buscando...' : 'Buscar'}</span>
            </button>
          </div>
        </div>

        {/* Message Area */}
        {error && (
          <div className="bg-red-100 border border-red-200 text-red-800 px-4 py-3 rounded-xl mb-6 flex items-center space-x-2">
            <AlertCircle className="w-5 h-5" />
            <span>{error}</span>
          </div>
        )}

        {/* Usuario encontrado */}
        {usuario && (
          <div className="bg-white rounded-2xl shadow-lg p-6 space-y-4">
            <div className="flex items-start space-x-4">
              <div className="w-12 h-12 bg-green-500 text-white rounded-full flex items-center justify-center font-bold">
                <User className="w-6 h-6" />
              </div>
              <div className="flex-1">
                <p className="text-base sm:text-xl text-gray-800 font-semibold">
                  {usuario.name} {usuario.apellido}
                </p>
                <p className="text-gray-600 mt-1 text-sm sm:text-base">
                  <span className="font-medium">Cédula:</span> {usuario.cedula}
                </p>
              </div>
            </div>
            <div className="pl-16">
              <button
                onClick={irAlPerfil}
                className="flex items-center space-x-2 bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition-all text-sm sm:text-base"
              >
                <Link className="w-4 h-4" />
                <span>Ver Perfil</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminBuscarUsuario;