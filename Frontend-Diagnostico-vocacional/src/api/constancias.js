const BASE_URL = process.env.REACT_APP_API_URL;

/** Emite una constancia (docente/superadmin). Devuelve { codigo, tipo, datos, fecha }. */
export const emitirConstancia = async (payload, token) => {
  const res = await fetch(`${BASE_URL}/constancias`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.msg || 'Error al emitir');
  return data;
};

/** Verifica públicamente una constancia por su código. */
export const verificarConstancia = async (codigo) => {
  const res = await fetch(`${BASE_URL}/constancias/verificar/${codigo}`);
  const data = await res.json();
  return { ok: res.ok, ...data };
};
