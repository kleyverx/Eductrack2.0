const Seccion = require('../models/Seccion');
const Materia = require('../models/Materia');
const PlanEvaluacion = require('../models/PlanEvaluacion');
const Nota = require('../models/Nota');
const User = require('../models/user');
const BoletinPublicado = require('../models/BoletinPublicado');
const { CURRICULO, ANIO_LABEL } = require('../data/curriculoMPPE');

/* ============================================================
 * Helpers
 * ============================================================ */

/** Verifica que la sección exista y pertenezca al docente autenticado. */
async function getSeccionPropia(seccionId, docenteId) {
    const seccion = await Seccion.findById(seccionId);
    if (!seccion) return { error: { status: 404, msg: 'Sección no encontrada' } };
    if (String(seccion.docente) !== String(docenteId)) {
        return { error: { status: 403, msg: 'Esta sección no te pertenece' } };
    }
    return { seccion };
}

/** Verifica que la materia exista y pertenezca al docente autenticado. */
async function getMateriaPropia(materiaId, docenteId) {
    const materia = await Materia.findById(materiaId);
    if (!materia) return { error: { status: 404, msg: 'Materia no encontrada' } };
    if (String(materia.docente) !== String(docenteId)) {
        return { error: { status: 403, msg: 'Esta materia no te pertenece' } };
    }
    return { materia };
}

/**
 * Calcula acumulados de MUCHAS materias × lapsos × estudiantes en bloque,
 * con solo 2 consultas a Mongo (todos los planes + todas las notas), en vez de
 * 2 consultas por cada materia/lapso. Esencial para evitar el problema N+1
 * cuando hay muchas secciones/materias (la latencia a Atlas se multiplicaba).
 *
 * @param {Array} materiaIds
 * @param {number[]} lapsos   ej. [1,2,3] o [1]
 * @param {Array} estudianteIds
 * @returns {Map<string, {acumulado:number|null, evaluado:number}>}
 *          clave = `${materiaId}|${lapso}|${estudianteId}`
 */
async function calcularLapsosBulk(materiaIds, lapsos, estudianteIds) {
    const estSet = estudianteIds.map(String);
    const out = new Map();
    const key = (m, l, e) => `${m}|${l}|${e}`;
    materiaIds.forEach(m => lapsos.forEach(l => estSet.forEach(e => out.set(key(m, l, e), { acumulado: null, evaluado: 0 }))));

    if (!materiaIds.length || !estudianteIds.length) return out;

    // Peso de cada actividad, por materia+lapso (1 consulta).
    const planes = await PlanEvaluacion.find({ materia: { $in: materiaIds }, lapso: { $in: lapsos } }).lean();
    const pesoActividad = new Map(); // actividadId -> { peso, materia, lapso }
    planes.forEach(p => p.actividades.forEach(a =>
        pesoActividad.set(String(a._id), { peso: a.ponderacion, materia: String(p.materia), lapso: p.lapso })
    ));

    // Todas las notas relevantes (1 consulta).
    const notas = await Nota.find({
        materia: { $in: materiaIds },
        lapso: { $in: lapsos },
        estudiante: { $in: estudianteIds },
    }).lean();

    notas.forEach(n => {
        const info = pesoActividad.get(String(n.actividad));
        if (!info) return; // actividad eliminada del plan
        const k = key(String(n.materia), n.lapso, String(n.estudiante));
        const r = out.get(k);
        if (!r) return;
        r.acumulado = (r.acumulado ?? 0) + n.valor * (info.peso / 100);
        r.evaluado += info.peso;
    });

    out.forEach(r => { if (r.acumulado !== null) r.acumulado = Math.round(r.acumulado * 100) / 100; });
    return out;
}

/* ============================================================
 * Presets (currículo MPPE)
 * ============================================================ */

exports.getPresets = (req, res) => {
    res.json({ curriculo: CURRICULO, etiquetas: ANIO_LABEL });
};

/* ============================================================
 * Secciones (docente)
 * ============================================================ */

