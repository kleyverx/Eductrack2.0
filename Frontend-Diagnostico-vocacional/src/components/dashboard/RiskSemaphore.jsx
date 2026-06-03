import React from 'react';
import { CheckCircle2, AlertTriangle, AlertOctagon, ShieldCheck } from 'lucide-react';
import { summarizeRisk } from '../../utils/academic';

/**
 * Semáforo de Riesgo Académico.
 * Resume de un vistazo cuántas materias están sólidas, en observación o en riesgo.
 * Estilo "Quiet Academic": tarjeta blanca, acentos emerald/amber/rose.
 *
 * @param {{ subjects: Array<{avgScore:number}> }} props
 */
const RiskSemaphore = ({ subjects = [] }) => {
  const { good, warning, danger, total } = summarizeRisk(subjects);

  const segments = [
    {
      key: 'good',
      label: 'Sólidas',
      hint: 'Nota ≥ 15',
      count: good,
      Icon: CheckCircle2,
      text: 'text-emerald-700',
      bg: 'bg-emerald-50',
      bar: 'bg-emerald-500',
      iconBg: 'bg-emerald-100',
    },
    {
      key: 'warning',
      label: 'En observación',
      hint: 'Nota 11–14',
      count: warning,
      Icon: AlertTriangle,
      text: 'text-amber-700',
      bg: 'bg-amber-50',
      bar: 'bg-amber-500',
      iconBg: 'bg-amber-100',
    },
    {
      key: 'danger',
      label: 'En riesgo',
      hint: 'Nota < 11',
      count: danger,
      Icon: AlertOctagon,
      text: 'text-rose-700',
      bg: 'bg-rose-50',
      bar: 'bg-rose-500',
      iconBg: 'bg-rose-100',
    },
  ];

  const pct = (n) => (total > 0 ? (n / total) * 100 : 0);

  return (
    <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-6">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-slate-900">Semáforo de Riesgo</h3>
            <p className="text-xs text-slate-500">Estado general de tus materias</p>
          </div>
        </div>
        <span className="text-xs font-bold text-slate-500 bg-slate-50 px-3 py-1 rounded-full">
          {total} {total === 1 ? 'materia' : 'materias'}
        </span>
      </div>

      {total === 0 ? (
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <ShieldCheck className="w-10 h-10 text-slate-200 mb-2" />
          <p className="text-sm text-slate-400 font-medium">
            Aún no hay materias para evaluar el riesgo.
          </p>
        </div>
      ) : (
        <>
          {/* Barra apilada proporcional */}
          <div className="flex w-full h-2.5 rounded-full overflow-hidden bg-slate-100 mb-6">
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
            {segments.map(({ key, label, hint, count, Icon, text, bg, iconBg }) => (
              <div key={key} className={`${bg} rounded-2xl p-4 flex flex-col items-center text-center`}>
                <div className={`${iconBg} ${text} p-2 rounded-xl mb-2`}>
                  <Icon className="w-5 h-5" />
                </div>
                <span className={`text-2xl font-black ${text} leading-none`}>{count}</span>
                <span className="text-xs font-semibold text-slate-700 mt-1.5">{label}</span>
                <span className="text-[10px] text-slate-400 uppercase tracking-wider font-bold mt-0.5">
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
