const answer = require('../models/Answer');
const question = require('../models/question');
const result = require('../models/result');
const { analizarResultado } = require('../controllers/aiAsistent.controller');


exports.generateResult = async (req, res) => {
  try {
    const userId = req.user.id;

    // Generar el resultado basado en las respuestas del usuario
    const areaScores = await generateResultFromAnswers(userId);

    // Guardar el resultado en la base de datos
    const resultData = {
      user: userId,
      results: areaScores,
      interpretation: await analizarResultado(areaScores), // Se envía el objeto crudo
    };

    const newResult = await result.create(resultData);

    res.status(200).json({ message: 'Resultado generado correctamente', result: newResult });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al generar el resultado', error });
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
