import React, { useContext, useEffect, useState, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import { getSeccion } from '../../api/academico';
import { getResumen } from '../../api/asistencia';
import EmitirConstanciaModal from '../../components/EmitirConstanciaModal';
import {
  ArrowLeft,
  Loader2,
  GraduationCap,
  FileText,
  CalendarCheck,
  Award,
  Stamp,
  Users,
  BookOpen,
} from 'lucide-react';

/**
 * Reportes de una sección para el SUPER ADMIN (solo lectura).
 * Reúne las mismas herramientas que el docente ve por sección —preinforme,
 * asistencia y constancias/certificación— pero sin edición: el super admin
 * consulta y emite documentos de cualquier sección del plantel.
 */
const AdminSeccionReportePage = () => {
  const { id } = useParams();
  const { token } = useContext(AuthContext);
  const [data, setData] = useState(null); // null = cargando
  const [inasistencia, setInasistencia] = useState({});
  const [constanciaEst, setConstanciaEst] = useState(null);
  const [constanciaSeccion, setConstanciaSeccion] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    try {
      setData(await getSeccion(token, id));
      getResumen(token, id)
        .then((r) => {
          const m = {};
          (r.estudiantes || []).forEach((e) => {
            m[e._id] = { pct: e.pct, nivel: e.nivel, dias: e.dias };
          });
          setInasistencia(m);
        })
        .catch(() => {});
    } catch (err) {
      setError(err.message);
    }
  }, [token, id]);

  useEffect(() => { if (token) load(); }, [token, load]);

  if (error) {
    return <div className="p-10 text-center text-rose-600 dark:text-rose-400">{error}</div>;
  }
  if (!data) {
    return (
      <div className="flex justify-center py-24">
        <Loader2 className="w-8 h-8 animate-spin text-slate-300 dark:text-slate-600" />
      </div>
    );
  }

  const { seccion, materias, etiquetaAnio } = data;
  const docenteNombre = seccion.docente
    ? `${seccion.docente.name || ''} ${seccion.docente.apellido || ''}`.trim()
    : '—';

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-6 transition-colors duration-300">
      <div className="max-w-5xl mx-auto">
        {/* Volver a Reportes → Por Docente */}
        <Link
          to="/app/admin/reportes"
          className="inline-flex items-center gap-1.5 text-sm text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 mb-4 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Volver a Reportes
        </Link>

        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-14 h-14 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-2xl flex items-center justify-center font-black text-xl">
              {seccion.anio}°
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
                {etiquetaAnio} — Sección {seccion.nombre}
              </h1>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Período {seccion.periodo} · Prof. {docenteNombre}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Link
              to={`/app/admin/secciones/${seccion._id}/asistencia`}
              className="inline-flex items-center gap-2 text-sm font-semibold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/30 px-4 py-2.5 rounded-xl hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-colors"
            >
              <CalendarCheck className="w-4 h-4" /> Asistencia
            </Link>
            <button
              onClick={() => setConstanciaSeccion(true)}
              className="inline-flex items-center gap-2 text-sm font-semibold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/30 px-4 py-2.5 rounded-xl hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-colors"
            >
              <Stamp className="w-4 h-4" /> Constancia de rendimiento
            </button>
            <Link
              to={`/app/admin/secciones/${seccion._id}/preinforme`}
              className="inline-flex items-center gap-2 bg-indigo-600 text-white text-sm font-semibold px-4 py-2.5 rounded-xl hover:bg-indigo-700 transition-colors shadow-sm hover:shadow-md"
            >
              <FileText className="w-4 h-4" /> Preinforme
            </Link>
          </div>
        </div>

        {/* Resumen: materias y estudiantes */}
        <div className="grid grid-cols-2 sm:grid-cols-2 gap-4 mb-6">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm dark:shadow-none p-5 flex items-center gap-4">
            <div className="p-2.5 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-xl">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900 dark:text-white">{materias.length}</p>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">Materias</p>
            </div>
          </div>
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm dark:shadow-none p-5 flex items-center gap-4">
            <div className="p-2.5 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-xl">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900 dark:text-white">{seccion.estudiantes.length}</p>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">Estudiantes</p>
            </div>
          </div>
        </div>

        {/* Estudiantes: emitir constancia / certificación (solo lectura) */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm dark:shadow-none border border-slate-100 dark:border-slate-800 overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800">
            <h2 className="font-bold text-slate-800 dark:text-slate-100">Estudiantes</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">Emite constancias y la certificación 1ro–4to.</p>
          </div>
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {seccion.estudiantes.map((est) => (
              <div key={est._id} className="flex items-center gap-4 p-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                <div className="w-9 h-9 rounded-full bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold text-sm">
                  {(est.name || 'E').charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-slate-800 dark:text-slate-100 truncate">
                    {est.name} {est.apellido || ''}
                  </p>
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-xs text-slate-400 dark:text-slate-500">C.I. {est.cedula}</p>
                    {inasistencia[est._id] && inasistencia[est._id].dias > 0 && (
                      <span
                        className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          inasistencia[est._id].nivel === 'danger'
                            ? 'bg-rose-50 dark:bg-rose-900/20 text-rose-700 dark:text-rose-300'
                            : inasistencia[est._id].nivel === 'warning'
                            ? 'bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300'
                            : 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300'
                        }`}
                        title="Inasistencia acumulada"
                      >
                        {inasistencia[est._id].pct}% inasist.
                      </span>
                    )}
                  </div>
                </div>
                <Link
                  to={`/app/admin/certificacion/${est._id}`}
                  className="inline-flex items-center gap-1 text-amber-600 dark:text-amber-400 text-xs font-bold px-3 py-2 bg-amber-50 dark:bg-amber-900/20 rounded-lg hover:bg-amber-100 dark:hover:bg-amber-900/40 transition-colors"
                  title="Certificación de calificaciones (1ro-4to)"
                >
                  <Award className="w-3.5 h-3.5" />
                  CERTIFICACIÓN
                </Link>
                <button
                  onClick={() => setConstanciaEst(est)}
                  className="inline-flex items-center gap-1 text-indigo-600 dark:text-indigo-400 text-xs font-bold px-3 py-2 bg-indigo-50 dark:bg-indigo-900/30 rounded-lg hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-colors"
                  title="Emitir constancia"
                >
                  <Stamp className="w-3.5 h-3.5" /> CONSTANCIA
                </button>
              </div>
            ))}
            {seccion.estudiantes.length === 0 && (
              <div className="text-center py-10">
                <GraduationCap className="w-10 h-10 text-slate-200 dark:text-slate-700 mx-auto mb-2" />
                <p className="text-slate-400 dark:text-slate-500 text-sm">Esta sección no tiene estudiantes.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <EmitirConstanciaModal
        open={!!constanciaEst}
        onClose={() => setConstanciaEst(null)}
        estudiante={constanciaEst}
        token={token}
      />
      <EmitirConstanciaModal
        open={constanciaSeccion}
        onClose={() => setConstanciaSeccion(false)}
        seccion={seccion}
        token={token}
      />
    </div>
  );
};

export default AdminSeccionReportePage;
