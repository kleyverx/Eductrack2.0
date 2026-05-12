const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

const User = require('./src/models/user');
const Question = require('./src/models/question');
const Test = require('./src/models/test');

async function check() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('--- Resumen de Base de Datos ---');
    console.log('Usuarios:', await User.countDocuments());
    console.log('Preguntas:', await Question.countDocuments());
    console.log('Tests:', await Test.countDocuments());
    await mongoose.disconnect();
  } catch (err) {
    console.error('Error:', err.message);
  }
}
check();
