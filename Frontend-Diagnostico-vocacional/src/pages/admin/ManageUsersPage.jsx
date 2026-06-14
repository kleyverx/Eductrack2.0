import React, { useContext, useEffect, useState } from 'react';
import { AuthContext } from '../../context/AuthContext';
import { listUsers, updateUserRole, deleteUser, createUser } from '../../api/user';
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

export default ManageUsersPage;
