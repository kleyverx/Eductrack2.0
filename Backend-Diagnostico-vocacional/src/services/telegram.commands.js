const User = require('../models/user');
const Seccion = require('../models/Seccion');
const { resumenInasistencia } = require('../controllers/asistencia.controller');
const { getConfig } = require('../controllers/config.controller');
const Materia = require('../models/Materia');
const Constancia = require('../models/Constancia');
const { calcularLapsosBulk } = require('../controllers/academico.controller');

/** Semáforo de una nota (escala 1-20): 🟢≥15 🟡≥11 🔴<11. */
function emojiNota(n) { if (n == null) return '⚪'; if (n >= 15) return '🟢'; if (n >= 11) return '🟡'; return '🔴'; }

const EMOJI_NIVEL = { good: '🟢', warning: '🟡', danger: '🔴' };

// require perezoso del servicio para evitar ciclo (service -> commands -> service).
function svc() { return require('./telegram.service'); }

const AYUDA = [
    'Comandos disponibles:',
    '/asistencia — % de inasistencia de tu representado',
    '/notas — resumen de calificaciones',
    '/misdatos — a quién representas',
    '/constancia — enlace de verificación de la última constancia',
    '/ayuda — esta ayuda',
].join('\n');

/** Devuelve el User representante vinculado a ese chat, o un error. */
async function resolverRepresentante(chatId) {
    const user = await User.findOne({ telegramChatId: String(chatId) })
        .select('name role representados').lean();
    if (!user) return { error: 'no-vinculado' };
    if (user.role !== 'representante') return { error: 'no-representante' };
    return { user };
}

// /misdatos — a quién representa (sin datos académicos).
async function cmdMisDatos(chatId, user) {
    const reps = await User.find({ _id: { $in: user.representados || [] } })
        .select('name apellido cedula').lean();
    if (!reps.length) { await svc().enviarMensaje(chatId, 'Aún no tienes representados vinculados.'); return; }
    const lineas = reps.map(r => `• ${r.name || ''} ${r.apellido || ''} (C.I. ${r.cedula})`.trim());
    await svc().enviarMensaje(chatId, `✅ Telegram vinculado.\nRepresentas a:\n${lineas.join('\n')}`);
}

/** Enruta un comando de texto. `cmd` incluye la barra (ej. "/asistencia"). */
async function ejecutarComando(cmd, chatId) {
    const c = cmd.split(/\s+/)[0].toLowerCase();
    if (c === '/ayuda' || c === '/start') { await svc().enviarMensaje(chatId, AYUDA); return; }

    const { user, error } = await resolverRepresentante(chatId);
    if (error === 'no-vinculado') { await svc().enviarMensaje(chatId, 'Primero vincúlate: genera tu código en el panel del representante de EduTrack y envíamelo aquí.'); return; }
    if (error === 'no-representante') { await svc().enviarMensaje(chatId, 'Este bot es para representantes.'); return; }

    try {
        switch (c) {
            case '/misdatos': await cmdMisDatos(chatId, user); break;
            case '/asistencia': await require('./telegram.commands').cmdAsistencia(chatId, user); break;
            case '/notas': await require('./telegram.commands').cmdNotas(chatId, user); break;
            case '/constancia': await require('./telegram.commands').cmdConstancia(chatId, user); break;
            default: await svc().enviarMensaje(chatId, `Comando no reconocido.\n\n${AYUDA}`);
        }
    } catch (e) {
        console.error('ejecutarComando error:', e.message);
        await svc().enviarMensaje(chatId, 'Ocurrió un error, intenta más tarde.');
    }
}

// Placeholders (se completan en Tasks 4 y 5). Exportados para que el switch los encuentre.
/** Nombre corto de un representado. */
async function nombreDe(estudianteId) {
    const e = await User.findById(estudianteId).select('name apellido').lean();
    return e ? `${e.name || ''} ${e.apellido || ''}`.trim() : 'Estudiante';
}

/** Texto de resumen de inasistencia de un estudiante (todas sus secciones). */
async function resumenAsistenciaTexto(estudianteId) {
    const cfg = await getConfig();
    const secciones = await Seccion.find({ estudiantes: estudianteId }).select('nombre anio').lean();
    if (!secciones.length) return 'Sin secciones registradas.';
    const nombre = await nombreDe(estudianteId);
    const lineas = [];
    for (const sec of secciones) {
        const mapa = await resumenInasistencia(sec._id, cfg.umbralInasistencia);
        const r = mapa.get(String(estudianteId)) || { pct: 0, nivel: 'good' };
        lineas.push(`${sec.anio}° ${sec.nombre}: ${r.pct}% ${EMOJI_NIVEL[r.nivel] || ''}`);
    }
    return `📋 *${nombre}* — inasistencia (umbral ${cfg.umbralInasistencia}%)\n${lineas.join('\n')}`;
}

// /asistencia — directo si 1 representado; botones si varios.
async function cmdAsistencia(chatId, user) {
    const reps = user.representados || [];
    if (reps.length === 0) { await svc().enviarMensaje(chatId, 'No tienes representados vinculados.'); return; }
    if (reps.length === 1) { await svc().enviarMensaje(chatId, await resumenAsistenciaTexto(reps[0])); return; }
    const botones = [];
    for (const id of reps) botones.push({ text: await nombreDe(id), callback_data: `asistencia:${id}` });
    await svc().enviarConBotones(chatId, 'Elige un representado:', botones);
}

