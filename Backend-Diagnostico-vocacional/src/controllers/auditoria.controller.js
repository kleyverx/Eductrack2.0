const AuditLog = require('../models/AuditLog');

// GET /api/admin/auditoria — últimos eventos (superadmin).
exports.listar = async (req, res) => {
    try {
        const filtro = {};
        if (req.query.accion) filtro.accion = req.query.accion;
        const logs = await AuditLog.find(filtro).sort({ createdAt: -1 }).limit(100)
            .select('accion actorNombre actorRol detalle createdAt').lean();
        res.json(logs);
    } catch (err) { console.error(err); res.status(500).json({ msg: 'Error al obtener la auditoría' }); }
};
