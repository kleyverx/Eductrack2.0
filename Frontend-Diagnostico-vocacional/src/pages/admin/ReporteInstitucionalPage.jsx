import React, { useState, useEffect, useMemo, useContext } from 'react';
import { Link } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import { getReporteInstitucional } from '../../api/reporteInstitucional';
import { exportReporteInstitucionalPDF, exportReporteDocentePDF } from '../../utils/reportesPDF';
import { getScoreStyles } from '../../utils/academic';
import {
  BarChart3,
  Users,
  GraduationCap,
  School,
  UsersRound,
  UserCog,
  FileDown,
  Loader2,
  ChevronRight,
} from 'lucide-react';

/**
 * Reportes (SuperAdmin). Dos vistas en pestañas sobre el mismo conjunto de datos:
 *   - Institucional: matrícula, rendimiento y asistencia por sección + vocacional.
 *   - Por Docente: las mismas secciones agrupadas por docente, con PDF por docente.
 */

/** Estilo del % de inasistencia según severidad. */
function inasistenciaStyle(pct, enRiesgo) {
  if (enRiesgo > 0 || pct >= 25) {
    return 'bg-rose-50 dark:bg-rose-900/20 text-rose-700 dark:text-rose-400';
  }
  if (pct >= 15) {
    return 'bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400';
  }
  return 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400';
}

