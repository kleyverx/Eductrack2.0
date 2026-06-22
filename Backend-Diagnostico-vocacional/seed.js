/**
 * Seed MAESTRO — repobla toda la base de datos de demo en orden.
 * Ejecuta: usuarios → vocacional → académico.
 *
 *   node seed.js              → corre todo
 *   node seed.js usuarios     → solo usuarios
 *   node seed.js vocacional   → solo el test vocacional (requiere usuarios)
 *   node seed.js academico    → solo lo académico (requiere usuarios)
 *
 * Los seeds individuales viven en src/seeds/*.seed.js y son reutilizables.
 */
const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

const { seedUsuarios } = require('./src/seeds/usuarios.seed');
const { seedVocacional } = require('./src/seeds/vocacional.seed');
const { seedAcademico } = require('./src/seeds/academico.seed');
const User = require('./src/models/user');

const arg = (process.argv[2] || 'all').toLowerCase();

/** Reconstruye el objeto "usuarios" desde la BD (para seeds parciales). */
async function cargarUsuarios() {
  const superadmin = await User.findOne({ role: 'superadmin' });
  const docentes = await User.find({ role: 'docente' }).sort({ cedula: 1 });
  const estudiantePrincipal = await User.findOne({ cedula: 22222222 });
  const estudiantes = await User.find({ cedula: { $gte: 30000000, $lt: 40000000 } }).sort({ cedula: 1 });
  return { superadmin, docentes, estudiantePrincipal, estudiantes };
}

async function run() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Conectado a MongoDB para el seeder maestro...\n');

    let usuarios;

    if (arg === 'all' || arg === 'usuarios') {
      usuarios = await seedUsuarios();
      console.log(`✓ Usuarios: 1 superadmin, ${usuarios.docentes.length} docentes, ${1 + usuarios.estudiantes.length} estudiantes`);
    }

    if (arg === 'all' || arg === 'vocacional') {
      if (!usuarios) usuarios = await cargarUsuarios();
      const v = await seedVocacional(usuarios);
      console.log(`✓ Vocacional: test + ${v.preguntas} preguntas + ${v.resultados} resultados`);
    }

    if (arg === 'all' || arg === 'academico') {
      if (!usuarios) usuarios = await cargarUsuarios();
      const a = await seedAcademico(usuarios);
      console.log(`✓ Académico: ${a.secciones} secciones (1ro-4to), ${a.totalNotas} notas cargadas`);
      a.detalle.forEach((d) => console.log(`    - ${d}`));
    }

    console.log('\n--- Seeding Completado con Éxito ---');
    console.log('Credenciales (login por cédula):');
    console.log('  SUPERADMIN → 11111111 / super123');
    console.log('  DOCENTE    → 40000000 / docente123  (tiene secciones 1ro-4to con notas)');
    console.log('  ESTUDIANTE → 22222222 / estudiante123  (inscrito 1ro-4to, boletines L1/L2 publicados)');

    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error('Error durante el seeding:', err);
    process.exit(1);
  }
}

run();
