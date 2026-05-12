import React from 'react';
import { BookOpen, ChevronRight } from 'lucide-react';

const SubjectCard = ({ name, area, score, progress }) => {
  // Academic Semaphore Logic
  const getStatusColor = (s) => {
    if (s >= 15) return 'border-emerald-500';
    if (s >= 11) return 'border-amber-500';
    return 'border-rose-500';
  };

  const getBgColor = (s) => {
    if (s >= 15) return 'bg-emerald-50';
    if (s >= 11) return 'bg-amber-50';
    return 'bg-rose-50';
  };

  const getTextColor = (s) => {
    if (s >= 15) return 'text-emerald-700';
    if (s >= 11) return 'text-amber-700';
    return 'text-rose-700';
  };

  return (
    <div className={`bg-white rounded-2xl shadow-sm border-l-4 ${getStatusColor(score)} p-5 hover:shadow-md transition-all duration-300 group`}>
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className={`p-2.5 rounded-xl ${getBgColor(score)} ${getTextColor(score)}`}>
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-slate-800 group-hover:text-indigo-600 transition-colors">
              {name}
            </h3>
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">
              {area || 'General'}
            </span>
          </div>
        </div>
        <div className={`text-xl font-black ${getTextColor(score)}`}>
          {score.toFixed(1)}
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex justify-between text-xs font-medium text-slate-500">
          <span>Progreso Académico</span>
          <span>{progress}%</span>
        </div>
        <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
          <div 
            className={`h-full rounded-full transition-all duration-500 ${
              score >= 15 ? 'bg-emerald-500' : score >= 11 ? 'bg-amber-500' : 'bg-rose-500'
            }`}
            style={{ width: `${progress}%` }}
          ></div>
        </div>
      </div>

      <div className="mt-4 pt-4 border-t border-slate-50 flex justify-end">
        <button className="text-indigo-600 text-xs font-bold flex items-center hover:translate-x-1 transition-transform">
          VER DETALLES <ChevronRight className="w-3 h-3 ml-1" />
        </button>
      </div>
    </div>
  );
};

export default SubjectCard;