exports.crearSeccion = async (req, res) => {
    try {
        const { nombre, anio, periodo, materias } = req.body;
        if (!nombre || !anio || !periodo) {
            return res.status(400).json({ msg: 'nombre, anio y periodo son requeridos' });
        }
        if (!CURRICULO[anio]) {
            return res.status(400).json({ msg: 'El año debe estar entre 1 y 5' });
        }

        const seccion = await Seccion.create({
            nombre, anio, periodo,
            docente: req.user.id,
            estudiantes: [],
        });

        // Materias: usa las enviadas o el preset oficial del año.
        const base = (Array.isArray(materias) && materias.length > 0) ? materias : CURRICULO[anio];
        const docs = base.map(m => ({
            nombre: m.nombre,
            horas: m.horas || 0,
            seccion: seccion._id,
            docente: req.user.id,
        }));
        await Materia.insertMany(docs);

        const creadas = await Materia.find({ seccion: seccion._id }).sort({ nombre: 1 });
        res.status(201).json({ seccion, materias: creadas });
    } catch (err) {
        if (err.code === 11000) {
            return res.status(400).json({ msg: 'Ya tienes una sección con ese nombre, año y período' });
        }
        console.error(err);
        res.status(500).json({ msg: 'Error al crear la sección' });
    }
};

exports.listarSecciones = async (req, res) => {
    try {
        const secciones = await Seccion.find({ docente: req.user.id }).sort({ anio: 1, nombre: 1 }).lean();
        // Conteo de materias por sección
        const ids = secciones.map(s => s._id);
        const materias = await Materia.aggregate([
            { $match: { seccion: { $in: ids } } },
            { $group: { _id: '$seccion', total: { $sum: 1 } } }
        ]);
        const conteo = new Map(materias.map(m => [String(m._id), m.total]));
        res.json(secciones.map(s => ({
            ...s,
            totalEstudiantes: s.estudiantes.length,
            totalMaterias: conteo.get(String(s._id)) || 0,
            etiquetaAnio: ANIO_LABEL[s.anio],
        })));
    } catch (err) {
        console.error(err);
        res.status(500).json({ msg: 'Error al listar secciones' });
    }
};

exports.getSeccion = async (req, res) => {
    try {
        const { seccion, error } = await getSeccionPropia(req.params.id, req.user.id);
        if (error) return res.status(error.status).json({ msg: error.msg });

        await seccion.populate('estudiantes', 'name apellido cedula email');
        const materias = await Materia.find({ seccion: seccion._id }).sort({ nombre: 1 });
        res.json({ seccion, materias, etiquetaAnio: ANIO_LABEL[seccion.anio] });
    } catch (err) {
        console.error(err);
        res.status(500).json({ msg: 'Error al obtener la sección' });
    }
};

exports.eliminarSeccion = async (req, res) => {
    try {
        const { seccion, error } = await getSeccionPropia(req.params.id, req.user.id);
        if (error) return res.status(error.status).json({ msg: error.msg });

        const materias = await Materia.find({ seccion: seccion._id }).select('_id');
        const materiaIds = materias.map(m => m._id);
        await Nota.deleteMany({ materia: { $in: materiaIds } });
        await PlanEvaluacion.deleteMany({ materia: { $in: materiaIds } });
        await Materia.deleteMany({ seccion: seccion._id });
        await BoletinPublicado.deleteMany({ seccion: seccion._id });
        await seccion.deleteOne();
        res.json({ msg: 'Sección eliminada con sus materias, planes y notas' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ msg: 'Error al eliminar la sección' });
    }
};

/* ============================================================
 * Estudiantes de la sección
 * ============================================================ */

exports.asignarEstudiantes = async (req, res) => {
    try {
        const { seccion, error } = await getSeccionPropia(req.params.id, req.user.id);
        if (error) return res.status(error.status).json({ msg: error.msg });

        const { estudiantes } = req.body; // array de ids
        if (!Array.isArray(estudiantes) || estudiantes.length === 0) {
            return res.status(400).json({ msg: 'Envía un array de ids de estudiantes' });
        }
        // Validar que sean usuarios con rol estudiante
        const validos = await User.find({ _id: { $in: estudiantes }, role: 'estudiante' }).select('_id');
        const idsValidos = validos.map(v => v._id);

        await Seccion.updateOne(
            { _id: seccion._id },
            { $addToSet: { estudiantes: { $each: idsValidos } } }
        );
        const actualizada = await Seccion.findById(seccion._id).populate('estudiantes', 'name apellido cedula email');
        res.json({ msg: `${idsValidos.length} estudiante(s) asignado(s)`, seccion: actualizada });
    } catch (err) {
        console.error(err);
        res.status(500).json({ msg: 'Error al asignar estudiantes' });
    }
};

