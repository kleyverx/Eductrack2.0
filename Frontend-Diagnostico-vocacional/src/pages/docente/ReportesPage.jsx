import React, { useContext, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import { listarSecciones } from '../../api/academico';
import {
  FileText,
  Loader2,
  FileBarChart,
  CalendarCheck,
  Award,
  ChevronRight,
} from 'lucide-react';

/**
 * Centro de Reportes (docente).
 * Agrupa en una sola pantalla los reportes disponibles por sección:
 * preinforme académico, reporte de asistencia y constancias/certificaciones.
 */
const ReportesPage = () => {
  const { token } = useContext(AuthContext);
  const [secciones, setSecciones] = useState(null); // null = cargando
  const [selId, setSelId] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    listarSecciones(token)
      .then((list) => {
        setSecciones(list);
        if (list.length) setSelId(list[0]._id);
      })
      .catch(() => {
        setSecciones([]);
        setError('No se pudieron cargar las secciones');
      });
  }, [token]);

  const sec = secciones ? secciones.find((s) => s._id === selId) : null;

  const reportes = sec
    ? [
        {
          titulo: 'Preinforme académico',
          desc: 'Matriz de notas por lapso, PDF y CSV.',
          icon: FileBarChart,
          to: `/app/docente/secciones/${sec._id}/preinforme`,
        },
        {
          titulo: 'Reporte de asistencia',
          desc: 'Resumen de inasistencia con semáforo, PDF y CSV.',
          icon: CalendarCheck,
          to: `/app/docente/secciones/${sec._id}/asistencia`,
        },
        {
          titulo: 'Constancias y certificaciones',
          desc: 'Emite constancias y la certificación 1ro–4to desde el detalle.',
          icon: Award,
          to: `/app/docente/secciones/${sec._id}`,
        },
      ]
    : [];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-6 transition-colors duration-300">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <div className="p-2 bg-indigo-600 dark:bg-indigo-500 rounded-lg text-white">
            <FileText className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
              Centro de Reportes
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Todos los reportes de tus secciones en un solo lugar
            </p>
          </div>
        </div>

        {error && <p className="text-rose-600 dark:text-rose-400 text-sm mb-4">{error}</p>}

        {secciones === null ? (
          <div className="flex justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-slate-300 dark:text-slate-600" />
          </div>
        ) : secciones.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 bg-white dark:bg-slate-900 rounded-3xl border border-dashed border-slate-200 dark:border-slate-800 text-center px-6">
            <div className="p-5 bg-indigo-50 dark:bg-indigo-900/30 rounded-3xl mb-4">
              <FileText className="w-12 h-12 text-indigo-500 dark:text-indigo-400" />
            </div>
            <p className="text-slate-700 dark:text-slate-200 font-bold text-lg mb-1">
              Aún no tienes secciones
            </p>
            <p className="text-slate-400 dark:text-slate-500 text-sm mb-6 max-w-md">
              Créalas en Mis Secciones para poder generar reportes.
            </p>
            <Link
              to="/app/docente/secciones"
              className="inline-flex items-center gap-2 bg-indigo-600 text-white text-sm font-semibold px-5 py-2.5 rounded-xl hover:bg-indigo-700 transition-colors"
            >
              Ir a Mis Secciones
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
        ) : (
          <>
            {/* Selector de sección */}
            <div className="flex flex-wrap gap-2 mb-6">
              {secciones.map((s) => {
                const activo = s._id === selId;
                return (
                  <button
                    key={s._id}
                    onClick={() => setSelId(s._id)}
                    className={`px-4 py-2 rounded-xl text-sm font-semibold transition-colors duration-300 ${
                      activo
                        ? 'bg-indigo-600 text-white'
                        : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-indigo-200 dark:hover:border-indigo-800'
                    }`}
                  >
                    {`${s.anio}° ${s.nombre} · ${s.periodo}`}
                  </button>
                );
              })}
            </div>

            {/* Grilla de reportes de la sección activa */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {reportes.map((r) => (
                <Link
                  key={r.titulo}
                  to={r.to}
                  className="group bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 p-5 hover:border-indigo-200 dark:hover:border-indigo-800 hover:shadow-sm transition-all duration-300"
                >
                  <div className="w-12 h-12 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-xl flex items-center justify-center mb-4">
                    <r.icon className="w-6 h-6" />
                  </div>
                  <h3 className="font-bold text-slate-800 dark:text-slate-100 mb-1 flex items-center gap-1">
                    {r.titulo}
                    <ChevronRight className="w-4 h-4 text-slate-300 dark:text-slate-600 group-hover:text-indigo-500 group-hover:translate-x-0.5 transition-all" />
                  </h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400">{r.desc}</p>
                </Link>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default ReportesPage;
