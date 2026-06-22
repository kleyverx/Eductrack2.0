import React, { useContext, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import SubjectCard from '../../components/SubjectCard';
import VocationalBanner from '../../components/dashboard/VocationalBanner';
import RiskSemaphore from '../../components/dashboard/RiskSemaphore';
import EvolutionChart from '../../components/dashboard/EvolutionChart';
import { getScoreStyles, scoreToProgress, summarizeRisk } from '../../utils/academic';
import { misMaterias } from '../../api/academico';
import { getUserResult } from '../../api/results';
import {
  LayoutDashboard,
  BookOpen,
  TrendingUp,
  Award,
  ShieldAlert,
  Loader2,
  GraduationCap,
} from 'lucide-react';

const LAPSO_LABEL = { 1: '1er Lapso', 2: '2do Lapso', 3: '3er Lapso' };

/**
 * Panel Académico del Estudiante (Quiet Academic, dark mode).
 * Métricas REALES del backend: materias y notas de sus secciones (por lapso)
 * y su perfil vocacional desde el servidor.
 */
const DashboardPage = () => {
  const { user, token } = useContext(AuthContext);
  const navigate = useNavigate();
  const [secciones, setSecciones] = useState(null); // respuesta de misMaterias
  const [topArea, setTopArea] = useState(null);

  // Materias y notas reales
  useEffect(() => {
    if (!token) return;
    misMaterias(token).then(setSecciones).catch(() => setSecciones([]));
  }, [token]);

  // Perfil vocacional (servidor)
  useEffect(() => {
    if (!token) return;
    getUserResult(token)
      .then((r) => {
        if (!r?.results) return;
        const entries = Object.entries(r.results);
        if (entries.length) setTopArea(entries.sort(([, a], [, b]) => b - a)[0][0]);
      })
      .catch(() => { /* aún no presenta el test */ });
  }, [token]);

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600 dark:text-indigo-400" />
      </div>
    );
  }

  const loading = secciones === null;

  // Aplanar materias de todas las secciones con su promedio actual
  // (promedio de los lapsos que ya tienen acumulado).
  const materias = (secciones || []).flatMap((grupo) =>
    grupo.materias.map((m) => {
      const valores = [1, 2, 3].map((l) => m.lapsos[l]?.acumulado).filter((v) => v !== null && v !== undefined);
      const avgScore = valores.length ? valores.reduce((s, v) => s + v, 0) / valores.length : null;
      return {
        id: m._id,
        nombre: m.nombre,
        area: `${grupo.seccion.etiquetaAnio} "${grupo.seccion.nombre}"`,
        avgScore,
      };
    })
  );
  const conNotas = materias.filter((m) => m.avgScore !== null);

  // Evolución: promedio del estudiante en cada lapso (across materias).
  const evolutionData = [1, 2, 3]
    .map((l) => {
      const vals = (secciones || [])
        .flatMap((g) => g.materias.map((m) => m.lapsos[l]?.acumulado))
        .filter((v) => v !== null && v !== undefined);
      return vals.length
        ? { label: LAPSO_LABEL[l], avg: +(vals.reduce((s, v) => s + v, 0) / vals.length).toFixed(1) }
        : null;
    })
    .filter(Boolean);

  // KPIs
  const generalAvg = conNotas.length
    ? conNotas.reduce((s, m) => s + m.avgScore, 0) / conNotas.length
    : 0;
  const avgStyles = getScoreStyles(generalAvg);
  const risk = summarizeRisk(conNotas);
  const atRisk = risk.danger + risk.warning;

  const kpis = [
    {
      label: 'Materias Activas',
      value: materias.length,
      Icon: BookOpen,
      text: 'text-blue-600 dark:text-blue-400',
      bg: 'bg-blue-50 dark:bg-blue-900/20',
    },
    {
      label: 'Promedio General',
      value: conNotas.length ? generalAvg.toFixed(1) : '—',
      Icon: TrendingUp,
      text: conNotas.length ? avgStyles.text : 'text-slate-500',
      bg: conNotas.length ? avgStyles.bg : 'bg-slate-50 dark:bg-slate-800/50',
    },
    {
      label: 'Materias en Riesgo',
      value: atRisk,
      Icon: ShieldAlert,
      text: atRisk > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400',
      bg: atRisk > 0 ? 'bg-rose-50 dark:bg-rose-900/20' : 'bg-emerald-50 dark:bg-emerald-900/20',
    },
    {
      label: 'Perfil Vocacional',
      value: topArea || 'Pendiente',
      Icon: Award,
      text: 'text-amber-600 dark:text-amber-400',
      bg: 'bg-amber-50 dark:bg-amber-900/20',
      truncate: true,
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-6 transition-colors duration-300">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <header className="mb-8">
          <div className="flex items-center space-x-3 mb-5">
            <div className="p-2 bg-indigo-600 dark:bg-indigo-500 rounded-lg text-white shadow-sm dark:shadow-none">
              <LayoutDashboard className="w-6 h-6" />
            </div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">Mi Panel Académico</h1>
          </div>

          <VocationalBanner userName={user.name} topArea={topArea} />
        </header>

        {/* Fila de KPIs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {kpis.map(({ label, value, Icon, text, bg, truncate }) => (
            <div
              key={label}
              className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm dark:shadow-none border border-slate-100 dark:border-slate-800 flex items-center space-x-4 hover:shadow-md transition-all duration-300"
            >
              <div className={`p-3 ${bg} ${text} rounded-xl flex-shrink-0`}>
                <Icon className="w-6 h-6" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{label}</p>
                <p
                  className={`font-bold text-slate-900 dark:text-slate-100 ${
                    truncate ? 'text-lg truncate max-w-[150px]' : 'text-2xl'
                  }`}
                >
                  {value}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Semáforo + Evolución por lapso */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <RiskSemaphore subjects={conNotas} />
          <EvolutionChart data={evolutionData} />
        </div>

        {/* Grid de materias */}
        <section>
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100">Mis Materias</h3>
            <Link
              to="/app/subjects"
              className="text-xs font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/30 px-3 py-1 rounded-full uppercase tracking-wider hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-colors"
            >
              Ver detalle por lapso
            </Link>
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 bg-white dark:bg-slate-900 rounded-3xl border border-dashed border-slate-200 dark:border-slate-800 transition-colors duration-300">
              <Loader2 className="w-10 h-10 animate-spin text-slate-300 dark:text-slate-600 mb-4" />
              <p className="text-slate-400 dark:text-slate-500 font-medium">Cargando tus materias...</p>
            </div>
          ) : materias.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 bg-white dark:bg-slate-900 rounded-3xl border border-dashed border-slate-200 dark:border-slate-800 text-center px-6 transition-colors duration-300">
              <div className="p-5 bg-indigo-50 dark:bg-indigo-900/30 rounded-3xl mb-5">
                <GraduationCap className="w-12 h-12 text-indigo-500 dark:text-indigo-400" />
              </div>
              <p className="text-slate-700 dark:text-slate-200 font-bold text-lg mb-1">Aún no estás inscrito en una sección</p>
              <p className="text-slate-400 dark:text-slate-500 text-sm max-w-sm">
                Cuando tu profesor te asigne a su sección, aquí verás tus materias,
                tus notas por lapso y tu progreso académico.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {materias.map((m) => (
                <SubjectCard
                  key={m.id}
                  name={m.nombre}
                  area={m.area}
                  score={m.avgScore ?? 0}
                  progress={m.avgScore !== null ? scoreToProgress(m.avgScore) : 0}
                  onClick={() => navigate(`/app/subjects?materia=${m.id}`)}
                />
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

export default DashboardPage;
