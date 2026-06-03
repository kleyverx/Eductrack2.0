import React, { useContext } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db/db';
import { AuthContext } from '../../context/AuthContext';
import SubjectCard from '../../components/SubjectCard';
import { 
  LayoutDashboard, 
  Sparkles, 
  BookOpen, 
  TrendingUp, 
  Award,
  AlertCircle,
  Loader2
} from 'lucide-react';

/**
 * DashboardPage - Panel principal unificado (Vocacional + Académico)
 * Versión estable con Tailwind CSS y soporte de Modo Oscuro.
 */
const DashboardPage = () => {
  const { user } = useContext(AuthContext);

  // Consulta reactiva de materias y notas desde Dexie
  const subjectsData = useLiveQuery(async () => {
    if (!user?.id) return [];
    
    const subjects = await db.subjects
      .where('user').equals(user.id)
      .filter(s => !s.deleted)
      .toArray();

    return await Promise.all(subjects.map(async (subject) => {
      const evaluations = await db.evaluations
        .where('subject').equals(subject.id)
        .filter(e => !e.deleted)
        .toArray();
      
      const evalIds = evaluations.map(e => e.id);
      const grades = await db.grades
        .where('evaluation').anyOf(evalIds)
        .filter(g => g.user === user.id && !g.deleted)
        .toArray();

      const avgScore = grades.length > 0 
        ? grades.reduce((acc, g) => acc + g.score, 0) / grades.length 
        : 0;

      return {
        ...subject,
        avgScore,
        progress: Math.min(Math.round((avgScore / 20) * 100), 100)
      };
    }));
  }, [user?.id]);

  // Consulta del resultado vocacional más reciente
  const latestVocationalResult = useLiveQuery(async () => {
    if (!user?.id) return null;
    return await db.vocationalResults
      .where('user').equals(user.id)
      .reverse()
      .sortBy('createdAt')
      .then(results => results[0]);
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

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-6 transition-colors duration-300">
      <div className="max-w-7xl mx-auto">
        <header className="mb-10">
          <div className="flex items-center space-x-3 mb-4">
            <div className="p-2 bg-indigo-600 dark:bg-indigo-500 rounded-lg text-white shadow-sm dark:shadow-none">
              <LayoutDashboard className="w-6 h-6" />
            </div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">Mi Panel Académico</h1>
          </div>
          
          <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl shadow-sm dark:shadow-none border border-slate-100 dark:border-slate-800 relative overflow-hidden transition-colors duration-300">
            <div className="absolute top-0 right-0 p-4 opacity-5 dark:opacity-10">
              <Sparkles className="w-32 h-32 text-indigo-600 dark:text-indigo-400" />
            </div>
            <div className="relative z-10">
              <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100 mb-2">
                Hola, {user.name || 'Estudiante'} 👋
              </h2>
              <p className="text-slate-600 dark:text-slate-400 max-w-2xl leading-relaxed">
                {topArea ? (
                  <>
                    Basado en tus pruebas, tu perfil es <span className="text-indigo-600 dark:text-indigo-400 font-bold uppercase">{topArea}</span>. 
                    Continúa con tu excelente desempeño académico para alcanzar tus metas.
                  </>
                ) : (
                  "Bienvenido a tu panel de control. Aquí podrás ver tu progreso académico y los resultados de tu orientación vocacional."
                )}
              </p>
            </div>
          </div>
        </header>

        {/* Resumen de estadísticas */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          <StatCard 
            icon={<BookOpen className="w-6 h-6" />} 
            label="Materias Activas" 
            value={subjectsData?.length || 0} 
            color="blue" 
          />
          <StatCard 
            icon={<TrendingUp className="w-6 h-6" />} 
            label="Promedio General" 
            value={subjectsData?.length > 0 ? (subjectsData.reduce((acc, s) => acc + s.avgScore, 0) / subjectsData.length).toFixed(1) : '0.0'} 
            color="emerald" 
          />
          <StatCard 
            icon={<Award className="w-6 h-6" />} 
            label="Perfil Vocacional" 
            value={topArea || 'Pendiente'} 
            color="amber" 
          />
        </div>

        {/* Listado de materias */}
        <section>
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100">Mis Materias</h3>
            <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/30 px-3 py-1 rounded-full uppercase">
              Semáforo Académico
            </span>
          </div>

          {!subjectsData ? (
            <div className="flex flex-col items-center justify-center py-20 bg-white dark:bg-slate-900 rounded-3xl border border-dashed border-slate-200 dark:border-slate-800 transition-colors duration-300">
              <Loader2 className="w-10 h-10 animate-spin text-slate-300 dark:text-slate-600 mb-4" />
              <p className="text-slate-400 dark:text-slate-500 font-medium">Cargando tus materias...</p>
            </div>
          ) : subjectsData.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 bg-white dark:bg-slate-900 rounded-3xl border border-dashed border-slate-200 dark:border-slate-800 transition-colors duration-300">
              <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-full mb-4">
                <AlertCircle className="w-10 h-10 text-slate-300 dark:text-slate-600" />
              </div>
              <p className="text-slate-500 dark:text-slate-400 font-bold text-lg mb-1">No tienes materias aún</p>
              <p className="text-slate-400 dark:text-slate-500 text-sm">Comienza agregando una materia para ver tu progreso.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {subjectsData.map(subject => (
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

// Componente interno para las tarjetas de estadísticas
const StatCard = ({ icon, label, value, color }) => {
  const colorMap = {
    blue: 'bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400',
    emerald: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400',
    amber: 'bg-amber-50 text-amber-600 dark:bg-amber-900/20 dark:text-amber-400'
  };
  return (
    <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm dark:shadow-none border border-slate-100 dark:border-slate-800 flex items-center space-x-4 transition-colors duration-300">
      <div className={`p-3 rounded-xl ${colorMap[color]}`}>{icon}</div>
      <div>
        <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{label}</p>
        <p className="text-xl font-bold text-slate-900 dark:text-slate-100 truncate max-w-[150px]">{value}</p>
      </div>
    </div>
  );
};

export default DashboardPage;
