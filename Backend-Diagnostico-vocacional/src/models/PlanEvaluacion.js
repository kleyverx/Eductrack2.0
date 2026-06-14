const mongoose = require('mongoose');

/**
 * Plan de Evaluación de una materia para un lapso (1, 2 o 3).
 * Las ponderaciones de las actividades deben sumar 100%.
 */
const ActividadSchema = new mongoose.Schema({
    nombre: { type: String, required: true, trim: true },           // "Examen Parcial", "Exposición"...
    tipo: {
        type: String,
        enum: ['examen', 'taller', 'exposicion', 'trabajo', 'proyecto', 'rasgos', 'otro'],
        default: 'otro'
    },
    fecha: { type: Date },
    ponderacion: { type: Number, required: true, min: 1, max: 100 } // % del lapso
});

const PlanEvaluacionSchema = new mongoose.Schema({
    materia: { type: mongoose.Schema.Types.ObjectId, ref: 'Materia', required: true },
    lapso: { type: Number, required: true, enum: [1, 2, 3] },
    actividades: {
        type: [ActividadSchema],
        validate: {
            validator(acts) {
                if (!acts.length) return true; // plan vacío permitido (en construcción)
                const total = acts.reduce((s, a) => s + a.ponderacion, 0);
                return total === 100;
            },
            message: 'Las ponderaciones de las actividades deben sumar exactamente 100%'
        }
    },
    publicado: { type: Boolean, default: false }, // visible para estudiantes
}, { timestamps: true });

PlanEvaluacionSchema.index({ materia: 1, lapso: 1 }, { unique: true });

module.exports = mongoose.model('PlanEvaluacion', PlanEvaluacionSchema);
