const Constancia = require('../models/Constancia');
const User = require('../models/user');
const Seccion = require('../models/Seccion');
const Materia = require('../models/Materia');
const { calcularLapsosBulk, _getSeccionPropia } = require('./academico.controller');
const { getConfig } = require('./config.controller');
const { ANIO_LABEL } = require('../data/curriculoMPPE');
const crypto = require('crypto');

/** Genera un código EDT-{año}-{secuencia6}-{sufijo aleatorio no adivinable}. */
async function generarCodigo() {
    const anio = new Date().getUTCFullYear();
    const desde = new Date(Date.UTC(anio, 0, 1));
    const n = await Constancia.countDocuments({ createdAt: { $gte: desde } });
    const sufijo = crypto.randomBytes(4).toString('hex').toUpperCase(); // 8 chars, ~4300M combinaciones
    return `EDT-${anio}-${String(n + 1).padStart(6, '0')}-${sufijo}`;
}

// ¿El docente tiene a este estudiante en alguna de sus secciones?
async function docenteTieneEstudiante(docenteId, estudianteId) {
    return !!(await Seccion.findOne({ docente: docenteId, estudiantes: estudianteId }));
}

exports.emitir = async (req, res) => {
    try {
        const { tipo, estudianteId, seccionId } = req.body;
        const cfg = await getConfig();

        if (!['estudios', 'conducta', 'rendimiento', 'con-representante'].includes(tipo)) {
            return res.status(400).json({ msg: 'Tipo de constancia inválido' });
        }

        let datos = { institucion: cfg.institucion };
        let estudianteRef = null, seccionRef = null;

        if (tipo === 'rendimiento') {
            let seccion;
            if (req.user.role === 'docente') {
                const r = await _getSeccionPropia(seccionId, req.user.id);
                if (r.error) return res.status(r.error.status).json({ msg: r.error.msg });
                seccion = r.seccion;
            } else {
                seccion = await Seccion.findById(seccionId);
                if (!seccion) return res.status(404).json({ msg: 'Sección no encontrada' });
            }
            await seccion.populate('estudiantes', 'name apellido cedula');
            const materias = await Materia.find({ seccion: seccion._id }).sort({ nombre: 1 }).lean();
            const bulk = await calcularLapsosBulk(materias.map(m => m._id), [1, 2, 3], seccion.estudiantes.map(e => e._id));
            datos.seccion = { nombre: seccion.nombre, anio: seccion.anio, etiquetaAnio: ANIO_LABEL[seccion.anio], periodo: seccion.periodo };
            datos.materias = materias.map(m => ({ nombre: m.nombre }));
            datos.filas = seccion.estudiantes.map(e => ({
                nombre: `${e.apellido || ''} ${e.name}`.trim(), cedula: e.cedula,
                notas: materias.map(m => {
                    const v = [1, 2, 3].map(l => bulk.get(`${String(m._id)}|${l}|${String(e._id)}`)?.acumulado).filter(x => x != null);
                    return v.length === 3 ? Math.round(v.reduce((s, x) => s + x, 0) / 3) : null;
                }),
            }));
            seccionRef = seccion._id;
        } else {
            const est = await User.findById(estudianteId).select('name apellido cedula conducta').lean();
            if (!est) return res.status(404).json({ msg: 'Estudiante no encontrado' });
            if (req.user.role === 'docente' && !(await docenteTieneEstudiante(req.user.id, estudianteId))) {
                return res.status(403).json({ msg: 'Este estudiante no pertenece a tus secciones' });
            }
            const sec = await Seccion.findOne({ estudiantes: estudianteId }).lean();
            datos.estudiante = { nombre: `${est.apellido || ''} ${est.name}`.trim(), cedula: est.cedula };
            if (sec) datos.seccion = { etiquetaAnio: ANIO_LABEL[sec.anio], nombre: sec.nombre, periodo: sec.periodo };
            if (tipo === 'conducta') datos.conducta = est.conducta || 'Satisfactoria';
            if (tipo === 'con-representante') {
                const rep = await User.findOne({ role: 'representante', representados: estudianteId }).select('name apellido cedula').lean();
                datos.representante = rep ? { nombre: `${rep.apellido || ''} ${rep.name}`.trim(), cedula: rep.cedula } : null;
            }
            estudianteRef = est._id;
            seccionRef = sec?._id;
        }

        const codigo = await generarCodigo();
        await Constancia.create({ codigo, tipo, estudiante: estudianteRef, seccion: seccionRef, emitidoPor: req.user.id, datos });
        res.status(201).json({ codigo, tipo, datos, fecha: new Date() });
    } catch (err) { console.error(err); res.status(500).json({ msg: 'Error al emitir la constancia' }); }
};

// Nombre minimizado para la verificación pública: "J. Pérez" (no doxear al menor).
function nombreMinimizado(nombreCompleto) {
    if (!nombreCompleto || typeof nombreCompleto !== 'string') return '—';
    const partes = nombreCompleto.trim().split(/\s+/);
    if (partes.length === 1) return partes[0][0].toUpperCase() + '.';
    // datos.estudiante.nombre viene como "Apellido Nombre" -> mostramos "N. Apellido"
    const apellido = partes[0];
    const nombre = partes[partes.length - 1];
    return `${nombre[0].toUpperCase()}. ${apellido}`;
}

// Público: verificar autenticidad (respuesta minimizada, sin nombre completo).
exports.verificar = async (req, res) => {
    try {
        const c = await Constancia.findOne({ codigo: req.params.codigo }).populate('estudiante', 'name apellido').lean();
        if (!c) return res.status(404).json({ valida: false, msg: 'Constancia no encontrada' });
        const TIPO_LABEL = { estudios: 'Constancia de Estudios', conducta: 'Constancia de Buena Conducta', rendimiento: 'Resumen Final de Rendimiento', 'con-representante': 'Constancia de Estudios (con representante)' };
        const nombreCompleto = c.datos?.estudiante?.nombre
            || (c.estudiante ? `${c.estudiante.apellido || ''} ${c.estudiante.name}`.trim() : '');
        const etiqueta = nombreCompleto
            ? nombreMinimizado(nombreCompleto)
            : (c.datos?.seccion ? `Sección ${c.datos.seccion.etiquetaAnio || ''} ${c.datos.seccion.nombre || ''}`.trim() : '—');
        res.json({
            valida: true,
            tipo: TIPO_LABEL[c.tipo] || c.tipo,
            estudiante: etiqueta,
            institucion: c.datos?.institucion || 'EduTrack Insight',
            fecha: c.createdAt,
        });
    } catch (err) { console.error(err); res.status(500).json({ msg: 'Error al verificar' }); }
};
