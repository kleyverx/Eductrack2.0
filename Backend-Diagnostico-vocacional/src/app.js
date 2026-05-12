const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

const authRoutes = require('./routes/auth.routes');
const testQuestionsRoutes = require('./routes/testQuestion.routes');
const testRoutes = require('./routes/testAnswer.routes');
const resultRoutes = require('./routes/result.routes');
const aiAsistentRoutes = require('./routes/aiAsistent.routes');
const syncRoutes = require('./routes/sync.routes');
const dashboardRoutes = require('./routes/dashboard.routes'); // Agregado
const tests = require('./routes/test.routes'); // Importing test routes

const app = express();

app.use(express.json());

// Configuración de CORS con opciones
const corsOptions = {
    origin: process.env.FRONTEND_URL, // Especifique el dominio permitido
    methods: ['GET', 'POST', 'PUT', 'DELETE'], // Especifique los métodos HTTP permitidos
    allowedHeaders: ['Content-Type', 'Authorization'] // Especifique las cabeceras permitidas
};

app.use(cors(corsOptions)); // Aplique la configuración de CORS

app.use('/api/auth', authRoutes); // Rutas de autenticación y datos del usuario
app.use('/api/testQuestions', testQuestionsRoutes); // Rutas de preguntas del test
app.use('/api/test', testRoutes); // Rutas de tests
app.use('/api/aiAsistent', aiAsistentRoutes); // Rutas del asistente de IA
app.use('/api/result', resultRoutes); // Rutas de resultados del test
app.use('/api/sync', syncRoutes); // Rutas de sincronización
app.use('/api/tests', tests); // Rutas de tests
app.use('/api/admin', dashboardRoutes); // Rutas de administración

mongoose.connect(process.env.MONGO_URI)
    .then(() => {
        console.log('MongoDB conectado');
        app.listen(5000, () => console.log('Servidor en puerto 5000'));
    })
    .catch(err => console.error(err));
