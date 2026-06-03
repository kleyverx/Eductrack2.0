/**
 * Mapa de Áreas Vocacionales → Icono + acento de color (Lucide-React).
 *
 * Las 8 áreas de conocimiento del test EduTrack. El emparejamiento es
 * tolerante: busca por palabras clave para soportar variantes de mayúsculas
 * o nombres ligeramente distintos provenientes de la base de datos.
 */
import {
  Stethoscope,
  Cpu,
  FlaskConical,
  GraduationCap,
  Users,
  Palette,
  Shield,
  Sprout,
  Compass,
} from 'lucide-react';

/**
 * Reglas de coincidencia por palabra clave. Se evalúan en orden.
 * Cada entrada define el icono y el tono (Tailwind) del acento.
 */
const RULES = [
  { match: ['salud', 'medic'], icon: Stethoscope, tone: 'rose' },
  { match: ['ingenier', 'tecnolog', 'arquitectura'], icon: Cpu, tone: 'indigo' },
  { match: ['básica', 'basica', 'química', 'quimica', 'física', 'fisica'], icon: FlaskConical, tone: 'violet' },
  { match: ['educación', 'educacion', 'deporte'], icon: GraduationCap, tone: 'sky' },
  { match: ['social'], icon: Users, tone: 'amber' },
  { match: ['humanidad', 'letras', 'arte'], icon: Palette, tone: 'pink' },
  { match: ['militar', 'defensa'], icon: Shield, tone: 'slate' },
  { match: ['agro', 'mar', 'ecosistema'], icon: Sprout, tone: 'emerald' },
];

/** Acento por defecto cuando el área no coincide con ninguna regla. */
const DEFAULT = { icon: Compass, tone: 'indigo' };

/**
 * Clases de color (texto + fondo suave) por tono.
 * Definidas de forma estática para que Tailwind las incluya en el build.
 */
const TONE_CLASSES = {
  rose: { text: 'text-rose-600 dark:text-rose-400', bg: 'bg-rose-50', bgDark: 'dark:bg-rose-900/30' },
  indigo: { text: 'text-indigo-600 dark:text-indigo-400', bg: 'bg-indigo-50', bgDark: 'dark:bg-indigo-900/30' },
  violet: { text: 'text-violet-600 dark:text-violet-400', bg: 'bg-violet-50', bgDark: 'dark:bg-violet-900/30' },
  sky: { text: 'text-sky-600 dark:text-sky-400', bg: 'bg-sky-50', bgDark: 'dark:bg-sky-900/30' },
  amber: { text: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-50', bgDark: 'dark:bg-amber-900/30' },
  pink: { text: 'text-pink-600 dark:text-pink-400', bg: 'bg-pink-50', bgDark: 'dark:bg-pink-900/30' },
  slate: { text: 'text-slate-600 dark:text-slate-300', bg: 'bg-slate-100', bgDark: 'dark:bg-slate-800' },
  emerald: { text: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50', bgDark: 'dark:bg-emerald-900/30' },
};

/**
 * Devuelve el icono y las clases de color para un nombre de área vocacional.
 * @param {string} area
 * @returns {{ Icon: Function, text: string, bg: string, bgDark: string, tone: string }}
 */
export function getVocationalIcon(area = '') {
  const normalized = String(area).toLowerCase();
  const rule = RULES.find((r) => r.match.some((kw) => normalized.includes(kw))) || DEFAULT;
  const colors = TONE_CLASSES[rule.tone] || TONE_CLASSES.indigo;
  return { Icon: rule.icon, text: colors.text, bg: colors.bg, bgDark: colors.bgDark, tone: rule.tone };
}
