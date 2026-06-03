/**
 * Utilidades académicas compartidas (Sistema de Diseño "Quiet Academic").
 *
 * Centraliza la lógica del "Semáforo Académico" para que las tarjetas,
 * los KPIs y los gráficos usen exactamente los mismos umbrales y colores.
 *
 * Escala de notas: 0 - 20 (sistema venezolano).
 *   🟢 Verde  (emerald): nota >= 15  → buen rendimiento
 *   🟡 Ámbar  (amber):   nota >= 11  → en observación
 *   🔴 Rojo   (rose):    nota <  11  → en riesgo
 */

export const SCALE_MAX = 20;

export const RISK = {
  GOOD: 'good',
  WARNING: 'warning',
  DANGER: 'danger',
};

/**
 * Clasifica una nota (0-20) en uno de los tres niveles del semáforo.
 * @param {number} score
 * @returns {'good'|'warning'|'danger'}
 */
export function getRiskLevel(score) {
  if (score >= 15) return RISK.GOOD;
  if (score >= 11) return RISK.WARNING;
  return RISK.DANGER;
}

/**
 * Paleta de Tailwind asociada a cada nivel del semáforo.
 * Un único lugar de la verdad para mantener la coherencia visual.
 */
export const RISK_STYLES = {
  [RISK.GOOD]: {
    label: 'Sólido',
    text: 'text-emerald-700',
    bg: 'bg-emerald-50',
    bgSolid: 'bg-emerald-500',
    border: 'border-emerald-500',
    ring: 'ring-emerald-500/20',
    hex: '#10b981',
  },
  [RISK.WARNING]: {
    label: 'En observación',
    text: 'text-amber-700',
    bg: 'bg-amber-50',
    bgSolid: 'bg-amber-500',
    border: 'border-amber-500',
    ring: 'ring-amber-500/20',
    hex: '#f59e0b',
  },
  [RISK.DANGER]: {
    label: 'En riesgo',
    text: 'text-rose-700',
    bg: 'bg-rose-50',
    bgSolid: 'bg-rose-500',
    border: 'border-rose-500',
    ring: 'ring-rose-500/20',
    hex: '#f43f5e',
  },
};

/**
 * Devuelve los estilos del semáforo directamente desde una nota.
 * @param {number} score
 */
export function getScoreStyles(score) {
  return RISK_STYLES[getRiskLevel(score)];
}

/**
 * Convierte una nota (0-20) en porcentaje de progreso (0-100).
 * @param {number} score
 */
export function scoreToProgress(score) {
  return Math.min(Math.round((score / SCALE_MAX) * 100), 100);
}

/**
 * Resume cuántas materias caen en cada nivel del semáforo.
 * @param {Array<{avgScore:number}>} subjects
 * @returns {{good:number, warning:number, danger:number, total:number}}
 */
export function summarizeRisk(subjects = []) {
  const summary = { good: 0, warning: 0, danger: 0, total: subjects.length };
  subjects.forEach((s) => {
    summary[getRiskLevel(s.avgScore)]++;
  });
  return summary;
}
