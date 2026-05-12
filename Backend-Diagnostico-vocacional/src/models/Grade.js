const mongoose = require('mongoose');

const GradeSchema = new mongoose.Schema({
    score: { type: Number, required: true },
    evaluation: { type: mongoose.Schema.Types.ObjectId, ref: 'Evaluation', required: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    lastModified: { type: Date, default: Date.now },
    syncStatus: { type: String, enum: ['synced', 'pending'], default: 'synced' },
    deleted: { type: Boolean, default: false }
}, { timestamps: true });

module.exports = mongoose.model('Grade', GradeSchema);
