import React from 'react';
import { BookOpen, ChevronRight } from 'lucide-react';

/**
 * SubjectCard - Componente de tarjeta de materia con "Semáforo Académico"
 * Utiliza solo Tailwind CSS para efectos de hover y transiciones. Soporta modo oscuro.
 */
const SubjectCard = ({ name, area, score, progress }) => {
  // Lógica de colores del semáforo
  const getStatusColor = (s) => {
    if (s >= 15) return 'border-emerald-500 dark:border-emerald-500';
    if (s >= 11) return 'border-amber-500 dark:border-amber-500';
    return 'border-rose-500 dark:border-rose-500';
  };

  const getBgColor = (s) => {
    if (s >= 15) return 'bg-emerald-50 dark:bg-emerald-900/20';
    if (s >= 11) return 'bg-amber-50 dark:bg-amber-900/20';
    return 'bg-rose-50 dark:bg-rose-900/20';
  };

  const getTextColor = (s) => {
    if (s >= 15) return 'text-emerald-700 dark:text-emerald-400';
    if (s >= 11) return 'text-amber-700 dark:text-amber-400';
    return 'text-rose-700 dark:text-rose-400';
  };

  return (
    <div className={`bg-white dark:bg-slate-900 rounded-2xl shadow-sm dark:shadow-none border border-slate-100 dark:border-slate-800 border-l-4 ${getStatusColor(score)} p-5 hover:shadow-md dark:hover:border-slate-700 hover:-translate-y-1 transition-all duration-300 group cursor-pointer`}>
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className={`p-2.5 rounded-xl ${getBgColor(score)} ${getTextColor(score)}`}>
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-slate-800 dark:text-slate-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
              {name}
            </h3>
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              {area || 'General'}
            </span>
          </div>
        </div>
        <div className={`text-xl font-black ${getTextColor(score)}`}>
          {score.toFixed(1)}
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex justify-between text-xs font-medium text-slate-500 dark:text-slate-400">
          <span>Progreso Académico</span>
          <span>{progress}%</span>
        </div>
        <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden">
          <div 
            className={`h-full rounded-full transition-all duration-500 ${
              score >= 15 ? 'bg-emerald-500' : score >= 11 ? 'bg-amber-500' : 'bg-rose-500'
            }`}
            style={{ width: `${progress}%` }}
          ></div>
        </div>
      </div>

      <div className="mt-4 pt-4 border-t border-slate-50 dark:border-slate-800/50 flex justify-end">
        <button className="text-indigo-600 dark:text-indigo-400 text-xs font-bold flex items-center group-hover:translate-x-1 transition-transform">
          VER DETALLES <ChevronRight className="w-3 h-3 ml-1" />
        </button>
      </div>
    </div>
  );
};

export default SubjectCard;
