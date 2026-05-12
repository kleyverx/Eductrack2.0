import React, { useEffect, useState, useRef } from 'react';
import { AlertTriangle, Loader2, Clock, Zap } from 'lucide-react';

// Componente Timer
// Muestra un temporizador que cuenta hacia atrás desde un tiempo total dado
// y maneja eventos de tiempo crítico y finalización
const Timer = ({ totalMinutes = 30, onTimeUp }) => {
  const timerRef = useRef(null); 

  const [secondsLeft, setSecondsLeft] = useState(() => {
    const storageKey = `testTimer_${totalMinutes}min`;
    const savedTime = localStorage.getItem(storageKey);
    return savedTime ? parseInt(savedTime, 10) : totalMinutes * 60;
  });

  const [showWarningModal, setShowWarningModal] = useState(false);
  const [showFinalModal, setShowFinalModal] = useState(false);
  const [isUrgent, setIsUrgent] = useState(false);
  const totalSeconds = totalMinutes * 60;

  // Calcular porcentaje de progreso
  const progressPercentage = totalSeconds > 0 ? ((totalSeconds - secondsLeft) / totalSeconds) * 100 : 0;
  const timePercentage = totalSeconds > 0 ? (secondsLeft / totalSeconds) * 100 : 0;

  // Determinar el estado del timer
  const getTimerState = () => {
    if (secondsLeft <= 60) return 'critical'; // Último minuto
    if (secondsLeft <= 300) return 'warning'; // Últimos 5 minutos
    if (timePercentage <= 25) return 'urgent'; // Último 25%
    return 'normal';
  };

  const timerState = getTimerState();

  // Actualizar el estado urgente basado en el timerState
  useEffect(() => {
    setIsUrgent(timerState === 'critical');
  }, [timerState]);

  // Cargar el tiempo restante desde localStorage al iniciar
  useEffect(() => {
    if (totalMinutes > 0) {
      const storageKey = `testTimer_${totalMinutes}min`;
      const savedTime = localStorage.getItem(storageKey);
      const newTime = savedTime ? parseInt(savedTime, 10) : totalMinutes * 60;
      
      if (newTime > totalMinutes * 60) {
        setSecondsLeft(totalMinutes * 60);
        localStorage.removeItem(storageKey);
      } else {
        setSecondsLeft(newTime);
      }
    }
  }, [totalMinutes]);

  // Configurar el temporizador
  useEffect(() => {
    if (totalMinutes === 0 || secondsLeft <= 0) {
      return;
    }

    if (timerRef.current) {
      clearInterval(timerRef.current);
    }

    timerRef.current = setInterval(() => {
      setSecondsLeft((prev) => {
        const newTime = Math.max(0, prev - 1);
        const storageKey = `testTimer_${totalMinutes}min`;
        
        if (newTime > 0) {
          localStorage.setItem(storageKey, newTime.toString());
        } else {
          localStorage.removeItem(storageKey);
        }
        
        return newTime;
      });
    }, 1000);

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [totalMinutes, secondsLeft]);

  // Manejar eventos de tiempo crítico y finalización
  useEffect(() => {
    if (secondsLeft <= 0 && totalMinutes > 0) {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      
      setShowFinalModal(true);
      const storageKey = `testTimer_${totalMinutes}min`;
      localStorage.removeItem(storageKey);
      onTimeUp?.();
    }
    else if (secondsLeft === 300 && totalMinutes > 5) {
      setShowWarningModal(true);
      setTimeout(() => setShowWarningModal(false), 4000);
    }
  }, [secondsLeft, onTimeUp, totalMinutes]);

  // Formatear el tiempo restante
  const formatTime = (secs) => {
    const hours = Math.floor(secs / 3600);
    const minutes = Math.floor((secs % 3600) / 60);
    const seconds = secs % 60;
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  // Obtener colores y estilos según el estado del temporizador
  const getTimerColors = () => {
    switch (timerState) {
      case 'critical':
        return {
          bg: 'bg-gradient-to-r from-red-500 via-red-600 to-red-700',
          text: 'text-white',
          progress: 'from-red-400 to-red-600',
          glow: 'shadow-red-500/50',
          pulse: 'animate-pulse'
        };
      case 'warning':
        return {
          bg: 'bg-gradient-to-r from-yellow-400 via-yellow-500 to-orange-500',
          text: 'text-white',
          progress: 'from-yellow-300 to-orange-400',
          glow: 'shadow-yellow-500/50',
          pulse: ''
        };
      case 'urgent':
        return {
          bg: 'bg-gradient-to-r from-orange-400 via-orange-500 to-orange-600',
          text: 'text-white',
          progress: 'from-orange-300 to-orange-500',
          glow: 'shadow-orange-500/30',
          pulse: ''
        };
      default:
        return {
          bg: 'bg-gradient-to-r from-blue-500 via-blue-600 to-indigo-600',
          text: 'text-white',
          progress: 'from-blue-400 to-indigo-500',
          glow: 'shadow-blue-500/30',
          pulse: ''
        };
    }
  };

  const colors = getTimerColors(); // Obtener colores y estilos según el estado del temporizador

  // Si el tiempo total es 0, mostrar un mensaje de carga
  if (totalMinutes === 0) {
    return (
      <div className="flex items-center justify-center p-4">
        <div className="bg-white/80 backdrop-blur-md rounded-2xl shadow-lg px-6 py-4 border border-gray-200">
          <div className="flex items-center space-x-3">
            <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
            <span className="text-gray-700 font-medium">Cargando temporizador...</span>
          </div>
        </div>
      </div>
    );
  }

  // Renderizar el temporizador con animaciones y efectos visuales
  return (
    <div className="flex items-center justify-center p-4">
      <div className={`relative ${colors.bg} ${colors.glow} shadow-2xl rounded-2xl overflow-hidden ${colors.pulse}`}>
        {/* Barra de progreso de fondo */}
        <div className="absolute inset-0 opacity-20">
          <div 
            className="h-full bg-gradient-to-r from-white/30 to-white/10 transition-all duration-1000 ease-out"
            style={{ width: `${progressPercentage}%` }}
          />
        </div>

        {/* Contenido principal */}
        <div className="relative px-8 py-4">
          <div className="flex items-center space-x-4">
            {/* Icono animado */}
            <div className="relative">
              <div className={`w-12 h-12 ${colors.text} rounded-full flex items-center justify-center ${timerState === 'critical' ? 'animate-bounce' : ''}`}>
                {timerState === 'critical' ? (
                  <Zap className="w-6 h-6" />
                ) : (
                  <Clock className="w-6 h-6" />
                )}
              </div>
              
              {/* Círculo de progreso */}
              <svg className="absolute inset-0 w-12 h-12 -rotate-90" viewBox="0 0 48 48">
                <circle
                  cx="24"
                  cy="24"
                  r="20"
                  stroke="white"
                  strokeWidth="2"
                  fill="none"
                  opacity="0.3"
                />
                <circle
                  cx="24"
                  cy="24"
                  r="20"
                  stroke="white"
                  strokeWidth="2"
                  fill="none"
                  strokeDasharray={`${2 * Math.PI * 20}`}
                  strokeDashoffset={`${2 * Math.PI * 20 * (1 - timePercentage / 100)}`}
                  className="transition-all duration-1000 ease-out"
                  strokeLinecap="round"
                />
              </svg>
            </div>

            {/* Información del tiempo */}
            <div className="flex flex-col">
              <div className="flex items-baseline space-x-2">
                <span className={`text-2xl font-bold font-mono ${colors.text} tracking-wider`}>
                  {formatTime(secondsLeft)}
                </span>
                {timerState === 'critical' && (
                  <span className="text-xs font-medium text-white/80 animate-pulse">
                    ¡ÚLTIMO MINUTO!
                  </span>
                )}
              </div>
              
              <div className="flex items-center space-x-2">
                <span className={`text-sm font-medium ${colors.text} opacity-90`}>
                  Tiempo restante
                </span>
                
                {/* Indicador de estado */}
                <div className="flex items-center space-x-1">
                  <div className={`w-2 h-2 rounded-full bg-white/80 ${isUrgent ? 'animate-ping' : ''}`} />
                  <span className="text-xs font-medium text-white/70 capitalize">
                    {timerState === 'critical' ? 'Crítico' : 
                     timerState === 'warning' ? 'Atención' : 
                     timerState === 'urgent' ? 'Apúrate' : 'Normal'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Efectos de brillo */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -skew-x-12 translate-x-full animate-pulse" />
      </div>

      {/* Modal de advertencia mejorado */}
      {showWarningModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/60 z-50 backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-md mx-4 text-center transform animate-bounce">
            <div className="relative">
              <div className="w-20 h-20 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full flex items-center justify-center mx-auto mb-6 animate-pulse">
                <AlertTriangle className="w-10 h-10 text-white" />
              </div>
              
              <div className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center animate-ping">
                <span className="text-white text-xs font-bold">!</span>
              </div>
            </div>
            
            <h2 className="text-3xl font-bold text-gray-800 mb-3">
              ⚠️ ¡Atención!
            </h2>
            <p className="text-gray-600 text-lg mb-4">
              Solo quedan <span className="font-bold text-orange-600">5 minutos</span> para finalizar el test.
            </p>
            <p className="text-sm text-gray-500">
              Asegúrate de responder todas las preguntas restantes.
            </p>

            {/* Barra de progreso en el modal */}
            <div className="mt-6 bg-gray-200 rounded-full h-3 overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-yellow-400 to-orange-500 transition-all duration-300"
                style={{ width: `${100 - timePercentage}%` }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Modal final mejorado */}
      {showFinalModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/70 z-50 backdrop-blur-md">
          <div className="bg-white rounded-3xl shadow-2xl p-10 max-w-md mx-4 text-center">
            <div className="relative mb-6">
              <div className="w-24 h-24 bg-gradient-to-r from-red-500 to-red-700 rounded-full flex items-center justify-center mx-auto">
                <Loader2 className="w-12 h-12 text-white animate-spin" />
              </div>
              
              {/* Círculo de pulso */}
              <div className="absolute inset-0 w-24 h-24 border-4 border-red-500 rounded-full animate-ping opacity-20 mx-auto" />
            </div>
            
            <h2 className="text-3xl font-bold text-gray-800 mb-3">
              ⏰ ¡Tiempo Agotado!
            </h2>
            <p className="text-gray-600 text-lg mb-4">
              Tus respuestas están siendo guardadas automáticamente.
            </p>
            <p className="text-sm text-gray-500 mb-6">
              Por favor espera mientras procesamos tu información...
            </p>

            {/* Animación de carga */}
            <div className="flex justify-center space-x-2">
              {[...Array(3)].map((_, i) => (
                <div
                  key={i}
                  className="w-3 h-3 bg-red-500 rounded-full animate-bounce"
                  style={{ animationDelay: `${i * 0.1}s` }}
                />
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Timer;