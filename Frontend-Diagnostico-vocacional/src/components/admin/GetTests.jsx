import React, { useEffect, useState, useContext } from 'react';
import { Edit2, Trash2, Save, X, HelpCircle, CheckCircle, AlertCircle, Plus, Book, Calendar } from 'lucide-react';
import { AuthContext } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';

// Importa las funciones de la API para tests.
import {
  getAllTests, createTest,
  deleteTest,
  updateTest
} from '../../api/tests'; // Ajusta la ruta a tu archivo de API de tests

const STATE_OPTIONS = ["active", "inactive"]; // Opciones de estado para los tests

// Componente principal para la gestión de tests
const GetTests = () => {
  const { token } = useContext(AuthContext);
  const navigate = useNavigate();
  const [tests, setTests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editId, setEditId] = useState(null);
  const [editName, setEditName] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editState, setEditState] = useState('inactive');
  const [editFechaInicio, setEditFechaInicio] = useState('');
  const [editFechaFin, setEditFechaFin] = useState('');
  const [editDurationMinutes, setEditDurationMinutes] = useState(''); // Nuevo estado para la edición
  const [currentPage, setCurrentPage] = useState(1);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [createName, setCreateName] = useState('');
  const [createDescription, setCreateDescription] = useState('');
  const [createState, setCreateState] = useState('inactive');
  const [createFechaInicio, setCreateFechaInicio] = useState('');
  const [createFechaFin, setCreateFechaFin] = useState('');
  const [createDurationMinutes, setCreateDurationMinutes] = useState(''); // Nuevo estado para la creación
  const [createSuccess, setCreateSuccess] = useState(null);
  const [createError, setCreateError] = useState(null);
  const [saveLoading, setSaveLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteModal, setDeleteModal] = useState({ show: false, testId: null, testName: '' });
  const itemsPerPage = 5;

  // Función para obtener todos los tests al cargar el componente
  const fetchTests = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getAllTests(token);
      setTests(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error fetching tests:', err);
      setError("Error al cargar los tests.");
      setTests([]);
    } finally {
      setLoading(false);
    }
  };

  // Efecto para cargar los tests al montar el componente
  useEffect(() => {
    if (token) {
      fetchTests();
    }
  }, [token]);

  // Función para manejar la edición de un test

  const handleEdit = (test) => {
    setEditId(test._id);
    setEditName(test.name);
    setEditDescription(test.description);
    setEditState(test.state);
    setEditFechaInicio(test.fechaInicio);
    setEditFechaFin(test.fechaFin);
    setEditDurationMinutes(test.duracion || ''); // Usar 'duracion' del modelo
    setShowCreateForm(false);
    setCreateError(null);
    setCreateSuccess(null);
  };

  // Función para manejar la creación de un nuevo test

  const handleSave = async (id) => {
    setCreateSuccess(null);
    setCreateError(null);

    if (!editName.trim() || !editDescription.trim()) {
      setCreateError('El nombre y la descripción del test no pueden estar vacíos.');
      return;
    }
    
    if (!editDurationMinutes || isNaN(editDurationMinutes) || parseInt(editDurationMinutes) <= 0) {
      setCreateError('La duración debe ser un número positivo.');
      return;
    }

    const updatedData = {
      name: editName,
      description: editDescription,
      state: editState,
      fechaInicio: editFechaInicio,
      fechaFin: editFechaFin,
      duracion: parseInt(editDurationMinutes) // Campo 'duracion' para la actualización
    };

    try {
      setSaveLoading(true);
      await updateTest(id, updatedData, token);
      const updatedTests = tests.map(test =>
        test._id === id ? { ...test, ...updatedData } : test
      );
      setTests(updatedTests);
      setEditId(null);
      setCreateSuccess("Test actualizado correctamente.");
    } catch (err) {
      console.error('Error updating test:', err);
      setCreateError('Error al actualizar el test: ' + (err.message || "Error desconocido"));
    } finally {
      setSaveLoading(false);
      setTimeout(() => {
        setCreateSuccess(null);
        setCreateError(null);
      }, 3000);
    }
  };

  // Función para manejar la eliminación de un test

  const handleDelete = async (id) => {
    try {
      setDeleteLoading(true);
      await deleteTest(id, token);
      const filteredTests = tests.filter(test => test._id !== id);
      setTests(filteredTests);
      const newTotalPages = Math.ceil(filteredTests.length / itemsPerPage);
      if (currentPage > newTotalPages && newTotalPages > 0) {
        setCurrentPage(newTotalPages);
      }
      setDeleteModal({ show: false, testId: null, testName: '' });
      setCreateSuccess("Test eliminado correctamente.");
    } catch (err) {
      console.error('Error deleting test:', err);
      setCreateError('Error al eliminar el test: ' + (err.message || "Error desconocido"));
      setDeleteModal({ show: false, testId: null, testName: '' });
    } finally {
      setDeleteLoading(false);
      setTimeout(() => {
        setCreateSuccess(null);
        setCreateError(null);
      }, 3000);
    }
  };

  // Función para abrir el modal de eliminación
  const openDeleteModal = (test) => {
    setDeleteModal({
      show: true,
      testId: test._id,
      testName: test.name
    });
  };

  const closeDeleteModal = () => {
    setDeleteModal({ show: false, testId: null, testName: '' });
  };

  const handleCreateTest = async () => {
    setCreateSuccess(null);
    setCreateError(null);

    if (!createName.trim() || !createDescription.trim()) {
      setCreateError('El nombre y la descripción del test no pueden estar vacíos.');
      return;
    }

    if (!createDurationMinutes || isNaN(createDurationMinutes) || parseInt(createDurationMinutes) <= 0) {
      setCreateError('La duración debe ser un número positivo.');
      return;
    }

    const newTest = {
      name: createName,
      description: createDescription,
      state: createState,
      fechaInicio: createFechaInicio,
      fechaFin: createFechaFin,
      duracion: parseInt(createDurationMinutes), // Corregido: 'duracion' en lugar de 'duration'
    };

    try {
      const createdTest = await createTest(newTest, token);
      setTests([...tests, createdTest]);
      setCreateSuccess('Test creado con éxito');
      setCreateName('');
      setCreateDescription('');
      setCreateState('inactive');
      setCreateFechaInicio('');
      setCreateFechaFin('');
      setCreateDurationMinutes('');
      setShowCreateForm(false);
      const newTotalPages = Math.ceil((tests.length + 1) / itemsPerPage);
      setCurrentPage(newTotalPages);
    } catch (err) {
      setCreateError(err.message || 'Error al crear el test');
    } finally {
      setTimeout(() => {
        setCreateSuccess(null);
        setCreateError(null);
      }, 3000);
    }
  };

  // Función para alternar el formulario de creación
  const toggleCreateForm = () => {
    setShowCreateForm(!showCreateForm);
    setEditId(null);
    setCreateName('');
    setCreateDescription('');
    setCreateState('inactive');
    setCreateFechaInicio('');
    setCreateFechaFin('');
    setCreateDurationMinutes('');
    setCreateError(null);
    setCreateSuccess(null);
  };

  //  Función para manejar el cambio de página en la paginación

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const totalPages = Array.isArray(tests) ? Math.ceil(tests.length / itemsPerPage) : 0;
  const paginatedTests = Array.isArray(tests) ? tests.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  ) : [];

  // Renderizar el componente
  
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6 w-full">
        <div className="max-w-7xl mx-auto">
          <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-gray-500 text-lg">Cargando tests...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6 w-full">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-8 flex flex-col md:flex-row items-start md:items-center justify-between space-y-4 md:space-y-0">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full flex items-center justify-center">
              <Book className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-800">Gestión de Tests</h1>
              <p className="text-gray-600">Administra los tests de orientación vocacional</p>
            </div>
          </div>
          <div className="flex flex-col md:flex-row items-start md:items-center space-y-4 md:space-y-0 md:space-x-4 w-full md:w-auto">
            <div className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white px-4 py-2 rounded-xl w-full text-center md:w-auto">
              <span className="font-semibold">{tests.length}</span> tests
            </div>
            <button
              onClick={toggleCreateForm}
              className="flex items-center justify-center w-full md:w-auto space-x-2 bg-green-500 text-white px-6 py-3 rounded-xl hover:bg-green-600 transition-all shadow-lg"
            >
              <Plus className="w-5 h-5" />
              <span>{showCreateForm ? 'Cancelar' : 'Nuevo Test'}</span>
            </button>
          </div>
        </div>

        {/* Formulario de creación */}
        {showCreateForm && (
          <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center">
                <Plus className="w-5 h-5 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-gray-800">Crear Nuevo Test</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Nombre del Test</label>
                <input
                  type="text"
                  value={createName}
                  onChange={(e) => setCreateName(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="Ej: Test de Intereses"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Descripción</label>
                <textarea
                  value={createDescription}
                  onChange={(e) => setCreateDescription(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 resize-none"
                  rows="3"
                  placeholder="Descripción breve del test..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Duración (minutos)</label>
                <input
                  type="number"
                  value={createDurationMinutes}
                  onChange={(e) => setCreateDurationMinutes(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="Ej: 30"
                  min="1"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Estado</label>
                <select
                  value={createState}
                  onChange={(e) => setCreateState(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  {STATE_OPTIONS.map(state => (
                    <option key={state} value={state}>
                      {state === 'active' ? 'Activo' : 'Inactivo'}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Fecha de Inicio (Opcional)</label>
                <input
                  type="datetime-local"
                  value={createFechaInicio}
                  onChange={(e) => setCreateFechaInicio(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Fecha de Fin (Opcional)</label>
                <input
                  type="datetime-local"
                  value={createFechaFin}
                  onChange={(e) => setCreateFechaFin(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
            </div>
            
            {createSuccess && (
              <div className="mt-6 bg-green-100 border border-green-200 text-green-800 px-4 py-3 rounded-xl flex items-center space-x-2">
                <CheckCircle className="w-5 h-5" />
                <span>{createSuccess}</span>
              </div>
            )}
            
            {createError && (
              <div className="mt-6 bg-red-100 border border-red-200 text-red-800 px-4 py-3 rounded-xl flex items-center space-x-2">
                <AlertCircle className="w-5 h-5" />
                <span>{createError}</span>
              </div>
            )}
            
            <div className="flex space-x-3 pt-6">
              <button
                onClick={handleCreateTest}
                className="flex items-center space-x-2 bg-green-500 text-white px-6 py-3 rounded-xl hover:bg-green-600 transition-all shadow-lg"
              >
                <Plus className="w-4 h-4" />
                <span>Crear Test</span>
              </button>
              <button
                onClick={toggleCreateForm}
                className="flex items-center space-x-2 bg-gray-500 text-white px-6 py-3 rounded-xl hover:bg-gray-600 transition-all"
              >
                <X className="w-4 h-4" />
                <span>Cancelar</span>
              </button>
            </div>
          </div>
        )}

        {/* Mensaje de error general */}
        {error && (
          <div className="bg-red-100 border border-red-200 text-red-800 px-4 py-3 rounded-xl mb-6 flex items-center space-x-2">
            <AlertCircle className="w-5 h-5" />
            <span>{error}</span>
          </div>
        )}

        {/* Estado vacío */}
        {tests.length === 0 && !error && !loading && (
          <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
            <HelpCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 text-lg">No hay tests registrados</p>
            <p className="text-gray-400 mt-2">Crea tu primer test usando el botón "Nuevo Test"</p>
          </div>
        )}

        {/* Lista de tests */}
        {paginatedTests.length > 0 && (
          <div className="space-y-6">
            {paginatedTests.map((test, index) => (
              <div key={test._id} className="bg-white rounded-2xl shadow-lg overflow-hidden">
                {editId === test._id ? (
                  <div className="p-6 space-y-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Nombre del Test</label>
                      <input
                        type="text"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Descripción</label>
                      <textarea
                        value={editDescription}
                        onChange={(e) => setEditDescription(e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                        rows="3"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Duración (minutos)</label>
                      <input
                        type="number"
                        value={editDurationMinutes}
                        onChange={(e) => setEditDurationMinutes(e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                        min="1"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Estado</label>
                      <select
                        value={editState}
                        onChange={(e) => setEditState(e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        {STATE_OPTIONS.map(state => (
                          <option key={state} value={state}>
                            {state === 'active' ? 'Activo' : 'Inactivo'}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Fecha de Inicio</label>
                      <input
                        type="datetime-local"
                        value={editFechaInicio}
                        onChange={(e) => setEditFechaInicio(e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Fecha de Fin</label>
                      <input
                        type="datetime-local"
                        value={editFechaFin}
                        onChange={(e) => setEditFechaFin(e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    {createSuccess && (
                      <div className="mt-6 bg-green-100 border border-green-200 text-green-800 px-4 py-3 rounded-xl flex items-center space-x-2">
                        <CheckCircle className="w-5 h-5" />
                        <span>{createSuccess}</span>
                      </div>
                    )}
                    {createError && (
                      <div className="mt-6 bg-red-100 border border-red-200 text-red-800 px-4 py-3 rounded-xl flex items-center space-x-2">
                        <AlertCircle className="w-5 h-5" />
                        <span>{createError}</span>
                      </div>
                    )}
                    <div className="flex space-x-3 pt-4">
                      <button
                        onClick={() => handleSave(test._id)}
                        disabled={saveLoading}
                        className="flex items-center space-x-2 bg-green-500 text-white px-6 py-3 rounded-xl hover:bg-green-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {saveLoading ? (
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        ) : (
                          <Save className="w-4 h-4" />
                        )}
                        <span>{saveLoading ? 'Guardando...' : 'Guardar'}</span>
                      </button>
                      <button
                        onClick={() => setEditId(null)}
                        disabled={saveLoading}
                        className="flex items-center space-x-2 bg-red-500 text-white px-6 py-3 rounded-xl hover:bg-red-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <X className="w-4 h-4" />
                        <span>Cancelar</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="p-6">
                    <div className="flex items-start justify-between space-x-4 mb-4">
                      <div className="flex-1">
                        <h2 className="text-xl font-bold text-gray-800 mb-1">{test.name}</h2>
                        <p className="text-gray-600 text-sm">{test.description}</p>
                      </div>
                      <div className={`px-4 py-1 rounded-full text-xs font-semibold ${test.state === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                        {test.state === 'active' ? 'Activo' : 'Inactivo'}
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-4 text-gray-500 text-sm mb-4">
                      <div className="flex items-center space-x-1">
                        <Calendar className="w-4 h-4" />
                        <span>Duración: {test.duracion} min</span> {/* Corregido: 'duracion' en lugar de 'durationMinutes' */}
                      </div>
                      <div className="flex items-center space-x-1">
                        <Calendar className="w-4 h-4" />
                        <span>Inicio: {test.fechaInicio ? new Date(test.fechaInicio).toLocaleString() : 'N/A'}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Calendar className="w-4 h-4" />
                        <span>Fin: {test.fechaFin ? new Date(test.fechaFin).toLocaleString() : 'N/A'}</span>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-3 mt-4">
                      <button
                        onClick={() => navigate(`/admin/tests/${test._id}/questions`)}
                        className="flex-1 min-w-[150px] flex items-center justify-center space-x-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                      >
                        <HelpCircle className="w-4 h-4" />
                        <span>Ver Preguntas</span>
                      </button>
                      <button
                        onClick={() => handleEdit(test)}
                        className="flex-1 min-w-[150px] flex items-center justify-center space-x-2 px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600"
                      >
                        <Edit2 className="w-4 h-4" />
                        <span>Editar</span>
                      </button>
                      <button
                        onClick={() => openDeleteModal(test)}
                        className="flex-1 min-w-[150px] flex items-center justify-center space-x-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
                      >
                        <Trash2 className="w-4 h-4" />
                        <span>Eliminar</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Paginación */}
        {totalPages > 1 && (
          <div className="flex justify-center mt-8">
            <div className="flex space-x-2">
              {Array.from({ length: totalPages }, (_, i) => (
                <button
                  key={i}
                  onClick={() => handlePageChange(i + 1)}
                  className={`px-4 py-2 rounded-lg font-medium ${currentPage === i + 1
                      ? 'bg-blue-500 text-white shadow-lg'
                      : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300'
                    }`}
                >
                  {i + 1}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Modal de confirmación de eliminación */}
        {deleteModal.show && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 overflow-hidden">
              <div className="bg-gradient-to-r from-red-500 to-red-600 p-6">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                    <AlertCircle className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white">Confirmar eliminación</h3>
                    <p className="text-red-100 text-sm">Esta acción no se puede deshacer</p>
                  </div>
                </div>
              </div>

              <div className="p-6">
                <p className="text-gray-700 mb-4">
                  ¿Estás seguro de que deseas eliminar el test "{deleteModal.testName}"?
                </p>
                <div className="flex space-x-3">
                  <button
                    onClick={() => handleDelete(deleteModal.testId)}
                    disabled={deleteLoading}
                    className="flex-1 bg-red-500 text-white py-3 px-4 rounded-xl hover:bg-red-600 transition-all font-medium flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {deleteLoading ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    ) : (
                      <Trash2 className="w-4 h-4" />
                    )}
                    <span>{deleteLoading ? 'Eliminando...' : 'Eliminar'}</span>
                  </button>
                  <button
                    onClick={closeDeleteModal}
                    disabled={deleteLoading}
                    className="flex-1 bg-gray-500 text-white py-3 px-4 rounded-xl hover:bg-gray-600 transition-all font-medium flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <X className="w-4 h-4" />
                    <span>Cancelar</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default GetTests;