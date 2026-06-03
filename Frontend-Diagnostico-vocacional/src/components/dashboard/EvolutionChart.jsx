import React from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  ReferenceLine,
} from 'recharts';
import { LineChart as LineChartIcon, TrendingUp, TrendingDown, Minus } from 'lucide-react';

/**
 * Mini gráfico de evolución del promedio académico.
 * Recibe una serie temporal ya calculada y muestra la tendencia.
 * Si hay menos de 2 puntos, muestra un estado vacío invitando a registrar notas.
 *
 * @param {{ data: Array<{label:string, avg:number}> }} props
 */
const EvolutionChart = ({ data = [] }) => {
  const hasEnough = data.length >= 2;

  // Tendencia simple: comparar primer y último punto.
  const first = data[0]?.avg ?? 0;
  const last = data[data.length - 1]?.avg ?? 0;
  const delta = +(last - first).toFixed(1);

  const trend =
    delta > 0.1
      ? { Icon: TrendingUp, text: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-900/20', label: `+${delta} pts` }
      : delta < -0.1
      ? { Icon: TrendingDown, text: 'text-rose-600 dark:text-rose-400', bg: 'bg-rose-50 dark:bg-rose-900/20', label: `${delta} pts` }
      : { Icon: Minus, text: 'text-slate-500 dark:text-slate-400', bg: 'bg-slate-100 dark:bg-slate-800', label: 'Estable' };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-sm dark:shadow-none border border-slate-100 dark:border-slate-800 p-6 h-full flex flex-col transition-colors duration-300">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-lg">
            <LineChartIcon className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-slate-900 dark:text-slate-100">Evolución del Promedio</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">Tendencia de tu rendimiento</p>
          </div>
        </div>
        {hasEnough && (
          <span
            className={`flex items-center gap-1.5 text-xs font-bold ${trend.text} ${trend.bg} px-3 py-1.5 rounded-full`}
          >
            <trend.Icon className="w-3.5 h-3.5" />
            {trend.label}
          </span>
        )}
      </div>

      {hasEnough ? (
        <div className="flex-1 min-h-[200px]">
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={data} margin={{ top: 5, right: 8, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="evolutionFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#4f46e5" stopOpacity={0.25} />
                  <stop offset="100%" stopColor="#4f46e5" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis
                dataKey="label"
                tick={{ fontSize: 11, fill: '#94a3b8' }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                domain={[0, 20]}
                ticks={[0, 5, 10, 15, 20]}
                tick={{ fontSize: 11, fill: '#94a3b8' }}
                axisLine={false}
                tickLine={false}
              />
              {/* Línea de aprobación (10) como referencia sutil */}
              <ReferenceLine y={10} stroke="#fda4af" strokeDasharray="4 4" />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#ffffff',
                  border: '1px solid #e2e8f0',
                  borderRadius: '12px',
                  fontSize: '12px',
                  boxShadow: '0 4px 12px -2px rgba(0,0,0,0.08)',
                }}
                formatter={(value) => [`${value} / 20`, 'Promedio']}
              />
              <Area
                type="monotone"
                dataKey="avg"
                stroke="#4f46e5"
                strokeWidth={2.5}
                fill="url(#evolutionFill)"
                dot={{ fill: '#4f46e5', strokeWidth: 2, stroke: '#fff', r: 3 }}
                activeDot={{ r: 5 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center text-center py-10 min-h-[200px]">
          <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-2xl mb-3">
            <LineChartIcon className="w-8 h-8 text-slate-300 dark:text-slate-600" />
          </div>
          <p className="text-slate-500 dark:text-slate-400 font-semibold text-sm mb-1">Sin datos suficientes</p>
          <p className="text-slate-400 dark:text-slate-500 text-xs max-w-[220px]">
            Registra al menos dos notas para visualizar la evolución de tu promedio.
          </p>
        </div>
      )}
    </div>
  );
};

export default EvolutionChart;
