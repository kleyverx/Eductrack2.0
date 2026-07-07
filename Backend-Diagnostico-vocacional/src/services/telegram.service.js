const axios = require('axios');
const User = require('../models/user');

const TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const API = TOKEN ? `https://api.telegram.org/bot${TOKEN}` : null;

/** ¿El bot está configurado? */
function botActivo() { return !!TOKEN; }

/** Envía un mensaje; reintenta 1 vez. Nunca lanza. Devuelve boolean. */
async function enviarMensaje(chatId, texto) {
    if (!API || !chatId) return false;
    for (let intento = 0; intento < 2; intento++) {
        try {
            await axios.post(`${API}/sendMessage`, { chat_id: chatId, text: texto, parse_mode: 'Markdown' }, { timeout: 8000 });
            return true;
        } catch (err) {
            if (intento === 1) { console.error('Telegram sendMessage falló:', err.response?.data?.description || err.message); return false; }
            await new Promise(r => setTimeout(r, 500));
        }
    }
    return false;
}

/** Envía un mensaje con botones inline. `botones` = [{text, callback_data}] (una fila por botón). Nunca lanza. */
async function enviarConBotones(chatId, texto, botones) {
    if (!API || !chatId) return false;
    try {
        await axios.post(`${API}/sendMessage`, {
            chat_id: chatId, text: texto, parse_mode: 'Markdown',
            reply_markup: { inline_keyboard: botones.map(b => [{ text: b.text, callback_data: b.callback_data }]) },
        }, { timeout: 8000 });
        return true;
    } catch (err) {
        console.error('Telegram enviarConBotones falló:', err.response?.data?.description || err.message);
        return false;
    }
}

/** Confirma un callback_query (quita el "reloj" de carga del botón en Telegram). Nunca lanza. */
async function answerCallbackQuery(callbackQueryId) {
    if (!API) return;
    try { await axios.post(`${API}/answerCallbackQuery`, { callback_query_id: callbackQueryId }, { timeout: 8000 }); }
    catch (err) { console.error('answerCallbackQuery falló:', err.response?.data?.description || err.message); }
}

/** Dispara en segundo plano el envío de una lista de {chatId, texto}. NO se le hace await. */
function notificarAsync(items) {
    if (!botActivo() || !Array.isArray(items) || items.length === 0) return;
    (async () => {
        for (const it of items) {
            if (!it?.chatId || !it?.texto) continue;
            await enviarMensaje(it.chatId, it.texto);
            await new Promise(r => setTimeout(r, 120)); // respetar rate-limit de Telegram
        }
    })().catch(e => console.error('notificarAsync error:', e.message));
}

/** Representantes (con Telegram vinculado) de un conjunto de estudiantes. 1 consulta. */
async function representantesDe(estudianteIds) {
    if (!botActivo()) return new Map();
    const reps = await User.find({
        role: 'representante',
        representados: { $in: estudianteIds },
        telegramChatId: { $ne: null },
    }).select('telegramChatId representados').lean();
    const map = new Map();
    estudianteIds.forEach(id => map.set(String(id), []));
    reps.forEach(r => {
        (r.representados || []).forEach(estId => {
            const k = String(estId);
            if (map.has(k) && r.telegramChatId) map.get(k).push(r.telegramChatId);
        });
    });
    return map;
}

/** Procesa un texto recibido por el bot: si es un código válido, vincula. */
async function procesarCodigo(textoRaw, chatId) {
    let texto = String(textoRaw || '').trim();
    if (texto.toLowerCase().startsWith('/start')) texto = texto.slice(6).trim();
    texto = texto.toUpperCase();
    if (!texto) {
        await enviarMensaje(chatId, 'Hola 👋 Para recibir avisos de tu representado, genera tu código en EduTrack (panel del representante) y envíamelo aquí.');
        return;
    }
    const user = await User.findOne({ telegramCodigo: texto });
    if (!user) {
        await enviarMensaje(chatId, 'No reconozco ese código. Genéralo desde tu panel en EduTrack.');
        return;
    }
    user.telegramChatId = String(chatId);
    user.telegramCodigo = undefined;
    await user.save();
    await enviarMensaje(chatId, `✅ Vinculado, ${user.name || ''}. Recibirás avisos de tus representados.`);
}

/** ¿El texto parece un código de vinculación (6 chars alfanuméricos)? */
function pareceCodigo(texto) {
    return /^[A-Z0-9]{6}$/.test(String(texto || '').trim().toUpperCase());
}

/** Enruta un mensaje de texto: comando, código de vinculación, o ayuda. */
async function manejarTexto(texto, chatId) {
    const t = String(texto || '').trim();
    if (t.startsWith('/')) {
        if (t.toLowerCase().startsWith('/start ') && pareceCodigo(t.slice(7))) {
            return procesarCodigo(t.slice(7), chatId);
        }
        return require('./telegram.commands').ejecutarComando(t, chatId);
    }
    if (pareceCodigo(t)) return procesarCodigo(t, chatId);
    return require('./telegram.commands').ejecutarComando('/ayuda', chatId);
}

/** Maneja el toque de un botón inline (callback_query). data = "accion:estudianteId". */
async function manejarCallback(cbq) {
    const chatId = cbq.message?.chat?.id;
    const data = cbq.data || '';
    await answerCallbackQuery(cbq.id);
    const [accion, estudianteId] = data.split(':');
    if (!accion || !estudianteId || !chatId) return;
    return require('./telegram.commands').ejecutarAccion(accion, estudianteId, chatId);
}

/** Punto de entrada del polling para cada update. */
async function manejarUpdate(update) {
    try {
        if (update.message && update.message.text) {
            await manejarTexto(update.message.text, update.message.chat.id);
        } else if (update.callback_query) {
            await manejarCallback(update.callback_query);
        }
    } catch (e) { console.error('manejarUpdate error:', e.message); }
}

/** Long-polling de getUpdates. Arranca solo si el bot está activo. */
let _offset = 0;
async function iniciarPolling() {
    if (!botActivo()) { console.log('Telegram: sin TELEGRAM_BOT_TOKEN, bot desactivado.'); return; }
    console.log('Telegram: polling iniciado.');
    (async function loop() {
        try {
            const { data } = await axios.get(`${API}/getUpdates`, { params: { offset: _offset, timeout: 30 }, timeout: 35000 });
            for (const upd of (data.result || [])) {
                _offset = upd.update_id + 1;
                await manejarUpdate(upd);
            }
        } catch (err) {
            if (err.code !== 'ECONNABORTED') console.error('Telegram getUpdates error:', err.response?.data?.description || err.message);
            await new Promise(r => setTimeout(r, 3000));
        }
        setImmediate(loop);
    })();
}

module.exports = { botActivo, enviarMensaje, enviarConBotones, answerCallbackQuery, notificarAsync, representantesDe, procesarCodigo, manejarUpdate, iniciarPolling };
