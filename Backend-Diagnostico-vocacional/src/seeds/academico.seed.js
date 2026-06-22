const Seccion = require('../models/Seccion');
const Materia = require('../models/Materia');
const PlanEvaluacion = require('../models/PlanEvaluacion');
const Nota = require('../models/Nota');
const BoletinPublicado = require('../models/BoletinPublicado');
const { CURRICULO } = require('../data/curriculoMPPE');

const PERIODO = '2025-2026';

// Plan de evaluación estándar reutilizado en cada materia/lapso (suma 100%).
const PLAN_BASE = [
  { nombre: 'Examen Parcial', tipo: 'examen', ponderacion: 40 },
  { nombre: 'Taller en aula', tipo: 'taller', ponderacion: 30 },
  { nombre: 'Rasgos y participación', tipo: 'rasgos', ponderacion: 30 },
];

// Nota pseudo-aleatoria pero determinística (sin Math.random, para reproducibilidad).
const notaDet = (seed) => {
  const base = 9 + (seed % 11); // 9..19
  return Math.min(20, Math.max(8, base));
};

/**
 * Seed ACADÉMICO: crea secciones de 1ro a 4to año para la Profesora González,
 * asigna estudiantes, define planes de evaluación y carga notas en los 3 lapsos.
 * El estudiante principal queda inscrito en 1ro–4to (certificación completa),
 * con el 3er lapso del 1er año publicado para probar el boletín.
 *
 * @param {{ docentes:[], estudiantePrincipal, estudiantes:[] }} usuarios
 * @param {{ limpiar?: boolean }} opts
 */
async function seedAcademico(usuarios, { limpiar = true } = {}) {
  if (limpiar) {
    await Seccion.deleteMany({});
    await Materia.deleteMany({});
    await PlanEvaluacion.deleteMany({});
    await Nota.deleteMany({});
    await BoletinPublicado.deleteMany({});
  }

  const docente = usuarios.docentes[0]; // Profesora González
  const principal = usuarios.estudiantePrincipal;
  // Reparto: la mitad de los extra van a las secciones de la profe.
  const extra = usuarios.estudiantes;

  let totalNotas = 0;
  const resumen = [];

  // Una sección por año, 1ro a 4to (certificación 1-4).
  for (let anio = 1; anio <= 4; anio++) {
    const seccion = await Seccion.create({
      nombre: 'A', anio, periodo: PERIODO, docente: docente._id,
      estudiantes: [principal._id, ...extra.slice(0, 5).map((e) => e._id)],
    });

    // Materias del preset oficial del año
    const materiasDocs = CURRICULO[anio].map((m) => ({
      nombre: m.nombre, horas: m.horas, seccion: seccion._id, docente: docente._id,
    }));
    await Materia.insertMany(materiasDocs);
    const materias = await Materia.find({ seccion: seccion._id });

    const estudianteIds = [principal._id, ...extra.slice(0, 5).map((e) => e._id)];

    for (let mi = 0; mi < materias.length; mi++) {
      const materia = materias[mi];
      for (let lapso = 1; lapso <= 3; lapso++) {
        // Plan de evaluación publicado para estudiantes
        const plan = await PlanEvaluacion.create({
          materia: materia._id, lapso, actividades: PLAN_BASE, publicado: true,
        });
        // Notas de cada estudiante en cada actividad
        for (let ei = 0; ei < estudianteIds.length; ei++) {
          for (let ai = 0; ai < plan.actividades.length; ai++) {
            const valor = notaDet(anio * 7 + mi * 3 + lapso * 2 + ei * 5 + ai);
            await Nota.create({
              estudiante: estudianteIds[ei], materia: materia._id, lapso,
              actividad: plan.actividades[ai]._id, valor, docente: docente._id,
            });
            totalNotas++;
          }
        }
      }
    }

    // Publicar el boletín del 1er y 2do lapso de cada año (3er queda inédito para demo)
    for (const lapso of [1, 2]) {
      await BoletinPublicado.create({ seccion: seccion._id, lapso, docente: docente._id });
    }

    resumen.push(`${anio}° Año A: ${materias.length} materias, ${estudianteIds.length} estudiantes`);
  }

  return { secciones: 4, detalle: resumen, totalNotas };
}

module.exports = { seedAcademico };
