
const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema({
    text: { type: String, required: true },
    area: [{ 
  type: String, 
  enum: [
    "Ciencias de la Educación y Ciencias del Deporte", 
    "Humanidades, Letras y artes", 
    "Ciencias y Artes Militares", 
    "Ciencias Sociales", 
    "Ciencias Básicas", 
    "Ingeniería, Arquitectura y Tecnología", 
    "Ciencias del Agro y del mar", 
    "Ciencias de la salud"
  ], 
  required: true 
}], // Área de la pregunta (ej. Matemáticas, Historia, etc.)
test_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Test',
    required: true // Referencia al test al que pertenece la pregunta
}
});
module.exports = mongoose.model('Question', questionSchema);
