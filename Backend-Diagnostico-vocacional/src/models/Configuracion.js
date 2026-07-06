const mongoose = require('mongoose');

// Documento único global con los ajustes de la institución.
const ConfiguracionSchema = new mongoose.Schema({
    clave: { type: String, default: 'global', unique: true }, // asegura un solo doc
    institucion: { type: String, default: 'EduTrack Insight' },
    umbralInasistencia: { type: Number, default: 25 }, // % que hace perder derecho a evaluación
    notaAprobatoria: { type: Number, default: 10 },
    umbralVerde: { type: Number, default: 15 },
    umbralAmbar: { type: Number, default: 11 },
    iaActiva: { type: Boolean, default: true },
}, { timestamps: true });

module.exports = mongoose.model('Configuracion', ConfiguracionSchema);
