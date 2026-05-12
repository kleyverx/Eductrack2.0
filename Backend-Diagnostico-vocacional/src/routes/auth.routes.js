const express = require('express');
const router = express.Router();                     // Creamos un enrutador de Express
const { register, login, identify, getUser, getUserByCedula, getUserById, updateUser, changePassword } = require('../controllers/auth.controller'); // Importamos los controladores
const auth = require('../middlewares/auth');
// Ruta para registrar un nuevo usuario
router.post('/register', register);

// Ruta para iniciar sesión
router.post('/login', login);

router.put('/identificacion', auth(), identify);

router.get('/user', auth(), getUser);

router.get('/user/buscar/:cedula', auth(["admin"]), getUserByCedula); // Ruta para buscar un usuario por cédula
router.put('/password', auth(), changePassword); // Para usuarios normales (dentro del perfil)
router.put('/user/:id/password', auth(["admin"]), changePassword);
router.get('/user/:id', auth(), getUserById);

router.put('/user/:id', auth(), updateUser);

// Ruta para cambiar la contraseña del usuario autenticad

module.exports = router; // Exportamos el router para usarlo en app.js