/** Ejecuta la acción de un botón, validando que el estudiante sea del representante. */
async function ejecutarAccion(accion, estudianteId, chatId) {
    try {
        const { user, error } = await resolverRepresentante(chatId);
        if (error) { await svc().enviarMensaje(chatId, 'Primero vincúlate desde tu panel en EduTrack.'); return; }
        const esSuyo = (user.representados || []).map(String).includes(String(estudianteId));
        if (!esSuyo) { await svc().enviarMensaje(chatId, 'Ese estudiante no es tu representado.'); return; }
        switch (accion) {
            case 'asistencia': await svc().enviarMensaje(chatId, await resumenAsistenciaTexto(estudianteId)); break;
            case 'notas': await svc().enviarMensaje(chatId, await require('./telegram.commands').resumenNotasTexto(estudianteId)); break;
            case 'constancia': await svc().enviarMensaje(chatId, await require('./telegram.commands').resumenConstanciaTexto(estudianteId)); break;
            default: await svc().enviarMensaje(chatId, 'Acción no reconocida.');
        }
    } catch (e) {
        console.error('ejecutarAccion error:', e.message);
        await svc().enviarMensaje(chatId, 'Ocurrió un error, intenta más tarde.');
    }
}
/** Resumen de notas SIN números exactos por materia: promedio general + semáforo por materia. */
async function resumenNotasTexto(estudianteId) {
    const nombre = await nombreDe(estudianteId);
    const secciones = await Seccion.find({ estudiantes: estudianteId }).select('nombre anio').lean();
    if (!secciones.length) return `📚 ${nombre}\nSin secciones registradas.`;
    const bloques = [];
    for (const sec of secciones) {
        const materias = await Materia.find({ seccion: sec._id }).sort({ nombre: 1 }).lean();
        if (!materias.length) continue;
        const bulk = await calcularLapsosBulk(materias.map(m => m._id), [1, 2, 3], [estudianteId]);
        const defs = [];
        const partesMateria = materias.map(m => {
            const vals = [1, 2, 3].map(l => bulk.get(`${String(m._id)}|${l}|${String(estudianteId)}`)?.acumulado).filter(v => v != null);
            const def = vals.length === 3 ? Math.round(vals.reduce((s, v) => s + v, 0) / 3) : (vals.length ? Math.round(vals.reduce((s, v) => s + v, 0) / vals.length) : null);
            if (def != null) defs.push(def);
            return `${m.nombre} ${emojiNota(def)}`;
        });
        const promedio = defs.length ? Math.round(defs.reduce((s, v) => s + v, 0) / defs.length) : null;
        bloques.push(`*${sec.anio}° ${sec.nombre}* — Promedio: ${promedio != null ? promedio + ' ' + emojiNota(promedio) : '—'}\n${partesMateria.join(' · ')}`);
    }
    return `📚 *${nombre}*\n${bloques.join('\n\n')}\n\n_Consulta el detalle en la plataforma._`;
}

/** Enlace de verificación de la última constancia del estudiante. */
async function resumenConstanciaTexto(estudianteId) {
    const nombre = await nombreDe(estudianteId);
    const c = await Constancia.findOne({ estudiante: estudianteId }).sort({ createdAt: -1 }).select('codigo tipo').lean();
    if (!c) return `No hay constancias emitidas para ${nombre} todavía.`;
    const base = (process.env.FRONTEND_URL || '').split(',')[0] || '';
    return `📄 Última constancia de ${nombre} (${c.tipo}):\n${base}/verificar/${c.codigo}`;
}

// /notas — directo si 1; botones si varios (callback_data notas:<id>).
async function cmdNotas(chatId, user) {
    const reps = user.representados || [];
    if (reps.length === 0) { await svc().enviarMensaje(chatId, 'No tienes representados vinculados.'); return; }
    if (reps.length === 1) { await svc().enviarMensaje(chatId, await resumenNotasTexto(reps[0])); return; }
    const botones = [];
    for (const id of reps) botones.push({ text: await nombreDe(id), callback_data: `notas:${id}` });
    await svc().enviarConBotones(chatId, 'Elige un representado:', botones);
}

// /constancia — directo si 1; botones si varios (callback_data constancia:<id>).
async function cmdConstancia(chatId, user) {
    const reps = user.representados || [];
    if (reps.length === 0) { await svc().enviarMensaje(chatId, 'No tienes representados vinculados.'); return; }
    if (reps.length === 1) { await svc().enviarMensaje(chatId, await resumenConstanciaTexto(reps[0])); return; }
    const botones = [];
    for (const id of reps) botones.push({ text: await nombreDe(id), callback_data: `constancia:${id}` });
    await svc().enviarConBotones(chatId, 'Elige un representado:', botones);
}

module.exports = { ejecutarComando, ejecutarAccion, resolverRepresentante, cmdMisDatos, cmdAsistencia, cmdNotas, cmdConstancia, resumenAsistenciaTexto, resumenNotasTexto, resumenConstanciaTexto, AYUDA };
