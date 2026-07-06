const BASE_URL = process.env.REACT_APP_API_URL;

async function req(method, path, token, body) {
  const res = await fetch(`${BASE_URL}/academico${path}`, {
    method,
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.msg || 'Error');
  return data;
}

export const getDia = (token, seccionId, fecha) =>
  req('GET', `/secciones/${seccionId}/asistencia/${fecha}`, token);

export const guardarDia = (token, seccionId, fecha, registros) =>
  req('PUT', `/secciones/${seccionId}/asistencia/${fecha}`, token, { registros });

export const getResumen = (token, seccionId) =>
  req('GET', `/secciones/${seccionId}/asistencia-resumen`, token);
