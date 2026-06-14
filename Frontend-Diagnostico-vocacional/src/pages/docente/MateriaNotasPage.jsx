import React, { useContext, useEffect, useState, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import { getPlan, guardarPlan, getNotasGrid, guardarNotas } from '../../api/academico';
import { getScoreStyles } from '../../utils/academic';
import {
  ArrowLeft,
  ClipboardList,
  Plus,
  Trash2,
  Loader2,
  Save,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertTriangle,
  GraduationCap,
} from 'lucide-react';

const TIPOS = [
  { value: 'examen', label: 'Examen' },
  { value: 'taller', label: 'Taller' },
  { value: 'exposicion', label: 'Exposición' },
  { value: 'trabajo', label: 'Trabajo' },
  { value: 'proyecto', label: 'Proyecto' },
  { value: 'rasgos', label: 'Rasgos' },
  { value: 'otro', label: 'Otro' },
];

/**
 * Plan de Evaluación y Carga de Notas de una materia, por lapso.
 * Flujo: definir actividades (suman 100%) → cargar notas en la cuadrícula.
 */
const MateriaNotasPage = () => {
  const { id } = useParams();
  const { token } = useContext(AuthContext);
  const [lapso, setLapso] = useState(1);
  const [vista, setVista] = useState('plan'); // 'plan' | 'notas'
  const [grid, setGrid] = useState(null);     // respuesta completa del backend
  const [actividades, setActividades] = useState([]);
  const [publicado, setPublicado] = useState(false);
  const [notasEdit, setNotasEdit] = useState({}); // `${estId}|${actId}` -> valor string
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState(null); // {tipo:'ok'|'error', texto}

  const load = useCallback(async () => {
    setGrid(null);
    try {
      const [planData, gridData] = await Promise.all([
        getPlan(token, id, lapso),
        getNotasGrid(token, id, lapso),
      ]);
      setActividades((planData.actividades || []).map(a => ({ ...a })));
      setPublicado(!!planData.publicado);
      setGrid(gridData);
      // Pre-cargar notas existentes en el editor
      const edit = {};
      gridData.estudiantes.forEach((e) => {
        Object.entries(e.notas).forEach(([actId, valor]) => {
          edit[`${e._id}|${actId}`] = String(valor);
        });
      });
      setNotasEdit(edit);
    } catch (err) {
      setMsg({ tipo: 'error', texto: err.message });
    }
  }, [token, id, lapso]);

  useEffect(() => { if (token) load(); }, [token, load]);

  const flash = (tipo, texto) => {
    setMsg({ tipo, texto });
    setTimeout(() => setMsg(null), 3500);
  };

  /* ---- Plan ---- */
  const totalPonderacion = actividades.reduce((s, a) => s + Number(a.ponderacion || 0), 0);

  const setActividad = (i, campo, valor) => {
    setActividades((prev) => prev.map((a, idx) => (idx === i ? { ...a, [campo]: valor } : a)));
  };

  const savePlan = async () => {
    if (actividades.length > 0 && totalPonderacion !== 100) {
      return flash('error', `Las ponderaciones deben sumar 100% (llevas ${totalPonderacion}%)`);
    }
    try {
      setSaving(true);
      await guardarPlan(token, id, lapso, {
        actividades: actividades.map(({ _id, nombre, tipo, fecha, ponderacion }) => ({
          ...( _id && !String(_id).startsWith('tmp') ? { _id } : {}),
          nombre, tipo, fecha: fecha || undefined, ponderacion: Number(ponderacion),
        })),
        publicado,
      });
      flash('ok', 'Plan de evaluación guardado');
      load();
    } catch (err) {
      flash('error', err.message);
    } finally {
      setSaving(false);
    }
  };

  /* ---- Notas ---- */
  const saveNotas = async () => {
    if (!grid) return;
    const payload = [];
    grid.estudiantes.forEach((e) => {
      (grid.plan.actividades || []).forEach((a) => {
        const key = `${e._id}|${a._id}`;
        const valorStr = notasEdit[key];
        const original = e.notas[String(a._id)];
        const valor = valorStr === '' || valorStr === undefined ? null : Number(valorStr);
        // Solo enviar cambios reales
        if (valor === null && original !== undefined) {
          payload.push({ estudiante: e._id, actividad: a._id, valor: null });
        } else if (valor !== null && valor !== original) {
          payload.push({ estudiante: e._id, actividad: a._id, valor });
        }
      });
    });
    if (payload.length === 0) return flash('ok', 'No hay cambios por guardar');
    // Validar rango
    const fuera = payload.find((p) => p.valor !== null && (p.valor < 1 || p.valor > 20 || Number.isNaN(p.valor)));
    if (fuera) return flash('error', 'Las notas deben estar entre 1 y 20');
    try {
      setSaving(true);
      const r = await guardarNotas(token, id, lapso, payload);
      flash('ok', r.msg);
      load();
    } catch (err) {
      flash('error', err.message);
    } finally {
      setSaving(false);
    }
  };

  if (!grid && !msg) {
    return (
      <div className="flex justify-center py-24">
        <Loader2 className="w-8 h-8 animate-spin text-slate-300 dark:text-slate-600" />
      </div>
    );
  }

  const materia = grid?.materia;
  const planActs = grid?.plan?.actividades || [];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-6 transition-colors duration-300">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        {materia && (
          <>
            <Link
              to={`/app/docente/secciones/${materia.seccion}`}
              className="inline-flex items-center gap-1.5 text-sm text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 mb-4 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" /> Volver a la sección
            </Link>
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-indigo-600 dark:bg-indigo-500 rounded-lg text-white">
                <ClipboardList className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">{materia.nombre}</h1>
                <p className="text-sm text-slate-500 dark:text-slate-400">Plan de evaluación y carga de notas</p>
              </div>
            </div>
          </>
        )}

        {/* Selector de lapso + vista */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
          <div className="flex gap-1.5 p-1 bg-slate-100 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
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
          <div className="flex gap-1.5 p-1 bg-slate-100 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
            <button
              onClick={() => setVista('plan')}
              className={`px-4 py-2 text-sm font-semibold rounded-lg transition-colors ${vista === 'plan' ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-sm' : 'text-slate-500 dark:text-slate-400'}`}
            >
              Plan de Evaluación
            </button>
            <button
              onClick={() => setVista('notas')}
              className={`px-4 py-2 text-sm font-semibold rounded-lg transition-colors ${vista === 'notas' ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-sm' : 'text-slate-500 dark:text-slate-400'}`}
            >
              Carga de Notas
            </button>
          </div>
        </div>

        {/* Mensaje flash */}
        {msg && (
          <div className={`flex items-center gap-2 text-sm font-medium px-4 py-3 rounded-xl mb-4 ${
            msg.tipo === 'ok'
              ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400'
              : 'bg-rose-50 dark:bg-rose-900/20 text-rose-700 dark:text-rose-400'
          }`}>
            {msg.tipo === 'ok' ? <CheckCircle2 className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
            {msg.texto}
          </div>
        )}

        {/* ================= PLAN ================= */}
        {vista === 'plan' && (
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm dark:shadow-none border border-slate-100 dark:border-slate-800 p-6">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-bold text-slate-900 dark:text-slate-100">Actividades del lapso</h3>
              <span className={`text-sm font-black px-3 py-1 rounded-full ${
                totalPonderacion === 100
                  ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400'
                  : 'bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400'
              }`}>
                {totalPonderacion}% / 100%
              </span>
            </div>

            <div className="space-y-3 mb-5">
              {actividades.map((a, i) => (
                <div key={a._id || i} className="grid grid-cols-12 gap-2 items-center">
                  <input
                    value={a.nombre}
                    onChange={(e) => setActividad(i, 'nombre', e.target.value)}
                    placeholder="Nombre (ej. Examen Parcial)"
                    className="col-span-4 px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
                  />
                  <select
                    value={a.tipo || 'otro'}
                    onChange={(e) => setActividad(i, 'tipo', e.target.value)}
                    className="col-span-3 px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-700 dark:text-slate-200 focus:outline-none"
                  >
                    {TIPOS.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                  </select>
                  <input
                    type="date"
                    value={a.fecha ? String(a.fecha).slice(0, 10) : ''}
                    onChange={(e) => setActividad(i, 'fecha', e.target.value)}
                    className="col-span-3 px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-700 dark:text-slate-200 focus:outline-none"
                  />
                  <div className="col-span-1 relative">
                    <input
                      type="number"
                      min="1" max="100"
                      value={a.ponderacion}
                      onChange={(e) => setActividad(i, 'ponderacion', e.target.value)}
                      className="w-full px-2 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-center font-bold text-slate-700 dark:text-slate-200 focus:outline-none"
                    />
                  </div>
                  <button
                    onClick={() => setActividades((prev) => prev.filter((_, idx) => idx !== i))}
                    className="col-span-1 p-2 text-slate-300 dark:text-slate-600 hover:text-rose-600 dark:hover:text-rose-400 transition-colors justify-self-center"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
              {actividades.length === 0 && (
                <p className="text-center text-slate-400 dark:text-slate-500 text-sm py-6">
                  Agrega las actividades de evaluación de este lapso (deben sumar 100%).
                </p>
              )}
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3">
              <button
                onClick={() => setActividades((prev) => [...prev, { _id: `tmp${Date.now()}`, nombre: '', tipo: 'examen', ponderacion: '' }])}
                className="inline-flex items-center gap-1.5 text-sm font-semibold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/30 px-4 py-2 rounded-xl hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-colors"
              >
                <Plus className="w-4 h-4" /> Agregar actividad
              </button>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => setPublicado((p) => !p)}
                  className={`inline-flex items-center gap-1.5 text-xs font-bold px-3 py-2 rounded-xl transition-colors ${
                    publicado
                      ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
                  }`}
                  title="Si está publicado, los estudiantes ven el plan y sus notas"
                >
                  {publicado ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                  {publicado ? 'Visible para estudiantes' : 'Oculto para estudiantes'}
                </button>
                <button
                  onClick={savePlan}
                  disabled={saving}
                  className="inline-flex items-center gap-2 bg-indigo-600 text-white text-sm font-semibold px-5 py-2.5 rounded-xl hover:bg-indigo-700 transition-colors disabled:opacity-60"
                >
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  Guardar plan
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ================= NOTAS ================= */}
        {vista === 'notas' && grid && (
          planActs.length === 0 ? (
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 p-12 text-center">
              <ClipboardList className="w-10 h-10 text-slate-200 dark:text-slate-700 mx-auto mb-3" />
              <p className="text-slate-600 dark:text-slate-300 font-semibold mb-1">Primero define el plan de evaluación</p>
              <p className="text-slate-400 dark:text-slate-500 text-sm">Crea las actividades del lapso para poder cargar notas.</p>
            </div>
          ) : grid.estudiantes.length === 0 ? (
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 p-12 text-center">
              <GraduationCap className="w-10 h-10 text-slate-200 dark:text-slate-700 mx-auto mb-3" />
              <p className="text-slate-600 dark:text-slate-300 font-semibold mb-1">La sección no tiene estudiantes</p>
              <p className="text-slate-400 dark:text-slate-500 text-sm">Asígnalos desde la página de la sección.</p>
            </div>
          ) : (
            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm dark:shadow-none border border-slate-100 dark:border-slate-800 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40">
                      <th className="text-left font-bold text-slate-600 dark:text-slate-300 px-4 py-3 min-w-[180px]">Estudiante</th>
                      {planActs.map((a) => (
                        <th key={a._id} className="text-center font-semibold text-slate-500 dark:text-slate-400 px-2 py-3 min-w-[90px]">
                          <span className="block truncate max-w-[110px] mx-auto" title={a.nombre}>{a.nombre}</span>
                          <span className="text-[10px] text-indigo-500 dark:text-indigo-400 font-black">{a.ponderacion}%</span>
                        </th>
                      ))}
                      <th className="text-center font-bold text-slate-600 dark:text-slate-300 px-4 py-3">Acumulado</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50 dark:divide-slate-800/60">
                    {grid.estudiantes.map((e) => {
                      const styles = e.acumulado !== null ? getScoreStyles(e.acumulado) : null;
                      return (
                        <tr key={e._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                          <td className="px-4 py-2.5">
                            <p className="font-semibold text-slate-800 dark:text-slate-100 leading-tight">{e.name} {e.apellido || ''}</p>
                            <p className="text-[11px] text-slate-400">C.I. {e.cedula}</p>
                          </td>
                          {planActs.map((a) => {
                            const key = `${e._id}|${a._id}`;
                            return (
                              <td key={a._id} className="px-2 py-2.5 text-center">
                                <input
                                  type="number"
                                  min="1" max="20" step="0.5"
                                  value={notasEdit[key] ?? ''}
                                  onChange={(ev) => setNotasEdit((prev) => ({ ...prev, [key]: ev.target.value }))}
                                  placeholder="—"
                                  className="w-16 px-2 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-center font-semibold text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
                                />
                              </td>
                            );
                          })}
                          <td className="px-4 py-2.5 text-center">
                            {e.acumulado !== null ? (
                              <span className={`inline-block min-w-[52px] font-black text-base px-2 py-1 rounded-lg ${styles.bg} ${styles.text}`}>
                                {e.acumulado}
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
              <div className="flex justify-end p-4 border-t border-slate-100 dark:border-slate-800">
                <button
                  onClick={saveNotas}
                  disabled={saving}
                  className="inline-flex items-center gap-2 bg-indigo-600 text-white text-sm font-semibold px-5 py-2.5 rounded-xl hover:bg-indigo-700 transition-colors disabled:opacity-60"
                >
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  Guardar notas
                </button>
              </div>
            </div>
          )
        )}
      </div>
    </div>
  );
};

export default MateriaNotasPage;
