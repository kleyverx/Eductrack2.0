import React, { useContext, useEffect, useState, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import { getDia, guardarDia, getResumen } from '../../api/asistencia';
import {
  CalendarCheck,
  ArrowLeft,
  Loader2,
  Check,
  X,
  Clock,
} from 'lucide-react';

/** Fecha de hoy en YYYY-MM-DD sin desfase de zona horaria. */
const hoyISO = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

/**
 * Control de asistencia del docente: pase de lista diario + resumen de inasistencia.
 */
const AsistenciaPage = () => {
  const { id } = useParams();
  const { token } = useContext(AuthContext);

  const [tab, setTab] = useState('pase');
  const [fecha, setFecha] = useState(hoyISO());
  const [estudiantes, setEstudiantes] = useState(null); // null = cargando
  const [estados, setEstados] = useState({});
  const [resumen, setResumen] = useState(null);
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');
  const [guardando, setGuardando] = useState(false);

  // ---- Pase de lista: cargar el día ----
  const cargarDia = useCallback(async () => {
    setError('');
    setEstudiantes(null);
    try {
      const data = await getDia(token, id, fecha);
      setEstudiantes(data.estudiantes || []);
      const inicial = {};
      (data.estudiantes || []).forEach((e) => { inicial[e._id] = e.estado; });
      setEstados(inicial);
    } catch (err) {
      setError(err.message);
      setEstudiantes([]);
    }
  }, [token, id, fecha]);

  useEffect(() => { if (token) cargarDia(); }, [token, cargarDia]);

  // ---- Resumen: cargar al activar la pestaña ----
  const cargarResumen = useCallback(async () => {
    setError('');
    setResumen(null);
    try {
      setResumen(await getResumen(token, id));
    } catch (err) {
      setError(err.message);
    }
  }, [token, id]);

  useEffect(() => {
    if (token && tab === 'resumen' && !resumen) cargarResumen();
  }, [token, tab, resumen, cargarResumen]);

  const marcarTodos = (estado) => {
    const nuevo = {};
    (estudiantes || []).forEach((e) => { nuevo[e._id] = estado; });
    setEstados(nuevo);
  };

  const guardar = async () => {
    setGuardando(true);
    setError('');
    try {
      const registros = Object.entries(estados).map(([estudiante, estado]) => ({ estudiante, estado }));
      await guardarDia(token, id, fecha, registros);
      setMsg('✓ Asistencia guardada');
      setResumen(null); // invalidar resumen para recargarlo con los nuevos datos
      setTimeout(() => setMsg(''), 2500);
    } catch (err) {
      setError(err.message);
    } finally {
      setGuardando(false);
    }
  };

  const nivelChip = {
    good: 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400',
    warning: 'bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400',
    danger: 'bg-rose-50 dark:bg-rose-900/30 text-rose-700 dark:text-rose-400',
  };
  const nivelTexto = { good: 'Normal', warning: 'Alerta', danger: 'Riesgo' };

  const TabButton = ({ value, label }) => (
    <button
      onClick={() => setTab(value)}
      className={`px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors ${
        tab === value
          ? 'bg-indigo-600 text-white shadow-sm'
          : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800'
      }`}
    >
      {label}
    </button>
  );

  const EstadoBtn = ({ activo, onClick, activeCls, icon: Icon, label }) => (
    <button
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
        activo ? activeCls : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
      }`}
    >
      <Icon className="w-3.5 h-3.5" />
      {label}
    </button>
  );

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-6 transition-colors duration-300">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <Link
          to={`/app/docente/secciones/${id}`}
          className="inline-flex items-center gap-1.5 text-sm text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 mb-4 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Volver a la sección
        </Link>
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-2xl flex items-center justify-center">
            <CalendarCheck className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
            Control de Asistencia
          </h1>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          <TabButton value="pase" label="Pase de lista" />
          <TabButton value="resumen" label="Resumen" />
        </div>

        {error && (
          <div className="mb-4 text-sm text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-900/20 rounded-xl px-4 py-3">
            {error}
          </div>
        )}

        {/* ---- Pase de lista ---- */}
        {tab === 'pase' && (
          <div>
            <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium text-slate-500 dark:text-slate-400">Fecha</label>
                <input
                  type="date"
                  value={fecha}
                  max={hoyISO()}
                  onChange={(e) => setFecha(e.target.value)}
                  className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
                />
              </div>
              <button
                onClick={() => marcarTodos('presente')}
                disabled={!estudiantes || estudiantes.length === 0}
                className="inline-flex items-center gap-1.5 text-sm font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/30 px-4 py-2 rounded-xl hover:bg-emerald-100 dark:hover:bg-emerald-900/50 transition-colors disabled:opacity-50"
              >
                <Check className="w-4 h-4" /> Marcar todos presentes
              </button>
            </div>

            {estudiantes === null ? (
              <div className="flex justify-center py-24">
                <Loader2 className="w-8 h-8 animate-spin text-slate-300 dark:text-slate-600" />
              </div>
            ) : (
              <>
                <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm dark:shadow-none border border-slate-100 dark:border-slate-800 divide-y divide-slate-100 dark:divide-slate-800 overflow-hidden">
                  {estudiantes.map((e) => (
                    <div key={e._id} className="flex flex-wrap items-center gap-3 p-4">
                      <div className="w-9 h-9 rounded-full bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold text-sm">
                        {(e.name || 'E').charAt(0)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-slate-800 dark:text-slate-100 truncate">
                          {e.name} {e.apellido || ''}
                        </p>
                        <p className="text-xs text-slate-400 dark:text-slate-500">C.I. {e.cedula}</p>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <EstadoBtn
                          activo={estados[e._id] === 'presente'}
                          onClick={() => setEstados((s) => ({ ...s, [e._id]: 'presente' }))}
                          activeCls="bg-emerald-600 text-white"
                          icon={Check}
                          label="Presente"
                        />
                        <EstadoBtn
                          activo={estados[e._id] === 'ausente'}
                          onClick={() => setEstados((s) => ({ ...s, [e._id]: 'ausente' }))}
                          activeCls="bg-rose-600 text-white"
                          icon={X}
                          label="Ausente"
                        />
                        <EstadoBtn
                          activo={estados[e._id] === 'justificado'}
                          onClick={() => setEstados((s) => ({ ...s, [e._id]: 'justificado' }))}
                          activeCls="bg-amber-500 text-white"
                          icon={Clock}
                          label="Justificado"
                        />
                      </div>
                    </div>
                  ))}
                  {estudiantes.length === 0 && (
                    <p className="text-center text-slate-400 dark:text-slate-500 py-10 text-sm">
                      No hay estudiantes en esta sección.
                    </p>
                  )}
                </div>

                {estudiantes.length > 0 && (
                  <div className="flex items-center gap-3 mt-4">
                    <button
                      onClick={guardar}
                      disabled={guardando}
                      className="inline-flex items-center gap-2 bg-indigo-600 text-white text-sm font-semibold px-5 py-2.5 rounded-xl hover:bg-indigo-700 transition-colors shadow-sm hover:shadow-md disabled:opacity-60"
                    >
                      {guardando && <Loader2 className="w-4 h-4 animate-spin" />}
                      Guardar
                    </button>
                    {msg && (
                      <span className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">{msg}</span>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* ---- Resumen ---- */}
        {tab === 'resumen' && (
          <div>
            {resumen === null && !error ? (
              <div className="flex justify-center py-24">
                <Loader2 className="w-8 h-8 animate-spin text-slate-300 dark:text-slate-600" />
              </div>
            ) : resumen ? (
              <>
                <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
                  Umbral de riesgo: <span className="font-semibold text-slate-700 dark:text-slate-200">{resumen.umbral}%</span>
                </p>
                <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm dark:shadow-none border border-slate-100 dark:border-slate-800 overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="text-left text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wide border-b border-slate-100 dark:border-slate-800">
                          <th className="px-4 py-3">Estudiante</th>
                          <th className="px-4 py-3 text-center">Días</th>
                          <th className="px-4 py-3 text-center">Ausencias</th>
                          <th className="px-4 py-3 text-center">% Inasistencia</th>
                          <th className="px-4 py-3 text-center">Estado</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {(resumen.estudiantes || []).map((e) => (
                          <tr key={e._id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                            <td className="px-4 py-3">
                              <p className="font-semibold text-slate-800 dark:text-slate-100">{e.name} {e.apellido || ''}</p>
                              <p className="text-xs text-slate-400 dark:text-slate-500">C.I. {e.cedula}</p>
                            </td>
                            <td className="px-4 py-3 text-center text-slate-600 dark:text-slate-300">{e.dias}</td>
                            <td className="px-4 py-3 text-center text-slate-600 dark:text-slate-300">{e.ausencias}</td>
                            <td className="px-4 py-3 text-center">
                              {e.dias === 0 ? (
                                <span className="text-slate-400 dark:text-slate-500">—</span>
                              ) : (
                                <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-bold ${nivelChip[e.nivel] || nivelChip.good}`}>
                                  {e.pct}%
                                </span>
                              )}
                            </td>
                            <td className="px-4 py-3 text-center text-xs font-semibold text-slate-600 dark:text-slate-300">
                              {nivelTexto[e.nivel] || '—'}
                            </td>
                          </tr>
                        ))}
                        {(resumen.estudiantes || []).length === 0 && (
                          <tr>
                            <td colSpan={5} className="px-4 py-10 text-center text-slate-400 dark:text-slate-500">
                              Sin datos de asistencia.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            ) : null}
          </div>
        )}
      </div>
    </div>
  );
};

export default AsistenciaPage;
