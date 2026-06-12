import React, { useContext, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import { listUsers } from '../../api/user';
import { getResultById } from '../../api/results';
import { resumenDocente } from '../../api/academico';
import RiskSemaphore from '../../components/dashboard/RiskSemaphore';
import { getScoreStyles } from '../../utils/academic';
import { getVocationalIcon } from '../../utils/vocationalIcons';
import {
  LayoutDashboard,
  BookOpen,
  School,
  ShieldAlert,
  Users,
  Loader2,
  PlusCircle,
  GraduationCap,
  ChevronRight,
} from 'lucide-react';

/**
 * Panel del Docente con métricas REALES del backend académico.
 * - KPIs y semáforo desde /academico/docente/resumen (por lapso).
 * - Lista de secciones con su promedio.
 * - Estudiantes con su perfil vocacional (apoyo a la orientación).
 */
const TeacherDashboard = () => {
  const { user, token } = useContext(AuthContext);
  const [lapso, setLapso] = useState(1);
  const [resumen, setResumen] = useState(null);
  const [students, setStudents] = useState(null);

  // Métricas académicas reales
  useEffect(() => {
    if (!token) return;
    setResumen(null);
    resumenDocente(token, lapso).then(setResumen).catch(() => setResumen(null));
  }, [token, lapso]);

  // Estudiantes con su perfil vocacional
  useEffect(() => {
    let active = true;
    const load = async () => {
      if (!token) return;
      try {
        const list = await listUsers(token, 'estudiante');
        const withProfile = await Promise.all(
          list.slice(0, 12).map(async (s) => {
            let topArea = null;
            try {
              const r = await getResultById(s._id, token);
              if (r?.results) {
                const entries = Object.entries(r.results);
                if (entries.length) topArea = entries.sort(([, a], [, b]) => b - a)[0][0];
              }
            } catch (_) { /* sin resultado vocacional */ }
            return { ...s, topArea };
          })
        );
        if (active) setStudents(withProfile);
      } catch (err) {
        console.error('Error al cargar estudiantes:', err);
        if (active) setStudents([]);
      }
    };
    load();
    return () => { active = false; };
  }, [token]);

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600 dark:text-indigo-400" />
      </div>
    );
  }

  const enRiesgo = resumen ? resumen.riesgo.warning + resumen.riesgo.danger : 0;

  const kpis = [
    { label: 'Mis Secciones', value: resumen?.totalSecciones ?? '—', Icon: School, text: 'text-indigo-600 dark:text-indigo-400', bg: 'bg-indigo-50 dark:bg-indigo-900/20' },
    { label: 'Estudiantes', value: resumen?.totalEstudiantes ?? '—', Icon: Users, text: 'text-violet-600 dark:text-violet-400', bg: 'bg-violet-50 dark:bg-violet-900/20' },
    { label: 'Materias', value: resumen?.totalMaterias ?? '—', Icon: BookOpen, text: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-50 dark:bg-blue-900/20' },
    { label: 'Calificaciones en Riesgo', value: resumen ? enRiesgo : '—', Icon: ShieldAlert, text: enRiesgo > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400', bg: enRiesgo > 0 ? 'bg-rose-50 dark:bg-rose-900/20' : 'bg-emerald-50 dark:bg-emerald-900/20' },
  ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-6 transition-colors duration-300">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <header className="mb-8">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-indigo-600 dark:bg-indigo-500 rounded-lg text-white">
                <LayoutDashboard className="w-6 h-6" />
              </div>
              <h1 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">Panel Docente</h1>
            </div>
            <div className="flex items-center gap-3">
              {/* Selector de lapso para las métricas */}
              <div className="flex gap-1 p-1 bg-slate-100 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
                {[1, 2, 3].map((l) => (
                  <button
                    key={l}
                    onClick={() => setLapso(l)}
                    className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors ${
                      lapso === l
                        ? 'bg-indigo-600 text-white'
                        : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                    }`}
                  >
                    {l === 1 ? '1er' : l === 2 ? '2do' : '3er'} L
                  </button>
                ))}
              </div>
              <Link
                to="/app/docente/secciones"
                className="inline-flex items-center gap-2 bg-indigo-600 text-white text-sm font-semibold px-4 py-2.5 rounded-xl hover:bg-indigo-700 transition-colors shadow-sm hover:shadow-md"
              >
                <PlusCircle className="w-4 h-4" />
                Mis Secciones
              </Link>
            </div>
          </div>
          <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl shadow-sm dark:shadow-none border border-slate-100 dark:border-slate-800 transition-colors duration-300">
            <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-1">
              Hola, Prof. {user.name || 'Docente'} 👋
            </h2>
            <p className="text-slate-600 dark:text-slate-400 text-sm">
              Administra tus secciones y acompaña a tus estudiantes según su rendimiento y vocación.
            </p>
          </div>
        </header>

        {/* KPIs reales */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {kpis.map(({ label, value, Icon, text, bg }) => (
            <div key={label} className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm dark:shadow-none border border-slate-100 dark:border-slate-800 flex items-center space-x-4 hover:shadow-md transition-all duration-300">
              <div className={`p-3 ${bg} ${text} rounded-xl flex-shrink-0`}>
                <Icon className="w-6 h-6" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{label}</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">{value}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Semáforo real + secciones */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <RiskSemaphore
            counts={resumen?.riesgo || { good: 0, warning: 0, danger: 0 }}
            unidad={['calificación', 'calificaciones']}
          />

          {/* Mis secciones con promedio */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-sm dark:shadow-none border border-slate-100 dark:border-slate-800 p-6 transition-colors duration-300">
            <div className="flex items-center gap-3 mb-5">
              <div className="p-2 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-lg">
                <School className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 dark:text-slate-100">Mis Secciones</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">Promedio del {lapso === 1 ? '1er' : lapso === 2 ? '2do' : '3er'} lapso</p>
              </div>
            </div>

            {!resumen ? (
              <div className="flex justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-slate-300 dark:text-slate-600" />
              </div>
            ) : resumen.secciones.length === 0 ? (
              <p className="text-sm text-slate-400 dark:text-slate-500 text-center py-8">
                Aún no tienes secciones. Crea la primera desde "Mis Secciones".
              </p>
            ) : (
              <div className="space-y-2">
                {resumen.secciones.map((s) => {
                  const styles = s.promedio !== null ? getScoreStyles(s.promedio) : null;
                  return (
                    <Link
                      key={s._id}
                      to={`/app/docente/secciones/${s._id}`}
                      className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group"
                    >
                      <div className="w-9 h-9 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-lg flex items-center justify-center font-black text-sm">
                        {s.anio}°
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                          {s.etiquetaAnio} — Sección {s.nombre}
                        </p>
                        <p className="text-xs text-slate-400 dark:text-slate-500">
                          {s.estudiantes} est. · {s.materias} materias
                        </p>
                      </div>
                      {s.promedio !== null ? (
                        <span className={`font-black px-2 py-1 rounded-lg text-sm ${styles.bg} ${styles.text}`}>
                          {s.promedio}
                        </span>
                      ) : (
                        <span className="text-xs text-slate-300 dark:text-slate-600">sin notas</span>
                      )}
                      <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-indigo-500 transition-colors" />
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Mis estudiantes con perfil vocacional */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-sm dark:shadow-none border border-slate-100 dark:border-slate-800 p-6 transition-colors duration-300">
          <div className="flex items-center gap-3 mb-5">
            <div className="p-2 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-lg">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 dark:text-slate-100">Mis Estudiantes</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Perfil vocacional para orientarlos</p>
            </div>
          </div>

          {students === null ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-slate-300 dark:text-slate-600" />
            </div>
          ) : students.length === 0 ? (
            <p className="text-sm text-slate-400 dark:text-slate-500 text-center py-8">
              No hay estudiantes registrados todavía.
            </p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-[320px] overflow-y-auto pr-1">
              {students.map((s) => {
                const { Icon, text, bg, bgDark } = getVocationalIcon(s.topArea || '');
                return (
                  <div key={s._id} className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                    <div className={`${bg} ${bgDark} ${text} p-2 rounded-lg flex-shrink-0`}>
                      {s.topArea ? <Icon className="w-4 h-4" /> : <GraduationCap className="w-4 h-4" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-slate-700 dark:text-slate-200 truncate">
                        {s.name} {s.apellido || ''}
                      </p>
                      <p className="text-xs text-slate-400 dark:text-slate-500 truncate">
                        {s.topArea || 'Sin test vocacional'}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TeacherDashboard;
