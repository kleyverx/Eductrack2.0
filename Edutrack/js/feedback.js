/* =====================================================
   feedback.js — Teacher feedback observability
   Tracks turnaround (entrega -> correccion) and quality
   metrics per docente and per evaluacion.
   ===================================================== */

const Feedback = (() => {
  const DAY = 24 * 60 * 60 * 1000;

  /** Average turnaround across evaluations of a docente, in days. */
  async function turnaroundByDocente(docenteId) {
    const materias = await DB.where('materias', 'docenteId', docenteId);
    const matIds = new Set(materias.map(m => m.id));
    const evals = (await DB.all('evaluaciones')).filter(e => matIds.has(e.materiaId));
    const corrected = evals.filter(e => e.fechaCorreccion);
    if (corrected.length === 0) return { avgDays: null, count: 0, total: evals.length, pending: evals.length };

    const sum = corrected.reduce((s,e) => s + (e.fechaCorreccion - e.fechaEntrega), 0);
    const avgMs = sum / corrected.length;
    return {
      avgDays: avgMs / DAY,
      count: corrected.length,
      total: evals.length,
      pending: evals.length - corrected.length,
      onTimeRate: corrected.filter(e => (e.fechaCorreccion - e.fechaEntrega) <= 7*DAY).length / corrected.length
    };
  }

  /** Per-evaluation feedback details */
  async function evaluationsTurnaround(docenteId = null) {
    let evals = await DB.all('evaluaciones');
    if (docenteId) {
      const mats = await DB.where('materias', 'docenteId', docenteId);
      const ids = new Set(mats.map(m => m.id));
      evals = evals.filter(e => ids.has(e.materiaId));
    }
    const matsAll = await DB.all('materias');
    const matMap = new Map(matsAll.map(m => [m.id, m]));
    return evals.map(e => ({
      ev: e,
      materia: matMap.get(e.materiaId),
      tatDays: e.fechaCorreccion ? (e.fechaCorreccion - e.fechaEntrega) / DAY : null
    })).sort((a,b) => b.ev.fechaEntrega - a.ev.fechaEntrega);
  }

  async function rankDocentes() {
    const docentes = (await DB.all('usuarios')).filter(u => u.role === 'docente');
    const out = [];
    for (const d of docentes) {
      const t = await turnaroundByDocente(d.id);
      out.push({ user: d, ...t });
    }
    return out;
  }

  /** Get textual feedback comments for a student */
  async function commentsForStudent(studentId) {
    const list = await DB.where('feedback', 'estudianteId', studentId);
    const evMap = new Map((await DB.all('evaluaciones')).map(e => [e.id, e]));
    const matMap = new Map((await DB.all('materias')).map(m => [m.id, m]));
    const docMap = new Map((await DB.all('usuarios')).map(u => [u.id, u]));
    return list
      .map(f => ({
        ...f,
        evaluacion: evMap.get(f.evaluacionId),
        materia: evMap.get(f.evaluacionId) ? matMap.get(evMap.get(f.evaluacionId).materiaId) : null,
        docente: docMap.get(f.docenteId)
      }))
      .sort((a,b) => b.createdAt - a.createdAt);
  }

  return { turnaroundByDocente, evaluationsTurnaround, rankDocentes, commentsForStudent };
})();
