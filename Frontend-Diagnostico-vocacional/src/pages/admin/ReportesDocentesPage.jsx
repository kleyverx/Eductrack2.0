import React, { useState, useEffect, useMemo, useContext } from 'react';
import { AuthContext } from '../../context/AuthContext';
import { getReporteInstitucional } from '../../api/reporteInstitucional';
import { exportReporteDocentePDF } from '../../utils/reportesPDF';
import { getScoreStyles } from '../../utils/academic';
import { UserCog, School, FileDown, Loader2 } from 'lucide-react';

/**
 * Reportes por Docente (SuperAdmin).
 * Reutiliza el reporte institucional y agrupa las secciones por docente,
 * en un explorador: lista de docentes a la izquierda y sus métricas +
 * exportación a PDF a la derecha.
 */

/** Estilo del % de inasistencia según severidad (réplica del reporte institucional). */
function inasistenciaStyle(pct, enRiesgo) {
  if (enRiesgo > 0 || pct >= 25) {
    return 'bg-rose-50 dark:bg-rose-900/20 text-rose-700 dark:text-rose-400';
  }
  if (pct >= 15) {
    return 'bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400';
  }
  return 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400';
}

const ReportesDocentesPage = () => {
  const { token } = useContext(AuthContext);
  const [data, setData] = useState(null); // null = cargando
  const [error, setError] = useState('');
  const [selDocente, setSelDocente] = useState(null); // docenteId (key) activo

  useEffect(() => {
    getReporteInstitucional(token)
      .then(setData)
      .catch((e) => setError(e.message));
  }, [token]);

  // Agrupa las secciones por docente (id), ordenadas por nombre.
  const grupos = useMemo(() => {
    if (!data?.porSeccion) return [];
    const map = new Map();
    data.porSeccion.forEach((s) => {
      const key = s.docenteId ? String(s.docenteId) : 'sin-docente';
      if (!map.has(key)) map.set(key, { key, docente: s.docente || '—', secciones: [] });
      map.get(key).secciones.push(s);
    });
    return Array.from(map.values()).sort((a, b) =>
      a.docente.localeCompare(b.docente, 'es')
    );
  }, [data]);

  // Selecciona el primer docente al cargar.
  useEffect(() => {
    if (grupos.length && !selDocente) setSelDocente(grupos[0].key);
  }, [grupos, selDocente]);

  const activo = grupos.find((g) => g.key === selDocente) || null;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-6 transition-colors duration-300">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div data-tour="page-reportes-docentes" className="flex items-center gap-3 mb-8">
          <div className="p-2 bg-indigo-600 dark:bg-indigo-500 rounded-lg text-white">
            <UserCog className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
              Reportes por Docente
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Explora los reportes agrupados por cada docente del plantel
            </p>
          </div>
        </div>

        {error ? (
          <div className="bg-rose-50 dark:bg-rose-900/20 border border-rose-100 dark:border-rose-900/40 rounded-2xl p-4 text-sm text-rose-700 dark:text-rose-300">
            {error}
          </div>
        ) : data === null ? (
          <div className="flex justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-slate-300 dark:text-slate-600" />
          </div>
        ) : grupos.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm dark:shadow-none p-8 text-center text-slate-400 dark:text-slate-500">
            Aún no hay secciones con datos.
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-[18rem_1fr] gap-6">
            {/* Lista de docentes */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm dark:shadow-none overflow-hidden self-start transition-colors duration-300">
              <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800">
                <h2 className="font-bold text-slate-800 dark:text-slate-100">Docentes</h2>
              </div>
              <div className="p-3 space-y-1 max-h-[70vh] overflow-y-auto">
                {grupos.map((g) => {
                  const isActive = g.key === selDocente;
                  return (
                    <button
                      key={g.key}
                      onClick={() => setSelDocente(g.key)}
                      className={`w-full flex items-center justify-between gap-2 px-3 py-2.5 rounded-xl text-left transition-colors duration-200 ${
                        isActive
                          ? 'bg-indigo-600 text-white'
                          : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/60'
                      }`}
                    >
                      <span className="text-sm font-semibold truncate">{g.docente}</span>
                      <span
                        className={`shrink-0 text-xs font-bold px-2 py-0.5 rounded-full ${
                          isActive
                            ? 'bg-indigo-500/40 text-white'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
                        }`}
                      >
                        {g.secciones.length}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Detalle del docente activo */}
            {activo && (
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm dark:shadow-none overflow-hidden transition-colors duration-300">
                <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2 min-w-0">
                    <School className="w-5 h-5 text-indigo-500 dark:text-indigo-400 shrink-0" />
                    <div className="min-w-0">
                      <h2 className="font-bold text-slate-800 dark:text-slate-100 truncate">
                        Prof. {activo.docente}
                      </h2>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {activo.secciones.length}{' '}
                        {activo.secciones.length === 1 ? 'sección' : 'secciones'}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => exportReporteDocentePDF(activo.docente, activo.secciones)}
                    className="inline-flex items-center gap-2 bg-indigo-600 text-white text-sm font-semibold px-4 py-2.5 rounded-xl hover:bg-indigo-700 transition-colors duration-300 shrink-0"
                  >
                    <FileDown className="w-4 h-4" />
                    Descargar PDF
                  </button>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 bg-slate-50 dark:bg-slate-800/50">
                        <th className="px-4 py-3">Sección</th>
                        <th className="px-4 py-3 text-center">Estudiantes</th>
                        <th className="px-4 py-3 text-center">Promedio</th>
                        <th className="px-4 py-3 text-center">Aprobados</th>
                        <th className="px-4 py-3 text-center">Aplazados</th>
                        <th className="px-4 py-3 text-center">% Inasist.</th>
                        <th className="px-4 py-3 text-center">En riesgo</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {activo.secciones.map((s, i) => {
                        const chip = s.promedio != null ? getScoreStyles(s.promedio) : null;
                        return (
                          <tr key={`${s.seccion}-${i}`} className="text-slate-700 dark:text-slate-200">
                            <td className="px-4 py-3 font-semibold text-slate-900 dark:text-white">
                              {s.seccion}
                            </td>
                            <td className="px-4 py-3 text-center">{s.estudiantes}</td>
                            <td className="px-4 py-3 text-center">
                              {chip ? (
                                <span
                                  className={`inline-block px-2.5 py-1 rounded-lg text-xs font-bold ${chip.bg} ${chip.text}`}
                                >
                                  {s.promedio}
                                </span>
                              ) : (
                                <span className="text-slate-400 dark:text-slate-600">—</span>
                              )}
                            </td>
                            <td className="px-4 py-3 text-center text-emerald-600 dark:text-emerald-400 font-semibold">
                              {s.aprobados}
                            </td>
                            <td className="px-4 py-3 text-center text-rose-600 dark:text-rose-400 font-semibold">
                              {s.aplazados}
                            </td>
                            <td className="px-4 py-3 text-center">
                              <span
                                className={`inline-block px-2.5 py-1 rounded-lg text-xs font-bold ${inasistenciaStyle(
                                  s.inasistenciaPromedio,
                                  s.enRiesgo
                                )}`}
                              >
                                {s.inasistenciaPromedio}%
                              </span>
                            </td>
                            <td className="px-4 py-3 text-center font-semibold text-slate-700 dark:text-slate-200">
                              {s.enRiesgo}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ReportesDocentesPage;
