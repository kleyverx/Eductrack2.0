/**
 * Cliente API de Gestión Académica (/api/academico).
 * Secciones, materias, planes de evaluación y notas — backend compartido.
 */
const BASE_URL = process.env.REACT_APP_API_URL;

async function request(method, path, token, body) {
  const res = await fetch(`${BASE_URL}/academico${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.msg || 'Error en la operación académica');
  return data;
}

/* ---- Presets ---- */
export const getPresets = (token) => request('GET', '/presets', token);

/* ---- Secciones (docente) ---- */
export const crearSeccion = (token, payload) => request('POST', '/secciones', token, payload);
export const listarSecciones = (token) => request('GET', '/secciones', token);
export const getSeccion = (token, id) => request('GET', `/secciones/${id}`, token);
export const eliminarSeccion = (token, id) => request('DELETE', `/secciones/${id}`, token);

/* ---- Estudiantes de la sección ---- */
export const asignarEstudiantes = (token, seccionId, estudiantes) =>
  request('POST', `/secciones/${seccionId}/estudiantes`, token, { estudiantes });
export const removerEstudiante = (token, seccionId, estudianteId) =>
  request('DELETE', `/secciones/${seccionId}/estudiantes/${estudianteId}`, token);

/* ---- Materias ---- */
export const agregarMateria = (token, seccionId, payload) =>
  request('POST', `/secciones/${seccionId}/materias`, token, payload);
export const eliminarMateria = (token, materiaId) =>
  request('DELETE', `/materias/${materiaId}`, token);

/* ---- Plan de evaluación ---- */
export const getPlan = (token, materiaId, lapso) =>
  request('GET', `/materias/${materiaId}/plan/${lapso}`, token);
export const guardarPlan = (token, materiaId, lapso, payload) =>
  request('PUT', `/materias/${materiaId}/plan/${lapso}`, token, payload);

/* ---- Notas ---- */
export const getNotasGrid = (token, materiaId, lapso) =>
  request('GET', `/materias/${materiaId}/notas/${lapso}`, token);
export const guardarNotas = (token, materiaId, lapso, notas) =>
  request('PUT', `/materias/${materiaId}/notas/${lapso}`, token, { notas });

/* ---- Vista del estudiante ---- */
export const misMaterias = (token) => request('GET', '/mis-materias', token);
export const miMateriaDetalle = (token, materiaId) => request('GET', `/mis-materias/${materiaId}`, token);
