import React, { useEffect, useState, useContext } from 'react';
import ProgressBar from '../../components/ProgressBar';
import { getQuestionsByTestId, saveAnswers } from '../../api/questions';
import { AuthContext } from '../../context/AuthContext';
import { generateUserResult, getUserResult } from '../../api/results';
import { getUserById } from '../../api/user';
import { useNavigate } from 'react-router-dom';
import { getActiveTest } from '../../api/tests';
import {
  ChevronLeft,
  ChevronRight,
  Check,
  Edit3,
  Send,
  AlertCircle,
  Loader2,
  X,
  HelpCircle,
} from 'lucide-react';
import Timer from '../Timer';


const options = [1, 2, 3, 4, 5]; // Opciones de respuesta del test

const colorByValue = {
  1: 'checked:bg-red-500 checked:border-red-500 border-red-300 text-red-500 bg-red-50 hover:bg-red-100',
  2: 'checked:bg-orange-400 checked:border-orange-400 border-orange-300 text-orange-400 bg-orange-50 hover:bg-orange-100',
  3: 'checked:bg-yellow-400 checked:border-yellow-400 border-yellow-300 text-yellow-500 bg-yellow-50 hover:bg-yellow-50',
  4: 'checked:bg-blue-400 checked:border-blue-400 border-blue-300 text-blue-400 bg-blue-50 hover:bg-blue-100',
  5: 'checked:bg-green-500 checked:border-green-500 border-green-300 text-green-500 bg-green-50 hover:bg-green-100',
}; // Colores para cada opción de respuesta

const optionLabels = {
  1: 'Muy en desacuerdo',
  2: 'En desacuerdo',
  3: 'Neutral',
  4: 'De acuerdo',
  5: 'Muy de acuerdo',
}; // Etiquetas para cada opción de respuesta

