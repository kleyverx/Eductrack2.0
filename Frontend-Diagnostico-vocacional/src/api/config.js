const BASE_URL = process.env.REACT_APP_API_URL;

export const getConfig = async (token) => {
  const res = await fetch(`${BASE_URL}/config`, { headers: { Authorization: `Bearer ${token}` } });
  const data = await res.json();
  if (!res.ok) throw new Error(data.msg || 'Error al obtener configuración');
  return data;
};

export const updateConfig = async (payload, token) => {
  const res = await fetch(`${BASE_URL}/config`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.msg || 'Error al guardar configuración');
  return data.config;
};
