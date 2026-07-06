import React, { useState, useEffect, useContext } from 'react';
import { Settings, Save, Building2, GraduationCap, Sparkles, CalendarX } from 'lucide-react';
import { getConfig, updateConfig } from '../../api/config';
import { AuthContext } from '../../context/AuthContext';

/**
 * Configuración de la App (SuperAdmin).
 * Lee y persiste los ajustes globales desde el backend (GET/PUT /api/config).
 */
const AppConfigPage = () => {
  const { token } = useContext(AuthContext);
  const [config, setConfig] = useState(null);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!token) return;
    getConfig(token)
      .then(setConfig)
      .catch(() => setError('No se pudo cargar la configuración'));
  }, [token]);

  const set = (key, value) => {
    setConfig((c) => ({ ...c, [key]: value }));
    setSaved(false);
  };

  const save = async () => {
    setError('');
    try {
      const { institucion, notaAprobatoria, umbralVerde, umbralAmbar, iaActiva, umbralInasistencia } = config;
      const updated = await updateConfig(
        { institucion, notaAprobatoria, umbralVerde, umbralAmbar, iaActiva, umbralInasistencia },
        token
      );
      setConfig(updated);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (err) {
      setError(err.message || 'Error al guardar configuración');
    }
  };

  if (!config) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center transition-colors duration-300">
        <p className="text-sm text-slate-500 dark:text-slate-400">Cargando configuración…</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-6 transition-colors duration-300">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <div className="p-2 bg-indigo-600 dark:bg-indigo-500 rounded-lg text-white">
            <Settings className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">Configuración</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">Ajustes globales de la aplicación</p>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-rose-50 dark:bg-rose-900/20 border border-rose-100 dark:border-rose-900/40 rounded-2xl p-4 mb-6">
            <p className="text-sm text-rose-700 dark:text-rose-300">{error}</p>
          </div>
        )}

        <div className="space-y-4">
          {/* Institución */}
          <ConfigCard Icon={Building2} title="Institución" subtitle="Nombre que se muestra en la app">
            <input
              value={config.institucion ?? ''}
              onChange={(e) => set('institucion', e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500"
            />
          </ConfigCard>

          {/* Escala de notas */}
          <ConfigCard Icon={GraduationCap} title="Semáforo Académico" subtitle="Umbrales de la escala 0–20">
            <div className="grid grid-cols-3 gap-3">
              <NumberField label="Aprobatoria" value={config.notaAprobatoria} onChange={(v) => set('notaAprobatoria', v)} />
              <NumberField label="Verde (≥)" value={config.umbralVerde} onChange={(v) => set('umbralVerde', v)} />
              <NumberField label="Ámbar (≥)" value={config.umbralAmbar} onChange={(v) => set('umbralAmbar', v)} />
            </div>
          </ConfigCard>

          {/* Umbral de inasistencia */}
          <ConfigCard Icon={CalendarX} title="Control de Asistencia" subtitle="% de inasistencia que enciende la alerta de riesgo">
            <div className="max-w-[140px]">
              <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Umbral (%)</label>
              <input
                type="number"
                min="0"
                max="100"
                value={config.umbralInasistencia ?? 25}
                onChange={(e) => set('umbralInasistencia', Number(e.target.value))}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
              />
            </div>
          </ConfigCard>

          {/* IA */}
          <ConfigCard Icon={Sparkles} title="Asistente de IA" subtitle="Activar el asistente de IA">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={config.iaActiva}
                onChange={(e) => set('iaActiva', e.target.checked)}
                className="w-5 h-5 rounded accent-indigo-600"
              />
              <span className="text-sm text-slate-600 dark:text-slate-300">
                {config.iaActiva ? 'Activado' : 'Desactivado'}
              </span>
            </label>
          </ConfigCard>
        </div>

        {/* Guardar */}
        <div className="flex items-center justify-end gap-3 mt-6">
          {saved && <span className="text-sm font-medium text-emerald-600 dark:text-emerald-400">✓ Guardado</span>}
          <button
            onClick={save}
            className="inline-flex items-center gap-2 bg-indigo-600 text-white text-sm font-semibold px-5 py-2.5 rounded-xl hover:bg-indigo-700 transition-colors shadow-sm hover:shadow-md"
          >
            <Save className="w-4 h-4" />
            Guardar cambios
          </button>
        </div>
      </div>
    </div>
  );
};

const ConfigCard = ({ Icon, title, subtitle, children }) => (
  <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm dark:shadow-none border border-slate-100 dark:border-slate-800 p-5 transition-colors duration-300">
    <div className="flex items-center gap-3 mb-4">
      <div className="p-2 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-lg">
        <Icon className="w-5 h-5" />
      </div>
      <div>
        <h3 className="font-bold text-slate-800 dark:text-slate-100">{title}</h3>
        <p className="text-xs text-slate-500 dark:text-slate-400">{subtitle}</p>
      </div>
    </div>
    {children}
  </div>
);

const NumberField = ({ label, value, onChange }) => (
  <div>
    <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">{label}</label>
    <input
      type="number"
      min="0"
      max="20"
      step="0.5"
      value={value}
      onChange={(e) => onChange(Number(e.target.value))}
      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
    />
  </div>
);

export default AppConfigPage;
