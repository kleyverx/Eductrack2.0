const bcrypt = require('bcryptjs');
const User = require('../models/user');

/** Crea una fecha desplazada N meses hacia atrás desde hoy. */
const monthsAgo = (n) => {
  const d = new Date();
  d.setMonth(d.getMonth() - n);
  return d;
};

/**
 * Seed de USUARIOS: superadmin, docentes y estudiantes de prueba.
 * Contraseñas por rol (login por cédula):
 *   superadmin → super123 · docente → docente123 · estudiante → estudiante123
 *
 * @param {{ limpiar?: boolean }} opts  Si limpiar=true, borra todos los usuarios antes.
 * @returns {Promise<{superadmin, docentes:[], estudiantePrincipal, estudiantes:[]}>}
 */
async function seedUsuarios({ limpiar = true } = {}) {
  if (limpiar) await User.deleteMany({});

  const superPwd = await bcrypt.hash('super123', 10);
  const docentePwd = await bcrypt.hash('docente123', 10);
  const estPwd = await bcrypt.hash('estudiante123', 10);

  const superadmin = await User.create({
    cedula: 11111111, password: superPwd, role: 'superadmin',
    name: 'Admin', apellido: 'Principal', email: 'admin@test.com',
    telefono: '04141111111', sexo: 'Hombre', edad: 35,
  });

  const docentesSeed = [
    { cedula: 40000000, name: 'Profesora', apellido: 'González', email: 'docente1@test.com', telefono: '04144000000', sexo: 'Mujer', edad: 38 },
    { cedula: 40000001, name: 'Profesor', apellido: 'Ramírez', email: 'docente2@test.com', telefono: '04144000001', sexo: 'Hombre', edad: 45 },
  ];
  const docentes = [];
  for (const d of docentesSeed) {
    docentes.push(await User.create({ ...d, password: docentePwd, role: 'docente' }));
  }

  const estudiantePrincipal = await User.create({
    cedula: 22222222, password: estPwd, role: 'estudiante',
    name: 'Estudiante', apellido: 'De Prueba', email: 'estudiante@test.com',
    telefono: '04142222222', sexo: 'Mujer', edad: 17,
  });

  const extraSeed = [
    { name: 'Carlos', apellido: 'Marín', sexo: 'Hombre', edad: 16, m: 5 },
    { name: 'María', apellido: 'López', sexo: 'Mujer', edad: 18, m: 5 },
    { name: 'José', apellido: 'Hernández', sexo: 'Hombre', edad: 19, m: 4 },
    { name: 'Ana', apellido: 'Díaz', sexo: 'Mujer', edad: 17, m: 3 },
    { name: 'Luis', apellido: 'Castro', sexo: 'Hombre', edad: 16, m: 3 },
    { name: 'Sofía', apellido: 'Mendoza', sexo: 'Mujer', edad: 17, m: 2 },
    { name: 'Pedro', apellido: 'Rojas', sexo: 'Hombre', edad: 18, m: 1 },
    { name: 'Valentina', apellido: 'Suárez', sexo: 'Mujer', edad: 16, m: 1 },
    { name: 'Miguel', apellido: 'Torres', sexo: 'Hombre', edad: 17, m: 0 },
    { name: 'Camila', apellido: 'Flores', sexo: 'Mujer', edad: 18, m: 0 },
  ];

  const estudiantes = [];
  for (let i = 0; i < extraSeed.length; i++) {
    const s = extraSeed[i];
    estudiantes.push(await User.create({
      cedula: 30000000 + i, password: estPwd, role: 'estudiante',
      name: s.name, apellido: s.apellido,
      email: `estudiante${i}@test.com`, telefono: `0414300000${i}`,
      sexo: s.sexo, edad: s.edad, createdAt: monthsAgo(s.m),
    }));
  }

  return { superadmin, docentes, estudiantePrincipal, estudiantes };
}

module.exports = { seedUsuarios };
