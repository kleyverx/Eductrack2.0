const Test = require('../models/test');
const Question = require('../models/question');
const TestResult = require('../models/result');

const AREAS = [
  'Ciencias de la Educación y Ciencias del Deporte',
  'Humanidades, Letras y artes',
  'Ciencias y Artes Militares',
  'Ciencias Sociales',
  'Ciencias Básicas',
  'Ingeniería, Arquitectura y Tecnología',
  'Ciencias del Agro y del mar',
  'Ciencias de la salud',
];

/** Puntajes por área con una dominante. */
const buildScores = (topArea) => {
  const scores = {};
  AREAS.forEach((a) => { scores[a] = 5 + Math.round((AREAS.indexOf(a) * 7) % 11); });
  scores[topArea] = 30;
  return scores;
};

/**
 * Seed VOCACIONAL: test, 10 preguntas (8 áreas) y resultados para los
 * estudiantes recibidos. La mayoría completa el test; algunos quedan sin él.
 *
 * @param {{ estudiantePrincipal, estudiantes:[] }} usuarios  Salida de seedUsuarios.
 * @param {{ limpiar?: boolean }} opts
 */
async function seedVocacional(usuarios, { limpiar = true } = {}) {
  if (limpiar) {
    await Test.deleteMany({});
    await Question.deleteMany({});
    await TestResult.deleteMany({});
  }

  const mainTest = await Test.create({
    name: 'Test de Orientación Vocacional 2024',
    description: 'Prueba general para detectar áreas de interés profesional.',
    state: 'active',
    fechaInicio: new Date(),
    fechaFin: new Date(new Date().setFullYear(new Date().getFullYear() + 1)),
    duracion: 45,
  });

  const questionsData = [
    { text: '¿Te gusta resolver problemas matemáticos complejos?', area: ['Ciencias Básicas'] },
    { text: '¿Te interesa el diseño de edificios y estructuras?', area: ['Ingeniería, Arquitectura y Tecnología'] },
    { text: '¿Te gustaría trabajar en hospitales ayudando a enfermos?', area: ['Ciencias de la salud'] },
    { text: '¿Te apasiona la enseñanza y el entrenamiento deportivo?', area: ['Ciencias de la Educación y Ciencias del Deporte'] },
    { text: '¿Te interesa la política y la organización de la sociedad?', area: ['Ciencias Sociales'] },
    { text: '¿Disfrutas de la lectura, la pintura o la música?', area: ['Humanidades, Letras y artes'] },
    { text: '¿Te gustaría aprender sobre estrategia y defensa nacional?', area: ['Ciencias y Artes Militares'] },
    { text: '¿Te interesa el estudio de los ecosistemas marinos y terrestres?', area: ['Ciencias del Agro y del mar'] },
    { text: '¿Te imaginas programando software o aplicaciones?', area: ['Ingeniería, Arquitectura y Tecnología'] },
    { text: '¿Te gusta investigar la composición química de los materiales?', area: ['Ciencias Básicas'] },
  ].map((q) => ({ ...q, test_id: mainTest._id }));
  await Question.insertMany(questionsData);

  // Estudiante principal → Tecnología
  await TestResult.create({
    user: usuarios.estudiantePrincipal._id,
    results: buildScores('Ingeniería, Arquitectura y Tecnología'),
    interpretation:
      'Tu perfil muestra una fuerte afinidad por el área de Ingeniería, Arquitectura y Tecnología. ' +
      'Disfrutas resolver problemas y construir soluciones. Considera carreras técnicas y de innovación.',
  });

  // La mayoría de los extra completan el test (algunos no, para variedad)
  let conTest = 1;
  for (let i = 0; i < usuarios.estudiantes.length; i++) {
    if (i % 5 === 4) continue;
    const topArea = AREAS[i % AREAS.length];
    await TestResult.create({
      user: usuarios.estudiantes[i]._id,
      results: buildScores(topArea),
      interpretation: `Perfil con afinidad destacada hacia ${topArea}.`,
    });
    conTest++;
  }

  return { test: mainTest, preguntas: questionsData.length, resultados: conTest };
}

module.exports = { seedVocacional, AREAS };
