import React from 'react';
import { CheckCircle2, AlertTriangle, AlertOctagon, ShieldCheck } from 'lucide-react';
import { summarizeRisk } from '../../utils/academic';

/**
 * Semáforo de Riesgo Académico.
 * Resume de un vistazo cuántas calificaciones están sólidas, en observación o en riesgo.
 * Estilo "Quiet Academic": tarjeta blanca, acentos emerald/amber/rose.
 *
 * @param {{ subjects?: Array<{avgScore:number}>, counts?: {good:number,warning:number,danger:number}, unidad?: [string,string] }} props
 *   - subjects: materias con promedio (se clasifica localmente), o
 *   - counts: conteos ya calculados (ej. desde la API del docente)
 *   - unidad: etiqueta singular/plural del contador (default materia/materias)
 */
const RiskSemaphore = ({ subjects = [], counts = null, unidad = ['materia', 'materias'] }) => {
  const { good, warning, danger, total } = counts
    ? { ...counts, total: (counts.good || 0) + (counts.warning || 0) + (counts.danger || 0) }
    : summarizeRisk(subjects);

  const segments = [
    {
      key: 'good',
      label: 'Sólidas',
      hint: 'Nota ≥ 15',
      count: good,
      Icon: CheckCircle2,
      text: 'text-emerald-700 dark:text-emerald-400',
      bg: 'bg-emerald-50',
      bgDark: 'dark:bg-emerald-900/20',
      bar: 'bg-emerald-500',
      iconBg: 'bg-emerald-100 dark:bg-emerald-900/40',
    },
    {
      key: 'warning',
      label: 'En observación',
      hint: 'Nota 11–14',
      count: warning,
      Icon: AlertTriangle,
      text: 'text-amber-700 dark:text-amber-400',
      bg: 'bg-amber-50',
      bgDark: 'dark:bg-amber-900/20',
      bar: 'bg-amber-500',
      iconBg: 'bg-amber-100 dark:bg-amber-900/40',
    },
    {
      key: 'danger',
      label: 'En riesgo',
      hint: 'Nota < 11',
      count: danger,
      Icon: AlertOctagon,
      text: 'text-rose-700 dark:text-rose-400',
      bg: 'bg-rose-50',
      bgDark: 'dark:bg-rose-900/20',
      bar: 'bg-rose-500',
      iconBg: 'bg-rose-100 dark:bg-rose-900/40',
    },
  ];

  const pct = (n) => (total > 0 ? (n / total) * 100 : 0);

  return (
    <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-sm dark:shadow-none border border-slate-100 dark:border-slate-800 p-6 transition-colors duration-300">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-lg">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-slate-900 dark:text-slate-100">Semáforo de Riesgo</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">Estado general de tus materias</p>
          </div>
        </div>
        <span className="text-xs font-bold text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800 px-3 py-1 rounded-full">
          {total} {total === 1 ? unidad[0] : unidad[1]}
        </span>
      </div>

      {total === 0 ? (
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <ShieldCheck className="w-10 h-10 text-slate-200 dark:text-slate-700 mb-2" />
          <p className="text-sm text-slate-400 dark:text-slate-500 font-medium">
            Aún no hay materias para evaluar el riesgo.
          </p>
        </div>
      ) : (
        <>
          {/* Barra apilada proporcional */}
          <div className="flex w-full h-2.5 rounded-full overflow-hidden bg-slate-100 dark:bg-slate-800 mb-6">
            {segments.map((s) =>
              s.count > 0 ? (
                <div
                  key={s.key}
                  className={`${s.bar} h-full transition-all duration-500`}
                  style={{ width: `${pct(s.count)}%` }}
                  title={`${s.label}: ${s.count}`}
                />
              ) : null
            )}
          </div>

          {/* Detalle por nivel */}
          <div className="grid grid-cols-3 gap-3">
            {segments.map(({ key, label, hint, count, Icon, text, bg, bgDark, iconBg }) => (
              <div key={key} className={`${bg} ${bgDark} rounded-2xl p-4 flex flex-col items-center text-center`}>
                <div className={`${iconBg} ${text} p-2 rounded-xl mb-2`}>
                  <Icon className="w-5 h-5" />
                </div>
                <span className={`text-2xl font-black ${text} leading-none`}>{count}</span>
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-200 mt-1.5">{label}</span>
                <span className="text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-wider font-bold mt-0.5">
                  {hint}
                </span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default RiskSemaphore;
