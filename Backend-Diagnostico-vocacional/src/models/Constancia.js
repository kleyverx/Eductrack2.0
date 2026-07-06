const mongoose = require('mongoose');

const ConstanciaSchema = new mongoose.Schema({
    codigo: { type: String, required: true, unique: true },
    tipo: { type: String, enum: ['estudios', 'conducta', 'rendimiento', 'con-representante'], required: true },
    estudiante: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    seccion: { type: mongoose.Schema.Types.ObjectId, ref: 'Seccion' },
    emitidoPor: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    datos: { type: mongoose.Schema.Types.Mixed },
}, { timestamps: true });

module.exports = mongoose.model('Constancia', ConstanciaSchema);
