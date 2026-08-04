const mongoose = require('mongoose');

const AuditLogSchema = new mongoose.Schema({
    accion: { type: String, enum: ['login', 'crear-usuario', 'eliminar-usuario', 'config', 'constancia'], required: true },
    actor: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    actorNombre: { type: String },
    actorRol: { type: String },
    detalle: { type: String },
}, { timestamps: true });

AuditLogSchema.index({ createdAt: -1 });

module.exports = mongoose.model('AuditLog', AuditLogSchema);
