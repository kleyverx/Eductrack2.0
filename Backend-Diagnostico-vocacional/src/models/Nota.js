const mongoose = require('mongoose');

/**
 * Nota de un estudiante en una actividad del plan de evaluación.
 * Escala venezolana: 1 a 20 (mínima aprobatoria 10).
 * La nota del lapso se calcula como suma ponderada de las actividades.
 */
const NotaSchema = new mongoose.Schema({
    estudiante: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    materia: { type: mongoose.Schema.Types.ObjectId, ref: 'Materia', required: true },
    lapso: { type: Number, required: true, enum: [1, 2, 3] },
    actividad: { type: mongoose.Schema.Types.ObjectId, required: true }, // _id de la actividad en el plan
    valor: { type: Number, required: true, min: 1, max: 20 },
    docente: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
}, { timestamps: true });

// Una sola nota por estudiante/actividad.
NotaSchema.index({ estudiante: 1, actividad: 1 }, { unique: true });
NotaSchema.index({ materia: 1, lapso: 1 });

module.exports = mongoose.model('Nota', NotaSchema);
