const BASE_URL = process.env.REACT_APP_API_URL;

/**
 * Obtiene el resultado ya generado para el usuario autenticado.
 * GET /api/results
 * @param {string} token - Token JWT del usuario
 * @returns {Promise<Object>} - Resultado con áreas y análisis
 */
export const getUserResult = async (token) => {
  const res = await fetch(`${BASE_URL}/result`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`
    }
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Error al obtener resultados');
  return data;
};

/**
 * Genera el resultado con base en las respuestas del usuario.
 * POST /api/results
 * @param {string} token - Token JWT del usuario
 * @returns {Promise<Object>} - Resultado recién generado
 */
export const generateUserResult = async (token) => {
  const res = await fetch(`${BASE_URL}/result`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`
    }
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Error al generar resultados');
  return data;
};

/**
 * Regenera el análisis con IA de un resultado existente (perfil, carreras, pasos).
 * POST /api/result/:id/analisis
 */
export const regenerarAnalisis = async (id, token) => {
  const res = await fetch(`${BASE_URL}/result/${id}/analisis`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Error al regenerar el análisis');
  return data;
};

export const getResultById = async (id, token) => {
  const res = await fetch(`${BASE_URL}/result/${id}`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });
  
  if (!res.ok) {
    const errorData = await res.json();
    throw new Error(errorData.message || 'Error al obtener el resultado');
  }
  
  return await res.json();
};
