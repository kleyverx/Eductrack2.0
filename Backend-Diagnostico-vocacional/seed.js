const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');

dotenv.config();

const User = require('./src/models/user');
const Test = require('./src/models/test');
const Question = require('./src/models/question');

const seed = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Conectado a MongoDB para el seeder...');

    // Limpiar base de datos
    await User.deleteMany({});
    await Test.deleteMany({});
    await Question.deleteMany({});
    console.log('Base de datos limpiada.');

    // Crear Usuarios
    const adminPassword = await bcrypt.hash('admin123', 10);
    const userPassword = await bcrypt.hash('usuario123', 10);

    const admin = await User.create({
      cedula: 11111111,
      password: adminPassword,
      role: 'admin',
      name: 'Admin',
      apellido: 'Principal',
      email: 'admin@test.com',
      telefono: '04141111111'
    });

    const student = await User.create({
      cedula: 22222222,
      password: userPassword,
      role: 'user',
      name: 'Estudiante',
      apellido: 'De Prueba',
      email: 'estudiante@test.com',
      telefono: '04142222222'
    });

    console.log('Usuarios creados.');

    // Crear un Test
    const mainTest = await Test.create({
      name: 'Test de Orientación Vocacional 2024',
      description: 'Prueba general para detectar áreas de interés profesional.',
      state: 'active',
      fechaInicio: new Date(),
      fechaFin: new Date(new Date().setFullYear(new Date().getFullYear() + 1)),
      duracion: 45
    });

    console.log('Test creado.');

    // Crear Preguntas
    const questionsData = [
      { text: '¿Te gusta resolver problemas matemáticos complejos?', area: ['Ciencias Básicas'], test_id: mainTest._id },
      { text: '¿Te interesa el diseño de edificios y estructuras?', area: ['Ingeniería, Arquitectura y Tecnología'], test_id: mainTest._id },
      { text: '¿Te gustaría trabajar en hospitales ayudando a enfermos?', area: ['Ciencias de la salud'], test_id: mainTest._id },
      { text: '¿Te apasiona la enseñanza y el entrenamiento deportivo?', area: ['Ciencias de la Educación y Ciencias del Deporte'], test_id: mainTest._id },
      { text: '¿Te interesa la política y la organización de la sociedad?', area: ['Ciencias Sociales'], test_id: mainTest._id },
      { text: '¿Disfrutas de la lectura, la pintura o la música?', area: ['Humanidades, Letras y artes'], test_id: mainTest._id },
      { text: '¿Te gustaría aprender sobre estrategia y defensa nacional?', area: ['Ciencias y Artes Militares'], test_id: mainTest._id },
      { text: '¿Te interesa el estudio de los ecosistemas marinos y terrestres?', area: ['Ciencias del Agro y del mar'], test_id: mainTest._id },
      { text: '¿Te imaginas programando software o aplicaciones?', area: ['Ingeniería, Arquitectura y Tecnología'], test_id: mainTest._id },
      { text: '¿Te gusta investigar la composición química de los materiales?', area: ['Ciencias Básicas'], test_id: mainTest._id }
    ];

    await Question.insertMany(questionsData);
    console.log('Preguntas creadas.');

    console.log('--- Seeding Completado con Éxito ---');
    await mongoose.disconnect();
  } catch (err) {
    console.error('Error durante el seeding:', err);
    process.exit(1);
  }
};

seed();