exports.removerEstudiante = async (req, res) => {
    try {
        const { seccion, error } = await getSeccionPropia(req.params.id, req.user.id);
        if (error) return res.status(error.status).json({ msg: error.msg });

        await Seccion.updateOne({ _id: seccion._id }, { $pull: { estudiantes: req.params.estudianteId } });
        res.json({ msg: 'Estudiante removido de la sección' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ msg: 'Error al remover estudiante' });
    }
};

/* ============================================================
 * Materias
 * ============================================================ */

exports.agregarMateria = async (req, res) => {
    try {
        const { seccion, error } = await getSeccionPropia(req.params.id, req.user.id);
        if (error) return res.status(error.status).json({ msg: error.msg });

        const { nombre, horas } = req.body;
        if (!nombre) return res.status(400).json({ msg: 'El nombre es requerido' });

        const materia = await Materia.create({
            nombre: nombre.trim(), horas: horas || 0,
            seccion: seccion._id, docente: req.user.id,
        });
        res.status(201).json(materia);
    } catch (err) {
        if (err.code === 11000) return res.status(400).json({ msg: 'Esa materia ya existe en la sección' });
        console.error(err);
        res.status(500).json({ msg: 'Error al agregar la materia' });
    }
};

exports.eliminarMateria = async (req, res) => {
    try {
        const { materia, error } = await getMateriaPropia(req.params.id, req.user.id);
        if (error) return res.status(error.status).json({ msg: error.msg });

        await Nota.deleteMany({ materia: materia._id });
        await PlanEvaluacion.deleteMany({ materia: materia._id });
        await materia.deleteOne();
        res.json({ msg: 'Materia eliminada con su plan y notas' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ msg: 'Error al eliminar la materia' });
    }
};

/* ============================================================
 * Plan de Evaluación
 * ============================================================ */

exports.getPlan = async (req, res) => {
    try {
        const { materia, error } = await getMateriaPropia(req.params.id, req.user.id);
        if (error) return res.status(error.status).json({ msg: error.msg });

        const lapso = Number(req.params.lapso);
        const plan = await PlanEvaluacion.findOne({ materia: materia._id, lapso });
        res.json(plan || { materia: materia._id, lapso, actividades: [], publicado: false });
    } catch (err) {
        console.error(err);
        res.status(500).json({ msg: 'Error al obtener el plan' });
    }
};

exports.guardarPlan = async (req, res) => {
    try {
        const { materia, error } = await getMateriaPropia(req.params.id, req.user.id);
        if (error) return res.status(error.status).json({ msg: error.msg });

        const lapso = Number(req.params.lapso);
        if (![1, 2, 3].includes(lapso)) return res.status(400).json({ msg: 'Lapso inválido (1, 2 o 3)' });

        const { actividades = [], publicado = false } = req.body;
        const total = actividades.reduce((s, a) => s + Number(a.ponderacion || 0), 0);
        if (actividades.length > 0 && total !== 100) {
            return res.status(400).json({ msg: `Las ponderaciones deben sumar 100% (actual: ${total}%)` });
        }

        const plan = await PlanEvaluacion.findOneAndUpdate(
            { materia: materia._id, lapso },
            { actividades, publicado },
            { new: true, upsert: true, runValidators: true }
        );
        res.json(plan);
    } catch (err) {
        console.error(err);
        res.status(500).json({ msg: err.message || 'Error al guardar el plan' });
    }
};

/* ============================================================
 * Notas
 * ============================================================ */

