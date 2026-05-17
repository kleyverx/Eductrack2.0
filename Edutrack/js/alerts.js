/* =====================================================
   alerts.js — Smart alerts engine
   Generates alerts based on:
   - drop in performance
   - high risk
   - delayed feedback
   - sudden grade changes
   ===================================================== */

const Alerts = (() => {
  const DAY = 24*60*60*1000;

  /** Generates fresh alerts for a student. Stores them in DB. */
  async function generateForStudent(studentId) {
    const series = await Analytics.timeSeries(studentId);
    const risk = await Risk.computeStudent(studentId);
    const critical = await Analytics.criticalSubjects(studentId);

    const alerts = [];

    // 1. High risk
    if (risk.level === 'alto') {
      alerts.push({
        type: 'risk_high',
        severity: 'high',
        title: 'Riesgo académico alto',
        message: `Tu índice de riesgo es ${risk.score}/100. Te recomendamos revisar tutorías y plan de estudio.`,
      });
    } else if (risk.level === 'medio') {
      alerts.push({
        type: 'risk_medium',
        severity: 'medium',
        title: 'Riesgo académico moderado',
        message: `Algunos indicadores muestran tendencia descendente (índice ${risk.score}/100).`,
      });
    }

    // 2. Sudden drop (last grade vs previous average)
    if (series.length >= 4) {
      const last = series[series.length - 1];
      const prev = series.slice(0, -1);
      const prevAvg = prev.reduce((s,p)=>s+p.valor,0)/prev.length;
      if (last.valor < prevAvg - 1.5) {
        alerts.push({
          type: 'drop',
          severity: 'medium',
          title: 'Caída brusca de rendimiento',
          message: `Tu nota más reciente (${last.valor.toFixed(1)}) es ${(prevAvg-last.valor).toFixed(1)} puntos inferior a tu promedio (${prevAvg.toFixed(1)}).`,
        });
      }
    }

    // 3. Critical subjects
    for (const c of critical) {
      alerts.push({
        type: 'critical_subject',
        severity: 'high',
        title: `Materia crítica: ${c.materia.nombre}`,
        message: `Tu promedio actual (${c.avg.toFixed(2)}) está por debajo del mínimo de aprobación.`,
        materiaId: c.materia.id
      });
    }

    // 4. Delayed feedback (eval entregada hace >7 días sin corregir)
    const evals = await DB.all('evaluaciones');
    const notas = await DB.where('notas', 'estudianteId', studentId);
    const myEvalIds = new Set(notas.map(n => n.evaluacionId));
    const now = Date.now();
    for (const ev of evals) {
      if (!myEvalIds.has(ev.id)) continue;
      if (ev.fechaCorreccion) continue;
      const lag = (now - ev.fechaEntrega) / DAY;
      if (lag > 7) {
        alerts.push({
          type: 'feedback_delay',
          severity: 'low',
          title: `Feedback pendiente: ${ev.nombre}`,
          message: `Han pasado ${Math.floor(lag)} días desde la entrega.`,
          evaluacionId: ev.id
        });
      }
    }

    // Replace previous alerts for this student
    const existing = await DB.where('alertas', 'estudianteId', studentId);
    for (const a of existing) await DB.del('alertas', a.id);
    for (const a of alerts) {
      await DB.add('alertas', { ...a, estudianteId: studentId });
    }
    return alerts;
  }

  async function listForStudent(studentId) {
    const list = await DB.where('alertas', 'estudianteId', studentId);
    return list.sort((a,b) => {
      const order = { high: 0, medium: 1, low: 2 };
      const sa = order[a.severity] ?? 3, sb = order[b.severity] ?? 3;
      if (sa !== sb) return sa - sb;
      return b.createdAt - a.createdAt;
    });
  }

  /** Generate alerts for ALL students - useful for admin/teacher dashboards */
  async function regenerateAll() {
    const students = (await DB.all('usuarios')).filter(u => u.role === 'estudiante');
    for (const s of students) await generateForStudent(s.id);
  }

  return { generateForStudent, listForStudent, regenerateAll };
})();
