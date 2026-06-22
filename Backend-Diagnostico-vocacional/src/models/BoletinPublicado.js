const mongoose = require('mongoose');

/**
 * Registro de boletines publicados por el docente.
 * Marca que el boletín de una sección, en un lapso, está disponible para que
 * los estudiantes de esa sección lo descarguen. Sin este registro, el
 * estudiante no puede generar su boletín del lapso.
 */
const BoletinPublicadoSchema = new mongoose.Schema({
    seccion: { type: mongoose.Schema.Types.ObjectId, ref: 'Seccion', required: true },
    lapso: { type: Number, required: true, enum: [1, 2, 3] },
    docente: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    publicadoEn: { type: Date, default: Date.now },
}, { timestamps: true });

// Un único registro por sección + lapso.
BoletinPublicadoSchema.index({ seccion: 1, lapso: 1 }, { unique: true });

module.exports = mongoose.model('BoletinPublicado', BoletinPublicadoSchema);
