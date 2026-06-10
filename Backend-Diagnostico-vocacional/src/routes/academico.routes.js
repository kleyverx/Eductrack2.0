const express = require('express');
const router = express.Router();
const auth = require('../middlewares/auth');
const c = require('../controllers/academico.controller');

/* ---- Presets del currículo MPPE (cualquier usuario autenticado) ---- */
router.get('/presets', auth(), c.getPresets);

/* ---- Secciones (docente) ---- */
router.post('/secciones', auth(['docente']), c.crearSeccion);
router.get('/secciones', auth(['docente']), c.listarSecciones);
router.get('/secciones/:id', auth(['docente']), c.getSeccion);
router.delete('/secciones/:id', auth(['docente']), c.eliminarSeccion);

/* ---- Estudiantes de la sección (docente) ---- */
router.post('/secciones/:id/estudiantes', auth(['docente']), c.asignarEstudiantes);
router.delete('/secciones/:id/estudiantes/:estudianteId', auth(['docente']), c.removerEstudiante);

/* ---- Materias (docente) ---- */
router.post('/secciones/:id/materias', auth(['docente']), c.agregarMateria);
router.delete('/materias/:id', auth(['docente']), c.eliminarMateria);

/* ---- Plan de evaluación (docente) ---- */
router.get('/materias/:id/plan/:lapso', auth(['docente']), c.getPlan);
router.put('/materias/:id/plan/:lapso', auth(['docente']), c.guardarPlan);

/* ---- Notas (docente) ---- */
router.get('/materias/:id/notas/:lapso', auth(['docente']), c.getNotasGrid);
router.put('/materias/:id/notas/:lapso', auth(['docente']), c.guardarNotas);

/* ---- Vista del estudiante ---- */
router.get('/mis-materias', auth(['estudiante']), c.misMaterias);
router.get('/mis-materias/:id', auth(['estudiante']), c.miMateriaDetalle);

module.exports = router;
