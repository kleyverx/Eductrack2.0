import React, { useContext, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, addRecord, updateRecord, softDelete } from '../db/db';
import { AuthContext } from '../context/AuthContext';
import Modal from '../components/ui/Modal';
import { getScoreStyles, scoreToProgress, SCALE_MAX } from '../utils/academic';
import {
  BookOpen,
  Plus,
  Pencil,
  Trash2,
  ChevronDown,
  ChevronRight,
  ClipboardList,
  GraduationCap,
  Loader2,
} from 'lucide-react';

// Paleta de colores sugeridos para las materias.
const SUBJECT_COLORS = ['#4f46e5', '#0ea5e9', '#10b981', '#f59e0b', '#f43f5e', '#8b5cf6', '#ec4899'];

/**
 * Gestión de Materias (funcional, offline-first en Dexie).
 * CRUD de materias → evaluaciones → notas, con cálculo de promedio y semáforo.
 * Disponible para estudiante y docente.
 */
const SubjectsPage = () => {
  const { user } = useContext(AuthContext);
  const [expanded, setExpanded] = useState(null);

  // Estado de los modales.
  const [subjectModal, setSubjectModal] = useState(null); // {mode, data}
  const [gradeModal, setGradeModal] = useState(null); // {subjectId}

  // Materias con promedio calculado.
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
        const avg = grades.length ? grades.reduce((a, g) => a + g.score, 0) / grades.length : 0;
        return { ...subject, evaluations: evals, grades, avg };
      })
    );
  }, [user?.id]);

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600 dark:text-indigo-400" />
      </div>
    );
  }

  const loading = subjects === undefined;
  const list = subjects || [];

  // ---- Acciones de Materia ----
  const saveSubject = async (form) => {
    if (subjectModal?.mode === 'edit') {
      await updateRecord('subjects', subjectModal.data.id, { name: form.name, color: form.color });
    } else {
      await addRecord('subjects', { name: form.name, color: form.color, user: user.id });
    }
    setSubjectModal(null);
  };

  const deleteSubject = async (id) => {
    if (!window.confirm('¿Eliminar esta materia y sus evaluaciones?')) return;
    await softDelete('subjects', id);
  };

  // ---- Acción de Nota (crea una evaluación + nota de una vez, modelo simple) ----
  const saveGrade = async (form) => {
    const evalId = await addRecord('evaluations', {
      name: form.evalName,
      percentage: 100,
      subject: gradeModal.subjectId,
      status: 'graded',
    });
    // addRecord devuelve la clave (id) insertada.
    await addRecord('grades', {
      score: Number(form.score),
      evaluation: evalId,
      user: user.id,
    });
    setGradeModal(null);
  };

  const deleteGrade = async (gradeId) => {
    await softDelete('grades', gradeId);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-6 transition-colors duration-300">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-600 dark:bg-indigo-500 rounded-lg text-white">
              <BookOpen className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">Materias</h1>
              <p className="text-sm text-slate-500 dark:text-slate-400">Gestiona tus materias, evaluaciones y notas</p>
            </div>
          </div>
          <button
            onClick={() => setSubjectModal({ mode: 'create', data: { name: '', color: SUBJECT_COLORS[0] } })}
            className="inline-flex items-center gap-2 bg-indigo-600 text-white text-sm font-semibold px-4 py-2.5 rounded-xl hover:bg-indigo-700 transition-colors shadow-sm hover:shadow-md"
          >
            <Plus className="w-4 h-4" />
            Nueva materia
          </button>
        </div>

        {/* Lista */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="w-10 h-10 animate-spin text-slate-300 dark:text-slate-600 mb-3" />
            <p className="text-slate-400 dark:text-slate-500">Cargando materias...</p>
          </div>
        ) : list.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 bg-white dark:bg-slate-900 rounded-3xl border border-dashed border-slate-200 dark:border-slate-800 text-center px-6">
            <div className="p-5 bg-indigo-50 dark:bg-indigo-900/30 rounded-3xl mb-4">
              <BookOpen className="w-12 h-12 text-indigo-500 dark:text-indigo-400" />
            </div>
            <p className="text-slate-700 dark:text-slate-200 font-bold text-lg mb-1">Sin materias todavía</p>
            <p className="text-slate-400 dark:text-slate-500 text-sm mb-6 max-w-sm">
              Crea tu primera materia para empezar a registrar evaluaciones y notas.
            </p>
            <button
              onClick={() => setSubjectModal({ mode: 'create', data: { name: '', color: SUBJECT_COLORS[0] } })}
              className="inline-flex items-center gap-2 bg-indigo-600 text-white text-sm font-semibold px-5 py-2.5 rounded-xl hover:bg-indigo-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Crear materia
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {list.map((subject) => {
              const styles = getScoreStyles(subject.avg);
              const isOpen = expanded === subject.id;
              return (
                <div
                  key={subject.id}
                  className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm dark:shadow-none border border-slate-100 dark:border-slate-800 overflow-hidden transition-colors duration-300"
                >
                  {/* Cabecera de la materia */}
                  <div className="flex items-center gap-4 p-5">
                    <button
                      onClick={() => setExpanded(isOpen ? null : subject.id)}
                      className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                    >
                      {isOpen ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
                    </button>
                    <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: subject.color }} />
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-slate-800 dark:text-slate-100 truncate">{subject.name}</h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {subject.grades.length} {subject.grades.length === 1 ? 'nota' : 'notas'}
                      </p>
                    </div>
                    {subject.grades.length > 0 && (
                      <div className={`text-right ${styles.text}`}>
                        <span className="text-2xl font-black">{subject.avg.toFixed(1)}</span>
                        <span className="text-xs block font-bold uppercase tracking-wider">{styles.label}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => setSubjectModal({ mode: 'edit', data: subject })}
                        className="p-2 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg transition-colors"
                        title="Editar"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => deleteSubject(subject.id)}
                        className="p-2 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg transition-colors"
                        title="Eliminar"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Progreso */}
                  {subject.grades.length > 0 && (
                    <div className="px-5 pb-4 -mt-1">
                      <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden">
                        <div
                          className={`h-full rounded-full ${styles.bgSolid}`}
                          style={{ width: `${scoreToProgress(subject.avg)}%` }}
                        />
                      </div>
                    </div>
                  )}

                  {/* Detalle expandido: notas */}
                  {isOpen && (
                    <div className="border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 p-5">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                          <ClipboardList className="w-3.5 h-3.5" />
                          Notas registradas
                        </h4>
                        <button
                          onClick={() => setGradeModal({ subjectId: subject.id })}
                          className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/30 px-3 py-1.5 rounded-lg hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-colors"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          Agregar nota
                        </button>
                      </div>

                      {subject.grades.length === 0 ? (
                        <p className="text-sm text-slate-400 dark:text-slate-500 py-3 text-center">
                          Aún no hay notas en esta materia.
                        </p>
                      ) : (
                        <div className="space-y-2">
                          {subject.evaluations.map((ev) => {
                            const g = subject.grades.find((gr) => gr.evaluation === ev.id);
                            if (!g) return null;
                            const gStyle = getScoreStyles(g.score);
                            return (
                              <div
                                key={g.id}
                                className="flex items-center justify-between bg-white dark:bg-slate-800 rounded-xl px-4 py-2.5 border border-slate-100 dark:border-slate-700"
                              >
                                <span className="text-sm text-slate-700 dark:text-slate-300">{ev.name}</span>
                                <div className="flex items-center gap-3">
                                  <span className={`font-bold ${gStyle.text}`}>{g.score} / {SCALE_MAX}</span>
                                  <button
                                    onClick={() => deleteGrade(g.id)}
                                    className="text-slate-300 dark:text-slate-600 hover:text-rose-500 transition-colors"
                                    title="Eliminar nota"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal: crear/editar materia */}
      <SubjectModal
        state={subjectModal}
        onClose={() => setSubjectModal(null)}
        onSave={saveSubject}
      />

      {/* Modal: agregar nota */}
      <GradeModal
        open={!!gradeModal}
        onClose={() => setGradeModal(null)}
        onSave={saveGrade}
      />
    </div>
  );
};

/** Formulario de materia. */
const SubjectModal = ({ state, onClose, onSave }) => {
  const [name, setName] = useState('');
  const [color, setColor] = useState(SUBJECT_COLORS[0]);

  // Sincroniza el formulario al abrir.
  React.useEffect(() => {
    if (state) {
      setName(state.data.name || '');
      setColor(state.data.color || SUBJECT_COLORS[0]);
    }
  }, [state]);

  const submit = (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    onSave({ name: name.trim(), color });
  };

  return (
    <Modal
      open={!!state}
      onClose={onClose}
      title={state?.mode === 'edit' ? 'Editar materia' : 'Nueva materia'}
      icon={BookOpen}
    >
      <form onSubmit={submit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-1.5">Nombre</label>
          <input
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ej. Matemática"
            className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-2">Color</label>
          <div className="flex gap-2 flex-wrap">
            {SUBJECT_COLORS.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setColor(c)}
                className={`w-8 h-8 rounded-full transition-transform ${color === c ? 'ring-2 ring-offset-2 ring-slate-400 dark:ring-offset-slate-900 scale-110' : ''}`}
                style={{ backgroundColor: c }}
              />
            ))}
          </div>
        </div>
        <div className="flex gap-2 pt-2">
          <button type="button" onClick={onClose} className="flex-1 px-4 py-2.5 text-sm font-semibold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
            Cancelar
          </button>
          <button type="submit" className="flex-1 px-4 py-2.5 text-sm font-semibold text-white bg-indigo-600 rounded-xl hover:bg-indigo-700 transition-colors">
            Guardar
          </button>
        </div>
      </form>
    </Modal>
  );
};

/** Formulario de nota (crea evaluación + nota). */
const GradeModal = ({ open, onClose, onSave }) => {
  const [evalName, setEvalName] = useState('');
  const [score, setScore] = useState('');
  const [err, setErr] = useState('');

  React.useEffect(() => {
    if (open) { setEvalName(''); setScore(''); setErr(''); }
  }, [open]);

  const submit = (e) => {
    e.preventDefault();
    const n = Number(score);
    if (!evalName.trim()) return setErr('Indica el nombre de la evaluación.');
    if (Number.isNaN(n) || n < 0 || n > SCALE_MAX) return setErr(`La nota debe estar entre 0 y ${SCALE_MAX}.`);
    onSave({ evalName: evalName.trim(), score: n });
  };

  return (
    <Modal open={open} onClose={onClose} title="Agregar nota" icon={GraduationCap}>
      <form onSubmit={submit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-1.5">Evaluación</label>
          <input
            autoFocus
            value={evalName}
            onChange={(e) => setEvalName(e.target.value)}
            placeholder="Ej. Examen Parcial 1"
            className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-1.5">Nota (0–{SCALE_MAX})</label>
          <input
            type="number"
            min="0"
            max={SCALE_MAX}
            step="0.1"
            value={score}
            onChange={(e) => setScore(e.target.value)}
            placeholder="Ej. 16.5"
            className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500"
          />
        </div>
        {err && <p className="text-xs text-rose-600 dark:text-rose-400">{err}</p>}
        <div className="flex gap-2 pt-2">
          <button type="button" onClick={onClose} className="flex-1 px-4 py-2.5 text-sm font-semibold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
            Cancelar
          </button>
          <button type="submit" className="flex-1 px-4 py-2.5 text-sm font-semibold text-white bg-indigo-600 rounded-xl hover:bg-indigo-700 transition-colors">
            Guardar nota
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default SubjectsPage;
