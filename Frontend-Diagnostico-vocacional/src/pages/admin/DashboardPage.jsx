import React, { useContext } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { Link } from 'react-router-dom';
import { db } from '../../db/db';
import { AuthContext } from '../../context/AuthContext';
import SubjectCard from '../../components/SubjectCard';
import VocationalBanner from '../../components/dashboard/VocationalBanner';
import RiskSemaphore from '../../components/dashboard/RiskSemaphore';
import EvolutionChart from '../../components/dashboard/EvolutionChart';
import { getScoreStyles, scoreToProgress, summarizeRisk } from '../../utils/academic';
import { seedLocalData, clearLocalData } from '../../db/seedLocal';
import {
  LayoutDashboard,
  BookOpen,
  TrendingUp,
  Award,
  ShieldAlert,
  Loader2,
  PlusCircle,
  Database,
  Trash2,
} from 'lucide-react';

/**
 * Panel Académico del Estudiante (Sistema de Diseño "Quiet Academic").
 * Lee datos locales (Dexie / offline-first) y los presenta de forma intuitiva:
 * banner vocacional, KPIs, semáforo de riesgo, evolución y grid de materias.
 * Compatible con Modo Oscuro.
 */
const DashboardPage = () => {
  const { user } = useContext(AuthContext);

  // Materias con su promedio y progreso calculados desde IndexedDB.
  const subjectsData = useLiveQuery(async () => {
    if (!user?.id) return [];

    const subjects = await db.subjects
      .where('user').equals(user.id)
      .filter((s) => !s.deleted)
      .toArray();

    return Promise.all(
      subjects.map(async (subject) => {
        const evaluations = await db.evaluations
          .where('subject').equals(subject.id)
          .filter((e) => !e.deleted)
          .toArray();

        const evalIds = evaluations.map((e) => e.id);
        const grades = await db.grades
          .where('evaluation').anyOf(evalIds)
          .filter((g) => g.user === user.id && !g.deleted)
          .toArray();

        const avgScore = grades.length > 0
          ? grades.reduce((acc, g) => acc + g.score, 0) / grades.length
          : 0;

        return { ...subject, avgScore, progress: scoreToProgress(avgScore) };
      })
    );
  }, [user?.id]);

  // Serie temporal de evolución del promedio (todas las notas ordenadas por fecha).
  const evolutionData = useLiveQuery(async () => {
    if (!user?.id) return [];

    const grades = await db.grades
      .where('user').equals(user.id)
      .filter((g) => !g.deleted)
      .toArray();

    const sorted = grades
      .filter((g) => typeof g.score === 'number')
      .sort((a, b) => (a.lastModified || 0) - (b.lastModified || 0));

    // Promedio acumulado tras cada nota registrada → muestra la trayectoria.
    let sum = 0;
    return sorted.map((g, i) => {
      sum += g.score;
      return { label: `N${i + 1}`, avg: +(sum / (i + 1)).toFixed(1) };
    });
  }, [user?.id]);

  // Último resultado vocacional guardado localmente.
  const latestVocationalResult = useLiveQuery(async () => {
    if (!user?.id) return null;
    const results = await db.vocationalResults
      .where('user').equals(user.id)
      .filter((v) => !v.deleted)
      .reverse()
      .sortBy('createdAt');
    return results[0] || null;
  }, [user?.id]);

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600 dark:text-indigo-400" />
      </div>
    );
  }

  const getTopArea = () => {
    if (!latestVocationalResult?.results) return null;
    const areas = Object.entries(latestVocationalResult.results);
    return areas.length > 0 ? areas.sort(([, a], [, b]) => b - a)[0][0] : null;
  };

  const topArea = getTopArea();
  const subjects = subjectsData || [];
  const loadingSubjects = subjectsData === undefined;
  const hasSubjects = subjects.length > 0;

  // --- Sembrador de datos de prueba (solo desarrollo) ---
  const isDev = process.env.NODE_ENV !== 'production';

  const handleSeed = async () => {
    try {
      await seedLocalData(user.id);
    } catch (err) {
      console.error('No se pudieron cargar los datos de prueba:', err);
    }
  };

  const handleClear = async () => {
    try {
      await clearLocalData();
    } catch (err) {
      console.error('No se pudieron limpiar los datos de prueba:', err);
    }
  };

  // Métricas derivadas.
  const generalAvg = subjects.length > 0
    ? subjects.reduce((acc, s) => acc + s.avgScore, 0) / subjects.length
    : 0;
  const avgStyles = getScoreStyles(generalAvg);
  const risk = summarizeRisk(subjects);
  const atRisk = risk.danger + risk.warning;

  const kpis = [
    {
      label: 'Materias Activas',
      value: subjects.length,
      Icon: BookOpen,
      text: 'text-blue-600 dark:text-blue-400',
      bg: 'bg-blue-50 dark:bg-blue-900/20',
    },
    {
      label: 'Promedio General',
      value: generalAvg > 0 ? generalAvg.toFixed(1) : '0.0',
      Icon: TrendingUp,
      text: subjects.length > 0 ? avgStyles.text : 'text-slate-500',
      bg: subjects.length > 0 ? avgStyles.bg : 'bg-slate-50 dark:bg-slate-800/50',
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
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-indigo-600 dark:bg-indigo-500 rounded-lg text-white shadow-sm dark:shadow-none">
                <LayoutDashboard className="w-6 h-6" />
              </div>
              <h1 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">Mi Panel Académico</h1>
            </div>

            {/* Herramienta de desarrollo: cargar / limpiar datos de prueba */}
            {isDev && (
              <div className="flex items-center gap-2">
                {hasSubjects ? (
                  <button
                    onClick={handleClear}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 px-3 py-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-rose-600 dark:hover:text-rose-400 transition-colors"
                    title="Borrar los datos de prueba locales"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Limpiar demo
                  </button>
                ) : (
                  <button
                    onClick={handleSeed}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/30 border border-indigo-100 dark:border-indigo-800 px-3 py-2 rounded-lg hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-colors"
                    title="Cargar materias y notas de ejemplo en este navegador"
                  >
                    <Database className="w-3.5 h-3.5" />
                    Cargar datos de prueba
                  </button>
                )}
              </div>
            )}
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

        {/* Semáforo + Evolución */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <RiskSemaphore subjects={subjects} />
          <EvolutionChart data={evolutionData || []} />
        </div>

        {/* Grid de materias */}
        <section>
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100">Mis Materias</h3>
            <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/30 px-3 py-1 rounded-full uppercase tracking-wider">
              Semáforo Académico
            </span>
          </div>

          {loadingSubjects ? (
            <div className="flex flex-col items-center justify-center py-20 bg-white dark:bg-slate-900 rounded-3xl border border-dashed border-slate-200 dark:border-slate-800 transition-colors duration-300">
              <Loader2 className="w-10 h-10 animate-spin text-slate-300 dark:text-slate-600 mb-4" />
              <p className="text-slate-400 dark:text-slate-500 font-medium">Cargando tus materias...</p>
            </div>
          ) : subjects.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 bg-white dark:bg-slate-900 rounded-3xl border border-dashed border-slate-200 dark:border-slate-800 text-center px-6 transition-colors duration-300">
              {/* Estado vacío con ilustración por iconos */}
              <div className="relative mb-5">
                <div className="p-5 bg-indigo-50 dark:bg-indigo-900/30 rounded-3xl">
                  <BookOpen className="w-12 h-12 text-indigo-500 dark:text-indigo-400" />
                </div>
                <div className="absolute -bottom-1 -right-1 p-1.5 bg-white dark:bg-slate-800 rounded-full shadow-sm border border-slate-100 dark:border-slate-700">
                  <PlusCircle className="w-5 h-5 text-emerald-500" />
                </div>
              </div>
              <p className="text-slate-700 dark:text-slate-200 font-bold text-lg mb-1">Comienza tu seguimiento</p>
              <p className="text-slate-400 dark:text-slate-500 text-sm max-w-sm mb-6">
                Aún no tienes materias registradas. Agrega tu primera materia para empezar a
                visualizar tu progreso y rendimiento.
              </p>
              <Link
                to="/subjects"
                className="inline-flex items-center gap-2 bg-indigo-600 text-white text-sm font-semibold px-5 py-2.5 rounded-xl hover:bg-indigo-700 transition-colors shadow-sm hover:shadow-md"
              >
                <PlusCircle className="w-4 h-4" />
                Agregar materia
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {subjects.map((subject) => (
                <SubjectCard
                  key={subject.id}
                  name={subject.name}
                  area={subject.area}
                  score={subject.avgScore}
                  progress={subject.progress}
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