/** Cuadrícula completa: estudiantes de la sección × actividades del plan. */
exports.getNotasGrid = async (req, res) => {
    try {
        const { materia, error } = await getMateriaPropia(req.params.id, req.user.id);
        if (error) return res.status(error.status).json({ msg: error.msg });

        const lapso = Number(req.params.lapso);
        // Sección, plan y notas en paralelo (3 consultas, no secuenciales).
        const [seccion, plan, notas] = await Promise.all([
            Seccion.findById(materia.seccion).populate('estudiantes', 'name apellido cedula').lean(),
            PlanEvaluacion.findOne({ materia: materia._id, lapso }).lean(),
            Nota.find({ materia: materia._id, lapso }).lean(),
        ]);

        const notasMap = {}; // estudianteId -> { actividadId: valor }
        notas.forEach(n => {
            const e = String(n.estudiante);
            (notasMap[e] ||= {})[String(n.actividad)] = n.valor;
        });

        // Acumulado por estudiante calculado en memoria (sin más consultas).
        const pesos = new Map((plan?.actividades || []).map(a => [String(a._id), a.ponderacion]));
        const calcAcum = (notasEst) => {
            let acumulado = null, evaluado = 0;
            for (const [actId, valor] of Object.entries(notasEst || {})) {
                const peso = pesos.get(actId);
                if (peso === undefined) continue;
                acumulado = (acumulado ?? 0) + valor * (peso / 100);
                evaluado += peso;
            }
            return { acumulado: acumulado !== null ? Math.round(acumulado * 100) / 100 : null, evaluado };
        };

        res.json({
            materia,
            lapso,
            plan: plan || { actividades: [], publicado: false },
            estudiantes: seccion.estudiantes.map(e => {
                const r = calcAcum(notasMap[String(e._id)]);
                return {
                    _id: e._id,
                    name: e.name,
                    apellido: e.apellido,
                    cedula: e.cedula,
                    notas: notasMap[String(e._id)] || {},
                    acumulado: r.acumulado,
                    evaluado: r.evaluado,
                };
            }),
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ msg: 'Error al obtener las notas' });
    }
};

/** Guardado en lote: [{ estudiante, actividad, valor|null }] (null elimina la nota). */
exports.guardarNotas = async (req, res) => {
    try {
        const { materia, error } = await getMateriaPropia(req.params.id, req.user.id);
        if (error) return res.status(error.status).json({ msg: error.msg });

        const lapso = Number(req.params.lapso);
        const { notas } = req.body;
        if (!Array.isArray(notas)) return res.status(400).json({ msg: 'Envía un array de notas' });

        const plan = await PlanEvaluacion.findOne({ materia: materia._id, lapso });
        if (!plan || plan.actividades.length === 0) {
            return res.status(400).json({ msg: 'Primero define el plan de evaluación de este lapso' });
        }
        const actividadesValidas = new Set(plan.actividades.map(a => String(a._id)));

        let guardadas = 0, eliminadas = 0, invalidas = 0;
        for (const n of notas) {
            if (!actividadesValidas.has(String(n.actividad))) { invalidas++; continue; }
            if (n.valor === null || n.valor === '' || n.valor === undefined) {
                const del = await Nota.deleteOne({ estudiante: n.estudiante, actividad: n.actividad });
                if (del.deletedCount) eliminadas++;
                continue;
            }
            const valor = Number(n.valor);
            if (Number.isNaN(valor) || valor < 1 || valor > 20) { invalidas++; continue; }
            await Nota.findOneAndUpdate(
                { estudiante: n.estudiante, actividad: n.actividad },
                { estudiante: n.estudiante, materia: materia._id, lapso, actividad: n.actividad, valor, docente: req.user.id },
                { upsert: true, new: true }
            );
            guardadas++;
        }
        res.json({ msg: `Notas guardadas: ${guardadas}, eliminadas: ${eliminadas}, inválidas: ${invalidas}` });
    } catch (err) {
        console.error(err);
        res.status(500).json({ msg: 'Error al guardar las notas' });
    }
};

/* ============================================================
 * Vista del estudiante
 * ============================================================ */

