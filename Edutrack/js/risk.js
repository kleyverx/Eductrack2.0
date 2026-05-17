/* =====================================================
   risk.js — Academic risk index engine
   Combines: current average, trend, recent performance,
   and number of failed subjects into a 0..100 score.
   ===================================================== */

const Risk = (() => {

  /**
   * Risk score (0..100) for a student. Higher = more at risk.
   * Components:
   *   - 40 pts: distance below approval threshold (overall)
   *   - 25 pts: negative trend (slope)
   *   - 20 pts: recent grades < threshold (last 3)
   *   - 15 pts: number of critical subjects
   */
  async function computeStudent(studentId) {
    const { avg, breakdown } = await Analytics.overallAverage(studentId);
    const series = await Analytics.timeSeries(studentId);
    const slope  = Analytics.trendSlope(series);
    const critical = await Analytics.criticalSubjects(studentId);

    const APPROVE = 6.0;
    const SCALE = 10;

    // 1. Distance below approval (overall)
    let distScore = 0;
    if (avg != null) {
      if (avg < APPROVE) {
        distScore = Math.min(40, (APPROVE - avg) / APPROVE * 40);
      } else {
        // small bonus reduction below for being above approval
        distScore = Math.max(0, (APPROVE - avg) / APPROVE * 10);
      }
    } else {
      distScore = 20; // no data == moderate uncertainty
    }

    // 2. Negative trend
    let trendScore = 0;
    if (slope < 0) trendScore = Math.min(25, Math.abs(slope) * 30);
    else trendScore = 0;

    // 3. Recent performance (last 3 grades)
    const recent = series.slice(-3);
    let recentScore = 0;
    if (recent.length > 0) {
      const failed = recent.filter(p => p.valor < APPROVE).length;
      recentScore = (failed / recent.length) * 20;
    }

    // 4. Critical subject count
    const totalSubjects = breakdown.length || 1;
    const criticalScore = Math.min(15, (critical.length / totalSubjects) * 15);

    const total = Math.round(distScore + trendScore + recentScore + criticalScore);
    const clamped = Math.max(0, Math.min(100, total));

    let level = 'bajo';
    if (clamped >= 60) level = 'alto';
    else if (clamped >= 30) level = 'medio';

    return {
      score: clamped,
      level,
      components: {
        distancia: Math.round(distScore),
        tendencia: Math.round(trendScore),
        reciente:  Math.round(recentScore),
        criticas:  Math.round(criticalScore)
      },
      stats: {
        promedio: avg,
        slope,
        materiasCriticas: critical.length,
        recientesReprobados: recent.filter(p => p.valor < APPROVE).length
      },
      criticalSubjects: critical
    };
  }

  /** All students, ranked by risk */
  async function rankStudents() {
    const students = (await DB.all('usuarios')).filter(u => u.role === 'estudiante');
    const out = [];
    for (const s of students) {
      const r = await computeStudent(s.id);
      out.push({ user: s, ...r });
    }
    return out.sort((a,b) => b.score - a.score);
  }

  function levelLabel(level) {
    return { bajo: 'Bajo', medio: 'Medio', alto: 'Alto' }[level] || level;
  }
  function levelColor(level) {
    return { bajo: 'var(--ok)', medio: 'var(--warn)', alto: 'var(--danger)' }[level] || 'var(--ink)';
  }

  return { computeStudent, rankStudents, levelLabel, levelColor };
})();
