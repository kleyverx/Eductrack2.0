const Configuracion = require('../models/Configuracion');

let _cache = null; // caché en memoria (se invalida al guardar)

/** Devuelve la config global, creándola con defaults si no existe. */
async function getConfig() {
    if (_cache) return _cache;
    let cfg = await Configuracion.findOne({ clave: 'global' });
    if (!cfg) cfg = await Configuracion.create({ clave: 'global' });
    _cache = cfg.toObject();
    return _cache;
}

exports.getConfig = getConfig;

// GET /api/config — cualquier usuario autenticado.
exports.obtener = async (req, res) => {
    try {
        const cfg = await getConfig();
        res.json(cfg);
    } catch (err) {
        console.error(err);
        res.status(500).json({ msg: 'Error al obtener la configuración' });
    }
};

// PUT /api/config — solo superadmin.
exports.actualizar = async (req, res) => {
    try {
        const campos = ['institucion', 'umbralInasistencia', 'notaAprobatoria', 'umbralVerde', 'umbralAmbar', 'iaActiva'];
        const cambios = {};
        campos.forEach(c => { if (req.body[c] !== undefined) cambios[c] = req.body[c]; });
        const cfg = await Configuracion.findOneAndUpdate(
            { clave: 'global' }, cambios, { new: true, upsert: true }
        );
        _cache = cfg.toObject(); // refrescar caché
        res.json({ msg: 'Configuración guardada', config: cfg });
    } catch (err) {
        console.error(err);
        res.status(500).json({ msg: 'Error al guardar la configuración' });
    }
};