/** Materias del estudiante con su acumulado por lapso y definitiva. */
exports.misMaterias = async (req, res) => {
    try {
        const userId = req.user.id;
        const secciones = await Seccion.find({ estudiantes: userId })
            .populate('docente', 'name apellido')
            .lean();

        // Todas las materias de sus secciones (1 consulta).
        const seccionIds = secciones.map(s => s._id);
        const materias = await Materia.find({ seccion: { $in: seccionIds } }).sort({ nombre: 1 }).lean();
        const materiaIds = materias.map(m => m._id);

        // Todos los planes y todas las notas del estudiante (2 consultas) en bloque,
        // en vez de consultar por materia×lapso (evita el problema N+1).
        const planes = await PlanEvaluacion.find({ materia: { $in: materiaIds } }).lean();
        const notas = await Nota.find({ materia: { $in: materiaIds }, estudiante: userId }).lean();

        // Índices en memoria: peso de cada actividad y notas por materia/lapso.
        const pesoActividad = new Map();   // actividadId -> ponderación
        planes.forEach(p => p.actividades.forEach(a => pesoActividad.set(String(a._id), a.ponderacion)));

        // acumulados[materiaId][lapso] = { acumulado, evaluado }
        const acumulados = {};
        notas.forEach(n => {
            const peso = pesoActividad.get(String(n.actividad));
            if (peso === undefined) return;
            const mid = String(n.materia);
            if (!acumulados[mid]) acumulados[mid] = {};
            if (!acumulados[mid][n.lapso]) acumulados[mid][n.lapso] = { acumulado: 0, evaluado: 0 };
            acumulados[mid][n.lapso].acumulado += n.valor * (peso / 100);
            acumulados[mid][n.lapso].evaluado += peso;
        });

        const getLapso = (mid, lapso) => {
            const r = acumulados[mid]?.[lapso];
            return r ? { acumulado: Math.round(r.acumulado * 100) / 100, evaluado: r.evaluado } : { acumulado: null, evaluado: 0 };
        };

        // Materias agrupadas por sección.
        const porSeccion = new Map(seccionIds.map(id => [String(id), []]));
        materias.forEach(materia => {
            const mid = String(materia._id);
            const lapsos = { 1: getLapso(mid, 1), 2: getLapso(mid, 2), 3: getLapso(mid, 3) };
            const valores = [1, 2, 3].map(l => lapsos[l].acumulado).filter(v => v !== null);
            const definitiva = valores.length === 3 ? Math.round(valores.reduce((s, v) => s + v, 0) / 3) : null;
            porSeccion.get(String(materia.seccion))?.push({ ...materia, lapsos, definitiva });
        });

        const resultado = secciones.map(seccion => ({
            seccion: {
                _id: seccion._id,
                nombre: seccion.nombre,
                anio: seccion.anio,
                etiquetaAnio: ANIO_LABEL[seccion.anio],
                periodo: seccion.periodo,
                docente: seccion.docente,
            },
            materias: porSeccion.get(String(seccion._id)) || [],
        }));

        res.json(resultado);
    } catch (err) {
        console.error(err);
        res.status(500).json({ msg: 'Error al obtener tus materias' });
    }
};

/* ============================================================
 * Preinforme: resumen de la sección por lapso (docente)
 * ============================================================ */

/** Matriz estudiantes × materias con acumulados del lapso y promedio por estudiante. */
exports.resumenSeccion = async (req, res) => {
    try {
        const { seccion, error } = await getSeccionPropia(req.params.id, req.user.id);
        if (error) return res.status(error.status).json({ msg: error.msg });

        const lapso = Number(req.params.lapso);
        if (![1, 2, 3].includes(lapso)) return res.status(400).json({ msg: 'Lapso inválido' });

        await seccion.populate('estudiantes', 'name apellido cedula');
        const materias = await Materia.find({ seccion: seccion._id }).sort({ nombre: 1 });
        const estudianteIds = seccion.estudiantes.map(e => e._id);

        // Acumulados de todas las materias × estudiantes en bloque (2 consultas).
        const bulk = await calcularLapsosBulk(materias.map(m => m._id), [lapso], estudianteIds);

        const filas = seccion.estudiantes.map(e => {
            const notas = materias.map(m => ({
                materiaId: m._id,
                acumulado: bulk.get(`${String(m._id)}|${lapso}|${String(e._id)}`)?.acumulado ?? null,
            }));
            const valores = notas.map(n => n.acumulado).filter(v => v !== null);
            const promedio = valores.length
                ? Math.round((valores.reduce((s, v) => s + v, 0) / valores.length) * 100) / 100
                : null;
            return {
                estudiante: { _id: e._id, name: e.name, apellido: e.apellido, cedula: e.cedula },
                notas,
                promedio,
            };
        });

        res.json({
            seccion: { _id: seccion._id, nombre: seccion.nombre, anio: seccion.anio, periodo: seccion.periodo },
            etiquetaAnio: ANIO_LABEL[seccion.anio],
            lapso,
            materias: materias.map(m => ({ _id: m._id, nombre: m.nombre })),
            filas,
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ msg: 'Error al generar el resumen' });
    }
};

/* ============================================================
 * Certificación de Calificaciones (1ro a 4to año — estándar OPSU)
 * ============================================================ */

