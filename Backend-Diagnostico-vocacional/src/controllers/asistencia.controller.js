const Asistencia = require('../models/Asistencia');
const Seccion = require('../models/Seccion');
const { _getSeccionPropia } = require('./academico.controller');
const { getConfig } = require('./config.controller');
const { notificarAsync, representantesDe, botActivo } = require('../services/telegram.service');

/** Normaliza una fecha (YYYY-MM-DD) a medianoche UTC. */
function normalizarFecha(str) {
    const d = new Date(str);
    if (Number.isNaN(d.getTime())) return null;
    return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
}

/** Nivel de inasistencia según el umbral configurado. */
function nivelInasistencia(pct, umbral) {
    if (pct >= umbral) return 'danger';
    if (pct >= umbral * 0.6) return 'warning';
    return 'good';
}

/**
 * Resumen de inasistencia de toda la sección en bloque (1 consulta).
 * @returns {Map<string, {dias,ausencias,justificadas,pct,nivel}>}
 */
async function resumenInasistencia(seccionId, umbral) {
    const docs = await Asistencia.find({ seccion: seccionId }).lean();
    const acc = new Map(); // estId -> {dias, ausencias, justificadas}
    docs.forEach(doc => {
        doc.registros.forEach(r => {
            const k = String(r.estudiante);
            if (!acc.has(k)) acc.set(k, { dias: 0, ausencias: 0, justificadas: 0 });
            const a = acc.get(k);
            a.dias++;
            if (r.estado === 'ausente') a.ausencias++;
            else if (r.estado === 'justificado') a.justificadas++;
        });
    });
    const out = new Map();
    acc.forEach((a, k) => {
        const pct = a.dias ? Math.round((a.ausencias / a.dias) * 100) : 0;
        out.set(k, { ...a, pct, nivel: nivelInasistencia(pct, umbral) });
    });
    return out;
}
exports.resumenInasistencia = resumenInasistencia;

// GET pase de lista de un día (existente o lista vacía con los estudiantes de la sección).
exports.getAsistenciaDia = async (req, res) => {
    try {
        const { seccion, error } = await _getSeccionPropia(req.params.id, req.user.id);
        if (error) return res.status(error.status).json({ msg: error.msg });
        const fecha = normalizarFecha(req.params.fecha);
        if (!fecha) return res.status(400).json({ msg: 'Fecha inválida (usa YYYY-MM-DD)' });

        await seccion.populate('estudiantes', 'name apellido cedula');
        const doc = await Asistencia.findOne({ seccion: seccion._id, fecha }).lean();
        const estadoPorEst = {};
        (doc?.registros || []).forEach(r => { estadoPorEst[String(r.estudiante)] = r.estado; });

        res.json({
            seccion: seccion._id,
            fecha: req.params.fecha,
            existe: !!doc,
            estudiantes: seccion.estudiantes.map(e => ({
                _id: e._id, name: e.name, apellido: e.apellido, cedula: e.cedula,
                estado: estadoPorEst[String(e._id)] || 'presente',
            })),
        });
    } catch (err) { console.error(err); res.status(500).json({ msg: 'Error al obtener la asistencia' }); }
};

// PUT guardar el pase de lista de un día (upsert).
exports.guardarAsistenciaDia = async (req, res) => {
    try {
        const { seccion, error } = await _getSeccionPropia(req.params.id, req.user.id);
        if (error) return res.status(error.status).json({ msg: error.msg });
        const fecha = normalizarFecha(req.params.fecha);
        if (!fecha) return res.status(400).json({ msg: 'Fecha inválida' });
        const { registros } = req.body;
        if (!Array.isArray(registros)) return res.status(400).json({ msg: 'registros debe ser un array' });

        const limpios = registros
            .filter(r => ['presente', 'ausente', 'justificado'].includes(r.estado))
            .map(r => ({ estudiante: r.estudiante, estado: r.estado }));

        await Asistencia.findOneAndUpdate(
            { seccion: seccion._id, fecha },
            { seccion: seccion._id, fecha, docente: req.user.id, registros: limpios },
            { upsert: true, new: true }
        );
        res.json({ msg: 'Asistencia guardada' });

        // Notificaciones a representantes (async, no bloquea la respuesta ya enviada).
        if (botActivo()) {
            try {
                await seccion.populate('estudiantes', 'name apellido');
                const nombre = {};
                seccion.estudiantes.forEach(e => { nombre[String(e._id)] = `${e.name || ''} ${e.apellido || ''}`.trim(); });
                const etiqueta = `${seccion.anio}° ${seccion.nombre}`;
                const ausentes = limpios.filter(r => r.estado === 'ausente').map(r => String(r.estudiante));
                const cfg = await getConfig();
                const resumen = await resumenInasistencia(seccion._id, cfg.umbralInasistencia);
                const mapaRep = await representantesDe(seccion.estudiantes.map(e => e._id));
                const items = [];
                ausentes.forEach(estId => {
                    const chats = mapaRep.get(estId) || [];
                    const est = nombre[estId] || 'su representado';
                    chats.forEach(chatId => items.push({ chatId, texto: `📌 ${est} fue reportado(a) *ausente* hoy en ${etiqueta}.` }));
                    const r = resumen.get(estId);
                    if (r && r.nivel === 'danger') {
                        chats.forEach(chatId => items.push({ chatId, texto: `⚠️ ${est} alcanzó ${r.pct}% de inasistencia (umbral ${cfg.umbralInasistencia}%). Está en riesgo de perder derecho a evaluación.` }));
                    }
                });
                notificarAsync(items);
            } catch (e) { console.error('Notif asistencia:', e.message); }
        }
    } catch (err) { console.error(err); res.status(500).json({ msg: 'Error al guardar la asistencia' }); }
};

// GET resumen de inasistencia por estudiante de la sección.
exports.getAsistenciaResumen = async (req, res) => {
    try {
        const { seccion, error } = await _getSeccionPropia(req.params.id, req.user.id);
        if (error) return res.status(error.status).json({ msg: error.msg });
        await seccion.populate('estudiantes', 'name apellido cedula');
        const cfg = await getConfig();
        const mapa = await resumenInasistencia(seccion._id, cfg.umbralInasistencia);
        res.json({
            umbral: cfg.umbralInasistencia,
            estudiantes: seccion.estudiantes.map(e => {
                const r = mapa.get(String(e._id)) || { dias: 0, ausencias: 0, justificadas: 0, pct: 0, nivel: 'good' };
                return { _id: e._id, name: e.name, apellido: e.apellido, cedula: e.cedula, ...r };
            }),
        });
    } catch (err) { console.error(err); res.status(500).json({ msg: 'Error al obtener el resumen' }); }
};
