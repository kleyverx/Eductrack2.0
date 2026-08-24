const mongoose = require('mongoose');
const answer = require('../models/Answer');
const question = require('../models/question');
const result = require('../models/result');
const { analizarResultado, analizarVocacionalEstructurado } = require('../controllers/aiAsistent.controller');


exports.generateResult = async (req, res) => {
  try {
    const userId = req.user.id;

    // Generar el resultado basado en las respuestas del usuario
    const areaScores = await generateResultFromAnswers(userId);

    // Análisis con IA: prosa + estructurado (perfil, carreras, pasos).
    // Si la IA falla, el resultado igual se guarda (no bloquea el test).
    let interpretation = '';
    let analisis = { resumen: '', fortalezas: [], carreras: [], pasos: [] };
    try {
      analisis = await analizarVocacionalEstructurado(areaScores);
      interpretation = analisis.resumen || await analizarResultado(areaScores);
    } catch (e) {
      console.error('IA no disponible al generar resultado:', e.message);
      interpretation = 'Tu test fue procesado. El análisis con IA no está disponible en este momento; vuelve a intentarlo desde tus resultados.';
    }

    const newResult = await result.create({
      user: userId,
      results: areaScores,
      interpretation,
      analisis,
    });

    res.status(200).json({ message: 'Resultado generado correctamente', result: newResult });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al generar el resultado', error });
  }
}

// Regenera el análisis con IA de un resultado existente (sin rehacer el test).
// Útil para resultados antiguos que no tienen análisis estructurado.
exports.regenerarAnalisis = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ message: 'ID inválido' });
    }

    // OJO: en esta ruta el :id que manda el frontend es el ID del USUARIO
    // (navega a /app/results/:userId), igual que en GET /api/result/:id.
    // Antes solo se buscaba con findById (ID del resultado), así que la
    // regeneración devolvía 404 siempre. Se aceptan ambos por compatibilidad.
    const userResult = (await result.findById(id)) || (await result.findOne({ user: id }));
    if (!userResult) return res.status(404).json({ message: 'Resultado no encontrado' });

    // El estudiante solo puede regenerar el suyo; superadmin/docente cualquiera.
    if (req.user.role === 'estudiante' && String(userResult.user) !== String(req.user.id)) {
      return res.status(403).json({ message: 'No puedes regenerar este análisis' });
    }

    const scores = userResult.results instanceof Map
      ? Object.fromEntries(userResult.results)
      : userResult.results;
    const analisis = await analizarVocacionalEstructurado(scores);
    userResult.analisis = analisis;
    if (analisis.resumen) userResult.interpretation = analisis.resumen;
    await userResult.save();

    res.json({ message: 'Análisis regenerado', result: userResult });
  } catch (error) {
    console.error('Error al regenerar análisis:', error.message);
    res.status(500).json({ message: 'No se pudo regenerar el análisis con IA' });
  }
}

exports.getResult = async (req, res) => {
  try {
    const userId = req.user.id;

    // Buscar el resultado del usuario
    const userResult = await result.findOne({ user: userId }).populate('user', 'name cedula');
    if (!userResult) {
      return res.status(404).json({ message: 'No se encontraron resultados para este usuario' });
    }
    res.status(200).json(userResult);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al obtener el resultado', error });
  }
}

/**
 * Área vocacional dominante de VARIOS estudiantes de una sola vez.
 * GET /api/result/areas-top?ids=id1,id2,...  →  { [userId]: "Área" }
 *
 * Existe para que el panel del docente no dispare una petición por estudiante:
 * antes hacía 1 + N llamadas HTTP (y la mayoría respondía 404 para quienes aún
 * no han hecho el test), lo que se notaba muchísimo con el backend dormido.
 */
exports.areasTop = async (req, res) => {
  try {
    const ids = String(req.query.ids || '')
      .split(',')
      .map((s) => s.trim())
      .filter((s) => mongoose.isValidObjectId(s));

    if (!ids.length) return res.json({});

    const docs = await result.find({ user: { $in: ids } }).select('user results').lean();

    const salida = {};
    docs.forEach((d) => {
      // Según venga de .lean() o de un documento, `results` es objeto plano o Map.
      const pares = d.results instanceof Map ? [...d.results.entries()] : Object.entries(d.results || {});
      if (!pares.length) return;
      salida[String(d.user)] = pares.sort(([, a], [, b]) => b - a)[0][0];
    });

    res.json(salida);
  } catch (error) {
    console.error('Error al obtener áreas dominantes:', error.message);
    res.status(500).json({ message: 'Error al obtener las áreas vocacionales' });
  }
}

exports.getResultById = async (req, res) => {
  try {
    const userId = req.params.id;

    // Buscar el resultado del usuario por ID
    const userResult = await result.findOne({ user: userId }).populate('user', 'name cedula');
    if (!userResult) {
      return res.status(404).json({ message: 'No se encontraron resultados para este usuario' });
    }
    res.status(200).json(userResult);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al obtener el resultado', error });
  }

}

async function generateResultFromAnswers(userId) {
  const userAnswers = await answer.findOne({ user: userId });

  if (!userAnswers || !userAnswers.respuestas) {
    throw new Error('No se encontraron respuestas para este usuario');
  }

  const areaScores = {};

  for (const resp of userAnswers.respuestas) {
    const q = await question.findById(resp.question);
    if (!q) continue;

    const areas = q.area;

    for (const area of areas) {
      if (typeof area !== 'string') continue;

      areaScores[area] = (areaScores[area] || 0) + (resp.selectedOptionValue || 0);
    }
  }

  return areaScores;
}
