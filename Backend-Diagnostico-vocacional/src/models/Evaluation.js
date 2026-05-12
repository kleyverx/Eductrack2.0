const mongoose = require('mongoose');

const EvaluationSchema = new mongoose.Schema({
    name: { type: String, required: true },
    percentage: { type: Number, required: true },
    subject: { type: mongoose.Schema.Types.ObjectId, ref: 'Subject', required: true },
    dueDate: { type: Date },
    feedbackDate: { type: Date },
    status: { type: String, enum: ['pending', 'graded'], default: 'pending' },
    lastModified: { type: Date, default: Date.now },
    syncStatus: { type: String, enum: ['synced', 'pending'], default: 'synced' },
    deleted: { type: Boolean, default: false }
}, { timestamps: true });

module.exports = mongoose.model('Evaluation', EvaluationSchema);
