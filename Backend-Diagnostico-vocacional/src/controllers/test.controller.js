const Test = require('../models/test'); // Make sure the path is correct
const Question = require('../models/question'); // Import Question model to handle associated questions

// Controller to create a new test, ensuring only one is active
exports.createTest = async (req, res) => {
    try {
        const { state } = req.body;

        // If the new test is set to 'active', deactivate all other active tests
        if (state === 'active') {
            await Test.updateMany({ state: 'active' }, { $set: { state: 'inactive' } });
        }

        const newTest = new Test(req.body);
        const savedTest = await newTest.save();
        res.status(201).json(savedTest);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
};

// Controller to get all tests
exports.getAllTests = async (req, res) => {
    try {
        const tests = await Test.find();
        res.status(200).json(tests);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// Controller to get a single test by ID
exports.getTestById = async (req, res) => {
    try {
        const test = await Test.findById(req.params.id);
        if (!test) {
            return res.status(404).json({ message: 'Test not found' });
        }
        res.status(200).json(test);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// Controller to update a test
exports.updateTest = async (req, res) => {
    try {
        const { state } = req.body;

        // If the update sets the test to 'active', deactivate all other active tests
        if (state === 'active') {
            await Test.updateMany({ state: 'active' }, { $set: { state: 'inactive' } });
        }

        const updatedTest = await Test.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!updatedTest) {
            return res.status(404).json({ message: 'Test not found' });
        }
        res.status(200).json(updatedTest);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
};

// Controller to delete a test
exports.deleteTest = async (req, res) => {
   try {
        const testId = req.params.id;
        
        // Elimina todas las preguntas que tienen el test_id del test que se va a eliminar
        await Question.deleteMany({ test_id: testId });

        // Elimina el test
        const deletedTest = await Test.findByIdAndDelete(testId);
        
        if (!deletedTest) {
            return res.status(404).json({ message: 'Test not found' });
        }
        
        res.status(200).json({ message: 'Test and associated questions deleted successfully' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// New controller to get the active test
exports.getActiveTest = async (req, res) => {
    try {
        const activeTest = await Test.findOne({ state: 'active' });
        if (!activeTest) {
            return res.status(404).json({ message: 'No active test found' });
        }
        res.status(200).json(activeTest);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};