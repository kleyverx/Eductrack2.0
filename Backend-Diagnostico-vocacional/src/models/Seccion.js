const mongoose = require('mongoose');

/**
 * Sección escolar (ej. "2do Año - A", período 2025-2026).
 * Pertenece a un docente, agrupa estudiantes y materias.
 */
const SeccionSchema = new mongoose.Schema({
    nombre: { type: String, required: true, trim: true },          // "A", "B", "Única"...
    anio: { type: Number, required: true, min: 1, max: 5 },        // 1ro a 5to año
    periodo: { type: String, required: true, trim: true },         // "2025-2026"
    docente: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    estudiantes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
}, { timestamps: true });

// Un docente no puede repetir la misma sección en el mismo período.
SeccionSchema.index({ docente: 1, anio: 1, nombre: 1, periodo: 1 }, { unique: true });

module.exports = mongoose.model('Seccion', SeccionSchema);
