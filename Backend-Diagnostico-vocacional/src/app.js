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
const dashboardRoutes = require('./routes/dashboard.routes');
const tests = require('./routes/test.routes');
const academicoRoutes = require('./routes/academico.routes');
const configRoutes = require('./routes/config.routes');

const app = express();

app.use(express.json());

// CORS: FRONTEND_URL admite varios orígenes separados por coma
// (ej. "https://edutrack.vercel.app,http://localhost:3000")
const allowedOrigins = (process.env.FRONTEND_URL || 'http://localhost:3000')
    .split(',')
    .map(o => o.trim())
    .filter(Boolean);

const corsOptions = {
    origin: (origin, callback) => {
        // Permitir requests sin origin (curl, healthchecks de Render)
        if (!origin || allowedOrigins.includes(origin)) {
            return callback(null, true);
        }
        return callback(new Error(`Origen no permitido por CORS: ${origin}`));
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization']
};

app.use(cors(corsOptions));

// Ruta de salud (la usa Render para verificar que el servicio está vivo)
app.get('/', (req, res) => {
    res.json({ status: 'ok', service: 'EduTrack Insight API', version: '2.0' });
});

app.use('/api/auth', authRoutes); // Autenticación y datos del usuario
app.use('/api/testQuestions', testQuestionsRoutes); // Preguntas del test
app.use('/api/test', testRoutes); // Respuestas del test
app.use('/api/aiAsistent', aiAsistentRoutes); // Asistente de IA (OpenRouter)
app.use('/api/result', resultRoutes); // Resultados del test
app.use('/api/sync', syncRoutes); // Sincronización
app.use('/api/tests', tests); // Gestión de tests
app.use('/api/admin', dashboardRoutes); // Administración
app.use('/api/academico', academicoRoutes); // Gestión académica (secciones, planes, notas)
app.use('/api/config', configRoutes); // Configuración global de la institución

const PORT = process.env.PORT || 5000;

mongoose.connect(process.env.MONGO_URI)
    .then(() => {
        console.log('MongoDB conectado');
        app.listen(PORT, () => console.log(`Servidor en puerto ${PORT}`));
    })
    .catch(err => console.error(err));
