const mongoose = require('mongoose');
// Definimos el esquema del test
const testSchema = new mongoose.Schema({
    name: { 
        type: String, 
        required: true, 
        unique: true // Nombre único del test   
    },
    description: String, // Descripción del test
    state: {
        type: String,
        enum: ['active', 'inactive'], // Estado del test, puede ser 'active' o 'inactive' 
        required: true,
    },
    fechaInicio: {
        type: Date,
        required: true, 
    },
    fechaFin: {
        type: Date, 
        required: true,
    },
    createdAt: {
        type: Date,
        default: Date.now // Fecha de creación del test
    },
    duracion: {
        type: Number, // Duración del test en minutos
        required: true
    }
});

module.exports = mongoose.model('Test', testSchema);
