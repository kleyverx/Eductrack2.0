import React, { useContext, useEffect, useState } from 'react';
import { AuthContext } from '../../context/AuthContext';
import { listUsers, updateUserRole, deleteUser } from '../../api/user';
import { ROLES, ROLE_LABEL } from '../../utils/roles';
import { Users, Loader2, Trash2, Shield, GraduationCap, BookUser, Search } from 'lucide-react';

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
        <div className="flex items-center gap-3 mb-8">
          <div className="p-2 bg-indigo-600 dark:bg-indigo-500 rounded-lg text-white">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">Gestión de Usuarios</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">Administra roles y cuentas del sistema</p>
          </div>
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
    </div>
  );
};

export default ManageUsersPage;
