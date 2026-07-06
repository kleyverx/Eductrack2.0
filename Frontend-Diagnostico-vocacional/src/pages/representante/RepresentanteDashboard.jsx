import React, { useContext, useEffect, useState } from 'react';
import { AuthContext } from '../../context/AuthContext';
import { misRepresentados, representadoDetalle } from '../../api/representante';
import { getScoreStyles } from '../../utils/academic';
import { Users, Loader2, GraduationCap, CalendarX } from 'lucide-react';

/** Chip de nota con el "Semáforo Académico" (idéntico a MisMateriasPage). */
const NotaChip = ({ valor }) => {
  if (valor === null || valor === undefined) {
    return <span className="text-slate-300 dark:text-slate-600 font-bold">—</span>;
  }
  const s = getScoreStyles(valor);
  return (
    <span className={`inline-block min-w-[44px] text-center font-black px-2 py-0.5 rounded-lg ${s.bg} ${s.text}`}>
      {valor}
    </span>
  );
};

/** Estilos de la tarjeta de asistencia según el nivel del backend. */
const ASISTENCIA_STYLES = {
  good: 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300 border-emerald-100 dark:border-emerald-900/40',
  warning: 'bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300 border-amber-100 dark:border-amber-900/40',
  danger: 'bg-rose-50 dark:bg-rose-900/20 text-rose-700 dark:text-rose-300 border-rose-100 dark:border-rose-900/40',
};

/**
 * Panel del Representante — solo lectura del rendimiento y la asistencia
 * de sus representados (notas por lapso, definitiva y asistencia por sección).
 */
