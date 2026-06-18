import React, { useEffect, useState, useContext, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { getResultById, regenerarAnalisis } from '../api/results';
import { getUser } from '../api/user';
import { AuthContext } from '../context/AuthContext';
import { ThemeContext } from '../context/ThemeContext';
import { exportToPDF } from '../utils/exportToPDF';
import { getVocationalIcon } from '../utils/vocationalIcons';
import {
  FileDown, BarChart3, Loader2, AlertCircle, TrendingUp,
  Sparkles, Target, CheckCircle2, GraduationCap, ArrowRight, RefreshCw, MessageSquare,
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LabelList, Cell,
} from 'recharts';

/**
 * Página de Resultados del Test Vocacional (Sistema de Diseño "Quiet Academic").
 * Muestra el perfil, gráfico de áreas y el análisis con IA orientado a la
 * toma de decisiones (resumen, fortalezas, carreras sugeridas, próximos pasos).
 */
const ResultsPage = () => {
  const { token, user } = useContext(AuthContext);
  const { theme } = useContext(ThemeContext);
  const dark = theme === 'dark';
  const { id } = useParams();
  const [loading, setLoading] = useState(true);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [userData, setUserData] = useState({});
  const [regenerando, setRegenerando] = useState(false);
  const chartRef = useRef();

  useEffect(() => {
    const fetch = async () => {
      if (!token || !id) return;
      try {
        setLoading(true);
        const fetchedResult = await getResultById(id, token);
        const u = await getUser(token);
        setResult(fetchedResult);
        setUserData(u);
      } catch (err) {
        setError('No se pudo obtener el resultado');
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [token, id]);

  const handleRegenerar = async () => {
    setRegenerando(true);
    try {
      const r = await regenerarAnalisis(id, token);
      setResult(r.result);
    } catch (err) {
      alert(err.message);
    } finally {
      setRegenerando(false);
    }
  };

  // Abre el chatbot flotante con una pregunta sobre la vocación.
  const consultarIA = () => {
    window.dispatchEvent(new CustomEvent('edutrack:abrir-chat', {
      detail: { mensaje: `Según mi test vocacional, mi área destacada es ${topArea}. ¿Qué me recomiendas para decidir mi carrera?` },
    }));
  };

  const Estado = ({ Icon, titulo, texto, tono = 'indigo' }) => {
    const tonos = {
      indigo: 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400',
      rose: 'bg-rose-50 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400',
      slate: 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400',
    };
    return (
      <div className="min-h-[60vh] flex items-center justify-center p-4">
        <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-sm dark:shadow-none border border-slate-100 dark:border-slate-800 p-12 text-center max-w-md">
          <div className={`w-16 h-16 ${tonos[tono]} rounded-2xl flex items-center justify-center mx-auto mb-5`}>
            <Icon className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-2">{titulo}</h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm">{texto}</p>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600 dark:text-indigo-400" />
      </div>
    );
  }
  if (error) return <div className="min-h-screen bg-slate-50 dark:bg-slate-950"><Estado Icon={AlertCircle} tono="rose" titulo="Error" texto={error} /></div>;
  if (!result) return <div className="min-h-screen bg-slate-50 dark:bg-slate-950"><Estado Icon={BarChart3} tono="slate" titulo="Sin Resultados" texto="No se encontró ningún resultado disponible." /></div>;

  // Normalizar resultados (Map o objeto)
  const scores = result.results || {};
  const entradas = Object.entries(scores);
  const chartData = entradas.map(([area, score]) => ({
    area: area.length > 12 ? area.substring(0, 12) + '…' : area,
    fullArea: area,
    score,
  }));
  const ordenadas = [...entradas].sort(([, a], [, b]) => b - a);
  const topAreas = ordenadas.slice(0, 3);
  const topArea = topAreas[0]?.[0] || '';
  const averageScore = entradas.length ? entradas.reduce((s, [, v]) => s + v, 0) / entradas.length : 0;
  const maxScore = Math.max(...entradas.map(([, v]) => v), 1);

  const analisis = result.analisis || {};
  const tieneAnalisis = analisis.carreras?.length || analisis.fortalezas?.length || analisis.pasos?.length;
  const { Icon: AreaIcon, text: areaText, bg: areaBg, bgDark: areaBgDark } = getVocationalIcon(topArea);

  const medallas = [
    { bg: 'bg-amber-50 dark:bg-amber-900/20', text: 'text-amber-600 dark:text-amber-400', bar: 'bg-amber-500' },
    { bg: 'bg-slate-100 dark:bg-slate-800', text: 'text-slate-600 dark:text-slate-300', bar: 'bg-slate-400' },
    { bg: 'bg-orange-50 dark:bg-orange-900/20', text: 'text-orange-600 dark:text-orange-400', bar: 'bg-orange-500' },
  ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-6 transition-colors duration-300">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-8">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-600 dark:bg-indigo-500 rounded-lg text-white">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">Orientación Vocacional</h1>
              <p className="text-sm text-slate-500 dark:text-slate-400">Tu perfil personalizado y recomendaciones</p>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={consultarIA}
              className="inline-flex items-center gap-2 text-sm font-semibold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/30 px-4 py-2.5 rounded-xl hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-colors"
            >
              <MessageSquare className="w-4 h-4" /> Pregúntale a la IA
            </button>
            <button
              onClick={() => exportToPDF(result, userData, chartRef)}
              className="inline-flex items-center gap-2 bg-indigo-600 text-white text-sm font-semibold px-4 py-2.5 rounded-xl hover:bg-indigo-700 transition-colors shadow-sm"
            >
              <FileDown className="w-4 h-4" /> Exportar PDF
            </button>
          </div>
        </div>

        {/* Banner del perfil */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-sm dark:shadow-none border border-slate-100 dark:border-slate-800 p-8 mb-6 relative overflow-hidden transition-colors duration-300">
          <div className="absolute top-0 right-0 p-2 opacity-[0.06] dark:opacity-[0.1]">
            <AreaIcon className="w-44 h-44 text-slate-900 dark:text-white" />
          </div>
          <div className="relative z-10 grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
            <div className="md:col-span-1">
              <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">Estudiante</p>
              <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">
                {userData.name} {userData.apellido || ''}
              </h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">C.I. {userData.cedula}</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="p-3 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 rounded-xl">
                <TrendingUp className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm text-slate-500 dark:text-slate-400">Promedio General</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">{averageScore.toFixed(1)}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className={`p-3 rounded-xl ${areaBg} ${areaBgDark} ${areaText}`}>
                <AreaIcon className="w-6 h-6" />
              </div>
              <div className="min-w-0">
                <p className="text-sm text-slate-500 dark:text-slate-400">Área Destacada</p>
                <p className="text-base font-bold text-slate-900 dark:text-slate-100 leading-tight">{topArea}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Top 3 áreas */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-6">
          {topAreas.map(([area, score], i) => (
            <div key={area} className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm dark:shadow-none border border-slate-100 dark:border-slate-800 p-5">
              <div className="flex items-center justify-between mb-3">
                <span className={`w-9 h-9 rounded-xl flex items-center justify-center font-black text-sm ${medallas[i].bg} ${medallas[i].text}`}>
                  #{i + 1}
                </span>
                <span className={`text-2xl font-black ${medallas[i].text}`}>{score}</span>
              </div>
              <h3 className="font-semibold text-slate-800 dark:text-slate-100 text-sm leading-tight mb-3">{area}</h3>
              <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden">
                <div className={`h-full rounded-full ${medallas[i].bar}`} style={{ width: `${(score / maxScore) * 100}%` }} />
              </div>
            </div>
          ))}
        </div>

        {/* Gráfico de áreas */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-sm dark:shadow-none border border-slate-100 dark:border-slate-800 overflow-hidden mb-6 transition-colors duration-300">
          <div className="flex items-center gap-3 p-6 border-b border-slate-100 dark:border-slate-800">
            <div className="p-2 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-lg">
              <BarChart3 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 dark:text-slate-100">Áreas de Interés</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Puntuación por categoría vocacional</p>
            </div>
          </div>
          <div ref={chartRef} className="p-6">
            <ResponsiveContainer width="100%" height={360}>
              <BarChart data={chartData} margin={{ top: 20, right: 16, left: 0, bottom: 70 }}>
                <defs>
                  <linearGradient id="barTop" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#6366f1" />
                    <stop offset="100%" stopColor="#4f46e5" />
                  </linearGradient>
                  <linearGradient id="barNormal" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={dark ? '#475569' : '#c7d2fe'} />
                    <stop offset="100%" stopColor={dark ? '#334155' : '#a5b4fc'} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={dark ? '#1e293b' : '#f1f5f9'} vertical={false} />
                <XAxis dataKey="area" angle={-40} textAnchor="end" interval={0} tick={{ fontSize: 10, fill: dark ? '#64748b' : '#94a3b8' }} height={90} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 12, fill: dark ? '#64748b' : '#94a3b8' }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: dark ? '#0f172a' : '#ffffff',
                    border: `1px solid ${dark ? '#334155' : '#e2e8f0'}`,
                    borderRadius: '12px',
                    fontSize: '12px',
                    boxShadow: '0 4px 12px -2px rgba(0,0,0,0.12)',
                  }}
                  itemStyle={{ color: dark ? '#e2e8f0' : '#334155' }}
                  labelStyle={{ color: dark ? '#94a3b8' : '#64748b' }}
                  formatter={(value, name, props) => [value, props.payload.fullArea]}
                  cursor={{ fill: dark ? 'rgba(99,102,241,0.12)' : 'rgba(99,102,241,0.07)' }}
                />
                <Bar dataKey="score" radius={[6, 6, 0, 0]} maxBarSize={48}>
                  {chartData.map((d) => (
                    <Cell key={d.fullArea} fill={d.fullArea === topArea ? 'url(#barTop)' : 'url(#barNormal)'} />
                  ))}
                  <LabelList dataKey="score" position="top" style={{ fill: dark ? '#94a3b8' : '#64748b', fontSize: '11px', fontWeight: 'bold' }} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Análisis con IA */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-sm dark:shadow-none border border-slate-100 dark:border-slate-800 overflow-hidden transition-colors duration-300">
          <div className="flex items-center justify-between gap-3 p-6 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-lg">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 dark:text-slate-100">Análisis y Recomendaciones</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">Generado con inteligencia artificial</p>
              </div>
            </div>
            <button
              onClick={handleRegenerar}
              disabled={regenerando}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800 px-3 py-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors disabled:opacity-60"
              title="Volver a generar el análisis con IA"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${regenerando ? 'animate-spin' : ''}`} />
              {regenerando ? 'Generando...' : 'Regenerar'}
            </button>
          </div>

          <div className="p-6 space-y-6">
            {/* Resumen */}
            <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
              {analisis.resumen || result.interpretation}
            </p>

            {tieneAnalisis ? (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                {/* Fortalezas */}
                {analisis.fortalezas?.length > 0 && (
                  <div className="bg-slate-50/60 dark:bg-slate-800/40 rounded-2xl p-5">
                    <div className="flex items-center gap-2 mb-3 text-emerald-600 dark:text-emerald-400">
                      <CheckCircle2 className="w-4 h-4" />
                      <h4 className="font-bold text-sm uppercase tracking-wider">Fortalezas</h4>
                    </div>
                    <ul className="space-y-2">
                      {analisis.fortalezas.map((f, i) => (
                        <li key={i} className="text-sm text-slate-600 dark:text-slate-300 flex gap-2">
                          <span className="text-emerald-500 mt-0.5">•</span> {f}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {/* Carreras */}
                {analisis.carreras?.length > 0 && (
                  <div className="bg-indigo-50/60 dark:bg-indigo-900/20 rounded-2xl p-5">
                    <div className="flex items-center gap-2 mb-3 text-indigo-600 dark:text-indigo-400">
                      <GraduationCap className="w-4 h-4" />
                      <h4 className="font-bold text-sm uppercase tracking-wider">Carreras Sugeridas</h4>
                    </div>
                    <ul className="space-y-2">
                      {analisis.carreras.map((c, i) => (
                        <li key={i} className="text-sm text-slate-700 dark:text-slate-200 flex gap-2 font-medium">
                          <Target className="w-3.5 h-3.5 text-indigo-500 mt-0.5 flex-shrink-0" /> {c}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {/* Próximos pasos */}
                {analisis.pasos?.length > 0 && (
                  <div className="bg-amber-50/60 dark:bg-amber-900/20 rounded-2xl p-5">
                    <div className="flex items-center gap-2 mb-3 text-amber-600 dark:text-amber-400">
                      <ArrowRight className="w-4 h-4" />
                      <h4 className="font-bold text-sm uppercase tracking-wider">Próximos Pasos</h4>
                    </div>
                    <ol className="space-y-2">
                      {analisis.pasos.map((p, i) => (
                        <li key={i} className="text-sm text-slate-600 dark:text-slate-300 flex gap-2">
                          <span className="font-bold text-amber-600 dark:text-amber-400">{i + 1}.</span> {p}
                        </li>
                      ))}
                    </ol>
                  </div>
                )}
              </div>
            ) : (
              // Resultado antiguo sin análisis estructurado: invitar a generarlo
              (user?.role !== 'estudiante' || String(result.user) === String(user?.id)) && (
                <div className="flex items-center gap-3 bg-indigo-50 dark:bg-indigo-900/20 rounded-2xl p-4">
                  <Sparkles className="w-5 h-5 text-indigo-600 dark:text-indigo-400 flex-shrink-0" />
                  <p className="text-sm text-slate-600 dark:text-slate-300 flex-1">
                    Genera carreras sugeridas y próximos pasos con IA para este perfil.
                  </p>
                  <button
                    onClick={handleRegenerar}
                    disabled={regenerando}
                    className="inline-flex items-center gap-1.5 text-sm font-semibold text-white bg-indigo-600 px-4 py-2 rounded-xl hover:bg-indigo-700 transition-colors disabled:opacity-60"
                  >
                    {regenerando ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                    Generar análisis
                  </button>
                </div>
              )
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResultsPage;
