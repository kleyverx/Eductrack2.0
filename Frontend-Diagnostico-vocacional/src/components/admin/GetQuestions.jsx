import React, { useEffect, useState, useContext, useCallback } from 'react';
import { Edit2, Trash2, Save, X, HelpCircle, CheckCircle, AlertCircle, Plus } from 'lucide-react';
import { AuthContext } from '../../context/AuthContext';
import { useParams } from 'react-router-dom';

import {
  createQuestion,
  deleteQuestion,
  editQuestion,
  getQuestionsByTestId,
  importQuestions
} from '../../api/questions';

// Importar los componentes necesarios para la gestión de preguntas
const AREA_OPTIONS = [
  "Ciencias de la Educación y Ciencias del Deporte",
  "Humanidades, Letras y artes",
  "Ciencias y Artes Militares",
  "Ciencias Sociales",
  "Ciencias Básicas",
  "Ingeniería, Arquitectura y Tecnología",
  "Ciencias del Agro y del mar",
  "Ciencias de la salud"
]; // Áreas predefinidas para las preguntas

// Componente principal para la gestión de preguntas
const GetQuestions = () => {
  const { test_id } = useParams();
  const { token } = useContext(AuthContext);
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editId, setEditId] = useState(null);
  const [editText, setEditText] = useState('');
  const [editAreas, setEditAreas] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [createText, setCreateText] = useState('');
  const [createAreas, setCreateAreas] = useState([]);
  const [createSuccess, setCreateSuccess] = useState(null);
  const [createError, setCreateError] = useState(null);
  const [deleteModal, setDeleteModal] = useState({ show: false, questionId: null, questionText: '' });
  const [saveLoading, setSaveLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [successModal, setSuccessModal] = useState({ show: false, message: '' });
  const [errorModal, setErrorModal] = useState({ show: false, message: '' });

  // Nuevos estados para la importación
  const [showImportForm, setShowImportForm] = useState(false);
  const [importFile, setImportFile] = useState(null);
  const [importLoading, setImportLoading] = useState(false);

  const itemsPerPage = 5;

  // Función para obtener las preguntas del test
  const fetchQuestions = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getQuestionsByTestId(test_id, token);
      setQuestions(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error fetching questions:', err);
      setQuestions([]);
      setError("test Vacio, Ingrese una nueva Pregunta.");
    } finally {
      setLoading(false);
    }
  }, [token, test_id]);

  // Efecto para cargar las preguntas al montar el componente
  useEffect(() => {
    if (token && test_id) {
      fetchQuestions();
    }
  }, [fetchQuestions, token, test_id]);

  const openSuccessModal = (message) => {
    setSuccessModal({ show: true, message });
  };

  const closeSuccessModal = () => {
    setSuccessModal({ show: false, message: '' });
  };

  const openErrorModal = (message) => {
    setErrorModal({ show: true, message });
  };

  const closeErrorModal = () => {
    setErrorModal({ show: false, message: '' });
  };

  // Manejo de edición de preguntas
  const handleEdit = useCallback((question) => {
    setEditId(question._id);
    setEditText(question.text);
    setEditAreas(question.area);
    setShowCreateForm(false);
    setShowImportForm(false);
  }, []);

  // Manejo de cambios en el texto de la pregunta
  const handleAreaChange = (area) => {
    setEditAreas((prev) =>
      prev.includes(area) ? prev.filter((a) => a !== area) : [...prev, area]
    );
  };

  // Manejo de cambios en el texto de la pregunta

  const handleCreateAreaChange = (area) => {
    setCreateAreas((prev) =>
      prev.includes(area) ? prev.filter((a) => a !== area) : [...prev, area]
    );
  };

  // Guardar cambios de edición

  const handleSave = useCallback(async (id) => {
    if (!editText.trim()) {
      openErrorModal("El texto de la pregunta no puede estar vacío");
      return;
    }

    if (editAreas.length === 0) {
      openErrorModal("Debes seleccionar al menos un área");
      return;
    }

    const updatedData = {
      text: editText,
      area: editAreas
    };

    try {
      setSaveLoading(true);
      await editQuestion(id, updatedData, token);
      const updatedQuestions = questions.map(q =>
        q._id === id ? { ...q, ...updatedData } : q
      );
      setQuestions(updatedQuestions);
      setEditId(null);
      setEditText('');
      setEditAreas([]);
      openSuccessModal("Pregunta actualizada correctamente");
    } catch (err) {
      console.error('Error updating question:', err);
      openErrorModal("Error al actualizar la pregunta: " + (err.message || "Error desconocido"));
    } finally {
      setSaveLoading(false);
    }
  }, [editText, editAreas, questions, token]);

  //  Manejo de eliminación de preguntas

  const handleDelete = useCallback(async (id) => {
    try {
      setDeleteLoading(true);
      await deleteQuestion(id, token);
      const filteredQuestions = questions.filter(q => q._id !== id);
      setQuestions(filteredQuestions);
      const newTotalPages = Math.ceil(filteredQuestions.length / itemsPerPage);
      if (currentPage > newTotalPages && newTotalPages > 0) {
        setCurrentPage(newTotalPages);
      }
      setDeleteModal({ show: false, questionId: null, questionText: '' });
      openSuccessModal("Pregunta eliminada correctamente");
    } catch (err) {
      console.error('Error deleting question:', err);
      openErrorModal("Error al eliminar la pregunta: " + (err.message || "Error desconocido"));
      setDeleteModal({ show: false, questionId: null, questionText: '' });
    } finally {
      setDeleteLoading(false);
    }
  }, [questions, token, currentPage]);

  // Abrir modal de confirmación de eliminación
  const openDeleteModal = (question) => {
    setDeleteModal({
      show: true,
      questionId: question._id,
      questionText: question.text
    });
  };

  // Cerrar modal de confirmación de eliminación

  const closeDeleteModal = () => {
    setDeleteModal({ show: false, questionId: null, questionText: '' });
  };

  const handleCreateQuestion = useCallback(async () => {
    setCreateError(null);
    setCreateSuccess(null);
    if (!createText.trim()) {
      setCreateError("El texto de la pregunta es obligatorio");
      return;
    }
    if (createAreas.length === 0) {
      setCreateError("Debes seleccionar al menos un área");
      return;
    }
    try {
      await createQuestion({ text: createText, area: createAreas, test_id: test_id }, token);
      await fetchQuestions();
      setCreateSuccess('Pregunta creada con éxito');
      setCreateText('');
      setCreateAreas([]);
      setShowCreateForm(false);
      const newTotalPages = Math.ceil((questions.length + 1) / itemsPerPage);
      setCurrentPage(newTotalPages);
      openSuccessModal('Pregunta creada con éxito');
      setTimeout(() => setCreateSuccess(null), 3000);
    } catch (err) {
      setCreateError(err.message || "Error al crear la pregunta");
      openErrorModal(err.message || "Error al crear la pregunta");
    }
  }, [createText, createAreas, test_id, token, fetchQuestions, questions.length]);

  const toggleCreateForm = useCallback(() => {
    setShowCreateForm(!showCreateForm);
    setShowImportForm(false);
    setEditId(null);
    setCreateText('');
    setCreateAreas([]);
    setCreateError(null);
    setCreateSuccess(null);
  }, [showCreateForm]);

  const handleFileChange = (e) => {
    setImportFile(e.target.files[0]);
  };

  // Manejo de la importación de preguntas desde un archivo

  const handleImportQuestions = useCallback(async () => {
    if (!importFile) {
      openErrorModal("Por favor, selecciona un archivo para importar.");
      return;
    }

    setImportLoading(true);
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const fileContent = JSON.parse(e.target.result);

        if (!Array.isArray(fileContent)) {
          openErrorModal("El archivo debe contener un array de preguntas.");
          return;
        }

        const questionsWithTestId = fileContent.map(q => ({
          ...q,
          test_id: test_id,
        }));

        await importQuestions(questionsWithTestId, token);
        await fetchQuestions();
        openSuccessModal("Preguntas importadas con éxito.");
        setImportFile(null);
        setShowImportForm(false);
      } catch (err) {
        openErrorModal("Error al procesar el archivo o importar preguntas: " + (err.message || "Error desconocido"));
      } finally {
        setImportLoading(false);
      }
    };
    reader.readAsText(importFile);
  }, [importFile, token, test_id, fetchQuestions]);

  const toggleImportForm = () => {
    setShowImportForm(!showImportForm);
    setShowCreateForm(false);
    setImportFile(null);
    setImportLoading(false);
  };

  //  Manejo de la paginación

  const handlePageChange = useCallback((page) => {
    setCurrentPage(page);
  }, []);

  const getAreaColor = (area) => {
    const colors = {
      "Ciencias de la Educación y Ciencias del Deporte": "bg-blue-100 text-blue-800",
      "Humanidades, Letras y artes": "bg-purple-100 text-purple-800",
      "Ciencias y Artes Militares": "bg-slate-100 text-slate-800",
      "Ciencias Sociales": "bg-green-100 text-green-800",
      "Ciencias Básicas": "bg-cyan-100 text-cyan-800",
      "Ingeniería, Arquitectura y Tecnología": "bg-orange-100 text-orange-800",
      "Ciencias del Agro y del mar": "bg-lime-100 text-lime-800",
      "Ciencias de la salud": "bg-red-100 text-red-800"
    };
    return colors[area] || "bg-gray-100 text-gray-800";
  };

  // Calcular el número total de páginas y las preguntas para la página actual

  const totalPages = Array.isArray(questions) ? Math.ceil(questions.length / itemsPerPage) : 0;
  const paginatedQuestions = Array.isArray(questions) ? questions.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  ) : [];

  // Renderizar el componente

  const SuccessModal = ({ show, message, onClose }) => {
    if (!show) return null;
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden">
          <div className="bg-gradient-to-r from-green-500 to-green-600 p-6">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white">Éxito</h3>
                <p className="text-green-100 text-sm">Operación completada</p>
              </div>
            </div>
          </div>
          <div className="p-6">
            <p className="text-gray-700 mb-6">{message}</p>
            <button
              onClick={onClose}
              className="w-full bg-green-500 text-white py-3 px-4 rounded-xl hover:bg-green-600 transition-all font-medium"
            >
              Cerrar
            </button>
          </div>
        </div>
      </div>
    );
  };

  const ErrorModal = ({ show, message, onClose }) => {
    if (!show) return null;
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden">
          <div className="bg-gradient-to-r from-red-500 to-red-600 p-6">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                <AlertCircle className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white">Error</h3>
                <p className="text-red-100 text-sm">Ha ocurrido un problema</p>
              </div>
            </div>
          </div>
          <div className="p-6">
            <p className="text-gray-700 mb-6">{message}</p>
            <button
              onClick={onClose}
              className="w-full bg-red-500 text-white py-3 px-4 rounded-xl hover:bg-red-600 transition-all font-medium"
            >
              Cerrar
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Renderizar el modal de eliminación
  
  const renderPaginationButtons = () => {
    const pagesToShow = 5;
    const buttons = [];
    let startPage, endPage;

    if (totalPages <= pagesToShow) {
      startPage = 1;
      endPage = totalPages;
    } else {
      startPage = Math.max(1, currentPage - Math.floor(pagesToShow / 2));
      endPage = Math.min(totalPages, startPage + pagesToShow - 1);
      if (endPage === totalPages) {
        startPage = Math.max(1, totalPages - pagesToShow + 1);
      }
    }

    // Add first page button if not in the range
    if (startPage > 1) {
      buttons.push(
        <button
          key={1}
          onClick={() => handlePageChange(1)}
          className={`px-4 py-2 rounded-lg font-medium bg-white text-gray-700 hover:bg-gray-100 border border-gray-300`}
        >
          1
        </button>
      );
      if (startPage > 2) {
        buttons.push(<span key="dots-start" className="px-2 py-2 text-gray-500">...</span>);
      }
    }

    for (let i = startPage; i <= endPage; i++) {
      buttons.push(
        <button
          key={i}
          onClick={() => handlePageChange(i)}
          className={`px-4 py-2 rounded-lg font-medium ${currentPage === i ? 'bg-blue-500 text-white shadow-lg' : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300'}`}
        >
          {i}
        </button>
      );
    }

    // Add last page button if not in the range
    if (endPage < totalPages) {
      if (endPage < totalPages - 1) {
        buttons.push(<span key="dots-end" className="px-2 py-2 text-gray-500">...</span>);
      }
      buttons.push(
        <button
          key={totalPages}
          onClick={() => handlePageChange(totalPages)}
          className={`px-4 py-2 rounded-lg font-medium bg-white text-gray-700 hover:bg-gray-100 border border-gray-300`}
        >
          {totalPages}
        </button>
      );
    }
    return buttons;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6 w-full">
        <div className="max-w-7xl mx-auto">
          <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-gray-500 text-lg">Cargando preguntas...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6 w-full">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-8 flex flex-col md:flex-row items-start md:items-center justify-between">
          <div className="flex items-center space-x-4 mb-4 md:mb-0">
            <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full flex items-center justify-center">
              <HelpCircle className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">Gestión de Preguntas</h1>
              <p className="text-gray-600 text-sm md:text-base">Administra las preguntas del test vocacional</p>
            </div>
          </div>
          {/* Contenedor con flex-wrap para evitar el scroll horizontal de los botones */}
          <div className="flex items-center flex-wrap justify-end gap-2">
            <div className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white px-4 py-2 rounded-xl text-sm">
              <span className="font-semibold">{questions.length}</span> preguntas
            </div>
            <button
              onClick={toggleCreateForm}
              className="flex items-center space-x-2 bg-green-500 text-white px-4 py-2 rounded-xl hover:bg-green-600 transition-all shadow-lg text-sm"
            >
              <Plus className="w-4 h-4" />
              <span>{showCreateForm ? 'Cancelar' : 'Nueva Pregunta'}</span>
            </button>
            <button
              onClick={toggleImportForm}
              className="flex items-center space-x-2 bg-yellow-500 text-white px-4 py-2 rounded-xl hover:bg-yellow-600 transition-all shadow-lg text-sm"
            >
              <Plus className="w-4 h-4" />
              <span>{showImportForm ? 'Cancelar Importación' : 'Importar Preguntas'}</span>
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
              <h2 className="text-xl md:text-2xl font-bold text-gray-800">Crear Nueva Pregunta</h2>
            </div>
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Texto de la pregunta</label>
                <textarea
                  value={createText}
                  onChange={(e) => setCreateText(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 resize-none"
                  rows="3"
                  placeholder="Escribe aquí el texto de la pregunta..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">Áreas Relacionadas</label>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {AREA_OPTIONS.map((area) => (
                    <label
                      key={area}
                      className="flex items-center space-x-3 p-3 bg-gray-50 rounded-xl hover:bg-gray-100 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={createAreas.includes(area)}
                        onChange={() => handleCreateAreaChange(area)}
                        className="w-4 h-4 text-green-600 bg-gray-100 border-gray-300 rounded focus:ring-green-500"
                      />
                      <span className="text-sm text-gray-700">{area}</span>
                    </label>
                  ))}
                </div>
              </div>
              {createSuccess && (
                <div className="bg-green-100 border border-green-200 text-green-800 px-4 py-3 rounded-xl flex items-center space-x-2">
                  <CheckCircle className="w-5 h-5" />
                  <span>{createSuccess}</span>
                </div>
              )}
              {createError && (
                <div className="bg-red-100 border border-red-200 text-red-800 px-4 py-3 rounded-xl flex items-center space-x-2">
                  <AlertCircle className="w-5 h-5" />
                  <span>{createError}</span>
                </div>
              )}
              <div className="flex flex-wrap gap-3 pt-4">
                <button
                  onClick={handleCreateQuestion}
                  className="flex items-center space-x-2 bg-green-500 text-white px-6 py-3 rounded-xl hover:bg-green-600 transition-all text-sm"
                >
                  <Save className="w-4 h-4" />
                  <span>Crear Pregunta</span>
                </button>
                <button
                  onClick={toggleCreateForm}
                  className="flex items-center space-x-2 bg-gray-500 text-white px-6 py-3 rounded-xl hover:bg-gray-600 transition-all text-sm"
                >
                  <X className="w-4 h-4" />
                  <span>Cancelar</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Formulario de importación */}
        {showImportForm && (
          <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-10 h-10 bg-yellow-500 rounded-full flex items-center justify-center">
                <Plus className="w-5 h-5 text-white" />
              </div>
              <h2 className="text-xl md:text-2xl font-bold text-gray-800">Importar Preguntas</h2>
            </div>
            <div className="mb-4 text-gray-600 text-sm">
              <p>El archivo debe ser un archivo de texto con formato **JSON**. Debe contener un **array de objetos**, donde cada objeto representa una pregunta con las siguientes propiedades:</p>
              <ul className="list-disc list-inside mt-2 ml-4">
                <li>**`text`**: El enunciado de la pregunta como una cadena de texto.</li>
                <li>**`area`**: Un **array de cadenas de texto** con las áreas de la pregunta. Las cadenas deben coincidir exactamente con las áreas predefinidas.</li>
                <li>las areas posibles son: [
                  "Ciencias de la Educación y Ciencias del Deporte",
                  "Humanidades, Letras y artes",
                  "Ciencias y Artes Militares",
                  "Ciencias Sociales",
                  "Ciencias Básicas",
                  "Ingeniería, Arquitectura y Tecnología",
                  "Ciencias del Agro y del mar",
                  "Ciencias de la salud"
                  ]
                </li>
              </ul>
              <p className="mt-4 font-semibold text-gray-700">Ejemplo de archivo:</p>
              <pre className="bg-gray-100 p-4 rounded-lg mt-2 overflow-x-auto text-sm">
                {`[
  {
    "text": "¿Te apasionan la forma en que avanza la historia y evolucionamos como humanidad?",
    "area": ["Ciencias Sociales", "Humanidades, Letras y artes"]
  },
  {
    "text": "¿te sientes comodo/a trabajando con números y datos?",
    "area": ["Ciencias Básicas", "Ingeniería, Arquitectura y Tecnología"]
  },
  {
    "text": "¿te gusta conocer nuevas especies?",
    "area": ["Ciencias Básicas"]
  }
]`}
              </pre>
            </div>
            <input
              type="file"
              onChange={handleFileChange}
              accept=".json"
              className="w-full text-gray-700 bg-gray-50 border border-gray-300 rounded-xl p-3 mb-4 text-sm"
            />
            <button
              onClick={handleImportQuestions}
              disabled={importLoading || !importFile}
              className="flex items-center space-x-2 bg-yellow-500 text-white px-6 py-3 rounded-xl hover:bg-yellow-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm"
            >
              {importLoading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              ) : (
                <Save className="w-4 h-4" />
              )}
              <span>{importLoading ? 'Importando...' : 'Importar'}</span>
            </button>
          </div>
        )}

        {/* Mensaje de error */}
        {error && (
          <div className="bg-red-100 border border-red-200 text-red-800 px-4 py-3 rounded-xl mb-6 flex items-center space-x-2">
            <AlertCircle className="w-5 h-5" />
            <span>{error}</span>
          </div>
        )}

        {/* Estado vacío */}
        {questions.length === 0 && !error && !loading && (
          <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
            <HelpCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 text-lg">Test vacío, crea nuevas preguntas</p>
            <p className="text-gray-400 mt-2">Crea tu primera pregunta usando el botón "Nueva Pregunta"</p>
          </div>
        )}

        {/* Lista de preguntas */}
        {paginatedQuestions.length > 0 && (
          <div className="space-y-6">
            {paginatedQuestions.map((q, index) => (
              <div key={q._id} className="bg-white rounded-2xl shadow-lg overflow-hidden">
                {editId === q._id ? (
                  <div className="p-6 space-y-6">
                    {/* Editar pregunta */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Pregunta</label>
                      <textarea
                        value={editText}
                        onChange={(e) => setEditText(e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                        rows="3"
                      />
                    </div>
                    {/* Selección de áreas */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-3">Áreas Relacionadas</label>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                        {AREA_OPTIONS.map((area) => (
                          <label
                            key={area}
                            className="flex items-center space-x-3 p-3 bg-gray-50 rounded-xl hover:bg-gray-100 cursor-pointer"
                          >
                            <input
                              type="checkbox"
                              checked={editAreas.includes(area)}
                              onChange={() => handleAreaChange(area)}
                              className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                            />
                            <span className="text-sm text-gray-700">{area}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                    {/* Botones de acción */}
                    <div className="flex flex-wrap gap-3 pt-4">
                      <button
                        onClick={() => handleSave(q._id)}
                        disabled={saveLoading}
                        className="flex items-center space-x-2 bg-green-500 text-white px-6 py-3 rounded-xl hover:bg-green-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm"
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
                        className="flex items-center space-x-2 bg-red-500 text-white px-6 py-3 rounded-xl hover:bg-red-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                      >
                        <X className="w-4 h-4" />
                        <span>Cancelar</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="p-6 space-y-4">
                    <div className="flex items-start space-x-4">
                      <div className="flex-shrink-0 w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center font-semibold text-sm">
                        {(currentPage - 1) * itemsPerPage + index + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-base sm:text-lg text-gray-800 break-words">{q.text}</p>
                      </div>
                    </div>
                    <div className="pl-12 flex flex-wrap gap-2">
                      {q.area?.map((area, i) => (
                        <span key={i} className={`px-4 py-2 rounded-full text-xs sm:text-sm font-medium ${getAreaColor(area)}`}>
                          {area}
                        </span>
                      ))}
                    </div>
                    <div className="flex flex-wrap gap-2 pt-2 pl-12">
                      <button
                        onClick={() => handleEdit(q)}
                        className="flex items-center space-x-2 bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 text-sm"
                      >
                        <Edit2 className="w-4 h-4" />
                        <span>Editar</span>
                      </button>
                      <button
                        onClick={() => openDeleteModal(q)}
                        className="flex items-center space-x-2 bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 text-sm"
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
            <div className="flex flex-wrap justify-center space-x-2">
              {renderPaginationButtons()}
            </div>
          </div>
        )}

        {/* Modal de confirmación de eliminación */}
        {deleteModal.show && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden">
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
                  ¿Estás seguro de que deseas eliminar esta pregunta?
                </p>
                <div className="bg-gray-50 rounded-lg p-4 mb-6">
                  <p className="text-sm text-gray-600 font-medium">Pregunta a eliminar:</p>
                  <p className="text-gray-800 mt-1 line-clamp-3">
                    {deleteModal.questionText}
                  </p>
                </div>
                <div className="flex flex-wrap gap-3">
                  <button
                    onClick={() => handleDelete(deleteModal.questionId)}
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

        {/* Modales de éxito y error personalizados */}
        <SuccessModal
          show={successModal.show}
          message={successModal.message}
          onClose={closeSuccessModal}
        />
        <ErrorModal
          show={errorModal.show}
          message={errorModal.message}
          onClose={closeErrorModal}
        />
      </div>
    </div>
  );
};

export default GetQuestions;