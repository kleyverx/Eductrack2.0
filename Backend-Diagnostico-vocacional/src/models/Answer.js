const mongoose = require('mongoose');

// Definimos el esquema para almacenar los resultados del test
const testAnswerSchema = new mongoose.Schema({
  user: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true, 
    unique: true // Para que solo se permita un test por usuario
  },
  respuestas: [
    {
      question: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Question', 
        required: true 
      },
      selectedOptionValue: { 
        type: Number, 
        required: true 
      }
    }
  ],
  createdAt: { 
    type: Date, 
    default: Date.now 
  },
});

module.exports = mongoose.model('TestAnswer', testAnswerSchema);
