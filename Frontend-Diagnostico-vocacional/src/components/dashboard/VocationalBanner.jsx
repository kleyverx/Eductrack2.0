import React from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, Target, ArrowRight } from 'lucide-react';
import { getVocationalIcon } from '../../utils/vocationalIcons';

/**
 * Banner de bienvenida con el perfil vocacional destacado.
 * - Con resultado: muestra el área top con su icono temático y un resumen.
 * - Sin resultado: invita a realizar el test vocacional (CTA).
 *
 * @param {{ userName?: string, topArea?: string|null }} props
 */
const VocationalBanner = ({ userName, topArea }) => {
  const name = userName || 'Estudiante';

  if (!topArea) {
    return (
      <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl shadow-sm dark:shadow-none border border-slate-100 dark:border-slate-800 relative overflow-hidden transition-colors duration-300">
        <div className="absolute top-0 right-0 p-4 opacity-5 dark:opacity-10">
          <Target className="w-32 h-32 text-indigo-600 dark:text-indigo-400" />
        </div>
        <div className="relative z-10">
          <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100 mb-2">Hola, {name} 👋</h2>
          <p className="text-slate-600 dark:text-slate-400 max-w-2xl leading-relaxed mb-5">
            Aún no conocemos tu perfil vocacional. Realiza el test para descubrir las áreas
            de conocimiento que mejor se alinean con tus intereses.
          </p>
          <Link
            to="/app/test"
            className="inline-flex items-center gap-2 bg-indigo-600 text-white text-sm font-semibold px-5 py-2.5 rounded-xl hover:bg-indigo-700 transition-colors shadow-sm hover:shadow-md"
          >
            <Target className="w-4 h-4" />
            Realizar test vocacional
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    );
  }

  const { Icon, text, bg, bgDark } = getVocationalIcon(topArea);

  return (
    <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl shadow-sm dark:shadow-none border border-slate-100 dark:border-slate-800 relative overflow-hidden transition-colors duration-300">
      {/* Icono temático grande y difuminado de fondo */}
      <div className="absolute top-0 right-0 p-2 opacity-[0.07] dark:opacity-[0.12]">
        <Icon className="w-40 h-40 text-slate-900 dark:text-white" />
      </div>

      <div className="relative z-10">
        <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100 mb-4">Hola, {name} 👋</h2>

        <div className="flex items-start gap-4">
          <div className={`${bg} ${bgDark} ${text} p-3.5 rounded-2xl flex-shrink-0`}>
            <Icon className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider mb-1">
              <Sparkles className="w-3.5 h-3.5" />
              Tu perfil vocacional
            </div>
            <p className="text-xl font-bold text-slate-900 dark:text-slate-100 leading-tight mb-1.5">{topArea}</p>
            <p className="text-slate-600 dark:text-slate-400 text-sm max-w-xl leading-relaxed">
              Esta es el área con mayor afinidad según tu test. Alinea tu desempeño académico
              con esta vocación para potenciar tus metas.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VocationalBanner;
