import React, { useContext, useEffect, useState } from 'react';
import { AuthContext } from '../context/AuthContext';
import { misMaterias, miMateriaDetalle, miBoletinEstado, miBoletin } from '../api/academico';
import { exportBoletinPDF } from '../utils/academicoPDF';
import { getScoreStyles } from '../utils/academic';
import {
  BookOpen,
  Loader2,
  ChevronDown,
  ChevronRight,
  GraduationCap,
  CalendarDays,
  EyeOff,
  FileDown,
  Lock,
} from 'lucide-react';

const LAPSO_LABEL = { 1: '1er Lapso', 2: '2do Lapso', 3: '3er Lapso' };

/**
 * Mis Materias (estudiante) — datos reales del backend académico.
 * Muestra sus secciones, materias con acumulado por lapso, definitiva,
 * y el detalle del plan de evaluación cuando el docente lo publica.
 */
const MisMateriasPage = () => {
  const { token } = useContext(AuthContext);
  const [secciones, setSecciones] = useState(null);
  const [error, setError] = useState('');
  const [expandida, setExpandida] = useState(null);   // materiaId expandida
  const [detalle, setDetalle] = useState(null);        // detalle de la materia expandida
  const [lapsoActivo, setLapsoActivo] = useState(1);
  const [boletines, setBoletines] = useState({ 1: false, 2: false, 3: false }); // lapsos publicados
  const [descargando, setDescargando] = useState(null);

  useEffect(() => {
    if (!token) return;
    misMaterias(token)
      .then(setSecciones)
      .catch((err) => { setError(err.message); setSecciones([]); });
    miBoletinEstado(token)
      .then((r) => setBoletines(r.estado))
      .catch(() => { /* sin sección */ });
  }, [token]);

  const descargarBoletin = async (lapso) => {
    setDescargando(lapso);
    try {
      const bol = await miBoletin(token, lapso);
      exportBoletinPDF(bol);
    } catch (err) {
      alert(err.message);
    } finally {
      setDescargando(null);
    }
  };

  const toggleMateria = async (materiaId) => {
    if (expandida === materiaId) {
      setExpandida(null);
      setDetalle(null);
      return;
    }
    setExpandida(materiaId);
    setDetalle(null);
    try {
      setDetalle(await miMateriaDetalle(token, materiaId));
    } catch (err) {
      setDetalle({ error: err.message });
    }
  };

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

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-6 transition-colors duration-300">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <div className="p-2 bg-indigo-600 dark:bg-indigo-500 rounded-lg text-white">
            <BookOpen className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">Mis Materias</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">Tus notas por lapso y plan de evaluación</p>
          </div>
        </div>

        {error && <p className="text-rose-600 dark:text-rose-400 text-sm mb-4">{error}</p>}

        {/* Boletines por lapso (descargables solo cuando el docente los publica) */}
        {secciones && secciones.length > 0 && (
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm dark:shadow-none border border-slate-100 dark:border-slate-800 p-5 mb-6 transition-colors duration-300">
            <div className="flex items-center gap-2 mb-3">
              <FileDown className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              <h3 className="font-bold text-slate-800 dark:text-slate-100 text-sm">Boletines de Calificaciones</h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[1, 2, 3].map((l) => {
                const disponible = boletines[l];
                return (
                  <button
                    key={l}
                    disabled={!disponible || descargando === l}
                    onClick={() => descargarBoletin(l)}
                    className={`flex items-center justify-between gap-2 px-4 py-3 rounded-xl border text-sm font-semibold transition-colors ${
                      disponible
                        ? 'bg-indigo-50 dark:bg-indigo-900/30 border-indigo-100 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-indigo-900/50'
                        : 'bg-slate-50 dark:bg-slate-800/50 border-slate-100 dark:border-slate-800 text-slate-400 dark:text-slate-500 cursor-not-allowed'
                    }`}
                  >
                    <span>{LAPSO_LABEL[l]}</span>
                    {descargando === l ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : disponible ? (
                      <FileDown className="w-4 h-4" />
                    ) : (
                      <Lock className="w-3.5 h-3.5" />
                    )}
                  </button>
                );
              })}
            </div>
            {![1, 2, 3].some((l) => boletines[l]) && (
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-3">
                Tus boletines aparecerán aquí cuando tu profesor los publique.
              </p>
            )}
          </div>
        )}

        {secciones === null ? (
          <div className="flex justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-slate-300 dark:text-slate-600" />
          </div>
        ) : secciones.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 bg-white dark:bg-slate-900 rounded-3xl border border-dashed border-slate-200 dark:border-slate-800 text-center px-6">
            <div className="p-5 bg-indigo-50 dark:bg-indigo-900/30 rounded-3xl mb-4">
              <GraduationCap className="w-12 h-12 text-indigo-500 dark:text-indigo-400" />
            </div>
            <p className="text-slate-700 dark:text-slate-200 font-bold text-lg mb-1">Aún no estás inscrito en una sección</p>
            <p className="text-slate-400 dark:text-slate-500 text-sm max-w-sm">
              Cuando tu profesor te asigne a su sección, verás aquí tus materias,
              el plan de evaluación y tus notas de cada lapso.
            </p>
          </div>
        ) : (
          secciones.map(({ seccion, materias }) => (
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
                        <th className="w-10"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50 dark:divide-slate-800/60">
                      {materias.map((m) => (
                        <React.Fragment key={m._id}>
                          <tr
                            onClick={() => toggleMateria(m._id)}
                            className="hover:bg-slate-50/60 dark:hover:bg-slate-800/30 cursor-pointer"
                          >
                            <td className="px-4 py-3 font-semibold text-slate-800 dark:text-slate-100">{m.nombre}</td>
                            {[1, 2, 3].map((l) => (
                              <td key={l} className="px-3 py-3 text-center">
                                <NotaChip valor={m.lapsos[l]?.acumulado} />
                              </td>
                            ))}
                            <td className="px-3 py-3 text-center">
                              <NotaChip valor={m.definitiva} />
                            </td>
                            <td className="px-2 text-slate-400">
                              {expandida === m._id ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                            </td>
                          </tr>

                          {/* Detalle expandido */}
                          {expandida === m._id && (
                            <tr>
                              <td colSpan={6} className="bg-slate-50/60 dark:bg-slate-800/30 px-4 py-4">
                                {!detalle ? (
                                  <div className="flex justify-center py-4">
                                    <Loader2 className="w-5 h-5 animate-spin text-slate-300" />
                                  </div>
                                ) : detalle.error ? (
                                  <p className="text-rose-600 dark:text-rose-400 text-sm">{detalle.error}</p>
                                ) : (
                                  <div>
                                    {/* Selector de lapso del detalle */}
                                    <div className="flex gap-1.5 mb-3">
                                      {[1, 2, 3].map((l) => (
                                        <button
                                          key={l}
                                          onClick={() => setLapsoActivo(l)}
                                          className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors ${
                                            lapsoActivo === l
                                              ? 'bg-indigo-600 text-white'
                                              : 'bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700'
                                          }`}
                                        >
                                          {LAPSO_LABEL[l]}
                                        </button>
                                      ))}
                                    </div>

                                    {(() => {
                                      const lap = detalle.lapsos[lapsoActivo];
                                      if (!lap.publicado) {
                                        return (
                                          <div className="flex items-center gap-2 text-slate-400 dark:text-slate-500 text-sm py-3">
                                            <EyeOff className="w-4 h-4" />
                                            El plan de evaluación de este lapso aún no ha sido publicado por tu profesor.
                                          </div>
                                        );
                                      }
                                      return (
                                        <div className="space-y-1.5">
                                          {lap.actividades.map((a) => (
                                            <div key={a._id} className="flex items-center gap-3 bg-white dark:bg-slate-900 rounded-xl px-4 py-2.5 border border-slate-100 dark:border-slate-800">
                                              <div className="flex-1 min-w-0">
                                                <p className="text-sm font-semibold text-slate-700 dark:text-slate-200 truncate">{a.nombre}</p>
                                                <p className="text-[11px] text-slate-400 flex items-center gap-2">
                                                  <span className="uppercase font-bold">{a.tipo}</span>
                                                  {a.fecha && (
                                                    <span className="flex items-center gap-1">
                                                      <CalendarDays className="w-3 h-3" />
                                                      {new Date(a.fecha).toLocaleDateString('es-VE')}
                                                    </span>
                                                  )}
                                                </p>
                                              </div>
                                              <span className="text-xs font-black text-indigo-500 dark:text-indigo-400">{a.ponderacion}%</span>
                                              <NotaChip valor={a.nota} />
                                            </div>
                                          ))}
                                          <div className="flex justify-end pt-1.5 text-sm">
                                            <span className="text-slate-500 dark:text-slate-400 mr-2">Acumulado del lapso:</span>
                                            <NotaChip valor={lap.acumulado} />
                                          </div>
                                        </div>
                                      );
                                    })()}
                                  </div>
                                )}
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </section>
          ))
        )}
      </div>
    </div>
  );
};

export default MisMateriasPage;
