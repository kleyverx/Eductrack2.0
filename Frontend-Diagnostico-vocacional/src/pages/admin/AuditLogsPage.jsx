import React from 'react';
import { ScrollText, Info, LogIn, UserPlus, Trash2, Settings, KeyRound } from 'lucide-react';

/**
 * Auditoría / Logs (SuperAdmin).
 * MAQUETA: muestra la estructura del registro de actividad con datos de ejemplo.
 * Los logs reales requieren un backend de auditoría (pendiente).
 */
const ACTION_META = {
  login: { Icon: LogIn, text: 'text-sky-600 dark:text-sky-400', bg: 'bg-sky-50 dark:bg-sky-900/20', label: 'Inicio de sesión' },
  create: { Icon: UserPlus, text: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-900/20', label: 'Creación' },
  delete: { Icon: Trash2, text: 'text-rose-600 dark:text-rose-400', bg: 'bg-rose-50 dark:bg-rose-900/20', label: 'Eliminación' },
  config: { Icon: Settings, text: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-900/20', label: 'Configuración' },
  password: { Icon: KeyRound, text: 'text-violet-600 dark:text-violet-400', bg: 'bg-violet-50 dark:bg-violet-900/20', label: 'Contraseña' },
};

// Datos de ejemplo (placeholder).
const SAMPLE_LOGS = [
  { id: 1, type: 'login', actor: 'Admin Principal', detail: 'Inició sesión como SuperAdmin', time: 'Hace 5 min' },
  { id: 2, type: 'create', actor: 'Admin Principal', detail: 'Ascendió a Profesora González a Docente', time: 'Hace 22 min' },
  { id: 3, type: 'password', actor: 'Admin Principal', detail: 'Restableció la contraseña de Carlos Estudiante', time: 'Hace 1 h' },
  { id: 4, type: 'config', actor: 'Admin Principal', detail: 'Cambió el umbral del semáforo a 15', time: 'Hace 3 h' },
  { id: 5, type: 'login', actor: 'Profesor Ramírez', detail: 'Inició sesión como Docente', time: 'Ayer' },
  { id: 6, type: 'delete', actor: 'Admin Principal', detail: 'Eliminó una cuenta de estudiante duplicada', time: 'Ayer' },
];

const AuditLogsPage = () => (
  <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-6 transition-colors duration-300">
    <div className="max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <div className="p-2 bg-indigo-600 dark:bg-indigo-500 rounded-lg text-white">
          <ScrollText className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">Auditoría</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">Registro de actividad del sistema</p>
        </div>
      </div>

      {/* Aviso de maqueta */}
      <div className="flex items-start gap-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-900/40 rounded-2xl p-4 mb-6">
        <Info className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
        <p className="text-sm text-amber-700 dark:text-amber-300">
          Vista previa con datos de ejemplo. El registro real de auditoría se habilitará cuando
          el backend comience a guardar eventos.
        </p>
      </div>

      {/* Lista de logs */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm dark:shadow-none border border-slate-100 dark:border-slate-800 overflow-hidden divide-y divide-slate-100 dark:divide-slate-800">
        {SAMPLE_LOGS.map((log) => {
          const meta = ACTION_META[log.type];
          return (
            <div key={log.id} className="flex items-center gap-4 p-4">
              <div className={`p-2.5 rounded-xl ${meta.bg} ${meta.text} flex-shrink-0`}>
                <meta.Icon className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-slate-700 dark:text-slate-200">
                  <span className="font-semibold">{log.actor}</span> — {log.detail}
                </p>
                <span className={`text-[10px] font-bold uppercase tracking-wider ${meta.text}`}>{meta.label}</span>
              </div>
              <span className="text-xs text-slate-400 dark:text-slate-500 flex-shrink-0">{log.time}</span>
            </div>
          );
        })}
      </div>
    </div>
  </div>
);

export default AuditLogsPage;
