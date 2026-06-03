/* =====================================================
   analytics.js — Academic performance engine
   Computes averages, trends, per-subject breakdowns,
   and identifies critical subjects.
   ===================================================== */

const Analytics = (() => {

  /**
   * Weighted average of grades for a student in a subject.
   * Uses evaluation weights (peso). If sum of weights < 1
   * (e.g., not all evals taken), normalises over taken weights.
   */
  async function subjectAverage(studentId, materiaId) {
    const evals = await DB.where('evaluaciones', 'materiaId', materiaId);
    const studentNotas = await DB.where('notas', 'estudianteId', studentId);
    const map = new Map(studentNotas.map(n => [n.evaluacionId, n]));

    let weighted = 0, totalW = 0;
    const items = [];
    for (const ev of evals) {
      const nota = map.get(ev.id);
      if (nota != null) {
        weighted += nota.valor * ev.peso;
        totalW   += ev.peso;
      }
      items.push({ evaluacion: ev, nota: nota || null });
    }
    const avg = totalW > 0 ? weighted / totalW : null;
    return { avg, totalWeight: totalW, items };
  }

  /** Overall GPA across all subjects for a student */
  async function overallAverage(studentId) {
    const subjects = await DB.all('materias');
    let sum = 0, n = 0;
    const breakdown = [];
    for (const m of subjects) {
      const r = await subjectAverage(studentId, m.id);
      if (r.avg != null) {
        sum += r.avg; n++;
      }
      breakdown.push({ materia: m, ...r });
    }
    return { avg: n > 0 ? sum / n : null, breakdown };
  }

  /**
   * Returns a chronological series of grades for a student
   * useful for line charts. Each point includes evaluation date.
   */
  async function timeSeries(studentId, materiaId = null) {
    const notas = await DB.where('notas', 'estudianteId', studentId);
    const evalsAll = await DB.all('evaluaciones');
    const matsAll  = await DB.all('materias');
    const evMap  = new Map(evalsAll.map(e => [e.id, e]));
    const matMap = new Map(matsAll.map(m => [m.id, m]));

    const series = notas.map(n => {
      const ev = evMap.get(n.evaluacionId);
      if (!ev) return null;
      if (materiaId && ev.materiaId !== materiaId) return null;
      return {
        fecha: ev.fechaEntrega,
        valor: n.valor,
        evaluacion: ev.nombre,
        materia: matMap.get(ev.materiaId)?.nombre || '—',
        materiaId: ev.materiaId
      };
    }).filter(Boolean).sort((a,b) => a.fecha - b.fecha);

    return series;
  }

  /** Identifies subjects below approval threshold */
  async function criticalSubjects(studentId) {
    const { breakdown } = await overallAverage(studentId);
    return breakdown
      .filter(b => b.avg != null && b.avg < (b.materia.notaAprobacion || 6))
      .sort((a,b) => a.avg - b.avg);
  }

  /**
   * Trend slope (simple linear regression) over time series.
   * Returns slope per evaluation; positive => improving.
   */
  function trendSlope(series) {
    if (series.length < 2) return 0;
    const xs = series.map((_,i) => i);
    const ys = series.map(p => p.valor);
    const n = xs.length;
    const meanX = xs.reduce((a,b)=>a+b,0)/n;
    const meanY = ys.reduce((a,b)=>a+b,0)/n;
    let num=0, den=0;
    for (let i=0;i<n;i++) {
      num += (xs[i]-meanX)*(ys[i]-meanY);
      den += (xs[i]-meanX)**2;
    }
    return den === 0 ? 0 : num/den;
  }

  /** Aggregate stats for a single course / docente / etc. */
  async function subjectStats(materiaId) {
    const evals = await DB.where('evaluaciones', 'materiaId', materiaId);
    const evalIds = new Set(evals.map(e => e.id));
    const notas = (await DB.all('notas')).filter(n => evalIds.has(n.evaluacionId));
    if (notas.length === 0) {
      return { mean: null, max: null, min: null, count: 0, approved: 0, failed: 0 };
    }
    const vals = notas.map(n => n.valor);
    const mean = vals.reduce((a,b)=>a+b,0) / vals.length;
    const mat = await DB.get('materias', materiaId);
    const aprob = mat?.notaAprobacion || 6;
    const approved = vals.filter(v => v >= aprob).length;
    return {
      mean, max: Math.max(...vals), min: Math.min(...vals),
      count: vals.length, approved, failed: vals.length - approved,
      approveRate: approved/vals.length
    };
  }

  return { subjectAverage, overallAverage, timeSeries, criticalSubjects, trendSlope, subjectStats };
})();
