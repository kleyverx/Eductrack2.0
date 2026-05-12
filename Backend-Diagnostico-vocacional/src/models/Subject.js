const mongoose = require('mongoose');

/**
 * Modelo de Materia (Subject)
 * Representa una asignatura académica vinculada a un usuario.
 */
const SubjectSchema = new mongoose.Schema({
    name: { 
        type: String, 
        required: [true, 'El nombre de la materia es obligatorio'] 
    },
    description: { type: String },
    // Relación con el usuario dueño de la materia
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    color: { type: String, default: '#4F46E5' },
    // Control de sincronización Offline-First
    lastModified: { type: Date, default: Date.now },
    syncStatus: { type: String, enum: ['synced', 'pending'], default: 'synced' },
    deleted: { type: Boolean, default: false } // Soft delete para no perder datos en sync
}, { timestamps: true });

module.exports = mongoose.model('Subject', SubjectSchema);
