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
    const userResult = await result.findById(id);
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
