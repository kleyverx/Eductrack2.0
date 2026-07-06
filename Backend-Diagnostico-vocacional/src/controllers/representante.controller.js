const User = require('../models/user');
const Seccion = require('../models/Seccion');
const Materia = require('../models/Materia');
const result = require('../models/result');
const { calcularLapsosBulk } = require('./academico.controller');
const { resumenInasistencia } = require('./asistencia.controller');
const { getConfig } = require('./config.controller');
const { ANIO_LABEL } = require('../data/curriculoMPPE');

// Devuelve el array de IDs de representados del usuario actual (carga desde DB si hace falta).
async function getRepresentados(req) {
    if (Array.isArray(req.user.representados)) return req.user.representados;
    const me = await User.findById(req.user.id).select('representados').lean();
    return me?.representados || [];
}

// Verifica que el estudiante :id sea representado del usuario actual.
async function esRepresentado(req, estudianteId) {
    const reps = await getRepresentados(req);
    return reps.map(String).includes(String(estudianteId));
}

// Detalle académico de un estudiante (materias por lapso + asistencia + vocacional).
async function detalleEstudiante(estudianteId) {
    const secciones = await Seccion.find({ estudiantes: estudianteId }).populate('docente', 'name apellido').lean();
    const cfg = await getConfig();
    const grupos = [];
    for (const sec of secciones) {
        const materias = await Materia.find({ seccion: sec._id }).sort({ nombre: 1 }).lean();
        const bulk = await calcularLapsosBulk(materias.map(m => m._id), [1, 2, 3], [estudianteId]);
        const items = materias.map(m => {
            const lapsos = {};
            [1, 2, 3].forEach(l => { lapsos[l] = { acumulado: bulk.get(`${String(m._id)}|${l}|${String(estudianteId)}`)?.acumulado ?? null }; });
            const vals = [1, 2, 3].map(l => lapsos[l].acumulado).filter(v => v !== null);
            const definitiva = vals.length === 3 ? Math.round(vals.reduce((s, v) => s + v, 0) / 3) : null;
            return { _id: m._id, nombre: m.nombre, lapsos, definitiva };
        });
        const inas = await resumenInasistencia(sec._id, cfg.umbralInasistencia);
        const asis = inas.get(String(estudianteId)) || { dias: 0, ausencias: 0, justificadas: 0, pct: 0, nivel: 'good' };
        grupos.push({
            seccion: { _id: sec._id, nombre: sec.nombre, anio: sec.anio, etiquetaAnio: ANIO_LABEL[sec.anio], periodo: sec.periodo, docente: sec.docente },
            materias: items,
            asistencia: { ...asis, umbral: cfg.umbralInasistencia },
        });
    }
    return grupos;
}

exports.misRepresentados = async (req, res) => {
    try {
        const repIds = await getRepresentados(req);
        const reps = await User.find({ _id: { $in: repIds } }).select('name apellido cedula').lean();
        // Perfil vocacional (área top) por representado
        const conArea = await Promise.all(reps.map(async (r) => {
            const vr = await result.findOne({ user: r._id }).sort({ createdAt: -1 }).lean();
            let topArea = null;
            if (vr?.results) {
                const scores = vr.results instanceof Map ? Object.fromEntries(vr.results) : vr.results;
                const e = Object.entries(scores).sort(([, a], [, b]) => b - a);
                if (e.length) topArea = e[0][0];
            }
            return { ...r, topArea };
        }));
        res.json(conArea);
    } catch (err) { console.error(err); res.status(500).json({ msg: 'Error al obtener representados' }); }
};

exports.representadoDetalle = async (req, res) => {
    try {
        if (!(await esRepresentado(req, req.params.id))) return res.status(403).json({ msg: 'Ese estudiante no es tu representado' });
        const estudiante = await User.findById(req.params.id).select('name apellido cedula').lean();
        if (!estudiante) return res.status(404).json({ msg: 'Estudiante no encontrado' });
        const grupos = await detalleEstudiante(req.params.id);
        res.json({ estudiante, grupos });
    } catch (err) { console.error(err); res.status(500).json({ msg: 'Error al obtener el detalle' }); }
};
