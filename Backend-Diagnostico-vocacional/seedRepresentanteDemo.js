/**
 * Seeder de DEMO para una presentación: crea (o actualiza) UN representante
 * limpio, SIN vinculación de Telegram, que puede ver a DOS alumnos con datos
 * reales (notas + asistencia + perfil vocacional).
 *
 * Es ADITIVO e IDEMPOTENTE: no borra nada de la base y se puede correr las veces
 * que haga falta. Ideal para preparar una demo sin tocar el resto de los datos.
 *
 *   node seedRepresentanteDemo.js                      → cédula 12345678 / demo123
 *   node seedRepresentanteDemo.js 87654321 miClave     → cédula y clave a medida
 *
 * Elige automáticamente dos estudiantes que estén inscritos en secciones (para
 * que tengan contenido); prefiere 22222222 y 30000001 —que en el seed de demo
 * tienen boletines publicados e inasistencia en rojo— y si no, toma los primeros
 * dos estudiantes con datos.
 */
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');
dotenv.config();

const User = require('./src/models/user');
const Seccion = require('./src/models/Seccion');

const CEDULA = Number(process.argv[2]) || 12345678;
const PASSWORD = process.argv[3] || 'demo123';

const nombreDe = (e) => `${e.name || ''} ${e.apellido || ''}`.trim() || `C.I. ${e.cedula}`;

/** Escoge dos estudiantes con datos: inscritos en alguna sección, con preferencias. */
async function elegirDosAlumnos() {
  const secciones = await Seccion.find().select('estudiantes').lean();
  const inscritos = new Set(secciones.flatMap((s) => (s.estudiantes || []).map(String)));

  // Preferir estudiantes inscritos (tienen notas/asistencia); si no hay, cualquiera.
  let candidatos = inscritos.size
    ? await User.find({ role: 'estudiante', _id: { $in: [...inscritos] } })
        .select('name apellido cedula').sort({ cedula: 1 }).lean()
    : [];
  if (candidatos.length < 2) {
    candidatos = await User.find({ role: 'estudiante' })
      .select('name apellido cedula').sort({ cedula: 1 }).lean();
  }
  if (candidatos.length < 2) {
    throw new Error(
      'Se necesitan al menos 2 estudiantes en la base. Corre primero el seed maestro: node seed.js'
    );
  }

  // Preferencias para una demo con datos contrastantes (boletines + semáforo rojo).
  const porCedula = (c) => candidatos.find((e) => e.cedula === c);
  const elegidos = [];
  const agregar = (e) => {
    if (e && elegidos.length < 2 && !elegidos.some((x) => String(x._id) === String(e._id))) elegidos.push(e);
  };
  agregar(porCedula(22222222));
  agregar(porCedula(30000001));
  for (const c of candidatos) agregar(c);
  return elegidos.slice(0, 2);
}

async function run() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Conectado a MongoDB…\n');

    // No pisar una cédula que ya use otro rol.
    const existente = await User.findOne({ cedula: CEDULA });
    if (existente && existente.role !== 'representante') {
      throw new Error(
        `La cédula ${CEDULA} ya pertenece a un usuario con rol "${existente.role}". ` +
        `Elige otra cédula: node seedRepresentanteDemo.js <cedula> <password>`
      );
    }

    const [a, b] = await elegirDosAlumnos();
    const password = await bcrypt.hash(PASSWORD, 10);

    // Representante limpio: sin Telegram (telegramChatId/telegramCodigo se dejan sin
    // valor). Aditivo/idempotente: crea si no existe, actualiza si ya está.
    const representante = await User.findOneAndUpdate(
      { cedula: CEDULA },
      {
        $set: {
          role: 'representante',
          password,
          name: 'Representante',
          apellido: 'Demo',
          representados: [a._id, b._id],
        },
        $unset: { telegramChatId: '', telegramCodigo: '' },
      },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );

    console.log('--- Representante de demo listo ---');
    console.log(`  ${existente ? 'Actualizado' : 'Creado'} (login por cédula):`);
    console.log(`  REPRESENTANTE → ${CEDULA} / ${PASSWORD}`);
    console.log('  Telegram: SIN vincular ✓');
    console.log('  Ve a estos 2 alumnos:');
    console.log(`    1. ${nombreDe(a)}  (C.I. ${a.cedula})`);
    console.log(`    2. ${nombreDe(b)}  (C.I. ${b.cedula})`);
    console.log(`\n  id representante: ${representante._id}`);

    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error('Error en el seeder de representante:', err.message);
    process.exit(1);
  }
}

run();
