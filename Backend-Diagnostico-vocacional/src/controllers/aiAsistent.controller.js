const axios = require('axios');
const dotenv = require('dotenv');
const result = require('../models/result');
const Subject = require('../models/Subject');
const Evaluation = require('../models/Evaluation');
const Grade = require('../models/Grade');

dotenv.config();

/**
 * Asistente IA vía OpenRouter (nube).
 * Reemplaza la integración local con Ollama para poder desplegar la app
 * en servicios como Render/Vercel donde no hay GPU local.
 *
 * Configuración por variables de entorno:
 *   OPENROUTER_MODEL           → modelo principal (Gemma 4 free)
 *   OPENROUTER_FALLBACK_MODELS → cadena de respaldos separados por coma
 *
 * Los modelos gratuitos se saturan con frecuencia (429), así que se usa el
 * enrutamiento nativo de OpenRouter (parámetro `models`): prueba cada modelo
 * de la cadena en orden hasta que uno responda. Si aun así todos están
 * saturados, se espera el tiempo indicado por el proveedor y se reintenta.
 */
const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const OPENROUTER_MODEL = process.env.OPENROUTER_MODEL || 'google/gemma-4-26b-a4b-it:free';
const FALLBACK_MODELS = (process.env.OPENROUTER_FALLBACK_MODELS || process.env.OPENROUTER_FALLBACK_MODEL ||
    'google/gemma-4-31b-it:free,meta-llama/llama-3.3-70b-instruct:free,qwen/qwen3-next-80b-a3b-instruct:free,meta-llama/llama-3.2-3b-instruct:free')
    .split(',').map(m => m.trim()).filter(Boolean);

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/**
 * Llama a OpenRouter con el formato de chat (OpenAI-compatible).
 *
 * @param {Array<{role:string, content:string}>} messages
 * @param {{ temperature?: number, maxTokens?: number }} options
 * @returns {Promise<string>} texto de la respuesta
 */
async function callOpenRouter(messages, options = {}) {
    if (!OPENROUTER_API_KEY) {
        throw new Error('OPENROUTER_API_KEY no está configurada en el entorno');
    }

    // OpenRouter acepta máximo 3 modelos por petición → dividir la cadena
    // completa en grupos de 3 y probarlos en secuencia.
    const chain = [OPENROUTER_MODEL, ...FALLBACK_MODELS];
    const groups = [];
    for (let i = 0; i < chain.length; i += 3) {
        groups.push(chain.slice(i, i + 3));
    }

    const doRequest = async (models) => {
        const response = await axios.post(
            OPENROUTER_URL,
            {
                model: models[0],
                // Enrutamiento de respaldo nativo: prueba estos modelos en orden.
                models,
                messages,
                temperature: options.temperature ?? 0.7,
                max_tokens: options.maxTokens ?? 800,
            },
            {
                headers: {
                    Authorization: `Bearer ${OPENROUTER_API_KEY}`,
                    'Content-Type': 'application/json',
                    // Metadatos opcionales de OpenRouter (ranking público)
                    'HTTP-Referer': process.env.FRONTEND_URL || 'http://localhost:3000',
                    'X-Title': 'EduTrack Insight',
                },
                timeout: 60000,
            }
        );
        const text = response.data?.choices?.[0]?.message?.content;
        if (!text) throw new Error('Respuesta vacía del modelo');
        return text.trim();
    };

    const isRetryable = (err) => {
        const status = err.response?.status;
        return status === 429 || (status >= 500 && status < 600);
    };

    let lastError;
    for (const group of groups) {
        try {
            return await doRequest(group);
        } catch (err) {
            if (!isRetryable(err)) throw err;
            lastError = err;
            console.warn(`Grupo de modelos saturado (${err.response?.status}): ${group.join(', ')}. Probando siguiente grupo...`);
        }
    }

    // Toda la cadena saturada: esperar lo que pida el proveedor (máx. 20 s)
    // y reintentar una vez con el primer grupo.
    const retryAfter = lastError?.response?.data?.error?.metadata?.retry_after_seconds;
    const waitMs = Math.min((Number(retryAfter) || 10), 20) * 1000;
    console.warn(`Todos los modelos saturados. Reintentando en ${waitMs / 1000}s...`);
    await sleep(waitMs);
    return await doRequest(groups[0]);
}