exports.certificacion = async (req, res) => {
    try {
        const estudianteId = req.params.id;

        // Permiso: superadmin, o docente que tenga al estudiante en alguna sección suya.
        if (req.user.role === 'docente') {
            const tiene = await Seccion.findOne({ docente: req.user.id, estudiantes: estudianteId });
            if (!tiene) return res.status(403).json({ msg: 'Este estudiante no pertenece a tus secciones' });
        }

        const estudiante = await User.findById(estudianteId).select('name apellido cedula');
        if (!estudiante) return res.status(404).json({ msg: 'Estudiante no encontrado' });

        // Solo 1ro a 4to año (la certificación para universidades excluye 5to).
        const secciones = await Seccion.find({ estudiantes: estudianteId, anio: { $lte: 4 } }).sort({ anio: 1 }).lean();

        // Todas las materias y todos los acumulados (3 lapsos) en bloque (2 consultas).
        const todasMaterias = await Materia.find({ seccion: { $in: secciones.map(s => s._id) } }).sort({ nombre: 1 }).lean();
        const bulk = await calcularLapsosBulk(todasMaterias.map(m => m._id), [1, 2, 3], [estudianteId]);
        const matsPorSeccion = new Map(secciones.map(s => [String(s._id), []]));
        todasMaterias.forEach(m => matsPorSeccion.get(String(m.seccion))?.push(m));

        const anios = [];
        for (const sec of secciones) {
            const materias = matsPorSeccion.get(String(sec._id)) || [];
            const items = [];
            for (const m of materias) {
                const lapsos = {};
                for (const l of [1, 2, 3]) {
                    lapsos[l] = bulk.get(`${String(m._id)}|${l}|${String(estudianteId)}`)?.acumulado ?? null;
                }
                const vals = [1, 2, 3].map(l => lapsos[l]).filter(v => v !== null);
                // Definitiva: promedio de lapsos disponibles, redondeada al entero (escala MPPE)
                const definitiva = vals.length ? Math.round(vals.reduce((s, v) => s + v, 0) / vals.length) : null;
                items.push({ nombre: m.nombre, lapsos, definitiva, completa: vals.length === 3 });
            }
            const defs = items.map(i => i.definitiva).filter(v => v !== null);
            const promedioAnio = defs.length
                ? Math.round((defs.reduce((s, v) => s + v, 0) / defs.length) * 100) / 100
                : null;
            anios.push({
                anio: sec.anio,
                etiquetaAnio: ANIO_LABEL[sec.anio],
                seccion: sec.nombre,
                periodo: sec.periodo,
                materias: items,
                promedioAnio,
            });
        }

        const proms = anios.map(a => a.promedioAnio).filter(v => v !== null);
        const promedioGeneral = proms.length
            ? Math.round((proms.reduce((s, v) => s + v, 0) / proms.length) * 100) / 100
            : null;

        res.json({
            estudiante: { _id: estudiante._id, name: estudiante.name, apellido: estudiante.apellido, cedula: estudiante.cedula },
            anios,
            promedioGeneral,
            aniosCargados: anios.length, // de los 4 requeridos
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ msg: 'Error al generar la certificación' });
    }
};

/* ============================================================
 * Publicación de boletines (docente)
 * ============================================================ */

/** Estado de publicación de los 3 lapsos de una sección. */
exports.getBoletinesEstado = async (req, res) => {
    try {
        const { seccion, error } = await getSeccionPropia(req.params.id, req.user.id);
        if (error) return res.status(error.status).json({ msg: error.msg });

        const pubs = await BoletinPublicado.find({ seccion: seccion._id });
        const estado = { 1: null, 2: null, 3: null };
        pubs.forEach(p => { estado[p.lapso] = p.publicadoEn; });
        res.json({ seccion: seccion._id, estado });
    } catch (err) {
        console.error(err);
        res.status(500).json({ msg: 'Error al obtener el estado de los boletines' });
    }
};

