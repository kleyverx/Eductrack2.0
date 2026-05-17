/* =====================================================
   simulation.js — Scenario simulation
   - Predict subject final grade with hypothetical inputs
   - Compute minimum grade needed on remaining evals
   - Compare scenarios
   ===================================================== */

const Simulation = (() => {

  /**
   * Given a student/subject, accept a map of evaluacionId -> hypothetical value
   * (overrides actual grades) and compute the projected weighted final.
   */
  async function project(studentId, materiaId, overrides = {}) {
    const evals = await DB.where('evaluaciones', 'materiaId', materiaId);
    const notas = await DB.where('notas', 'estudianteId', studentId);
    const map = new Map(notas.map(n => [n.evaluacionId, n]));

    let weighted = 0, totalW = 0;
    const detail = [];
    for (const ev of evals) {
      const real = map.get(ev.id)?.valor;
      const hypo = overrides[ev.id];
      const usedVal = (hypo !== undefined && hypo !== null && hypo !== '') ? Number(hypo) : real;
      if (usedVal != null && !isNaN(usedVal)) {
        weighted += usedVal * ev.peso;
        totalW += ev.peso;
      }
      detail.push({
        evaluacion: ev,
        notaReal: real ?? null,
        notaHipotetica: hypo ?? null,
        notaUsada: usedVal ?? null
      });
    }
    const proyectado = totalW > 0 ? weighted / totalW : null;
    return { proyectado, totalWeight: totalW, detail };
  }

  /**
   * Computes the minimum average required on remaining (un-graded) evaluations
   * to reach `target` final grade. Uses standard weighted-average algebra:
   *   target = (sum_done(value*weight) + neededAvg * sum_remaining(weight)) / totalWeight
   */
  async function minimumNeeded(studentId, materiaId, target) {
    const mat = await DB.get('materias', materiaId);
    if (!mat) return { possible: false };
    const evals = await DB.where('evaluaciones', 'materiaId', materiaId);
    const notas = await DB.where('notas', 'estudianteId', studentId);
    const noteMap = new Map(notas.map(n => [n.evaluacionId, n]));

    let doneWeighted = 0, doneW = 0, remW = 0;
    const remaining = [];
    let totalW = 0;
    for (const ev of evals) {
      totalW += ev.peso;
      const n = noteMap.get(ev.id);
      if (n) {
        doneWeighted += n.valor * ev.peso;
        doneW += ev.peso;
      } else {
        remW += ev.peso;
        remaining.push(ev);
      }
    }
    if (remW === 0) {
      const final = doneW > 0 ? doneWeighted / doneW : null;
      return {
        possible: true,
        finalActual: final,
        notaNecesaria: null,
        message: 'No quedan evaluaciones pendientes',
        remaining: []
      };
    }
    // target * totalW = doneWeighted + needed*remW  (assuming weights cover total = 1)
    // If totalW < 1, target normalised to totalW. We'll require target on full totalW.
    const needed = (target * totalW - doneWeighted) / remW;
    const escala = mat.escala || 10;
    let possible = needed <= escala;
    let achievable = needed >= 0 && needed <= escala;
    return {
      possible: achievable,
      ceilingExceeded: needed > escala,
      floorAlready: needed < 0,
      notaNecesaria: needed,
      doneWeighted, doneW, remW, totalW,
      remaining, escala, target
    };
  }

  /**
   * Compare an array of scenarios (each = overrides map) and return their
   * projected outcomes for charting.
   */
  async function compareScenarios(studentId, materiaId, scenarios) {
    const out = [];
    for (const sc of scenarios) {
      const p = await project(studentId, materiaId, sc.overrides || {});
      out.push({ name: sc.name, projected: p.proyectado, totalWeight: p.totalWeight });
    }
    return out;
  }

  /**
   * Sensitivity: how much each remaining evaluation changes the final
   * by ±1 point. Helps the student prioritise.
   */
  async function sensitivity(studentId, materiaId) {
    const evals = await DB.where('evaluaciones', 'materiaId', materiaId);
    const notas = await DB.where('notas', 'estudianteId', studentId);
    const noteMap = new Map(notas.map(n => [n.evaluacionId, n]));
    const totalW = evals.reduce((s,e)=>s+e.peso, 0);
    return evals
      .filter(e => !noteMap.get(e.id))
      .map(e => ({
        evaluacion: e,
        impactoPor1Punto: e.peso / totalW
      }))
      .sort((a,b) => b.impactoPor1Punto - a.impactoPor1Punto);
  }

  return { project, minimumNeeded, compareScenarios, sensitivity };
})();
