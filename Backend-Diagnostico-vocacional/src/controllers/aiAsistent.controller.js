const axios = require('axios');
const dotenv = require('dotenv');
const result = require('../models/result');
const Subject = require('../models/Subject');
const Evaluation = require('../models/Evaluation');
const Grade = require('../models/Grade');

dotenv.config();

const OLLAMA_URL = process.env.OLLAMA_URL || 'http://localhost:11434/api/generate';
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || 'gemma4:4b';

/**
 * Analiza resultados académicos o vocacionales usando Gemma 4 local.
 */
exports.analizarResultado = async (data, contextType = 'vocacional') => {
    try {
        let systemInstruction = "";
        
        if (contextType === 'vocacional') {
            systemInstruction = "Actúa como un psicometrista profesional. Analiza estos resultados de un test vocacional y genera una orientación profesional breve (máximo 200 palabras), cálida y directa. No menciones puntajes numéricos.";
        } else {
            systemInstruction = "Actúa como un asesor académico experto. Analiza este historial de notas y evaluaciones para identificar riesgos, fortalezas y dar consejos de estudio personalizados.";
        }

        const prompt = `${systemInstruction}\n\nDatos: ${JSON.stringify(data)}`;

        const response = await axios.post(OLLAMA_URL, {
            model: OLLAMA_MODEL,
            prompt: prompt,
            stream: false,
            options: {
                temperature: 0.5
            }
        });

        return response.data.response;
    } catch (error) {
        console.error("Error al analizar con Gemma 4:", error);
        throw new Error('Error al procesar el análisis local');
    }
}

/**
 * Chat interactivo con el Asistente Integral EduTrack Insight.
 * Utiliza Gemma 4 local mediante Ollama.
 */
exports.asistente = async (req, res) => {
    try {
        const { mensaje, historial = [] } = req.body;
        const userId = req.user.id;

        if (!mensaje) {
            return res.status(400).json({ success: false, error: 'El mensaje es requerido' });
        }

        // 1. Recopilar Contexto Académico (Buscamos datos del usuario para "alimentar" a la IA)
        const subjects = await Subject.find({ user: userId, deleted: false }).limit(20);
        const grades = await Grade.find({ user: userId, deleted: false })
            .populate({
                path: 'evaluation',
                populate: { path: 'subject' }
            })
            .sort({ createdAt: -1 }) // Traemos las notas más recientes primero
            .limit(10);
        
        // 2. Recopilar Perfil Vocacional (Para alinear notas con intereses)
        const userResult = await result.findOne({ user: userId }).sort({ createdAt: -1 });

        // 3. Construir el prompt enriquecido
        let contexto = "Eres el Asistente Integral de EduTrack Insight v2.0. Tu objetivo es doble: 1) Ayudar con la orientación vocacional basada en sus tests y 2) Mejorar su rendimiento académico basado en sus notas.\n\n";
        
        if (subjects.length > 0) {
            contexto += `El estudiante está cursando: ${subjects.map(s => s.name).join(', ')}.\n`;
        }
        
        if (grades.length > 0) {
            contexto += "Historial de notas recientes:\n" + grades.map(g => 
                `- ${g.evaluation.subject.name} (${g.evaluation.name}): Nota ${g.score}`
            ).join('\n') + "\n";
        }

        if (userResult) {
            contexto += `\nPerfil Vocacional: ${userResult.interpretation}\n`;
        }

        // 4. Integrar historial
        const conversacionPrevia = historial.map(h => `${h.role === 'user' ? 'Usuario' : 'Asistente'}: ${h.mensaje}`).join('\n');
        
        const fullPrompt = `${contexto}\n\nHistorial de conversación:\n${conversacionPrevia}\n\nUsuario: ${mensaje}\nAsistente:`;

        // 5. Llamada a Gemma 4 (Ollama)
        const response = await axios.post(OLLAMA_URL, {
            model: OLLAMA_MODEL,
            prompt: fullPrompt,
            stream: false,
            system: "Eres un asistente académico empático, profesional y basado en datos. Responde siempre en español, de forma concisa y sin usar formato de texto enriquecido (negritas o listas complejas).",
            options: {
                temperature: 0.7,
                num_predict: 800
            }
        });

        const respuestaIA = response.data.response;

        const nuevoHistorial = [
            ...historial,
            { role: 'user', mensaje: mensaje, timestamp: new Date() },
            { role: 'model', mensaje: respuestaIA, timestamp: new Date() }
        ];

        return res.status(200).json({
            success: true,
            data: {
                respuesta: respuestaIA,
                historial: nuevoHistorial
            }
        });

    } catch (error) {
        console.error("Error en el asistente local:", error.message);
        return res.status(500).json({
            success: false,
            error: 'Error de inteligencia local',
            message: 'Asegúrate de que Ollama esté corriendo con Gemma 4.'
        });
    }
};
