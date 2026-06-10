import React, { useContext, useEffect, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { Link } from 'react-router-dom';
import { db } from '../../db/db';
import { AuthContext } from '../../context/AuthContext';
import { listUsers } from '../../api/user';
import { getResultById } from '../../api/results';
import RiskSemaphore from '../../components/dashboard/RiskSemaphore';
import { getScoreStyles, summarizeRisk } from '../../utils/academic';
import { getVocationalIcon } from '../../utils/vocationalIcons';
import {
  LayoutDashboard,
  BookOpen,
  TrendingUp,
  ShieldAlert,
  Users,
  Loader2,
  PlusCircle,
  GraduationCap,
} from 'lucide-react';

/**
 * Panel del Docente (Sistema de Diseño "Quiet Academic", dark mode).
 * - KPIs de SUS materias (datos locales / Dexie).
 * - Semáforo de riesgo de sus materias.
 * - Lista de estudiantes con su perfil vocacional (apoyo a la orientación).
 */
const TeacherDashboard = () => {
  const { user, token } = useContext(AuthContext);

  // Materias del docente (Dexie) con promedio.
  const subjects = useLiveQuery(async () => {
    if (!user?.id) return [];
    const list = await db.subjects.where('user').equals(user.id).filter((s) => !s.deleted).toArray();
    return Promise.all(
      list.map(async (subject) => {
        const evals = await db.evaluations.where('subject').equals(subject.id).filter((e) => !e.deleted).toArray();
        const evalIds = evals.map((e) => e.id);
        const grades = evalIds.length
          ? await db.grades.where('evaluation').anyOf(evalIds).filter((g) => !g.deleted).toArray()
          : [];
        const avgScore = grades.length ? grades.reduce((a, g) => a + g.score, 0) / grades.length : 0;
        return { ...subject, avgScore, gradeCount: grades.length };
      })
    );
  }, [user?.id]);

  // Estudiantes (backend) con su perfil vocacional.
  const [students, setStudents] = useState(null);

  useEffect(() => {
    let active = true;
    const load = async () => {
      if (!token) return;
      try {
        const list = await listUsers(token, 'estudiante');
        // Para cada estudiante, intentamos traer su área vocacional top.
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

  const list = subjects || [];
  const generalAvg = list.length ? list.reduce((a, s) => a + s.avgScore, 0) / list.length : 0;
  const avgStyles = getScoreStyles(generalAvg);
  const risk = summarizeRisk(list);

  const kpis = [
    { label: 'Mis Materias', value: list.length, Icon: BookOpen, text: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-50 dark:bg-blue-900/20' },
    { label: 'Promedio de Grupos', value: generalAvg > 0 ? generalAvg.toFixed(1) : '0.0', Icon: TrendingUp, text: list.length ? avgStyles.text : 'text-slate-500', bg: list.length ? avgStyles.bg : 'bg-slate-50 dark:bg-slate-800/50' },
    { label: 'Materias en Riesgo', value: risk.danger + risk.warning, Icon: ShieldAlert, text: (risk.danger + risk.warning) > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400', bg: (risk.danger + risk.warning) > 0 ? 'bg-rose-50 dark:bg-rose-900/20' : 'bg-emerald-50 dark:bg-emerald-900/20' },
    { label: 'Estudiantes', value: students ? students.length : '—', Icon: Users, text: 'text-violet-600 dark:text-violet-400', bg: 'bg-violet-50 dark:bg-violet-900/20' },
  ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-6 transition-colors duration-300">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <header className="mb-8">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-indigo-600 dark:bg-indigo-500 rounded-lg text-white">
                <LayoutDashboard className="w-6 h-6" />
              </div>
              <h1 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">Panel Docente</h1>
            </div>
            <Link
              to="/app/docente/secciones"
              className="inline-flex items-center gap-2 bg-indigo-600 text-white text-sm font-semibold px-4 py-2.5 rounded-xl hover:bg-indigo-700 transition-colors shadow-sm hover:shadow-md"
            >
              <PlusCircle className="w-4 h-4" />
              Mis Secciones
            </Link>
          </div>
          <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl shadow-sm dark:shadow-none border border-slate-100 dark:border-slate-800 transition-colors duration-300">
            <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-1">
              Hola, Prof. {user.name || 'Docente'} 👋
            </h2>
            <p className="text-slate-600 dark:text-slate-400 text-sm">
              Administra tus materias y acompaña a tus estudiantes según su rendimiento y vocación.
            </p>
          </div>
        </header>

        {/* KPIs */}
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

        {/* Semáforo de sus materias + Mis estudiantes */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <RiskSemaphore subjects={list} />

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
              <div className="space-y-2 max-h-[360px] overflow-y-auto pr-1">
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
    </div>
  );
};

export default TeacherDashboard;
