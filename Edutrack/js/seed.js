/* =====================================================
   seed.js — Initial demo data
   Runs once on first load to populate the database
   ===================================================== */

const Seed = (() => {
  // Very simple hashing for demo only (not secure for prod)
  function hash(str) {
    let h = 0; for (let i = 0; i < str.length; i++) { h = ((h << 5) - h) + str.charCodeAt(i); h |= 0; }
    return 'h' + Math.abs(h).toString(36);
  }

  async function run() {
    const seeded = await DB.getMeta('seeded', false);
    if (seeded) return;

    // ---- Usuarios ----
    const adminId = await DB.add('usuarios', {
      username: 'admin', password: hash('admin'),
      name: 'Administrador', role: 'admin', email: 'admin@edutrack.local'
    });
    const docente1 = await DB.add('usuarios', {
      username: 'docente1', password: hash('1234'),
      name: 'Lucía Martínez', role: 'docente', email: 'lucia@edu.local'
    });
    const docente2 = await DB.add('usuarios', {
      username: 'docente2', password: hash('1234'),
      name: 'Carlos Pérez', role: 'docente', email: 'carlos@edu.local'
    });
    const est1 = await DB.add('usuarios', {
      username: 'estudiante1', password: hash('1234'),
      name: 'María Gómez', role: 'estudiante', email: 'maria@edu.local'
    });
    const est2 = await DB.add('usuarios', {
      username: 'estudiante2', password: hash('1234'),
      name: 'Diego Torres', role: 'estudiante', email: 'diego@edu.local'
    });
    const est3 = await DB.add('usuarios', {
      username: 'estudiante3', password: hash('1234'),
      name: 'Ana Ruiz', role: 'estudiante', email: 'ana@edu.local'
    });

    // ---- Materias ----
    const matMate = await DB.add('materias', {
      nombre: 'Matemáticas',         codigo: 'MAT-101', docenteId: docente1, notaAprobacion: 6.0, escala: 10
    });
    const matFis  = await DB.add('materias', {
      nombre: 'Física',              codigo: 'FIS-101', docenteId: docente1, notaAprobacion: 6.0, escala: 10
    });
    const matProg = await DB.add('materias', {
      nombre: 'Programación',        codigo: 'PRG-201', docenteId: docente2, notaAprobacion: 6.0, escala: 10
    });
    const matLit  = await DB.add('materias', {
      nombre: 'Literatura',          codigo: 'LIT-101', docenteId: docente2, notaAprobacion: 6.0, escala: 10
    });

    // ---- Evaluaciones ----
    const day = 24*60*60*1000;
    const now = Date.now();
    const ev = async (materiaId, nombre, peso, daysAgo, tipo='Examen') => {
      return DB.add('evaluaciones', {
        materiaId, nombre, peso, tipo,
        fechaEntrega: now - daysAgo*day,
        fechaCorreccion: null
      });
    };
    const evMate1 = await ev(matMate, 'Examen Parcial 1',  0.30, 60);
    const evMate2 = await ev(matMate, 'Trabajo Práctico',  0.20, 40, 'Trabajo');
    const evMate3 = await ev(matMate, 'Examen Parcial 2',  0.30, 15);
    const evMate4 = await ev(matMate, 'Final',             0.20,  0);

    const evFis1  = await ev(matFis,  'Laboratorio 1',     0.20, 55, 'Laboratorio');
    const evFis2  = await ev(matFis,  'Examen Parcial',    0.40, 30);
    const evFis3  = await ev(matFis,  'Laboratorio 2',     0.20, 12, 'Laboratorio');
    const evFis4  = await ev(matFis,  'Final',             0.20,  0);

    const evPrg1  = await ev(matProg, 'Proyecto 1',        0.30, 50, 'Proyecto');
    const evPrg2  = await ev(matProg, 'Examen Práctico',   0.30, 25);
    const evPrg3  = await ev(matProg, 'Proyecto Final',    0.40,  0, 'Proyecto');

    const evLit1  = await ev(matLit,  'Ensayo 1',          0.25, 50, 'Ensayo');
    const evLit2  = await ev(matLit,  'Examen Parcial',    0.30, 25);
    const evLit3  = await ev(matLit,  'Ensayo Final',      0.45,  0, 'Ensayo');

    // Mark some as graded with timestamps for feedback metrics
    const markCorr = async (id, daysAfterEntrega) => {
      const e = await DB.get('evaluaciones', id);
      e.fechaCorreccion = e.fechaEntrega + daysAfterEntrega*day;
      await DB.put('evaluaciones', e);
    };
    await markCorr(evMate1, 5);
    await markCorr(evMate2, 8);
    await markCorr(evMate3, 4);
    await markCorr(evFis1,  3);
    await markCorr(evFis2,  10);
    await markCorr(evFis3,  6);
    await markCorr(evPrg1,  7);
    await markCorr(evPrg2,  4);
    await markCorr(evLit1,  6);
    await markCorr(evLit2,  9);

    // ---- Notas ----
    const addNota = (estudianteId, evaluacionId, valor) =>
      DB.add('notas', { estudianteId, evaluacionId, valor, observacion: '' });

    // María — solid student trending up
    await addNota(est1, evMate1, 6.5);
    await addNota(est1, evMate2, 7.8);
    await addNota(est1, evMate3, 8.2);
    await addNota(est1, evFis1,  7.0);
    await addNota(est1, evFis2,  6.8);
    await addNota(est1, evFis3,  8.5);
    await addNota(est1, evPrg1,  9.0);
    await addNota(est1, evPrg2,  8.5);
    await addNota(est1, evLit1,  7.2);
    await addNota(est1, evLit2,  7.0);

    // Diego — at risk, declining
    await addNota(est2, evMate1, 6.2);
    await addNota(est2, evMate2, 5.5);
    await addNota(est2, evMate3, 4.8);
    await addNota(est2, evFis1,  5.2);
    await addNota(est2, evFis2,  4.5);
    await addNota(est2, evFis3,  4.8);
    await addNota(est2, evPrg1,  6.8);
    await addNota(est2, evPrg2,  5.5);
    await addNota(est2, evLit1,  6.0);
    await addNota(est2, evLit2,  5.0);

    // Ana — high performer
    await addNota(est3, evMate1, 8.5);
    await addNota(est3, evMate2, 9.2);
    await addNota(est3, evMate3, 9.0);
    await addNota(est3, evFis1,  8.8);
    await addNota(est3, evFis2,  9.0);
    await addNota(est3, evFis3,  9.5);
    await addNota(est3, evPrg1,  9.8);
    await addNota(est3, evPrg2,  9.4);
    await addNota(est3, evLit1,  9.0);
    await addNota(est3, evLit2,  8.8);

    // Some feedback comments
    await DB.add('feedback', {
      evaluacionId: evMate1, estudianteId: est2, docenteId: docente1,
      texto: 'Repasar derivadas y aplicar regla de la cadena. Buen análisis del problema 3.',
      tipo: 'mejora'
    });
    await DB.add('feedback', {
      evaluacionId: evMate3, estudianteId: est2, docenteId: docente1,
      texto: 'Atención: bajada notable. Reservar tutoría.',
      tipo: 'alerta'
    });
    await DB.add('feedback', {
      evaluacionId: evPrg1, estudianteId: est1, docenteId: docente2,
      texto: 'Excelente arquitectura. Considerar separar capas.',
      tipo: 'positivo'
    });

    await DB.setMeta('seeded', true);
    await DB.setMeta('createdAt', Date.now());
  }

  return { run, hash };
})();
