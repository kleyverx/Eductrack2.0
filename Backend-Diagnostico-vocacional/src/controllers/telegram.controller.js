const User = require('../models/user');
const { botActivo } = require('../services/telegram.service');

/** Genera un código legible de 6 chars (sin caracteres ambiguos). */
function generarCodigo() {
    const abc = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let c = '';
    for (let i = 0; i < 6; i++) c += abc[Math.floor(Math.random() * abc.length)];
    return c;
}

// GET /api/telegram/mi-codigo — devuelve el código de vinculación (o estado vinculado).
exports.miCodigo = async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('telegramChatId telegramCodigo name');
        if (!user) return res.status(404).json({ msg: 'Usuario no encontrado' });
        if (user.telegramChatId) return res.json({ vinculado: true, botActivo: botActivo(), botUsername: process.env.TELEGRAM_BOT_USERNAME || null });
        if (!user.telegramCodigo) { user.telegramCodigo = generarCodigo(); await user.save(); }
        res.json({ vinculado: false, codigo: user.telegramCodigo, botActivo: botActivo(), botUsername: process.env.TELEGRAM_BOT_USERNAME || null });
    } catch (err) { console.error(err); res.status(500).json({ msg: 'Error al obtener el código' }); }
};

// POST /api/telegram/desvincular — el representante deja de recibir avisos.
exports.desvincular = async (req, res) => {
    try {
        await User.updateOne({ _id: req.user.id }, { $unset: { telegramChatId: '' } });
        res.json({ msg: 'Telegram desvinculado' });
    } catch (err) { console.error(err); res.status(500).json({ msg: 'Error al desvincular' }); }
};