const ReporteInstitucionalPage = () => {
  const { token } = useContext(AuthContext);
  const [data, setData] = useState(null); // null = cargando
  const [error, setError] = useState('');
  const [tab, setTab] = useState('institucional'); // 'institucional' | 'docentes'
  const [selDocente, setSelDocente] = useState(null); // docenteId activo (pestaña por docente)

  useEffect(() => {
    getReporteInstitucional(token)
      .then(setData)
      .catch((e) => setError(e.message));
  }, [token]);

  const t = data?.totales || {};

  const kpis = [
    { label: 'Estudiantes', value: t.estudiantes ?? 0, Icon: Users },
    { label: 'Docentes', value: t.docentes ?? 0, Icon: GraduationCap },
    { label: 'Secciones', value: t.secciones ?? 0, Icon: School },
    { label: 'Hombres / Mujeres', value: `${t.hombres ?? 0} / ${t.mujeres ?? 0}`, Icon: UsersRound },
  ];

  // Máximo para dimensionar las barras de áreas vocacionales.
  const maxVoc = Math.max(1, ...(data?.vocacional || []).map((a) => a.cantidad || 0));

  // Agrupa las secciones por docente (para la pestaña "Por Docente").
  const grupos = useMemo(() => {
    if (!data?.porSeccion) return [];
    const map = new Map();
    data.porSeccion.forEach((s) => {
      const key = s.docenteId ? String(s.docenteId) : 'sin-docente';
      if (!map.has(key)) map.set(key, { key, docente: s.docente || '—', secciones: [] });
      map.get(key).secciones.push(s);
    });
    return Array.from(map.values()).sort((a, b) => a.docente.localeCompare(b.docente, 'es'));
  }, [data]);

  // Selecciona el primer docente al cargar / cambiar a la pestaña por docente.
  useEffect(() => {
    if (grupos.length && !selDocente) setSelDocente(grupos[0].key);
  }, [grupos, selDocente]);

  const activo = grupos.find((g) => g.key === selDocente) || null;

  const TabButton = ({ value, Icon, label }) => (
    <button
      onClick={() => setTab(value)}
      className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-colors duration-200 ${
        tab === value
          ? 'bg-indigo-600 text-white'
          : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800'
      }`}
    >
      <Icon className="w-4 h-4" />
      {label}
    </button>
  );

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-6 transition-colors duration-300">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between gap-3 mb-6">
          <div data-tour="page-reporte-institucional" className="flex items-center gap-3">
            <div className="p-2 bg-indigo-600 dark:bg-indigo-500 rounded-lg text-white">
              <BarChart3 className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
                Reportes
              </h1>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Resumen académico del plantel — institucional y por docente
              </p>
            </div>
          </div>
          {tab === 'institucional' && (
            <button
              onClick={() => data && exportReporteInstitucionalPDF(data)}
              disabled={!data}
              className="inline-flex items-center gap-2 bg-indigo-600 text-white text-sm font-semibold px-4 py-2.5 rounded-xl hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-300"
            >
              <FileDown className="w-4 h-4" />
              Descargar PDF
            </button>
          )}
        </div>

        {/* Pestañas */}
        <div className="flex items-center gap-2 mb-6">
          <TabButton value="institucional" Icon={BarChart3} label="Institucional" />
          <TabButton value="docentes" Icon={UserCog} label="Por Docente" />
        </div>

        {error ? (
          <div className="bg-rose-50 dark:bg-rose-900/20 border border-rose-100 dark:border-rose-900/40 rounded-2xl p-4 text-sm text-rose-700 dark:text-rose-300">
            {error}
          </div>
        ) : data === null ? (
          <div className="flex justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-slate-300 dark:text-slate-600" />
          </div>
        ) : tab === 'institucional' ? (
          <>
            {/* KPIs */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              {kpis.map(({ label, value, Icon }) => (
                <div
                  key={label}
                  className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm dark:shadow-none p-5 transition-colors duration-300"
                >
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                      {label}
                    </span>
                    <div className="p-2 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-xl">
                      <Icon className="w-4 h-4" />
                    </div>
                  </div>
                  <p className="text-3xl font-bold text-slate-900 dark:text-white">{value}</p>
                </div>
              ))}
            </div>

            {/* Tabla por sección */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm dark:shadow-none mb-6 overflow-hidden transition-colors duration-300">
              <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800">
                <h2 className="font-bold text-slate-800 dark:text-slate-100">
                  Rendimiento y asistencia por sección
                </h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 bg-slate-50 dark:bg-slate-800/50">
                      <th className="px-4 py-3">Sección</th>
                      <th className="px-4 py-3">Docente</th>
                      <th className="px-4 py-3 text-center">Estudiantes</th>
                      <th className="px-4 py-3 text-center">Promedio</th>
                      <th className="px-4 py-3 text-center">Aprobados</th>
                      <th className="px-4 py-3 text-center">Aplazados</th>
                      <th className="px-4 py-3 text-center">% Inasist.</th>
                      <th className="px-4 py-3 text-center">En riesgo</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {(data.porSeccion || []).map((s, i) => {
                      const chip = s.promedio != null ? getScoreStyles(s.promedio) : null;
                      return (
                        <tr key={`${s.seccion}-${i}`} className="text-slate-700 dark:text-slate-200">
                          <td className="px-4 py-3">
                            {s.seccionId ? (
                              <Link
                                to={`/app/admin/secciones/${s.seccionId}`}
                                className="inline-flex items-center gap-1 font-semibold text-indigo-600 dark:text-indigo-400 hover:underline"
                                title="Ver reportes de esta sección"
                              >
                                {s.seccion}
                                <ChevronRight className="w-3.5 h-3.5" />
                              </Link>
                            ) : (
                              <span className="font-semibold text-slate-900 dark:text-white">{s.seccion}</span>
                            )}
                          </td>
                          <td className="px-4 py-3">{s.docente}</td>
                          <td className="px-4 py-3 text-center">{s.estudiantes}</td>
                          <td className="px-4 py-3 text-center">
                            {chip ? (
                              <span className={`inline-block px-2.5 py-1 rounded-lg text-xs font-bold ${chip.bg} ${chip.text}`}>
                                {s.promedio}
                              </span>
                            ) : (
                              <span className="text-slate-400 dark:text-slate-600">—</span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-center text-emerald-600 dark:text-emerald-400 font-semibold">{s.aprobados}</td>
                          <td className="px-4 py-3 text-center text-rose-600 dark:text-rose-400 font-semibold">{s.aplazados}</td>
                          <td className="px-4 py-3 text-center">
                            <span className={`inline-block px-2.5 py-1 rounded-lg text-xs font-bold ${inasistenciaStyle(s.inasistenciaPromedio, s.enRiesgo)}`}>
                              {s.inasistenciaPromedio}%
                            </span>
                          </td>
                          <td className="px-4 py-3 text-center font-semibold text-slate-700 dark:text-slate-200">{s.enRiesgo}</td>
                        </tr>
                      );
                    })}
                    {(data.porSeccion || []).length === 0 && (
                      <tr>
                        <td colSpan={8} className="px-4 py-8 text-center text-slate-400 dark:text-slate-500">
                          Aún no hay secciones con datos.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Áreas vocacionales */}
            {(data.vocacional || []).length > 0 && (
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm dark:shadow-none p-5 transition-colors duration-300">
                <h2 className="font-bold text-slate-800 dark:text-slate-100 mb-4">
                  Áreas vocacionales más frecuentes
                </h2>
                <div className="space-y-3">
                  {data.vocacional.map((a, i) => (
                    <div key={`${a.area}-${i}`}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm text-slate-700 dark:text-slate-200">{a.area}</span>
                        <span className="text-sm font-bold text-slate-900 dark:text-white">{a.cantidad}</span>
                      </div>
                      <div className="h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-indigo-500 dark:bg-indigo-400 transition-all duration-300"
                          style={{ width: `${Math.round((a.cantidad / maxVoc) * 100)}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        ) : grupos.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm dark:shadow-none p-8 text-center text-slate-400 dark:text-slate-500">
            Aún no hay secciones con datos.
          </div>
        ) : (
          /* Pestaña "Por Docente": explorador docente → secciones */
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
                            <td className="px-4 py-3">
                            {s.seccionId ? (
                              <Link
                                to={`/app/admin/secciones/${s.seccionId}`}
                                className="inline-flex items-center gap-1 font-semibold text-indigo-600 dark:text-indigo-400 hover:underline"
                                title="Ver reportes de esta sección"
                              >
                                {s.seccion}
                                <ChevronRight className="w-3.5 h-3.5" />
                              </Link>
                            ) : (
                              <span className="font-semibold text-slate-900 dark:text-white">{s.seccion}</span>
                            )}
                          </td>
                            <td className="px-4 py-3 text-center">{s.estudiantes}</td>
                            <td className="px-4 py-3 text-center">
                              {chip ? (
                                <span className={`inline-block px-2.5 py-1 rounded-lg text-xs font-bold ${chip.bg} ${chip.text}`}>
                                  {s.promedio}
                                </span>
                              ) : (
                                <span className="text-slate-400 dark:text-slate-600">—</span>
                              )}
                            </td>
                            <td className="px-4 py-3 text-center text-emerald-600 dark:text-emerald-400 font-semibold">{s.aprobados}</td>
                            <td className="px-4 py-3 text-center text-rose-600 dark:text-rose-400 font-semibold">{s.aplazados}</td>
                            <td className="px-4 py-3 text-center">
                              <span className={`inline-block px-2.5 py-1 rounded-lg text-xs font-bold ${inasistenciaStyle(s.inasistenciaPromedio, s.enRiesgo)}`}>
                                {s.inasistenciaPromedio}%
                              </span>
                            </td>
                            <td className="px-4 py-3 text-center font-semibold text-slate-700 dark:text-slate-200">{s.enRiesgo}</td>
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

export default ReporteInstitucionalPage;
