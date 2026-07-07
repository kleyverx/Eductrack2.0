const User = require('../models/user');

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
async function cmdAsistencia(chatId) { await svc().enviarMensaje(chatId, '(asistencia próximamente)'); }
async function cmdNotas(chatId) { await svc().enviarMensaje(chatId, '(notas próximamente)'); }
async function cmdConstancia(chatId) { await svc().enviarMensaje(chatId, '(constancia próximamente)'); }

module.exports = { ejecutarComando, resolverRepresentante, cmdMisDatos, cmdAsistencia, cmdNotas, cmdConstancia, AYUDA };