/** Publica o despublica el boletín de un lapso para la sección. */
exports.toggleBoletin = async (req, res) => {
    try {
        const { seccion, error } = await getSeccionPropia(req.params.id, req.user.id);
        if (error) return res.status(error.status).json({ msg: error.msg });

        const lapso = Number(req.params.lapso);
        if (![1, 2, 3].includes(lapso)) return res.status(400).json({ msg: 'Lapso inválido' });
        const { publicar } = req.body;

        if (publicar) {
            await BoletinPublicado.findOneAndUpdate(
                { seccion: seccion._id, lapso },
                { seccion: seccion._id, lapso, docente: req.user.id, publicadoEn: new Date() },
                { upsert: true, new: true }
            );
            return res.json({ msg: `Boletín del ${lapso}° lapso publicado`, publicado: true });
        }
        await BoletinPublicado.deleteOne({ seccion: seccion._id, lapso });
        res.json({ msg: `Boletín del ${lapso}° lapso ocultado`, publicado: false });
    } catch (err) {
        console.error(err);
        res.status(500).json({ msg: 'Error al actualizar la publicación' });
    }
};

/* ============================================================
 * Boletín del estudiante (solo lapsos publicados)
 * ============================================================ */

exports.miBoletin = async (req, res) => {
    try {
        const lapso = Number(req.params.lapso);
        if (![1, 2, 3].includes(lapso)) return res.status(400).json({ msg: 'Lapso inválido' });

        // Sección del estudiante (la primera donde esté inscrito).
        const seccion = await Seccion.findOne({ estudiantes: req.user.id })
            .populate('docente', 'name apellido');
        if (!seccion) return res.status(404).json({ msg: 'No estás inscrito en ninguna sección' });

        // El boletín solo está disponible si el docente lo publicó.
        const pub = await BoletinPublicado.findOne({ seccion: seccion._id, lapso });
        if (!pub) {
            return res.status(403).json({
                msg: 'El boletín de este lapso aún no está disponible. Tu profesor lo publicará cuando esté listo.',
                disponible: false,
            });
        }

        const estudiante = await User.findById(req.user.id).select('name apellido cedula');
        const materias = await Materia.find({ seccion: seccion._id }).sort({ nombre: 1 }).lean();

        // Acumulados de todas las materias del lapso en bloque (2 consultas).
        const bulk = await calcularLapsosBulk(materias.map(m => m._id), [lapso], [req.user.id]);
        const items = materias.map(m => ({
            nombre: m.nombre,
            acumulado: bulk.get(`${String(m._id)}|${lapso}|${String(req.user.id)}`)?.acumulado ?? null,
        }));
        const vals = items.map(i => i.acumulado).filter(v => v !== null);
        const promedio = vals.length ? Math.round((vals.reduce((s, v) => s + v, 0) / vals.length) * 100) / 100 : null;

        res.json({
            disponible: true,
            estudiante,
            seccion: {
                nombre: seccion.nombre,
                anio: seccion.anio,
                etiquetaAnio: ANIO_LABEL[seccion.anio],
                periodo: seccion.periodo,
                docente: seccion.docente,
            },
            lapso,
            materias: items,
            promedio,
            publicadoEn: pub.publicadoEn,
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ msg: 'Error al generar tu boletín' });
    }
};

/** Estado de disponibilidad de los 3 lapsos para el estudiante. */
exports.miBoletinEstado = async (req, res) => {
    try {
        const seccion = await Seccion.findOne({ estudiantes: req.user.id });
        if (!seccion) return res.json({ estado: { 1: false, 2: false, 3: false } });
        const pubs = await BoletinPublicado.find({ seccion: seccion._id });
        const estado = { 1: false, 2: false, 3: false };
        pubs.forEach(p => { estado[p.lapso] = true; });
        res.json({ estado });
    } catch (err) {
        console.error(err);
        res.status(500).json({ msg: 'Error al consultar disponibilidad' });
    }
};

/* ============================================================
 * Resumen del docente (métricas reales del dashboard)
 * ============================================================ */

