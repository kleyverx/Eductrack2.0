const mongoose = require('mongoose');

const AsistenciaSchema = new mongoose.Schema({
    seccion: { type: mongoose.Schema.Types.ObjectId, ref: 'Seccion', required: true },
    fecha: { type: Date, required: true }, // normalizada a medianoche UTC
    docente: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    registros: [{
        estudiante: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
        estado: { type: String, enum: ['presente', 'ausente', 'justificado'], default: 'presente' },
    }],
}, { timestamps: true });

AsistenciaSchema.index({ seccion: 1, fecha: 1 }, { unique: true });

module.exports = mongoose.model('Asistencia', AsistenciaSchema);
