const User = require('../models/user');
const Seccion = require('../models/Seccion');
const Materia = require('../models/Materia');
const TestResult = require('../models/result');
const { calcularLapsosBulk } = require('./academico.controller');
const { resumenInasistencia } = require('./asistencia.controller');
const { getConfig } = require('./config.controller');
const { ANIO_LABEL } = require('../data/curriculoMPPE');

// GET /api/admin/reporte-institucional — resumen académico agregado del plantel (superadmin).
exports.getReporteInstitucional = async (req, res) => {
    try {
        const cfg = await getConfig();
        const umbral = cfg.umbralInasistencia;

        // 1. Totales
        const [estudiantes, docentes, hombres, mujeres] = await Promise.all([
            User.countDocuments({ role: 'estudiante' }),
            User.countDocuments({ role: 'docente' }),
            User.countDocuments({ role: 'estudiante', sexo: 'Hombre' }),
            User.countDocuments({ role: 'estudiante', sexo: 'Mujer' }),
        ]);

        // 2. Por sección (rendimiento + asistencia), en bloque por sección.
        const secciones = await Seccion.find().populate('docente', 'name apellido').sort({ anio: 1, nombre: 1 }).lean();
        const porSeccion = [];
        for (const sec of secciones) {
            const materias = await Materia.find({ seccion: sec._id }).select('_id').lean();
            const estIds = (sec.estudiantes || []).map(e => e);
            let promedio = null, aprobados = 0, aplazados = 0;
            if (materias.length && estIds.length) {
                const bulk = await calcularLapsosBulk(materias.map(m => m._id), [1, 2, 3], estIds);
                const promesEst = [];
                estIds.forEach(estId => {
                    // definitiva por materia (promedio de 3 lapsos si están; si no, de lo cargado)
                    const defs = [];
                    materias.forEach(m => {
                        const vals = [1, 2, 3].map(l => bulk.get(`${String(m._id)}|${l}|${String(estId)}`)?.acumulado).filter(v => v != null);
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
            // asistencia
            const inas = await resumenInasistencia(sec._id, umbral);
            let sumaPct = 0, conteo = 0, enRiesgo = 0;
            inas.forEach(r => { sumaPct += r.pct; conteo++; if (r.nivel === 'danger') enRiesgo++; });
            const inasistenciaPromedio = conteo ? Math.round(sumaPct / conteo) : 0;
            porSeccion.push({
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
            });
        }

        // 3. Vocacional (top áreas)
        const completedTests = await TestResult.countDocuments();
        let vocacional = [];
        if (completedTests > 0) {
            const raw = await TestResult.aggregate([
                { $project: { areas: { $objectToArray: '$results' } } },
                { $unwind: '$areas' },
                { $group: { _id: '$areas.k', count: { $sum: 1 } } },
                { $sort: { count: -1 } },
            ]);
            vocacional = raw.map(a => ({ area: a._id, cantidad: a.count }));
        }

        res.json({
            generadoEn: new Date(),
            totales: { estudiantes, docentes, secciones: secciones.length, hombres, mujeres },
            porSeccion,
            vocacional,
        });
    } catch (err) { console.error(err); res.status(500).json({ msg: 'Error al generar el reporte institucional' }); }
};