exports.resumenDocente = async (req, res) => {
    try {
        const lapso = [1, 2, 3].includes(Number(req.query.lapso)) ? Number(req.query.lapso) : 1;
        const secciones = await Seccion.find({ docente: req.user.id })
            .populate('estudiantes', 'name apellido').lean();

        // Todas las materias de todas las secciones (1 consulta).
        const seccionIds = secciones.map(s => s._id);
        const materias = await Materia.find({ seccion: { $in: seccionIds } }).select('_id seccion').lean();

        // Todos los acumulados del lapso en bloque (2 consultas en total).
        const todosEstudiantes = [...new Set(secciones.flatMap(s => s.estudiantes.map(e => String(e._id))))];
        const materiaIds = materias.map(m => m._id);
        const bulk = await calcularLapsosBulk(materiaIds, [lapso], todosEstudiantes);

        // Agrupar materias por sección.
        const matsPorSeccion = new Map(seccionIds.map(id => [String(id), []]));
        materias.forEach(m => matsPorSeccion.get(String(m.seccion))?.push(m));

        const unicos = new Set();
        const riesgo = { good: 0, warning: 0, danger: 0 };
        const detalle = secciones.map(sec => {
            sec.estudiantes.forEach(e => unicos.add(String(e._id)));
            const mats = matsPorSeccion.get(String(sec._id)) || [];
            const ids = sec.estudiantes.map(e => String(e._id));
            let suma = 0, n = 0;
            const riesgoSec = { good: 0, warning: 0, danger: 0 };

            mats.forEach(m => ids.forEach(eid => {
                const r = bulk.get(`${String(m._id)}|${lapso}|${eid}`);
                if (!r || r.acumulado === null) return;
                suma += r.acumulado; n++;
                const nivel = r.acumulado >= 15 ? 'good' : r.acumulado >= 11 ? 'warning' : 'danger';
                riesgoSec[nivel]++; riesgo[nivel]++;
            }));

            return {
                _id: sec._id,
                nombre: sec.nombre,
                anio: sec.anio,
                etiquetaAnio: ANIO_LABEL[sec.anio],
                estudiantes: sec.estudiantes.length,
                materias: mats.length,
                promedio: n ? Math.round((suma / n) * 100) / 100 : null,
                riesgo: riesgoSec,
            };
        });

        res.json({
            lapso,
            totalSecciones: secciones.length,
            totalEstudiantes: unicos.size,
            totalMaterias: materias.length,
            riesgo,
            secciones: detalle,
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ msg: 'Error al generar el resumen del docente' });
    }
};

/** Detalle de una materia para el estudiante: plan publicado + sus notas. */
exports.miMateriaDetalle = async (req, res) => {
    try {
        const materia = await Materia.findById(req.params.id).lean();
        if (!materia) return res.status(404).json({ msg: 'Materia no encontrada' });

        // Verificar que el estudiante pertenezca a la sección
        const seccion = await Seccion.findOne({ _id: materia.seccion, estudiantes: req.user.id });
        if (!seccion) return res.status(403).json({ msg: 'No estás inscrito en esta materia' });

        // Planes y notas de los 3 lapsos en bloque (2 consultas).
        const planes = await PlanEvaluacion.find({ materia: materia._id }).lean();
        const notas = await Nota.find({ materia: materia._id, estudiante: req.user.id }).lean();
        const planPorLapso = new Map(planes.map(p => [p.lapso, p]));
        const notasPorLapso = {}; // lapso -> { actividadId: valor }
        notas.forEach(n => {
            (notasPorLapso[n.lapso] ||= {})[String(n.actividad)] = n.valor;
        });

        const detalle = {};
        for (const lapso of [1, 2, 3]) {
            const plan = planPorLapso.get(lapso);
            const notasMap = notasPorLapso[lapso] || {};
            // Acumulado del lapso (suma ponderada en memoria).
            let acumulado = null, evaluado = 0;
            if (plan && plan.actividades.length) {
                plan.actividades.forEach(a => {
                    const v = notasMap[String(a._id)];
                    if (v === undefined) return;
                    acumulado = (acumulado ?? 0) + v * (a.ponderacion / 100);
                    evaluado += a.ponderacion;
                });
                if (acumulado !== null) acumulado = Math.round(acumulado * 100) / 100;
            }
            detalle[lapso] = {
                // El estudiante solo ve el plan si el docente lo publicó
                actividades: (plan && plan.publicado) ? plan.actividades.map(a => ({
                    _id: a._id, nombre: a.nombre, tipo: a.tipo, fecha: a.fecha,
                    ponderacion: a.ponderacion,
                    nota: notasMap[String(a._id)] ?? null,
                })) : [],
                publicado: plan ? plan.publicado : false,
                acumulado,
                evaluado,
            };
        }
        res.json({ materia, lapsos: detalle });
    } catch (err) {
        console.error(err);
        res.status(500).json({ msg: 'Error al obtener el detalle' });
    }
};
