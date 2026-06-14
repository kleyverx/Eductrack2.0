import React, { useContext, useEffect, useState, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import {
  getSeccion,
  asignarEstudiantes,
  removerEstudiante,
  agregarMateria,
  eliminarMateria,
} from '../../api/academico';
import { listUsers, createUser } from '../../api/user';
import Modal from '../../components/ui/Modal';
import {
  ArrowLeft,
  Users,
  BookOpen,
  Plus,
  Trash2,
  Loader2,
  Search,
  GraduationCap,
  ClipboardList,
  ChevronRight,
  FileText,
  Award,
} from 'lucide-react';

/**
 * Detalle de una sección (docente): pestañas Estudiantes y Materias.
 */
const SeccionDetailPage = () => {
  const { id } = useParams();
  const { token } = useContext(AuthContext);
  const [data, setData] = useState(null);
  const [tab, setTab] = useState('materias');
  const [addEstOpen, setAddEstOpen] = useState(false);
  const [addMatOpen, setAddMatOpen] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    try {
      setData(await getSeccion(token, id));
    } catch (err) {
      setError(err.message);
    }
  }, [token, id]);

  useEffect(() => { if (token) load(); }, [token, load]);

  if (error) {
    return <div className="p-10 text-center text-rose-600 dark:text-rose-400">{error}</div>;
  }
  if (!data) {
    return (
      <div className="flex justify-center py-24">
        <Loader2 className="w-8 h-8 animate-spin text-slate-300 dark:text-slate-600" />
      </div>
    );
  }

  const { seccion, materias, etiquetaAnio } = data;

  const quitarEstudiante = async (est) => {
    if (!window.confirm(`¿Quitar a ${est.name} ${est.apellido || ''} de la sección?`)) return;
    try {
      await removerEstudiante(token, seccion._id, est._id);
      load();
    } catch (err) { alert(err.message); }
  };

  const quitarMateria = async (mat) => {
    if (!window.confirm(`¿Eliminar "${mat.nombre}"? Se borrará su plan y sus notas.`)) return;
    try {
      await eliminarMateria(token, mat._id);
      load();
    } catch (err) { alert(err.message); }
  };

  const TabButton = ({ value, icon: Icon, label, count }) => (
    <button
      onClick={() => setTab(value)}
      className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors ${
        tab === value
          ? 'bg-indigo-600 text-white shadow-sm'
          : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800'
      }`}
    >
      <Icon className="w-4 h-4" />
      {label}
      <span className={`text-xs px-1.5 py-0.5 rounded-full font-bold ${tab === value ? 'bg-white/20' : 'bg-slate-100 dark:bg-slate-800'}`}>
        {count}
      </span>
    </button>
  );

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-6 transition-colors duration-300">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <Link to="/app/docente/secciones" className="inline-flex items-center gap-1.5 text-sm text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 mb-4 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Mis Secciones
        </Link>
        <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-14 h-14 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-2xl flex items-center justify-center font-black text-xl">
              {seccion.anio}°
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
                {etiquetaAnio} — Sección {seccion.nombre}
              </h1>
              <p className="text-sm text-slate-500 dark:text-slate-400">Período {seccion.periodo}</p>
            </div>
          </div>
          <Link
            to={`/app/docente/secciones/${seccion._id}/preinforme`}
            className="inline-flex items-center gap-2 bg-indigo-600 text-white text-sm font-semibold px-4 py-2.5 rounded-xl hover:bg-indigo-700 transition-colors shadow-sm hover:shadow-md"
          >
            <FileText className="w-4 h-4" />
            Preinforme
          </Link>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          <TabButton value="materias" icon={BookOpen} label="Materias" count={materias.length} />
          <TabButton value="estudiantes" icon={Users} label="Estudiantes" count={seccion.estudiantes.length} />
        </div>

        {/* ---- Materias ---- */}
        {tab === 'materias' && (
          <div>
            <div className="flex justify-end mb-4">
              <button
                onClick={() => setAddMatOpen(true)}
                className="inline-flex items-center gap-1.5 text-sm font-semibold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/30 px-4 py-2 rounded-xl hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-colors"
              >
                <Plus className="w-4 h-4" /> Agregar materia
              </button>
            </div>
            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm dark:shadow-none border border-slate-100 dark:border-slate-800 divide-y divide-slate-100 dark:divide-slate-800 overflow-hidden">
              {materias.map((mat) => (
                <div key={mat._id} className="flex items-center gap-4 p-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group">
                  <div className="p-2.5 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-xl">
                    <BookOpen className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-slate-800 dark:text-slate-100 truncate">{mat.nombre}</p>
                    <p className="text-xs text-slate-400 dark:text-slate-500">{mat.horas > 0 ? `${mat.horas} h semanales` : 'Área de formación'}</p>
                  </div>
                  <Link
                    to={`/app/docente/materias/${mat._id}`}
                    className="inline-flex items-center gap-1 text-indigo-600 dark:text-indigo-400 text-xs font-bold px-3 py-2 bg-indigo-50 dark:bg-indigo-900/30 rounded-lg hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-colors"
                  >
                    <ClipboardList className="w-3.5 h-3.5" />
                    PLAN Y NOTAS
                    <ChevronRight className="w-3.5 h-3.5" />
                  </Link>
                  <button
                    onClick={() => quitarMateria(mat)}
                    className="p-2 text-slate-300 dark:text-slate-600 hover:text-rose-600 dark:hover:text-rose-400 rounded-lg transition-colors"
                    title="Eliminar materia"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
              {materias.length === 0 && (
                <p className="text-center text-slate-400 dark:text-slate-500 py-10 text-sm">Sin materias.</p>
              )}
            </div>
          </div>
        )}

        {/* ---- Estudiantes ---- */}
        {tab === 'estudiantes' && (
          <div>
            <div className="flex justify-end mb-4">
              <button
                onClick={() => setAddEstOpen(true)}
                className="inline-flex items-center gap-1.5 text-sm font-semibold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/30 px-4 py-2 rounded-xl hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-colors"
              >
                <Plus className="w-4 h-4" /> Asignar estudiantes
              </button>
            </div>
            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm dark:shadow-none border border-slate-100 dark:border-slate-800 divide-y divide-slate-100 dark:divide-slate-800 overflow-hidden">
              {seccion.estudiantes.map((est) => (
                <div key={est._id} className="flex items-center gap-4 p-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                  <div className="w-9 h-9 rounded-full bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold text-sm">
                    {(est.name || 'E').charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-slate-800 dark:text-slate-100 truncate">
                      {est.name} {est.apellido || ''}
                    </p>
                    <p className="text-xs text-slate-400 dark:text-slate-500">C.I. {est.cedula}</p>
                  </div>
                  <Link
                    to={`/app/docente/certificacion/${est._id}`}
                    className="inline-flex items-center gap-1 text-amber-600 dark:text-amber-400 text-xs font-bold px-3 py-2 bg-amber-50 dark:bg-amber-900/20 rounded-lg hover:bg-amber-100 dark:hover:bg-amber-900/40 transition-colors"
                    title="Certificación de calificaciones (1ro-4to)"
                  >
                    <Award className="w-3.5 h-3.5" />
                    CERTIFICACIÓN
                  </Link>
                  <button
                    onClick={() => quitarEstudiante(est)}
                    className="p-2 text-slate-300 dark:text-slate-600 hover:text-rose-600 dark:hover:text-rose-400 rounded-lg transition-colors"
                    title="Quitar de la sección"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
              {seccion.estudiantes.length === 0 && (
                <div className="text-center py-10">
                  <GraduationCap className="w-10 h-10 text-slate-200 dark:text-slate-700 mx-auto mb-2" />
                  <p className="text-slate-400 dark:text-slate-500 text-sm">Aún no has asignado estudiantes.</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      <AsignarEstudiantesModal
        open={addEstOpen}
        onClose={() => setAddEstOpen(false)}
        token={token}
        seccion={seccion}
        onDone={() => { setAddEstOpen(false); load(); }}
      />
      <AgregarMateriaModal
        open={addMatOpen}
        onClose={() => setAddMatOpen(false)}
        token={token}
        seccionId={seccion._id}
        onDone={() => { setAddMatOpen(false); load(); }}
      />
    </div>
  );
};

/** Modal: buscar y seleccionar estudiantes registrados para asignarlos.
 *  Incluye modo "crear estudiante nuevo" para inscribir a quien no esté registrado. */
const AsignarEstudiantesModal = ({ open, onClose, token, seccion, onDone }) => {
  const [todos, setTodos] = useState(null);
  const [query, setQuery] = useState('');
  const [seleccion, setSeleccion] = useState({});
  const [saving, setSaving] = useState(false);
  const [modoCrear, setModoCrear] = useState(false);
  const [nuevo, setNuevo] = useState({ name: '', apellido: '', cedula: '' });
  const [errCrear, setErrCrear] = useState('');

  useEffect(() => {
    if (!open) return;
    setSeleccion({});
    setQuery('');
    setModoCrear(false);
    setNuevo({ name: '', apellido: '', cedula: '' });
    setErrCrear('');
    listUsers(token, 'estudiante').then(setTodos).catch(() => setTodos([]));
  }, [open, token]);

  /** Crea el estudiante y lo asigna a la sección de una vez. */
  const crearYAsignar = async (e) => {
    e.preventDefault();
    setErrCrear('');
    const cedula = parseInt(nuevo.cedula, 10);
    if (!nuevo.name.trim()) return setErrCrear('Indica el nombre.');
    if (!cedula || cedula <= 0) return setErrCrear('Indica una cédula válida (solo números).');
    try {
      setSaving(true);
      const creado = await createUser(
        { name: nuevo.name.trim(), apellido: nuevo.apellido.trim(), cedula, role: 'estudiante' },
        token
      );
      await asignarEstudiantes(token, seccion._id, [creado.user._id]);
      onDone();
    } catch (err) {
      setErrCrear(err.message);
    } finally {
      setSaving(false);
    }
  };

  const yaAsignados = new Set((seccion.estudiantes || []).map((e) => e._id));
  const disponibles = (todos || []).filter((e) => !yaAsignados.has(e._id));
  const filtrados = disponibles.filter((e) => {
    const q = query.toLowerCase();
    return !q || `${e.name} ${e.apellido} ${e.cedula}`.toLowerCase().includes(q);
  });
  const elegidos = Object.keys(seleccion).filter((k) => seleccion[k]);

  const submit = async () => {
    if (elegidos.length === 0) return;
    try {
      setSaving(true);
      await asignarEstudiantes(token, seccion._id, elegidos);
      onDone();
    } catch (err) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title={modoCrear ? 'Inscribir estudiante nuevo' : 'Asignar estudiantes'} icon={Users}>
      {modoCrear ? (
        /* ---- Modo: crear estudiante nuevo e inscribirlo ---- */
        <form onSubmit={crearYAsignar} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Nombre *</label>
              <input
                autoFocus
                value={nuevo.name}
                onChange={(e) => setNuevo((n) => ({ ...n, name: e.target.value }))}
                className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Apellido</label>
              <input
                value={nuevo.apellido}
                onChange={(e) => setNuevo((n) => ({ ...n, apellido: e.target.value }))}
                className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Cédula (escolar o de identidad) *</label>
            <input
              type="number"
              value={nuevo.cedula}
              onChange={(e) => setNuevo((n) => ({ ...n, cedula: e.target.value }))}
              className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
            />
          </div>
          <p className="text-xs text-slate-400 dark:text-slate-500 bg-slate-50 dark:bg-slate-800/50 rounded-lg px-3 py-2">
            🔑 La contraseña inicial del estudiante será <span className="font-bold">su misma cédula</span>.
            Podrá cambiarla luego desde su perfil.
          </p>
          {errCrear && <p className="text-xs text-rose-600 dark:text-rose-400">{errCrear}</p>}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setModoCrear(false)}
              className="flex-1 px-4 py-2.5 text-sm font-semibold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
            >
              Volver a la búsqueda
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 px-4 py-2.5 text-sm font-semibold text-white bg-indigo-600 rounded-xl hover:bg-indigo-700 transition-colors disabled:opacity-60 inline-flex items-center justify-center gap-2"
            >
              {saving && <Loader2 className="w-4 h-4 animate-spin" />}
              Crear e inscribir
            </button>
          </div>
        </form>
      ) : (
        /* ---- Modo: buscar y asignar registrados ---- */
        <div className="space-y-3">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar por nombre o cédula..."
              className="w-full pl-9 pr-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
            />
          </div>

          <div className="max-h-60 overflow-y-auto space-y-1 border border-slate-100 dark:border-slate-800 rounded-xl p-2">
            {todos === null ? (
              <div className="flex justify-center py-6"><Loader2 className="w-5 h-5 animate-spin text-slate-300" /></div>
            ) : filtrados.length === 0 ? (
              <p className="text-center text-slate-400 dark:text-slate-500 text-sm py-6">
                {disponibles.length === 0 ? 'Todos los estudiantes registrados ya están en la sección.' : 'Sin resultados.'}
              </p>
            ) : (
              filtrados.map((e) => (
                <label key={e._id} className="flex items-center gap-2.5 p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={!!seleccion[e._id]}
                    onChange={(ev) => setSeleccion((s) => ({ ...s, [e._id]: ev.target.checked }))}
                    className="w-4 h-4 rounded accent-indigo-600"
                  />
                  <span className="text-sm text-slate-700 dark:text-slate-200 flex-1">{e.name} {e.apellido || ''}</span>
                  <span className="text-[11px] text-slate-400 font-medium">C.I. {e.cedula}</span>
                </label>
              ))
            )}
          </div>

          {/* Acceso al modo crear */}
          <button
            type="button"
            onClick={() => setModoCrear(true)}
            className="w-full px-4 py-2 text-xs font-semibold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/30 rounded-xl hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-colors inline-flex items-center justify-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            ¿No aparece? Inscribir estudiante nuevo
          </button>

          <button
            onClick={submit}
            disabled={saving || elegidos.length === 0}
            className="w-full px-4 py-2.5 text-sm font-semibold text-white bg-indigo-600 rounded-xl hover:bg-indigo-700 transition-colors disabled:opacity-50 inline-flex items-center justify-center gap-2"
          >
            {saving && <Loader2 className="w-4 h-4 animate-spin" />}
            Asignar {elegidos.length > 0 ? `(${elegidos.length})` : ''}
          </button>
        </div>
      )}
    </Modal>
  );
};

/** Modal para agregar una materia extra a la sección. */
const AgregarMateriaModal = ({ open, onClose, token, seccionId, onDone }) => {
  const [nombre, setNombre] = useState('');
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');

  useEffect(() => { if (open) { setNombre(''); setErr(''); } }, [open]);

  const submit = async (e) => {
    e.preventDefault();
    if (!nombre.trim()) return;
    try {
      setSaving(true);
      await agregarMateria(token, seccionId, { nombre: nombre.trim() });
      onDone();
    } catch (e2) {
      setErr(e2.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Agregar materia" icon={BookOpen}>
      <form onSubmit={submit} className="space-y-4">
        <input
          autoFocus
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          placeholder="Nombre de la materia"
          className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
        />
        {err && <p className="text-xs text-rose-600 dark:text-rose-400">{err}</p>}
        <button type="submit" disabled={saving} className="w-full px-4 py-2.5 text-sm font-semibold text-white bg-indigo-600 rounded-xl hover:bg-indigo-700 transition-colors disabled:opacity-60">
          Agregar
        </button>
      </form>
    </Modal>
  );
};

export default SeccionDetailPage;
