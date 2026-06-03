import { db } from './db';
import { generateId } from '../utils/syncUtils';

/**
 * Sembrador de datos académicos de PRUEBA en Dexie (IndexedDB).
 *
 * Crea materias, evaluaciones y notas para el usuario indicado, con notas
 * fechadas en distintos momentos para que el "Mini gráfico de evolución" y el
 * "Semáforo de Riesgo" del dashboard muestren información realista.
 *
 * Pensado solo para desarrollo / demos. Se invoca desde un botón temporal.
 */

const DAY = 24 * 60 * 60 * 1000;

// Materias de demo con un promedio objetivo (para cubrir los 3 estados del semáforo).
const DEMO_SUBJECTS = [
  { name: 'Matemática', color: '#4f46e5', target: 17 },   // 🟢 sólida
  { name: 'Física', color: '#0ea5e9', target: 18.5 },     // 🟢 sólida
  { name: 'Castellano', color: '#f59e0b', target: 13 },   // 🟡 observación
  { name: 'Biología', color: '#10b981', target: 12 },     // 🟡 observación
  { name: 'Química', color: '#f43f5e', target: 9 },        // 🔴 riesgo
  { name: 'Historia', color: '#8b5cf6', target: 15 },     // 🟢 sólida
];

// Genera 3 notas alrededor de un promedio objetivo, en fechas escalonadas.
const buildGrades = (target, now) => {
  const variations = [-1.5, 0.5, 1.0]; // suman ~0 → el promedio ronda el objetivo
  return variations.map((v, i) => ({
    score: Math.max(0, Math.min(20, +(target + v).toFixed(1))),
    daysAgo: (variations.length - i) * 14, // hace 6, 4 y 2 semanas
    now,
  }));
};

/**
 * Inserta los datos de prueba para un usuario.
 * @param {string} userId  ID del usuario (el mismo que usa el dashboard: user.id del JWT)
 */
export async function seedLocalData(userId) {
  if (!userId) throw new Error('seedLocalData requiere un userId');

  const now = Date.now();

  // Resultado vocacional de demo (alimenta el banner del dashboard).
  // El dashboard lo lee desde Dexie, por eso lo sembramos aquí también.
  await db.vocationalResults.add({
    id: generateId(),
    user: userId,
    results: {
      'Ingeniería, Arquitectura y Tecnología': 30,
      'Ciencias Básicas': 22,
      'Ciencias de la salud': 18,
      'Ciencias Sociales': 14,
      'Humanidades, Letras y artes': 12,
    },
    interpretation:
      'Tu perfil muestra una fuerte afinidad por Ingeniería, Arquitectura y Tecnología.',
    createdAt: now,
    lastModified: now,
    syncStatus: 'pending',
    deleted: false,
  });

  for (let i = 0; i < DEMO_SUBJECTS.length; i++) {
    const def = DEMO_SUBJECTS[i];

    const subjectId = generateId();
    await db.subjects.add({
      id: subjectId,
      name: def.name,
      color: def.color,
      user: userId,
      lastModified: now,
      syncStatus: 'pending',
      deleted: false,
    });

    // Una evaluación por materia (suficiente para promediar notas).
    const evaluationId = generateId();
    await db.evaluations.add({
      id: evaluationId,
      name: 'Evaluación Continua',
      percentage: 100,
      subject: subjectId,
      status: 'graded',
      lastModified: now,
      syncStatus: 'pending',
      deleted: false,
    });

    // Varias notas fechadas → alimentan la evolución del promedio.
    const grades = buildGrades(def.target, now);
    for (const g of grades) {
      await db.grades.add({
        id: generateId(),
        score: g.score,
        evaluation: evaluationId,
        user: userId,
        lastModified: now - g.daysAgo * DAY,
        syncStatus: 'pending',
        deleted: false,
      });
    }
  }

  return DEMO_SUBJECTS.length;
}

/**
 * Borra TODOS los datos académicos locales (limpieza de la demo).
 */
export async function clearLocalData() {
  await db.subjects.clear();
  await db.evaluations.clear();
  await db.grades.clear();
  await db.vocationalResults.clear();
}
