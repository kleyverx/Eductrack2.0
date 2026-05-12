// src/components/ProgressBar.jsx
import React from 'react';
import PropTypes from 'prop-types';

const ProgressBar = ({ current, total, label }) => {
  const percentage = Math.min(Math.round((current / total) * 100), 100);
  const isCompleted = percentage === 100; // Verifica si el progreso está completo

  const barColor = isCompleted
    ? 'from-green-500 to-emerald-600'
    : 'from-blue-500 to-indigo-600'; // Color de la barra según el estado

  const barGlow = isCompleted
    ? 'shadow-lg shadow-emerald-500/50'
    : ''; // Efecto de brillo para la barra cuando está completa

    // Renderiza la barra de progreso
  return (
    <div className="w-full bg-white rounded-xl shadow-lg border border-gray-100 p-6 transition-all duration-300">
      {/* Se ajustó el ancho máximo del contenedor de la barra */}
      <div className="max-w-md mx-auto">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-semibold text-gray-500">
            {label || 'Progreso'}
          </span>
          <span className="text-sm font-bold text-gray-800 transition-colors duration-300">
            {isCompleted ? 'Completado!' : `${percentage}%`}
          </span>
        </div>
        <div
          className="w-full h-3 bg-gray-200 rounded-full overflow-hidden"
          role="progressbar"
          aria-valuenow={percentage}
          aria-valuemin="0"
          aria-valuemax="100"
        >
          <div
            className={`h-full bg-gradient-to-r ${barColor} ${barGlow} rounded-full transition-all duration-500 ease-in-out transform`}
            style={{ width: `${percentage}%` }}
          />
        </div>
      </div>
    </div>
  );
};

ProgressBar.propTypes = {
  current: PropTypes.number.isRequired,
  total: PropTypes.number.isRequired,
  label: PropTypes.string,
}; // PropTypes para validar las props

export default ProgressBar;