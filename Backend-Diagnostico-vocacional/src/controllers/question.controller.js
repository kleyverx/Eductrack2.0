const Question = require('../models/question');  // Usa mayúscula para modelos

exports.createQuestion = async (req, res) => {
    try {
        const { text, area, test_id } = req.body; // Ensure test_id is deconstructed

        if (!text || typeof text !== 'string') {
            return res.status(400).json({ msg: 'El texto de la pregunta es obligatorio y debe ser una cadena' });
        }
        if (!test_id) { // Add a check for test_id to provide a more specific error
            return res.status(400).json({ msg: 'El ID del test es obligatorio' });
        }

        const newQuestion = new Question({ text, area, test_id }); // Pass test_id to the new Question document
        await newQuestion.save();

        res.status(201).json({ msg: 'Pregunta creada correctamente', question: newQuestion });
    } catch (err) {
        console.error(err);
        res.status(500).json({ msg: 'Error del servidor al crear la pregunta', error: err.message });
    }
};
exports.getQuestions = async (req, res) => {
    try {
        const questions = await Question.find();
        res.json(questions);
    } catch (err) {
        console.error(err);
        res.status(500).json({ msg: 'Error del servidor al obtener las preguntas' });
    }
};

exports.editQuestion = async (req, res) => {
    try {
        const { id } = req.params;
        const { text, area } = req.body;

        if (!text || typeof text !== 'string') {
            return res.status(400).json({ msg: 'El texto de la pregunta es obligatorio y debe ser una cadena' });
        }

        const updatedQuestion = await Question.findByIdAndUpdate(
            id,
            { text, area },
            { new: true }
        );

        if (!updatedQuestion) {
            return res.status(404).json({ msg: 'Pregunta no encontrada' });
        }

        res.json({ msg: 'Pregunta actualizada correctamente', question: updatedQuestion });
    } catch (err) {
        console.error(err);
        res.status(500).json({ msg: 'Error del servidor al actualizar la pregunta' });
    }
};

exports.deleteQuestion = async (req, res) => {
    try {
        const deleted = await Question.findByIdAndDelete(req.params.id);
        if (!deleted) {
            return res.status(404).json({ msg: 'Pregunta no encontrada' });
        }
        res.json({ msg: 'Pregunta eliminada correctamente' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ msg: 'Error del servidor al eliminar la pregunta' });
    }
};

exports.createQuestions = async (req, res) => {
    try {
        const questionsData = req.body.questions;

        if (!Array.isArray(questionsData) || questionsData.length === 0) {
            return res.status(400).json({ msg: 'Se requieren preguntas válidas para crear' });
        }

        const createdQuestions = await Question.insertMany(questionsData);
        res.status(201).json({ msg: 'Preguntas creadas correctamente', questions: createdQuestions });
    } catch (err) {
        console.error(err);
        res.status(500).json({ msg: 'Error del servidor al crear las preguntas', error: err.message });
    }
}
exports.getQuestionsByTestId = async (req, res) => {
    try {
        // Change 'id' to 'test_id' to match the route parameter
        const { test_id } = req.params; 
        
        // Use the correct parameter in the query
        const questions = await Question.find({ test_id: test_id });

        if (questions.length === 0) {
            return res.status(404).json({ msg: 'No se encontraron preguntas para este test' });
        }
        res.json(questions);
    } catch (err) {
        console.error(err);
        res.status(500).json({ msg: 'Error del servidor al obtener las preguntas del test', error: err.message });
    }
};

exports.createQuestions = async (req, res) => {
    try {
        const questionsData = req.body.questions;

        if (!Array.isArray(questionsData) || questionsData.length === 0) {
            return res.status(400).json({ msg: 'Se requieren preguntas válidas para crear' });
        }

        const createdQuestions = await Question.insertMany(questionsData);
        res.status(201).json({ msg: 'Preguntas creadas correctamente', questions: createdQuestions });
    } catch (err) {
        console.error(err);
        res.status(500).json({ msg: 'Error del servidor al crear las preguntas', error: err.message });
    }
}