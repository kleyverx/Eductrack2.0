const answer = require('../models/Answer');

exports.getAnswers = async (req, res) => {
  try {
    const userId = req.user.id;

    const userAnswers = await answer.findOne({ user: userId }).populate('user', 'name cedula');

    if (!userAnswers) {
      return res.status(404).json({ msg: 'No se encontraron respuestas para este usuario' });
    }

    res.json(userAnswers);
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Error del servidor al obtener las respuestas del usuario' });
  }
};


exports.saveAnswer = async (req, res) => {
  try {
    const userId = req.user.id;
    const { respuestas } = req.body;

    // Borrar test anterior si ya existe
    await answer.deleteOne({ user: userId });

    // Crear nuevo resultado
    const result = await answer.create({
      user: userId,
      respuestas
    });

    res.status(201).json({ msg: 'Test guardado correctamente', result });
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: 'Error al guardar test' });
  }
}