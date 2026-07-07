const express = require('express');
const router = express.Router();                     // Creamos un enrutador de Express
const { register, login, identify, getUser, getUserByCedula, getUserById, updateUser, changePassword, listUsers, updateRole, deleteUser, createUser, importarEstudiantes, vincularRepresentado, desvincularRepresentado, updateConducta } = require('../controllers/auth.controller'); // Importamos los controladores
const auth = require('../middlewares/auth');
const rateLimit = require('express-rate-limit');

// Frena fuerza bruta contra el login: 10 intentos por IP cada 15 min.
const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10,
    standardHeaders: true,
    legacyHeaders: false,
    message: { msg: 'Demasiados intentos de inicio de sesión. Intenta de nuevo en unos minutos.' },
});
// Ruta para registrar un nuevo usuario
router.post('/register', register);

// Ruta para iniciar sesión
router.post('/login', loginLimiter, login);

router.put('/identificacion', auth(), identify);

router.get('/user', auth(), getUser);

// Listar usuarios: docente (ve estudiantes) y superadmin (gestión).
router.get('/users', auth(["superadmin", "docente"]), listUsers);

// Crear usuario desde la plataforma: docente (solo estudiantes) y superadmin (cualquier rol).
router.post('/users', auth(["superadmin", "docente"]), createUser);

// Importación masiva de estudiantes (docente y superadmin).
router.post('/users/importar', auth(["superadmin", "docente"]), importarEstudiantes);

router.get('/user/buscar/:cedula', auth(["superadmin", "docente"]), getUserByCedula); // Buscar usuario por cédula
router.put('/password', auth(), changePassword); // Para usuarios normales (dentro del perfil)
router.put('/user/:id/password', auth(["superadmin"]), changePassword); // Reset de contraseña por superadmin
router.put('/user/:id/role', auth(["superadmin"]), updateRole); // Cambiar rol (superadmin)
router.delete('/user/:id', auth(["superadmin"]), deleteUser); // Eliminar usuario (superadmin)
router.get('/user/:id', auth(), getUserById);

router.put('/user/:id', auth(), updateUser);

// Vinculación de representados y conducta (docente/superadmin)
router.post('/representante/:id/vincular', auth(['superadmin', 'docente']), vincularRepresentado);
router.delete('/representante/:id/vincular/:estudianteId', auth(['superadmin', 'docente']), desvincularRepresentado);
router.put('/user/:id/conducta', auth(['superadmin', 'docente']), updateConducta);

// Ruta para cambiar la contraseña del usuario autenticad

module.exports = router; // Exportamos el router para usarlo en app.js
