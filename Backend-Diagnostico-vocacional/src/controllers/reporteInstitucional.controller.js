const User = require('../models/user');
const Seccion = require('../models/Seccion');
const Materia = require('../models/Materia');
const TestResult = require('../models/result');
const { calcularLapsosBulk } = require('./academico.controller');
const { resumenInasistenciaBulk } = require('./asistencia.controller');
const { getConfig } = require('./config.controller');
const { ANIO_LABEL } = require('../data/curriculoMPPE');

// GET /api/admin/reporte-institucional — resumen académico agregado del plantel (superadmin).
exports.getReporteInstitucional = async (req, res) => {
    try {
        // El reporte se resuelve en solo DOS olas de consultas concurrentes (en vez
        // del N+1 anterior, que encadenaba materias + acumulados + asistencia por
        // cada sección en serie contra Atlas, multiplicando la latencia de red).

        // Ola 1: todo lo que NO depende de otra consulta, en paralelo.
        //   (materias y el agregado vocacional se traen del plantel completo; para
        //    una sola institución es un conjunto acotado y ahorra una ola entera.)
        const [cfg, estudiantes, docentes, hombres, mujeres, secciones, todasMaterias, vocacionalRaw] = await Promise.all([
            getConfig(),
            User.countDocuments({ role: 'estudiante' }),
            User.countDocuments({ role: 'docente' }),
            User.countDocuments({ role: 'estudiante', sexo: 'Hombre' }),
            User.countDocuments({ role: 'estudiante', sexo: 'Mujer' }),
            Seccion.find().populate('docente', 'name apellido').sort({ anio: 1, nombre: 1 }).lean(),
            Materia.find().select('_id seccion').lean(),
            TestResult.aggregate([
                { $project: { areas: { $objectToArray: '$results' } } },
                { $unwind: '$areas' },
                { $group: { _id: '$areas.k', count: { $sum: 1 } } },
                { $sort: { count: -1 } },
            ]),
        ]);
        const umbral = cfg.umbralInasistencia;
        const vocacional = vocacionalRaw.map(a => ({ area: a._id, cantidad: a.count }));

        const seccionIds = secciones.map(s => s._id);
        const materiasPorSeccion = new Map(); // seccionId -> [materiaIds]
        todasMaterias.forEach(m => {
            const sk = String(m.seccion);
            if (!materiasPorSeccion.has(sk)) materiasPorSeccion.set(sk, []);
            materiasPorSeccion.get(sk).push(m._id);
        });

        // Ola 2: acumulados de TODO el plantel en bloque + asistencia de todas las
        //   secciones, en paralelo (ambos dependen de la ola 1).
        const todosEstIds = [...new Set(secciones.flatMap(s => (s.estudiantes || []).map(String)))];
        const [bulk, inasPorSeccion] = await Promise.all([
            calcularLapsosBulk(todasMaterias.map(m => m._id), [1, 2, 3], todosEstIds),
            resumenInasistenciaBulk(seccionIds, umbral),
        ]);

        // 2.c Se arma cada sección en memoria, sin más consultas.
        const porSeccion = secciones.map(sec => {
            const materiaIds = materiasPorSeccion.get(String(sec._id)) || [];
            const estIds = (sec.estudiantes || []).map(e => e);
            let promedio = null, aprobados = 0, aplazados = 0;
            if (materiaIds.length && estIds.length) {
                const promesEst = [];
                estIds.forEach(estId => {
                    // definitiva por materia (promedio de 3 lapsos si están; si no, de lo cargado)
                    const defs = [];
                    materiaIds.forEach(mId => {
                        const vals = [1, 2, 3].map(l => bulk.get(`${String(mId)}|${l}|${String(estId)}`)?.acumulado).filter(v => v != null);
                        if (vals.length) defs.push(Math.round(vals.reduce((s, v) => s + v, 0) / vals.length));
                    });
                    if (defs.length) {
                        const promEst = Math.round(defs.reduce((s, v) => s + v, 0) / defs.length);
                        promesEst.push(promEst);
                        if (promEst >= 10) aprobados++; else aplazados++;
                    }
                });
                if (promesEst.length) promedio = Math.round(promesEst.reduce((s, v) => s + v, 0) / promesEst.length);
            }
            // asistencia (ya calculada en bloque)
            const inas = inasPorSeccion.get(String(sec._id));
            let sumaPct = 0, conteo = 0, enRiesgo = 0;
            if (inas) inas.forEach(r => { sumaPct += r.pct; conteo++; if (r.nivel === 'danger') enRiesgo++; });
            const inasistenciaPromedio = conteo ? Math.round(sumaPct / conteo) : 0;
            return {
                seccion: `${sec.anio}° ${sec.nombre}`,
                seccionId: sec._id,
                anio: sec.anio,
                etiquetaAnio: ANIO_LABEL[sec.anio],
                periodo: sec.periodo,
                docente: sec.docente ? `${sec.docente.name || ''} ${sec.docente.apellido || ''}`.trim() : '—',
                docenteId: sec.docente?._id,
                estudiantes: estIds.length,
                promedio,
                aprobados,
                aplazados,
                inasistenciaPromedio,
                enRiesgo,
            };
        });

        res.json({
            generadoEn: new Date(),
            totales: { estudiantes, docentes, secciones: secciones.length, hombres, mujeres },
            porSeccion,
            vocacional,
        });
    } catch (err) { console.error(err); res.status(500).json({ msg: 'Error al generar el reporte institucional' }); }
};
