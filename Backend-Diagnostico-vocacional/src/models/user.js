const mongoose = require('mongoose');

// Definimos el esquema del usuario
const UserSchema = new mongoose.Schema({             // Nombre del usuario
    cedula: { type: Number, required: true, unique: true }, // Cédula única del usuario
    password: { type: String, required: true },       // Contraseña encriptada
    role: {
        type: String,
        enum: ['estudiante', 'docente', 'superadmin', 'representante'],  // Roles del sistema
        default: 'estudiante'  // Valor por defecto
    },// Rol del usuario, por defecto es 'estudiante'

    // Información personal (identificación)
    name: String,
    secondName: String,
    apellido: String,
    segundoApellido: String,
    nacionalidad: String,
    edad: Number,
    sexo: String,
    fechaNacimiento: Date,
    // sparse: la unicidad solo aplica si el campo existe (muchos estudiantes
    // de liceo no tienen email/teléfono propio).
    telefono: { type: String, unique: true, sparse: true }, // Teléfono único (opcional)
    email: { type: String, unique: true, sparse: true }, // Email único (opcional)

    // Información de ubicación
    estado: String, // Estado del usuario
    municipio: String, // Municipio del usuario
    parroquia: String, // Parroquia del usuario

    //información de unidad educativa
    unidadEducativa: String, // Nombre de la unidad educativa
    codigoUnidadEducativa: String, // Código único de la unidad educativa

    // Conducta del estudiante (para constancia de buena conducta)
    conducta: { type: String, default: 'Satisfactoria' },
    // Estudiantes que representa (solo aplica al rol 'representante')
    representados: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }]

}, { timestamps: true });                                 // Agrega automáticamente campos createdAt y updatedAt

module.exports = mongoose.model('User', UserSchema); // Exportamos el modelo
