import React, { useState, useEffect, useContext } from 'react';
import { ScrollText, LogIn, UserPlus, Trash2, Settings, FileText, Loader2, FileDown } from 'lucide-react';
import { AuthContext } from '../../context/AuthContext';
import { getAuditoria } from '../../api/auditoria';
import { exportAuditoriaPDF } from '../../utils/reportesPDF';

/**
 * Auditoría / Logs (SuperAdmin).
 * Muestra el registro real de actividad del sistema desde GET /api/admin/auditoria.
 */
const ACTION_META = {
  'login': { Icon: LogIn, text: 'text-sky-600 dark:text-sky-400', bg: 'bg-sky-50 dark:bg-sky-900/20', label: 'Inicio de sesión' },
  'crear-usuario': { Icon: UserPlus, text: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-900/20', label: 'Creación de usuario' },
  'eliminar-usuario': { Icon: Trash2, text: 'text-rose-600 dark:text-rose-400', bg: 'bg-rose-50 dark:bg-rose-900/20', label: 'Eliminación' },
  'config': { Icon: Settings, text: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-900/20', label: 'Configuración' },
  'constancia': { Icon: FileText, text: 'text-violet-600 dark:text-violet-400', bg: 'bg-violet-50 dark:bg-violet-900/20', label: 'Constancia' },
};
const META_DEFAULT = { Icon: ScrollText, text: 'text-slate-500 dark:text-slate-400', bg: 'bg-slate-100 dark:bg-slate-800', label: 'Evento' };

const AuditLogsPage = () => {
  const [logs, setLogs] = useState(null); // null = cargando
  const [error, setError] = useState('');
  const { token } = useContext(AuthContext);

  useEffect(() => {
    if (!token) return;
    getAuditoria(token)
      .then(setLogs)
      .catch((e) => {
        setError(e.message);
        setLogs([]);
      });
  }, [token]);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-6 transition-colors duration-300">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between gap-3 mb-8">
          <div data-tour="page-auditoria" className="flex items-center gap-3">
            <div className="p-2 bg-indigo-600 dark:bg-indigo-500 rounded-lg text-white">
              <ScrollText className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">Auditoría</h1>
              <p className="text-sm text-slate-500 dark:text-slate-400">Registro de actividad del sistema</p>
            </div>
          </div>
          <button
            onClick={() => exportAuditoriaPDF(logs)}
            disabled={!logs || logs.length === 0}
            title={logs && logs.length > 0 ? 'Descargar el registro en PDF' : 'Sin actividad registrada'}
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/30 px-4 py-2 rounded-xl hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <FileDown className="w-4 h-4" /> Descargar PDF
          </button>
        </div>

        {/* Cargando */}
        {logs === null && !error && (
          <div className="flex justify-center py-16">
            <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="bg-rose-50 dark:bg-rose-900/20 border border-rose-100 dark:border-rose-900/40 rounded-2xl p-4 text-sm text-rose-700 dark:text-rose-300">
            {error}
          </div>
        )}

        {/* Estado vacío */}
        {logs && logs.length === 0 && !error && (
          <div className="border border-dashed border-slate-200 dark:border-slate-700 rounded-2xl p-10 text-center text-sm text-slate-400 dark:text-slate-500">
            Aún no hay actividad registrada.
          </div>
        )}

        {/* Lista de logs */}
        {logs && logs.length > 0 && (
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm dark:shadow-none border border-slate-100 dark:border-slate-800 overflow-hidden divide-y divide-slate-100 dark:divide-slate-800">
            {logs.map((log) => {
              const meta = ACTION_META[log.accion] || META_DEFAULT;
              return (
                <div key={log._id} className="flex items-center gap-4 p-4">
                  <div className={`p-2.5 rounded-xl ${meta.bg} ${meta.text} flex-shrink-0`}>
                    <meta.Icon className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-slate-700 dark:text-slate-200">{log.detalle}</p>
                    <span className="text-xs text-slate-400 dark:text-slate-500">
                      {`${log.actorNombre || 'Sistema'} · ${log.actorRol || ''}`}
                    </span>
                  </div>
                  <span className="text-xs text-slate-400 dark:text-slate-500 flex-shrink-0">
                    {new Date(log.createdAt).toLocaleString('es-VE')}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default AuditLogsPage;
