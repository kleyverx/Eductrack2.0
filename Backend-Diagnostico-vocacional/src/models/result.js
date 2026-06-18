// src/models/testResult.js
const mongoose = require('mongoose');

const testResultSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true // Un resultado por usuario. Si quieres permitir varios resultados por usuario, quita esto.
  },
  results: {
    type: Map,
    of: Number,
    required: true
    // Ejemplo: { "Ciencias": 24, "Artes": 15, "Tecnología": 20 }
  },
  interpretation: {
    type: String,
    // Interpretación del resultado del test (texto en prosa)
  },
  // Análisis estructurado generado por IA para apoyar la decisión vocacional.
  analisis: {
    resumen: String,
    fortalezas: [String],
    carreras: [String],
    pasos: [String],
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('TestResult', testResultSchema);
