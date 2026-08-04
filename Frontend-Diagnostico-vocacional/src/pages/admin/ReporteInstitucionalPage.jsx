import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../../context/AuthContext';
import { getReporteInstitucional } from '../../api/reporteInstitucional';
import { exportReporteInstitucionalPDF } from '../../utils/reportesPDF';
import { getScoreStyles } from '../../utils/academic';
import {
  BarChart3,
  Users,
  GraduationCap,
  School,
  UsersRound,
  FileDown,
  Loader2,
} from 'lucide-react';

/**
 * Reporte Institucional (SuperAdmin).
 * Resume matrícula, rendimiento y asistencia por sección y las áreas
 * vocacionales más frecuentes del plantel. Exporta a PDF membretado.
 */

/** Estilo simple para el % de inasistencia según severidad. */
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

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-6 transition-colors duration-300">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between gap-3 mb-8">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-600 dark:bg-indigo-500 rounded-lg text-white">
              <BarChart3 className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
                Reporte Institucional
              </h1>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Resumen académico del plantel
              </p>
            </div>
          </div>
          <button
            onClick={() => data && exportReporteInstitucionalPDF(data)}
            disabled={!data}
            className="inline-flex items-center gap-2 bg-indigo-600 text-white text-sm font-semibold px-4 py-2.5 rounded-xl hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-300"
          >
            <FileDown className="w-4 h-4" />
            Descargar PDF
          </button>
        </div>

        {error ? (
          <div className="bg-rose-50 dark:bg-rose-900/20 border border-rose-100 dark:border-rose-900/40 rounded-2xl p-4 text-sm text-rose-700 dark:text-rose-300">
            {error}
          </div>
        ) : data === null ? (
          <div className="flex justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-slate-300 dark:text-slate-600" />
          </div>
        ) : (
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
                          <td className="px-4 py-3 font-semibold text-slate-900 dark:text-white">{s.seccion}</td>
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
        )}
      </div>
    </div>
  );
};

export default ReporteInstitucionalPage;