/**
 * Analiza resultados académicos o vocacionales.
 * (Usado por result.controller al generar el resultado del test.)
 */
exports.analizarResultado = async (data, contextType = 'vocacional') => {
    try {
        const systemInstruction = contextType === 'vocacional'
            ? 'Actúa como un psicometrista profesional. Analiza estos resultados de un test vocacional y genera una orientación profesional breve (máximo 200 palabras), cálida y directa, en español. No menciones puntajes numéricos.'
            : 'Actúa como un asesor académico experto. Analiza este historial de notas y evaluaciones para identificar riesgos, fortalezas y dar consejos de estudio personalizados, en español.';

        return await callOpenRouter(
            [
                { role: 'system', content: systemInstruction },
                { role: 'user', content: `Datos: ${JSON.stringify(data)}` },
            ],
            { temperature: 0.5, maxTokens: 500 }
        );
    } catch (error) {
        console.error('Error al analizar con OpenRouter:', error.message);
        throw new Error('Error al procesar el análisis con IA');
    }
};

/**
 * Chat interactivo con el Asistente Integral EduTrack Insight.
 */
exports.asistente = async (req, res) => {
    try {
        const { mensaje, historial = [] } = req.body;
        const userId = req.user.id;

        if (!mensaje) {
            return res.status(400).json({ success: false, error: 'El mensaje es requerido' });
        }

        // 1. Contexto académico del estudiante (materias y notas recientes)
        const subjects = await Subject.find({ user: userId, deleted: false }).limit(20);
        const grades = await Grade.find({ user: userId, deleted: false })
            .populate({
                path: 'evaluation',
                populate: { path: 'subject' }
            })
            .sort({ createdAt: -1 })
            .limit(10);

        // 2. Perfil vocacional
        const userResult = await result.findOne({ user: userId }).sort({ createdAt: -1 });

        // 3. Prompt de sistema enriquecido con su contexto
        let contexto = 'Eres el Asistente Integral de EduTrack Insight v2.0. Tu objetivo es doble: 1) Ayudar con la orientación vocacional basada en sus tests y 2) Mejorar su rendimiento académico basado en sus notas. Responde siempre en español, de forma empática, concisa y sin usar formato de texto enriquecido (sin negritas ni listas complejas).\n\n';

        if (subjects.length > 0) {
            contexto += `El estudiante está cursando: ${subjects.map(s => s.name).join(', ')}.\n`;
        }

        if (grades.length > 0) {
            contexto += 'Historial de notas recientes:\n' + grades
                .filter(g => g.evaluation && g.evaluation.subject)
                .map(g => `- ${g.evaluation.subject.name} (${g.evaluation.name}): Nota ${g.score}`)
                .join('\n') + '\n';
        }

        if (userResult) {
            contexto += `\nPerfil Vocacional: ${userResult.interpretation}\n`;
        }

        // 4. Historial en formato de mensajes (frontend envía role: 'user' | 'model')
        const historyMessages = historial
            .filter(h => h.mensaje)
            .map(h => ({
                role: h.role === 'user' ? 'user' : 'assistant',
                content: h.mensaje,
            }));

        const messages = [
            { role: 'system', content: contexto },
            ...historyMessages,
            { role: 'user', content: mensaje },
        ];

        // 5. Llamada a OpenRouter
        const respuestaIA = await callOpenRouter(messages, { temperature: 0.7, maxTokens: 800 });

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
        console.error('Error en el asistente IA:', error.response?.data || error.message);
        return res.status(500).json({
            success: false,
            error: 'Error del asistente de IA',
            message: 'No se pudo obtener respuesta del modelo. Intenta de nuevo en unos segundos.'
        });
    }
};
