import React, { useContext, useEffect, useState } from 'react';
import { AuthContext } from '../../context/AuthContext';
import { listUsers, updateUserRole, deleteUser, createUser, vincularRepresentante } from '../../api/user';
import { ROLES, ROLE_LABEL } from '../../utils/roles';
import Modal from '../../components/ui/Modal';
import { Users, Loader2, Trash2, Shield, GraduationCap, BookUser, Search, UserPlus } from 'lucide-react';

/**
 * Gestión de Usuarios (SuperAdmin) — FUNCIONAL.
 * Lista todos los usuarios, permite cambiar su rol y eliminarlos.
 */
const ROLE_META = {
  [ROLES.SUPERADMIN]: { Icon: Shield, text: 'text-rose-600 dark:text-rose-400', bg: 'bg-rose-50 dark:bg-rose-900/20' },
  [ROLES.DOCENTE]: { Icon: BookUser, text: 'text-sky-600 dark:text-sky-400', bg: 'bg-sky-50 dark:bg-sky-900/20' },
  [ROLES.ESTUDIANTE]: { Icon: GraduationCap, text: 'text-indigo-600 dark:text-indigo-400', bg: 'bg-indigo-50 dark:bg-indigo-900/20' },
};

const ManageUsersPage = () => {
  const { token, user: currentUser } = useContext(AuthContext);
  const [users, setUsers] = useState(null);
  const [error, setError] = useState(null);
  const [query, setQuery] = useState('');
  const [busy, setBusy] = useState(null);
  const [crearOpen, setCrearOpen] = useState(false);
  const [repEst, setRepEst] = useState(null);

  const load = async () => {
    try {
      const list = await listUsers(token);
      setUsers(list);
    } catch (err) {
      setError(err.message);
      setUsers([]);
    }
  };

  useEffect(() => {
    if (token) load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const changeRole = async (id, role) => {
    setBusy(id);
    try {
      await updateUserRole(id, role, token);
      setUsers((prev) => prev.map((u) => (u._id === id ? { ...u, role } : u)));
    } catch (err) {
      alert(err.message);
    } finally {
      setBusy(null);
    }
  };

  const removeUser = async (id, name) => {
    if (!window.confirm(`¿Eliminar a ${name}? Esta acción no se puede deshacer.`)) return;
    setBusy(id);
    try {
      await deleteUser(id, token);
      setUsers((prev) => prev.filter((u) => u._id !== id));
    } catch (err) {
      alert(err.message);
    } finally {
      setBusy(null);
    }
  };

  const filtered = (users || []).filter((u) => {
    const q = query.toLowerCase();
    return !q || `${u.name} ${u.apellido} ${u.cedula} ${u.email}`.toLowerCase().includes(q);
  });

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-6 transition-colors duration-300">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-600 dark:bg-indigo-500 rounded-lg text-white">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">Gestión de Usuarios</h1>
              <p className="text-sm text-slate-500 dark:text-slate-400">Administra roles y cuentas del sistema</p>
            </div>
          </div>
          <button
            onClick={() => setCrearOpen(true)}
            className="inline-flex items-center gap-2 bg-indigo-600 text-white text-sm font-semibold px-4 py-2.5 rounded-xl hover:bg-indigo-700 transition-colors shadow-sm hover:shadow-md"
          >
            <UserPlus className="w-4 h-4" />
            Crear usuario
          </button>
        </div>

        {/* Buscador */}
        <div className="relative mb-5">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar por nombre, cédula o email..."
            className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500"
          />
        </div>

        {users === null ? (
          <div className="flex justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-slate-300 dark:text-slate-600" />
          </div>
        ) : error ? (
          <p className="text-rose-600 dark:text-rose-400 text-center py-10">{error}</p>
        ) : (
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm dark:shadow-none border border-slate-100 dark:border-slate-800 overflow-hidden divide-y divide-slate-100 dark:divide-slate-800">
            {filtered.map((u) => {
              const meta = ROLE_META[u.role] || ROLE_META[ROLES.ESTUDIANTE];
              const isSelf = u._id === currentUser?.id;
              return (
                <div key={u._id} className="flex items-center gap-4 p-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                  <div className={`p-2.5 rounded-xl ${meta.bg} ${meta.text} flex-shrink-0`}>
                    <meta.Icon className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-slate-800 dark:text-slate-100 truncate">
                      {u.name} {u.apellido || ''} {isSelf && <span className="text-xs text-indigo-500">(tú)</span>}
                    </p>
                    <p className="text-xs text-slate-400 dark:text-slate-500 truncate">
                      C.I. {u.cedula} · {u.email || 'sin email'}
                    </p>
                  </div>

                  {/* Selector de rol */}
                  <select
                    value={u.role}
                    disabled={busy === u._id || isSelf}
                    onChange={(e) => changeRole(u._id, e.target.value)}
                    className="text-sm font-medium text-slate-700 dark:text-slate-200 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 disabled:opacity-50 cursor-pointer"
                  >
                    {Object.values(ROLES).map((r) => (
                      <option key={r} value={r}>{ROLE_LABEL[r]}</option>
                    ))}
                  </select>

                  {u.role === ROLES.ESTUDIANTE && !isSelf && (
                    <button
                      onClick={() => setRepEst(u)}
                      title="Asignar representante"
                      className="p-2 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg transition-colors"
                    >
                      <BookUser className="w-4 h-4" />
                    </button>
                  )}

                  <button
                    onClick={() => removeUser(u._id, u.name)}
                    disabled={busy === u._id || isSelf}
                    className="p-2 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                    title={isSelf ? 'No puedes eliminarte' : 'Eliminar'}
                  >
                    {busy === u._id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                  </button>
                </div>
              );
            })}
            {filtered.length === 0 && (
              <p className="text-center text-slate-400 dark:text-slate-500 py-10 text-sm">Sin resultados.</p>
            )}
          </div>
        )}
      </div>

      <CrearUsuarioModal
        open={crearOpen}
        onClose={() => setCrearOpen(false)}
        token={token}
        onCreated={(nuevo) => {
          setCrearOpen(false);
          setUsers((prev) => [nuevo, ...(prev || [])]);
        }}
      />

      <AsignarRepresentanteModal
        open={!!repEst}
        onClose={() => setRepEst(null)}
        estudiante={repEst}
        token={token}
        allUsers={users || []}
        onDone={load}
      />
    </div>
  );
};

/** Modal del superadmin para crear usuarios de cualquier rol. */
const CrearUsuarioModal = ({ open, onClose, token, onCreated }) => {
  const [form, setForm] = useState({ name: '', apellido: '', cedula: '', role: ROLES.ESTUDIANTE, email: '', telefono: '', password: '' });
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');

  useEffect(() => {
    if (open) {
      setForm({ name: '', apellido: '', cedula: '', role: ROLES.ESTUDIANTE, email: '', telefono: '', password: '' });
      setErr('');
    }
  }, [open]);

  const set = (campo, valor) => setForm((f) => ({ ...f, [campo]: valor }));

  const submit = async (e) => {
    e.preventDefault();
    setErr('');
    const cedula = parseInt(form.cedula, 10);
    if (!form.name.trim()) return setErr('Indica el nombre.');
    if (!cedula || cedula <= 0) return setErr('Indica una cédula válida (solo números).');
    try {
      setSaving(true);
      const payload = {
        name: form.name.trim(),
        apellido: form.apellido.trim() || undefined,
        cedula,
        role: form.role,
        email: form.email.trim() || undefined,
        telefono: form.telefono.trim() || undefined,
        password: form.password.trim() || undefined,
      };
      const r = await createUser(payload, token);
      onCreated(r.user);
    } catch (e2) {
      setErr(e2.message);
    } finally {
      setSaving(false);
    }
  };

  const inputCls = 'w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/30';

  return (
    <Modal open={open} onClose={onClose} title="Crear usuario" icon={UserPlus}>
      <form onSubmit={submit} className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Nombre *</label>
            <input autoFocus value={form.name} onChange={(e) => set('name', e.target.value)} className={inputCls} />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Apellido</label>
            <input value={form.apellido} onChange={(e) => set('apellido', e.target.value)} className={inputCls} />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Cédula *</label>
            <input type="number" value={form.cedula} onChange={(e) => set('cedula', e.target.value)} className={inputCls} />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Rol</label>
            <select value={form.role} onChange={(e) => set('role', e.target.value)} className={inputCls}>
              {Object.values(ROLES).map((r) => (
                <option key={r} value={r}>{ROLE_LABEL[r]}</option>
              ))}
            </select>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Email (opcional)</label>
            <input type="email" value={form.email} onChange={(e) => set('email', e.target.value)} className={inputCls} />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Teléfono (opcional)</label>
            <input value={form.telefono} onChange={(e) => set('telefono', e.target.value)} className={inputCls} />
          </div>
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">
            Contraseña (opcional — si la dejas vacía, será la cédula)
          </label>
          <input type="text" value={form.password} onChange={(e) => set('password', e.target.value)} className={inputCls} />
        </div>
        {err && <p className="text-xs text-rose-600 dark:text-rose-400">{err}</p>}
        <button
          type="submit"
          disabled={saving}
          className="w-full px-4 py-2.5 text-sm font-semibold text-white bg-indigo-600 rounded-xl hover:bg-indigo-700 transition-colors disabled:opacity-60 inline-flex items-center justify-center gap-2"
        >
          {saving && <Loader2 className="w-4 h-4 animate-spin" />}
          Crear usuario
        </button>
      </form>
    </Modal>
  );
};

/** Modal para asignar un representante a un estudiante: vincular uno existente o crear uno nuevo. */
const AsignarRepresentanteModal = ({ open, onClose, estudiante, token, allUsers, onDone }) => {
  const [modo, setModo] = useState('vincular'); // 'vincular' | 'crear'
  const [query, setQuery] = useState('');
  const [nuevo, setNuevo] = useState({ name: '', apellido: '', cedula: '' });
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');

  useEffect(() => {
    if (open) {
      setModo('vincular');
      setQuery('');
      setNuevo({ name: '', apellido: '', cedula: '' });
      setErr('');
    }
  }, [open]);

  const representantes = (allUsers || []).filter((u) => u.role === ROLES.REPRESENTANTE);
  const filtrados = representantes.filter((u) => {
    const q = query.toLowerCase();
    return !q || `${u.name} ${u.apellido || ''} ${u.cedula}`.toLowerCase().includes(q);
  });

  const vincular = async (rep) => {
    setErr('');
    try {
      setSaving(true);
      await vincularRepresentante(rep._id, estudiante._id, token);
      onDone?.();
      onClose();
    } catch (e2) {
      setErr(e2.message);
    } finally {
      setSaving(false);
    }
  };

  const crear = async (e) => {
    e.preventDefault();
    setErr('');
    const cedula = parseInt(nuevo.cedula, 10);
    if (!nuevo.name.trim()) return setErr('Indica el nombre.');
    if (!cedula || cedula <= 0) return setErr('Indica una cédula válida (solo números).');
    try {
      setSaving(true);
      await createUser(
        { role: ROLES.REPRESENTANTE, name: nuevo.name.trim(), apellido: nuevo.apellido.trim() || undefined, cedula, representadoId: estudiante._id },
        token
      );
      onDone?.();
      onClose();
    } catch (e2) {
      setErr(e2.message);
    } finally {
      setSaving(false);
    }
  };

  const inputCls = 'w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/30';
  const tabCls = (activo) =>
    `flex-1 px-3 py-2 text-xs font-semibold rounded-lg transition-colors ${
      activo ? 'bg-indigo-600 text-white' : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
    }`;

  return (
    <Modal open={open} onClose={onClose} title="Asignar representante" icon={BookUser}>
      {estudiante && (
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
          Representante de: <span className="font-semibold text-slate-800 dark:text-slate-100">{estudiante.name} {estudiante.apellido || ''}</span>
        </p>
      )}

      <div className="flex gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl mb-4">
        <button onClick={() => setModo('vincular')} className={tabCls(modo === 'vincular')}>Vincular existente</button>
        <button onClick={() => setModo('crear')} className={tabCls(modo === 'crear')}>Crear nuevo</button>
      </div>

      {modo === 'crear' ? (
        <form onSubmit={crear} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Nombre *</label>
              <input autoFocus value={nuevo.name} onChange={(e) => setNuevo((n) => ({ ...n, name: e.target.value }))} className={inputCls} />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Apellido</label>
              <input value={nuevo.apellido} onChange={(e) => setNuevo((n) => ({ ...n, apellido: e.target.value }))} className={inputCls} />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Cédula *</label>
            <input type="number" value={nuevo.cedula} onChange={(e) => setNuevo((n) => ({ ...n, cedula: e.target.value }))} className={inputCls} />
          </div>
          <p className="text-xs text-slate-400 dark:text-slate-500 bg-slate-50 dark:bg-slate-800/50 rounded-lg px-3 py-2">
            🔑 La contraseña inicial del representante será <span className="font-bold">su misma cédula</span>.
          </p>
          {err && <p className="text-xs text-rose-600 dark:text-rose-400">{err}</p>}
          <button
            type="submit"
            disabled={saving}
            className="w-full px-4 py-2.5 text-sm font-semibold text-white bg-indigo-600 rounded-xl hover:bg-indigo-700 transition-colors disabled:opacity-60 inline-flex items-center justify-center gap-2"
          >
            {saving && <Loader2 className="w-4 h-4 animate-spin" />}
            Crear y vincular
          </button>
        </form>
      ) : (
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
            {filtrados.length === 0 ? (
              <p className="text-center text-slate-400 dark:text-slate-500 text-sm py-6">
                {representantes.length === 0 ? 'No hay representantes registrados. Crea uno nuevo.' : 'Sin resultados.'}
              </p>
            ) : (
              filtrados.map((u) => (
                <div key={u._id} className="flex items-center gap-2.5 p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-slate-700 dark:text-slate-200 truncate">{u.name} {u.apellido || ''}</p>
                    <p className="text-[11px] text-slate-400">C.I. {u.cedula}</p>
                  </div>
                  <button
                    onClick={() => vincular(u)}
                    disabled={saving}
                    className="text-xs font-bold px-3 py-1.5 text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 inline-flex items-center gap-1.5"
                  >
                    {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                    Vincular
                  </button>
                </div>
              ))
            )}
          </div>
          {err && <p className="text-xs text-rose-600 dark:text-rose-400">{err}</p>}
        </div>
      )}
    </Modal>
  );
};

export default ManageUsersPage;