const RepresentanteDashboard = () => {
  const { token } = useContext(AuthContext);
  const [representados, setRepresentados] = useState(null); // null = cargando
  const [error, setError] = useState('');
  const [selId, setSelId] = useState(null);
  const [detalle, setDetalle] = useState(null);             // null = cargando
  const [errDetalle, setErrDetalle] = useState('');

  // Carga inicial de la lista de representados.
  useEffect(() => {
    if (!token) return;
    misRepresentados(token)
      .then((list) => {
        setRepresentados(list);
        if (list.length) setSelId(list[0]._id);
      })
      .catch((e) => { setError(e.message); setRepresentados([]); });
  }, [token]);

  // Detalle del representado activo.
  useEffect(() => {
    if (!token || !selId) return;
    setDetalle(null);
    setErrDetalle('');
    representadoDetalle(token, selId)
      .then(setDetalle)
      .catch((e) => setErrDetalle(e.message));
  }, [token, selId]);

  const activo = representados?.find((r) => r._id === selId);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-6 transition-colors duration-300">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <div className="p-2 bg-indigo-600 dark:bg-indigo-500 rounded-lg text-white">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">Mis Representados</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">Rendimiento y asistencia de tus representados</p>
          </div>
        </div>

        {error && <p className="text-rose-600 dark:text-rose-400 text-sm mb-4">{error}</p>}

        {representados === null ? (
          <div className="flex justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-slate-300 dark:text-slate-600" />
          </div>
        ) : representados.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 bg-white dark:bg-slate-900 rounded-3xl border border-dashed border-slate-200 dark:border-slate-800 text-center px-6">
            <div className="p-5 bg-indigo-50 dark:bg-indigo-900/30 rounded-3xl mb-4">
              <Users className="w-12 h-12 text-indigo-500 dark:text-indigo-400" />
            </div>
            <p className="text-slate-700 dark:text-slate-200 font-bold text-lg mb-1">Aún no tienes representados vinculados</p>
            <p className="text-slate-400 dark:text-slate-500 text-sm max-w-sm">
              Pide a la institución que te asigne a tus representados para ver
              aquí sus notas y su asistencia.
            </p>
          </div>
        ) : (
          <>
            {/* Selector de representado */}
            {representados.length > 1 && (
              <div className="flex flex-wrap gap-2 mb-4">
                {representados.map((r) => {
                  const isActive = r._id === selId;
                  return (
                    <button
                      key={r._id}
                      onClick={() => setSelId(r._id)}
                      className={`px-4 py-2 rounded-xl text-sm font-semibold border transition-colors ${
                        isActive
                          ? 'bg-indigo-600 text-white border-indigo-600'
                          : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700'
                      }`}
                    >
                      {r.name} {r.apellido}
                    </button>
                  );
                })}
              </div>
            )}

            {/* Cabecera del representado activo */}
            {activo && (
              <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm dark:shadow-none border border-slate-100 dark:border-slate-800 p-5 mb-6 transition-colors duration-300">
                <div className="flex flex-wrap items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-black text-lg">
                    {(activo.name || 'R').charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <h2 className="text-xl font-bold text-slate-900 dark:text-white leading-tight">
                      {activo.name} {activo.apellido}
                    </h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400">C.I. {activo.cedula}</p>
                  </div>
                  {activo.topArea && (
                    <span className="ml-auto px-3 py-1.5 rounded-lg text-xs font-bold bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 border border-indigo-100 dark:border-indigo-800">
                      Área vocacional: {activo.topArea}
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* Cuerpo: detalle del representado */}
            {errDetalle ? (
              <p className="text-rose-600 dark:text-rose-400 text-sm">{errDetalle}</p>
            ) : detalle === null ? (
              <div className="flex justify-center py-20">
                <Loader2 className="w-8 h-8 animate-spin text-slate-300 dark:text-slate-600" />
              </div>
            ) : detalle.grupos.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 bg-white dark:bg-slate-900 rounded-3xl border border-dashed border-slate-200 dark:border-slate-800 text-center px-6">
                <div className="p-5 bg-indigo-50 dark:bg-indigo-900/30 rounded-3xl mb-4">
                  <GraduationCap className="w-12 h-12 text-indigo-500 dark:text-indigo-400" />
                </div>
                <p className="text-slate-700 dark:text-slate-200 font-bold text-lg mb-1">Sin secciones registradas</p>
                <p className="text-slate-400 dark:text-slate-500 text-sm max-w-sm">
                  Este representado aún no está inscrito en ninguna sección.
                </p>
              </div>
            ) : (
              detalle.grupos.map(({ seccion, materias, asistencia }) => (
                <section key={seccion._id} className="mb-8">
                  {/* Encabezado de la sección */}
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-xl flex items-center justify-center font-black">
                      {seccion.anio}°
                    </div>
                    <div>
                      <h2 className="font-bold text-slate-800 dark:text-slate-100">
                        {seccion.etiquetaAnio} — Sección {seccion.nombre}
                      </h2>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {seccion.periodo} · Prof. {seccion.docente?.name} {seccion.docente?.apellido || ''}
                      </p>
                    </div>
                  </div>

                  {/* Tarjeta de asistencia */}
                  {asistencia && (
                    <div
                      className={`flex items-center gap-3 rounded-2xl border p-4 mb-4 transition-colors duration-300 ${
                        ASISTENCIA_STYLES[asistencia.nivel] || ASISTENCIA_STYLES.good
                      }`}
                    >
                      <CalendarX className="w-6 h-6 flex-shrink-0" />
                      {asistencia.dias === 0 ? (
                        <p className="text-sm font-semibold">Sin registros de asistencia</p>
                      ) : (
                        <div>
                          <p className="text-base font-black leading-tight">{asistencia.pct}% de inasistencia</p>
                          <p className="text-xs font-medium opacity-90">
                            umbral {asistencia.umbral}% · {asistencia.ausencias} ausencias / {asistencia.dias} días
                          </p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Tabla de materias con lapsos */}
                  <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm dark:shadow-none border border-slate-100 dark:border-slate-800 overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40">
                            <th className="text-left font-bold text-slate-600 dark:text-slate-300 px-4 py-3">Materia</th>
                            <th className="text-center font-semibold text-slate-500 dark:text-slate-400 px-3 py-3">1er Lapso</th>
                            <th className="text-center font-semibold text-slate-500 dark:text-slate-400 px-3 py-3">2do Lapso</th>
                            <th className="text-center font-semibold text-slate-500 dark:text-slate-400 px-3 py-3">3er Lapso</th>
                            <th className="text-center font-bold text-slate-600 dark:text-slate-300 px-3 py-3">Definitiva</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50 dark:divide-slate-800/60">
                          {materias.map((m) => (
                            <tr key={m._id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/30 transition-colors">
                              <td className="px-4 py-3 font-semibold text-slate-800 dark:text-slate-100">{m.nombre}</td>
                              {[1, 2, 3].map((l) => (
                                <td key={l} className="px-3 py-3 text-center">
                                  <NotaChip valor={m.lapsos[l]?.acumulado} />
                                </td>
                              ))}
                              <td className="px-3 py-3 text-center">
                                <NotaChip valor={m.definitiva} />
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </section>
              ))
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default RepresentanteDashboard;
