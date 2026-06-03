const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');

dotenv.config();

const User = require('./src/models/user');
const Test = require('./src/models/test');
const Question = require('./src/models/question');
const TestResult = require('./src/models/result');

// Las 8 áreas de conocimiento del sistema.
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

/** Crea una fecha desplazada N meses hacia atrás desde hoy. */
const monthsAgo = (n) => {
  const d = new Date();
  d.setMonth(d.getMonth() - n);
  return d;
};

const seed = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Conectado a MongoDB para el seeder...');

    // Limpiar base de datos
    await User.deleteMany({});
    await Test.deleteMany({});
    await Question.deleteMany({});
    await TestResult.deleteMany({});
    console.log('Base de datos limpiada.');

    // ---- Contraseñas por rol ----
    const superPassword = await bcrypt.hash('super123', 10);
    const docentePassword = await bcrypt.hash('docente123', 10);
    const estudiantePassword = await bcrypt.hash('estudiante123', 10);

    // ---- SuperAdmin ----
    await User.create({
      cedula: 11111111,
      password: superPassword,
      role: 'superadmin',
      name: 'Admin',
      apellido: 'Principal',
      email: 'admin@test.com',
      telefono: '04141111111',
      sexo: 'Hombre',
      edad: 35,
    });

    // ---- Docentes ----
    const docentesSeed = [
      { cedula: 40000000, name: 'Profesora', apellido: 'González', email: 'docente1@test.com', telefono: '04144000000', sexo: 'Mujer', edad: 38 },
      { cedula: 40000001, name: 'Profesor', apellido: 'Ramírez', email: 'docente2@test.com', telefono: '04144000001', sexo: 'Hombre', edad: 45 },
    ];
    for (const d of docentesSeed) {
      await User.create({ ...d, password: docentePassword, role: 'docente' });
    }

    // ---- Estudiante principal de prueba ----
    const student = await User.create({
      cedula: 22222222,
      password: estudiantePassword,
      role: 'estudiante',
      name: 'Estudiante',
      apellido: 'De Prueba',
      email: 'estudiante@test.com',
      telefono: '04142222222',
      sexo: 'Mujer',
      edad: 17,
    });

    // ---- Estudiantes adicionales (volumen y variedad para el dashboard global) ----
    const extraSeed = [
      { name: 'Carlos', sexo: 'Hombre', edad: 16, m: 5 },
      { name: 'María', sexo: 'Mujer', edad: 18, m: 5 },
      { name: 'José', sexo: 'Hombre', edad: 19, m: 4 },
      { name: 'Ana', sexo: 'Mujer', edad: 17, m: 3 },
      { name: 'Luis', sexo: 'Hombre', edad: 22, m: 3 },
      { name: 'Sofía', sexo: 'Mujer', edad: 20, m: 2 },
      { name: 'Pedro', sexo: 'Hombre', edad: 24, m: 1 },
      { name: 'Valentina', sexo: 'Mujer', edad: 16, m: 1 },
      { name: 'Miguel', sexo: 'Hombre', edad: 28, m: 0 },
      { name: 'Camila', sexo: 'Mujer', edad: 18, m: 0 },
    ];

    const extraStudents = [];
    for (let i = 0; i < extraSeed.length; i++) {
      const s = extraSeed[i];
      const u = await User.create({
        cedula: 30000000 + i,
        password: estudiantePassword,
        role: 'estudiante',
        name: s.name,
        apellido: 'Estudiante',
        email: `estudiante${i}@test.com`,
        telefono: `0414300000${i}`,
        sexo: s.sexo,
        edad: s.edad,
        createdAt: monthsAgo(s.m),
      });
      extraStudents.push(u);
    }

    console.log(`Usuarios creados: 1 superadmin, ${docentesSeed.length} docentes, ${1 + extraStudents.length} estudiantes.`);

    // ---- Test ----
    const mainTest = await Test.create({
      name: 'Test de Orientación Vocacional 2024',
      description: 'Prueba general para detectar áreas de interés profesional.',
      state: 'active',
      fechaInicio: new Date(),
      fechaFin: new Date(new Date().setFullYear(new Date().getFullYear() + 1)),
      duracion: 45,
    });
    console.log('Test creado.');

    // ---- Preguntas (cubren las 8 áreas) ----
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
    console.log('Preguntas creadas.');

    // ---- Resultados vocacionales ----
    const buildScores = (topArea) => {
      const scores = {};
      AREAS.forEach((a) => {
        scores[a] = 5 + Math.round((AREAS.indexOf(a) * 7) % 11);
      });
      scores[topArea] = 30;
      return scores;
    };

    await TestResult.create({
      user: student._id,
      results: buildScores('Ingeniería, Arquitectura y Tecnología'),
      interpretation:
        'Tu perfil muestra una fuerte afinidad por el área de Ingeniería, Arquitectura y Tecnología. ' +
        'Disfrutas resolver problemas y construir soluciones. Considera carreras técnicas y de innovación.',
    });

    for (let i = 0; i < extraStudents.length; i++) {
      if (i % 5 === 4) continue; // dejar algunos sin test (tests pendientes)
      const topArea = AREAS[i % AREAS.length];
      await TestResult.create({
        user: extraStudents[i]._id,
        results: buildScores(topArea),
        interpretation: `Perfil con afinidad destacada hacia ${topArea}.`,
      });
    }
    console.log('Resultados vocacionales creados.');

    console.log('\n--- Seeding Completado con Éxito ---');
    console.log('Credenciales de acceso (login por cédula):');
    console.log('  SUPERADMIN → cédula: 11111111  contraseña: super123');
    console.log('  DOCENTE 1  → cédula: 40000000  contraseña: docente123');
    console.log('  DOCENTE 2  → cédula: 40000001  contraseña: docente123');
    console.log('  ESTUDIANTE → cédula: 22222222  contraseña: estudiante123');
    console.log('\nNota: las materias y notas académicas se cargan aparte desde');
    console.log('el botón "Cargar datos de prueba" en el dashboard (Dexie/local).');

    await mongoose.disconnect();
  } catch (err) {
    console.error('Error durante el seeding:', err);
    process.exit(1);
  }
};

seed();
