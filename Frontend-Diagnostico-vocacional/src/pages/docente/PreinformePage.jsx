import React, { useContext, useEffect, useState, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import { resumenSeccion } from '../../api/academico';
import { exportPreinformePDF, exportPreinformeCSV } from '../../utils/academicoPDF';
import { getScoreStyles } from '../../utils/academic';
import {
  ArrowLeft,
  FileText,
  FileDown,
  Sheet,
  Loader2,
  GraduationCap,
} from 'lucide-react';

/**
 * Preinforme Académico de la sección por lapso (docente).
 * Matriz estudiantes × materias con promedios y exportación PDF/CSV.
 */
const PreinformePage = () => {
  const { id } = useParams();
  const { token } = useContext(AuthContext);
  const [lapso, setLapso] = useState(1);
  const [resumen, setResumen] = useState(null);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setResumen(null);
    setError('');
    try {
      setResumen(await resumenSeccion(token, id, lapso));
    } catch (err) {
      setError(err.message);
    }
  }, [token, id, lapso]);

  useEffect(() => { if (token) load(); }, [token, load]);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-6 transition-colors duration-300">
      <div className="max-w-6xl mx-auto">
        <Link
          to={`/app/docente/secciones/${id}`}
          className="inline-flex items-center gap-1.5 text-sm text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 mb-4 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Volver a la sección
        </Link>

        <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-600 dark:bg-indigo-500 rounded-lg text-white">
              <FileText className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Preinforme Académico</h1>
              {resumen && (
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  {resumen.etiquetaAnio} — Sección {resumen.seccion.nombre} · {resumen.seccion.periodo}
                </p>
              )}
            </div>
          </div>

          {/* Exportar */}
          {resumen && resumen.filas.length > 0 && (
            <div className="flex gap-2">
              <button
                onClick={() => exportPreinformeCSV(resumen)}
                className="inline-flex items-center gap-1.5 text-sm font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 px-4 py-2.5 rounded-xl hover:bg-emerald-100 dark:hover:bg-emerald-900/40 transition-colors"
              >
                <Sheet className="w-4 h-4" /> CSV
              </button>
              <button
                onClick={() => exportPreinformePDF(resumen)}
                className="inline-flex items-center gap-2 bg-indigo-600 text-white text-sm font-semibold px-4 py-2.5 rounded-xl hover:bg-indigo-700 transition-colors shadow-sm"
              >
                <FileDown className="w-4 h-4" /> Exportar PDF
              </button>
            </div>
          )}
        </div>

        {/* Selector de lapso */}
        <div className="flex gap-1.5 p-1 bg-slate-100 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 w-fit mb-6">
          {[1, 2, 3].map((l) => (
            <button
              key={l}
              onClick={() => setLapso(l)}
              className={`px-4 py-2 text-sm font-bold rounded-lg transition-colors ${
                lapso === l
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              {l === 1 ? '1er' : l === 2 ? '2do' : '3er'} Lapso
            </button>
          ))}
        </div>

        {error && <p className="text-rose-600 dark:text-rose-400 text-sm mb-4">{error}</p>}

        {!resumen && !error ? (
          <div className="flex justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-slate-300 dark:text-slate-600" />
          </div>
        ) : resumen && resumen.filas.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 p-12 text-center">
            <GraduationCap className="w-10 h-10 text-slate-200 dark:text-slate-700 mx-auto mb-3" />
            <p className="text-slate-600 dark:text-slate-300 font-semibold">La sección no tiene estudiantes asignados.</p>
          </div>
        ) : resumen && (
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm dark:shadow-none border border-slate-100 dark:border-slate-800 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40">
                    <th className="text-left font-bold text-slate-600 dark:text-slate-300 px-4 py-3 min-w-[180px] sticky left-0 bg-slate-50 dark:bg-slate-800">Estudiante</th>
                    {resumen.materias.map((m) => (
                      <th key={m._id} className="text-center font-semibold text-slate-500 dark:text-slate-400 px-2 py-3 min-w-[72px]">
                        <span className="block truncate max-w-[90px] mx-auto text-[11px]" title={m.nombre}>{m.nombre}</span>
                      </th>
                    ))}
                    <th className="text-center font-bold text-slate-600 dark:text-slate-300 px-3 py-3">Promedio</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 dark:divide-slate-800/60">
                  {resumen.filas.map((f) => {
                    const pStyles = f.promedio !== null ? getScoreStyles(f.promedio) : null;
                    return (
                      <tr key={f.estudiante._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                        <td className="px-4 py-2.5 sticky left-0 bg-white dark:bg-slate-900">
                          <p className="font-semibold text-slate-800 dark:text-slate-100 leading-tight">
                            {f.estudiante.apellido || ''} {f.estudiante.name}
                          </p>
                          <p className="text-[11px] text-slate-400">C.I. {f.estudiante.cedula}</p>
                        </td>
                        {f.notas.map((n, i) => {
                          const s = n.acumulado !== null ? getScoreStyles(n.acumulado) : null;
                          return (
                            <td key={i} className="px-2 py-2.5 text-center">
                              {n.acumulado !== null ? (
                                <span className={`font-bold ${s.text}`}>{n.acumulado}</span>
                              ) : (
                                <span className="text-slate-300 dark:text-slate-600">—</span>
                              )}
                            </td>
                          );
                        })}
                        <td className="px-3 py-2.5 text-center">
                          {f.promedio !== null ? (
                            <span className={`inline-block min-w-[52px] font-black px-2 py-1 rounded-lg ${pStyles.bg} ${pStyles.text}`}>
                              {f.promedio}
                            </span>
                          ) : (
                            <span className="text-slate-300 dark:text-slate-600">—</span>
                          )}
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
    </div>
  );
};

export default PreinformePage;
