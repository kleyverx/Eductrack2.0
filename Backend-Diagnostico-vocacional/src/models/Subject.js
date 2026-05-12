const mongoose = require('mongoose');

const SubjectSchema = new mongoose.Schema({
    name: { type: String, required: true },
    description: { type: String },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    color: { type: String, default: '#4F46E5' },
    lastModified: { type: Date, default: Date.now },
    syncStatus: { type: String, enum: ['synced', 'pending'], default: 'synced' },
    deleted: { type: Boolean, default: false }
}, { timestamps: true });

module.exports = mongoose.model('Subject', SubjectSchema);
