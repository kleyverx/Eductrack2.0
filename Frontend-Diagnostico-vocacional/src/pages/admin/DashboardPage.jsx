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

const DashboardPage = () => {
  const { user } = useContext(AuthContext);

  // Fetch subjects with scores and progress
  const subjectsData = useLiveQuery(async () => {
    if (!user?.id) return [];
    
    // Get all active subjects for this user
    const subjects = await db.subjects
      .where('user').equals(user.id)
      .filter(s => !s.deleted)
      .toArray();

    // Calculate scores for each subject
    const results = await Promise.all(subjects.map(async (subject) => {
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

    return results;
  }, [user?.id]);

  // Fetch the latest vocational result
  const latestVocationalResult = useLiveQuery(async () => {
    if (!user?.id) return null;
    return await db.vocationalResults
      .where('user').equals(user.id)
      .filter(v => !v.deleted)
      .reverse()
      .sortBy('createdAt')
      .then(results => results[0]);
  }, [user?.id]);

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  const getTopArea = () => {
    if (!latestVocationalResult?.results) return null;
    const areas = Object.entries(latestVocationalResult.results);
    if (areas.length === 0) return null;
    return areas.sort(([, a], [, b]) => b - a)[0][0];
  };

  const topArea = getTopArea();

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header Section */}
        <header className="mb-10">
          <div className="flex items-center space-x-3 mb-4">
            <div className="p-2 bg-indigo-600 rounded-lg text-white">
              <LayoutDashboard className="w-6 h-6" />
            </div>
            <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Mi Panel Académico</h1>
          </div>
          
          <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-5">
              <Sparkles className="w-32 h-32 text-indigo-600" />
            </div>
            <div className="relative z-10">
              <h2 className="text-2xl font-bold text-slate-800 mb-2">
                Hola, {user.name || 'Estudiante'} 👋
              </h2>
              <p className="text-slate-600 max-w-2xl leading-relaxed">
                {topArea ? (
                  <>
                    Basado en tus pruebas, tu perfil es <span className="text-indigo-600 font-bold uppercase">{topArea}</span>. 
                    Continúa con tu excelente desempeño académico para alcanzar tus metas.
                  </>
                ) : (
                  "Bienvenido a tu panel de control. Aquí podrás ver tu progreso académico y los resultados de tu orientación vocacional."
                )}
              </p>
            </div>
          </div>
        </header>

        {/* Stats Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center space-x-4">
            <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
              <BookOpen className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500">Materias Activas</p>
              <p className="text-2xl font-bold text-slate-900">{subjectsData?.length || 0}</p>
            </div>
          </div>
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center space-x-4">
            <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
              <TrendingUp className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500">Promedio General</p>
              <p className="text-2xl font-bold text-slate-900">
                {subjectsData?.length > 0 
                  ? (subjectsData.reduce((acc, s) => acc + s.avgScore, 0) / subjectsData.length).toFixed(1)
                  : '0.0'}
              </p>
            </div>
          </div>
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center space-x-4">
            <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
              <Award className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500">Perfil Vocacional</p>
              <p className="text-lg font-bold text-slate-900 truncate max-w-[150px]">
                {topArea || 'Pendiente'}
              </p>
            </div>
          </div>
        </div>

        {/* Subjects Grid */}
        <section>
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-slate-800">Mis Materias</h3>
            <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full uppercase">
              Semáforo Académico
            </span>
          </div>

          {!subjectsData ? (
            <div className="flex flex-col items-center justify-center py-20 bg-white rounded-3xl border border-dashed border-slate-200">
              <Loader2 className="w-10 h-10 animate-spin text-slate-300 mb-4" />
              <p className="text-slate-400 font-medium">Cargando tus materias...</p>
            </div>
          ) : subjectsData.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 bg-white rounded-3xl border border-dashed border-slate-200">
              <div className="p-4 bg-slate-50 rounded-full mb-4">
                <AlertCircle className="w-10 h-10 text-slate-300" />
              </div>
              <p className="text-slate-500 font-bold text-lg mb-1">No tienes materias aún</p>
              <p className="text-slate-400 text-sm">Comienza agregando una materia para ver tu progreso.</p>
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

export default DashboardPage;
