/**
 * Cliente API del Representante (/api/representante).
 * Lista de representados y detalle (notas + asistencia) de cada uno.
 */
const BASE_URL = process.env.REACT_APP_API_URL;

async function get(path, token) {
  const res = await fetch(`${BASE_URL}/representante${path}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.msg || 'Error');
  return data;
}

export const misRepresentados = (token) => get('/mis-representados', token);
export const representadoDetalle = (token, id) => get(`/representado/${id}`, token);
