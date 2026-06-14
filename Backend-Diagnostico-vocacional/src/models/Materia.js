const mongoose = require('mongoose');

/**
 * Materia (área de formación) dentro de una sección.
 * Se crea automáticamente desde el preset del currículo MPPE al crear la
 * sección, aunque el docente puede agregar o quitar.
 */
const MateriaSchema = new mongoose.Schema({
    nombre: { type: String, required: true, trim: true },
    horas: { type: Number, default: 0 },                            // horas semanales (referencial)
    seccion: { type: mongoose.Schema.Types.ObjectId, ref: 'Seccion', required: true },
    docente: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
}, { timestamps: true });

MateriaSchema.index({ seccion: 1, nombre: 1 }, { unique: true });

module.exports = mongoose.model('Materia', MateriaSchema);