// Componente principal del test de usuario
const TestUser = () => {
  const { token, user } = useContext(AuthContext);
  const navigate = useNavigate();

  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState([]);
  const [error, setError] = useState(null);
  const [reviewMode, setReviewMode] = useState(false);
  const [saving, setSaving] = useState(false);
  const [checkingProfile, setCheckingProfile] = useState(true);
  const [profileComplete, setProfileComplete] = useState(false);
  const [checkingCompletion, setCheckingCompletion] = useState(false);
  const [alreadyCompleted, setAlreadyCompleted] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [testDuration, setTestDuration] = useState(0);


  const [modalState, setModalState] = useState({
    show: false,
    title: '',
    message: '',
    onClose: null,
  });

  const groupSize = 3;

  // Función para cerrar el modal
  const closeModal = () => {
    setModalState({
      show: false,
      title: '',
      message: '',
      onClose: null,
    });
  };
// Función para manejar el envío de respuestas

  const handleSubmit = async (forceSubmit = false) => {
    if (submitted) return;
    setSubmitted(true);

    localStorage.removeItem('testTimer');
    localStorage.removeItem('testAnswers');

    if (answers.length === 0) {
      setSubmitted(false);
      setModalState({
        show: true,
        title: 'Sin Respuestas',
        message:
          'No se guardará el test porque no respondiste ninguna pregunta.',
        onClose: () => {
          closeModal();
          navigate('/app/dashboard');
        },
      });
      return;
    }

    if (!forceSubmit && answers.length < questions.length) {
      setSubmitted(false);
      setModalState({
        show: true,
        title: 'Test Incompleto',
        message: 'Por favor responde todas las preguntas antes de enviar.',
        onClose: closeModal,
      });
      return;
    }

    try {
      setSaving(true);
      await saveAnswers({ respuestas: answers }, token);
      await generateUserResult(token);

      navigate(`/app/results/${user?.id}`);
    } catch (err) {
      console.error('Error al enviar respuestas:', err);
      setSubmitted(false);
      setModalState({
        show: true,
        title: 'Error de Envío',
        message: 'Error al enviar respuestas o generar resultados.',
        onClose: closeModal,
      });
    } finally {
      setSaving(false);
    }
  };

  // Verifica si el perfil del usuario está completo
  useEffect(() => {
    if (!token || !user) {
      setCheckingProfile(false);
      return;
    }

    const checkUserProfile = async () => {
      try {
        const userData = await getUserById(user.id, token);
        // Solo los campos que se piden en el registro; los datos demográficos
        // extendidos (ubicación, unidad educativa) son opcionales para el test.
        const requiredFields = ['name', 'email', 'telefono'];
        const isComplete = requiredFields.every((field) => !!userData[field]);
        setProfileComplete(isComplete);
      } catch (err) {
        console.error('Error al verificar el perfil:', err);
        setProfileComplete(false);
      } finally {
        setCheckingProfile(false);
      }
    };
    checkUserProfile();
  }, [token, user]);

  // Verifica si el usuario ya completó el test

  useEffect(() => {
    if (!token || !profileComplete || alreadyCompleted) return;
    const checkTestCompletion = async () => {
      try {
        setCheckingCompletion(true);
        const result = await getUserResult(token);
        if (result) {
          setAlreadyCompleted(true);
        }
      } catch (err) {
        console.log('Usuario sin resultados previos → puede hacer el test');
      } finally {
        setCheckingCompletion(false);
      }
    };
    checkTestCompletion();
  }, [token, profileComplete, alreadyCompleted]);

  // Carga las preguntas del test activo

  useEffect(() => {
    if (!token || !profileComplete || alreadyCompleted) return;
    const fetchQuestionsAndTestDuration = async () => {
      try {
        const activeTest = await getActiveTest(token);
        if (!activeTest) {
          setError('No hay test disponible en estos momentos.');
          return;
        }

        setTestDuration(activeTest.duracion);

        const data = await getQuestionsByTestId(activeTest._id, token);
        if (!data || data.length === 0) {
          setError('No se encontraron preguntas para el test activo.');
          return;
        }
        setQuestions(data);

        const savedAnswers = localStorage.getItem('testAnswers');
        if (savedAnswers) {
          setAnswers(JSON.parse(savedAnswers));
        }
      } catch (err) {
        setError('No hay test disponible en estos momentos.');
      }
    };
    fetchQuestionsAndTestDuration();
  }, [token, profileComplete, alreadyCompleted]);

  // Maneja las respuestas del usuario
  const handleAnswer = (questionId, value) => {
    setAnswers((prev) => {
      const others = prev.filter((a) => a.question !== questionId);
      const newAnswers = [
        ...others,
        { question: questionId, selectedOptionValue: value },
      ];
      localStorage.setItem('testAnswers', JSON.stringify(newAnswers));
      return newAnswers;
    });
  };

  // Verifica si todas las preguntas del grupo actual están respondidas
  const isGroupAnswered = () => {
    return questions
      .slice(currentIndex, currentIndex + groupSize)
      .every((q) => answers.find((a) => a.question === q._id));
  };

  //  Maneja la navegación entre preguntas

  const handleNext = () => {
    if (currentIndex + groupSize < questions.length) {
      setCurrentIndex(currentIndex + groupSize);
    } else {
      setReviewMode(true);
    }
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - groupSize);
    }
  };

  // Maneja la navegación al modo de revisión
  const handleEditAnswer = (questionId, newValue) => {
    setAnswers((prev) => {
      const newAnswers = prev.map((a) =>
        a.question === questionId ? { ...a, selectedOptionValue: newValue } : a
      );
      localStorage.setItem('testAnswers', JSON.stringify(newAnswers));
      return newAnswers;
    });
  };

  // Maneja la navegación a los resultados del test
  const handleGoToResults = () => {
    navigate(`/app/results/${user?.id}`);
  };

  // Maneja la navegación al panel del usuario
  const handleGoToProfile = () => {
    navigate('/app/dashboard');
  };
  // Maneja el cierre del modal
  if (checkingProfile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <Loader2 className="w-10 h-10 animate-spin text-blue-600" />
      </div>
    );
  }

  // Si el perfil no está completo, muestra un modal
  if (!profileComplete) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md text-center">
          <AlertCircle className="w-14 h-14 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-800 mb-2">
            Perfil Incompleto
          </h2>
          <p className="text-gray-600 mb-6">
            Para poder realizar el test, por favor completa toda la información
            de tu perfil.
          </p>
          <button
            onClick={handleGoToProfile}
            className="bg-gradient-to-r from-red-500 to-rose-600 text-white px-6 py-3 rounded-lg hover:from-red-600 hover:to-rose-700 transition-all"
          >
            Ir a mi perfil
          </button>
        </div>
      </div>
    );
  }

  // Si el usuario ya completó el test, muestra un modal
  if (checkingCompletion) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <Loader2 className="w-10 h-10 animate-spin text-blue-600" />
      </div>
    );
  }

  // Si el usuario ya completó el test, muestra un modal
  if (alreadyCompleted) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md text-center">
          <HelpCircle className="w-14 h-14 text-blue-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-800 mb-2">
            ¡Ya completaste el test!
          </h2>
          <p className="text-gray-600 mb-6">
            Solo puedes responder el test una vez. Puedes ver tu resultado
            actual.
          </p>
          <button
            onClick={handleGoToResults}
            className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white px-6 py-3 rounded-lg hover:from-blue-600 hover:to-indigo-700 transition-all"
          >
            Ver mis resultados
          </button>
        </div>
      </div>
    );
  }

  // Si hay un error al cargar las preguntas, muestra un mensaje
  if (!token) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-lg p-8 text-center max-w-md">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-800 mb-2">
            Acceso Restringido
          </h2>
          <p className="text-gray-600">
            No estás autenticado para acceder al test.
          </p>
        </div>
      </div>
    );
  }

  // Si hay un error al cargar las preguntas, muestra un mensaje
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-lg p-8 text-center max-w-md">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Error</h2>
          <p className="text-red-600">{error}</p>
        </div>
      </div>
    );
  }

  if (questions.length === 0 || testDuration === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-lg p-8 text-center max-w-md">
          <Loader2 className="w-16 h-16 text-blue-500 animate-spin mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-800 mb-2">
            Cargando Test
          </h2>
          <p className="text-gray-600">Preparando tu test vocacional...</p>
        </div>
      </div>
    );
  }

  // Si el test está en modo de revisión, muestra las respuestas
  if (reviewMode) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4 w-full">
        <div className="max-w-6xl mx-auto">
          <div className="bg-white rounded-2xl shadow-lg mb-8 overflow-hidden">
            <div className="bg-gradient-to-r from-blue-500 to-indigo-600 p-6">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                  <Edit3 className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-white">
                    Revisión de Respuestas
                  </h2>
                  <p className="text-blue-100">
                    Revisa y edita tus respuestas antes de enviar
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {answers.map((a) => {
              const question = questions.find((q) => q._id === a.question);
              return (
                <div
                  key={a.question}
                  className="bg-white rounded-2xl shadow-lg p-6"
                >
                  <p className="text-lg font-semibold text-gray-800 mb-4">
                    {question?.text}
                  </p>
                  <div className="flex justify-center gap-3">
                    {options.map((value) => (
                      <label
                        key={value}
                        className="flex flex-col items-center cursor-pointer group"
                      >
                        <input
                          type="radio"
                          name={`edit-${a.question}`}
                          value={value}
                          checked={a.selectedOptionValue === value}
                          onChange={() => handleEditAnswer(a.question, value)}
                          className={`appearance-none w-10 h-10 border-2 rounded-full transition-all duration-200 ${colorByValue[value]}`}
                        />
                        <span className="text-xs text-gray-500 mt-1 text-center max-w-16">
                          {optionLabels[value]}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="text-center">
            <button
              onClick={() => handleSubmit(false)}
              disabled={saving}
              className="bg-gradient-to-r from-green-500 to-emerald-600 text-white px-8 py-4 rounded-xl hover:from-green-600 hover:to-emerald-700 disabled:opacity-50 transition-all flex items-center space-x-3 mx-auto"
            >
              {saving ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span className="text-lg font-semibold">Enviando...</span>
                </>
              ) : (
                <>
                  <Send className="w-5 h-5" />
                  <span className="text-lg font-semibold">
                    Guardar Respuestas
                  </span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Renderiza las preguntas del test
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex flex-col w-full pb-16">
      {questions.length > 0 && (
        <Timer
          totalMinutes={testDuration}
          onTimeUp={() => {
            if (!submitted) {
              handleSubmit(true);
            }
          }}
        />
      )}

      <div className="flex-1 flex flex-col p-4 w-full">
        <div className="max-w-4xl mx-auto flex flex-col h-full w-full">
          <div className="text-center mb-4">
            <h1 className="text-2xl lg:text-3xl font-bold text-gray-800 mb-2">
              Test de Orientación Vocacional
            </h1>
            <p className="text-gray-600">
              Pregunta {currentIndex + 1} -{' '}
              {Math.min(currentIndex + groupSize, questions.length)} de{' '}
              {questions.length}
            </p>
          </div>

          <div className="flex-1 flex flex-col justify-center space-y-4 w-full">
            {questions
              .slice(currentIndex, currentIndex + groupSize)
              .map((question, idx) => {
                const selected = answers.find(
                  (a) => a.question === question._id
                )?.selectedOptionValue;
                // Renderiza cada pregunta con sus opciones
                return (
                  <div
                    key={question._id}
                    className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl w-full"
                  >
                    <div className="text-center">
                      <div className="inline-flex items-center justify-center w-8 h-8 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-full text-sm font-bold mb-3">
                        {currentIndex + idx + 1}
                      </div>
                      <p className="text-lg font-semibold text-gray-800 mb-6">
                        {question.text}
                      </p>

                      <div className="flex justify-center gap-3 lg:gap-4">
                        {options.map((value) => (
                          <label
                            key={value}
                            className="flex flex-col items-center cursor-pointer group"
                          >
                            <input
                              type="radio"
                              name={`question-${question._id}`}
                              value={value}
                              checked={selected === value}
                              onChange={() => handleAnswer(question._id, value)}
                              className={`appearance-none w-10 h-10 lg:w-12 lg:h-12 border-2 rounded-full transition-all duration-200 transform group-hover:scale-105 ${colorByValue[value]}`}
                            />
                            <span className="text-xs text-gray-500 mt-1 text-center max-w-16">
                              {optionLabels[value]}
                            </span>
                            {selected === value && (
                              <Check className="w-3 h-3 text-white absolute mt-3" />
                            )}
                          </label>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              })}
          </div>

          <div className="mt-4">
            <ProgressBar
              current={Math.min(currentIndex + groupSize, questions.length)}
              total={questions.length}
            />
          </div>

          <div className="flex justify-between items-center mt-4 w-full">
            <button
              onClick={handlePrevious}
              disabled={currentIndex === 0}
              className="flex items-center space-x-2 px-4 py-2 bg-gray-200 text-gray-700 rounded-xl hover:bg-gray-300 disabled:opacity-50"
            >
              <ChevronLeft className="w-4 h-4" />
              <span className="font-semibold">Anterior</span>
            </button>
            <button
              onClick={handleNext}
              disabled={!isGroupAnswered()}
              className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-xl hover:from-blue-600 hover:to-indigo-700 disabled:opacity-50"
            >
              <span className="font-semibold">
                {currentIndex + groupSize >= questions.length
                  ? 'Finalizar'
                  : 'Siguiente'}
              </span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {modalState.show && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 overflow-hidden">
            <div className="bg-gradient-to-r from-red-500 to-rose-600 p-6">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                  <AlertCircle className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">
                    {modalState.title}
                  </h3>
                </div>
              </div>
            </div>

            <div className="p-6">
              <p className="text-gray-700 mb-4">{modalState.message}</p>
              <div className="flex justify-end">
                <button
                  onClick={modalState.onClose}
                  className="flex-1 bg-red-500 text-white py-3 px-4 rounded-xl hover:bg-red-600 transition-all font-medium flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <X className="w-4 h-4" />
                  <span>Aceptar</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TestUser;