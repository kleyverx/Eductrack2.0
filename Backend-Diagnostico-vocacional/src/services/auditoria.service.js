const AuditLog = require('../models/AuditLog');

/** Registra un evento de auditoría. A prueba de fallos: nunca lanza ni rompe la operación que lo dispara. */
async function registrarAuditoria({ accion, actor, actorNombre, actorRol, detalle }) {
    try {
        await AuditLog.create({ accion, actor: actor || undefined, actorNombre, actorRol, detalle });
    } catch (e) {
        console.error('registrarAuditoria falló:', e.message);
    }
}

module.exports = { registrarAuditoria };
