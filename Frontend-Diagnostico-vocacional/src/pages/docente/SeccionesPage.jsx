import React, { useContext, useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import { listarSecciones, crearSeccion, eliminarSeccion, getPresets } from '../../api/academico';
import Modal from '../../components/ui/Modal';
import {
  School,
  Plus,
  Users,
  BookOpen,
  Trash2,
  ChevronRight,
  Loader2,
  GraduationCap,
} from 'lucide-react';

const PERIODO_ACTUAL = '2025-2026';

/**
 * Mis Secciones (docente).
 * Crea secciones por año escolar: las materias del currículo MPPE se
 * preseleccionan automáticamente y el docente puede ajustarlas.
 */
const SeccionesPage = () => {
  const { token } = useContext(AuthContext);
  const [secciones, setSecciones] = useState(null);
  const [presets, setPresets] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    try {
      const [secs, pres] = await Promise.all([listarSecciones(token), getPresets(token)]);
      setSecciones(secs);
      setPresets(pres);
    } catch (err) {
      setError(err.message);
      setSecciones([]);
    }
  }, [token]);

  useEffect(() => { if (token) load(); }, [token, load]);

  const handleDelete = async (sec) => {
    if (!window.confirm(`¿Eliminar "${sec.etiquetaAnio} - ${sec.nombre}"? Se borrarán sus materias, planes y notas.`)) return;
    try {
      await eliminarSeccion(token, sec._id);
      setSecciones((prev) => prev.filter((s) => s._id !== sec._id));
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-6 transition-colors duration-300">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-600 dark:bg-indigo-500 rounded-lg text-white">
              <School className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">Mis Secciones</h1>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Período escolar {PERIODO_ACTUAL} · Currículo oficial MPPE
              </p>
            </div>
          </div>
          <button
            onClick={() => setModalOpen(true)}
            className="inline-flex items-center gap-2 bg-indigo-600 text-white text-sm font-semibold px-4 py-2.5 rounded-xl hover:bg-indigo-700 transition-colors shadow-sm hover:shadow-md"
          >
            <Plus className="w-4 h-4" />
            Nueva sección
          </button>
        </div>

        {error && <p className="text-rose-600 dark:text-rose-400 text-sm mb-4">{error}</p>}

        {/* Lista de secciones */}
        {secciones === null ? (
          <div className="flex justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-slate-300 dark:text-slate-600" />
          </div>
        ) : secciones.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 bg-white dark:bg-slate-900 rounded-3xl border border-dashed border-slate-200 dark:border-slate-800 text-center px-6">
            <div className="p-5 bg-indigo-50 dark:bg-indigo-900/30 rounded-3xl mb-4">
              <GraduationCap className="w-12 h-12 text-indigo-500 dark:text-indigo-400" />
            </div>
            <p className="text-slate-700 dark:text-slate-200 font-bold text-lg mb-1">Crea tu primera sección</p>
            <p className="text-slate-400 dark:text-slate-500 text-sm mb-6 max-w-md">
              Elige el año escolar y las materias del plan de estudio oficial se
              cargarán automáticamente. Luego asigna a tus estudiantes.
            </p>
            <button
              onClick={() => setModalOpen(true)}
              className="inline-flex items-center gap-2 bg-indigo-600 text-white text-sm font-semibold px-5 py-2.5 rounded-xl hover:bg-indigo-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Crear sección
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {secciones.map((sec) => (
              <div
                key={sec._id}
                className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm dark:shadow-none border border-slate-100 dark:border-slate-800 p-5 hover:shadow-md transition-all duration-300 group"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-xl flex items-center justify-center font-black text-lg">
                      {sec.anio}°
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-800 dark:text-slate-100">
                        {sec.etiquetaAnio} — Sección {sec.nombre}
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400">{sec.periodo}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleDelete(sec)}
                    className="p-2 text-slate-300 dark:text-slate-600 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-lg transition-colors"
                    title="Eliminar sección"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <div className="flex items-center gap-4 mb-4">
                  <span className="flex items-center gap-1.5 text-sm text-slate-600 dark:text-slate-300">
                    <Users className="w-4 h-4 text-slate-400" />
                    {sec.totalEstudiantes} estudiantes
                  </span>
                  <span className="flex items-center gap-1.5 text-sm text-slate-600 dark:text-slate-300">
                    <BookOpen className="w-4 h-4 text-slate-400" />
                    {sec.totalMaterias} materias
                  </span>
                </div>

                <Link
                  to={`/app/docente/secciones/${sec._id}`}
                  className="inline-flex items-center gap-1 text-indigo-600 dark:text-indigo-400 text-sm font-bold group-hover:translate-x-1 transition-transform"
                >
                  GESTIONAR <ChevronRight className="w-4 h-4" />
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>

      <CrearSeccionModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        presets={presets}
        onCreated={() => { setModalOpen(false); load(); }}
        token={token}
      />
    </div>
  );
};

/** Modal de creación: año → preset de materias editable. */
const CrearSeccionModal = ({ open, onClose, presets, onCreated, token }) => {
  const [anio, setAnio] = useState(1);
  const [nombre, setNombre] = useState('A');
  const [seleccion, setSeleccion] = useState({});
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');

  // Al abrir o cambiar de año, marcar todas las materias del preset.
  useEffect(() => {
    if (!presets) return;
    const materias = presets.curriculo[anio] || [];
    setSeleccion(Object.fromEntries(materias.map((m) => [m.nombre, true])));
  }, [anio, presets, open]);

  const submit = async (e) => {
    e.preventDefault();
    setErr('');
    const materias = (presets?.curriculo[anio] || []).filter((m) => seleccion[m.nombre]);
    if (!nombre.trim()) return setErr('Indica el nombre de la sección (ej. A).');
    if (materias.length === 0) return setErr('Selecciona al menos una materia.');
    try {
      setSaving(true);
      await crearSeccion(token, { nombre: nombre.trim().toUpperCase(), anio, periodo: PERIODO_ACTUAL, materias });
      onCreated();
    } catch (e2) {
      setErr(e2.message);
    } finally {
      setSaving(false);
    }
  };

  const materiasPreset = presets?.curriculo[anio] || [];

  return (
    <Modal open={open} onClose={onClose} title="Nueva sección" icon={School}>
      <form onSubmit={submit} className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-1.5">Año escolar</label>
            <select
              value={anio}
              onChange={(e) => setAnio(Number(e.target.value))}
              className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
            >
              {[1, 2, 3, 4, 5].map((a) => (
                <option key={a} value={a}>{presets?.etiquetas?.[a] || `${a}° Año`}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-1.5">Sección</label>
            <input
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder="A"
              maxLength={10}
              className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-2">
            Materias del plan oficial <span className="text-slate-400">(puedes desmarcar)</span>
          </label>
          <div className="max-h-52 overflow-y-auto space-y-1 pr-1 border border-slate-100 dark:border-slate-800 rounded-xl p-2">
            {materiasPreset.map((m) => (
              <label
                key={m.nombre}
                className="flex items-center gap-2.5 p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={!!seleccion[m.nombre]}
                  onChange={(e) => setSeleccion((s) => ({ ...s, [m.nombre]: e.target.checked }))}
                  className="w-4 h-4 rounded accent-indigo-600"
                />
                <span className="text-sm text-slate-700 dark:text-slate-200 flex-1">{m.nombre}</span>
                <span className="text-[10px] text-slate-400 font-bold">{m.horas}h</span>
              </label>
            ))}
          </div>
        </div>

        {err && <p className="text-xs text-rose-600 dark:text-rose-400">{err}</p>}

        <div className="flex gap-2 pt-1">
          <button type="button" onClick={onClose} className="flex-1 px-4 py-2.5 text-sm font-semibold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
            Cancelar
          </button>
          <button type="submit" disabled={saving} className="flex-1 px-4 py-2.5 text-sm font-semibold text-white bg-indigo-600 rounded-xl hover:bg-indigo-700 transition-colors disabled:opacity-60 inline-flex items-center justify-center gap-2">
            {saving && <Loader2 className="w-4 h-4 animate-spin" />}
            Crear sección
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default SeccionesPage;
