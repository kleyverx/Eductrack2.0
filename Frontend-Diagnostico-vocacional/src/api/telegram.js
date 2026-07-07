/**
 * Cliente API de Telegram (/api/telegram).
 * Código de vinculación del representante y desvinculación de la cuenta.
 */
const BASE_URL = process.env.REACT_APP_API_URL;

export const miCodigoTelegram = async (token) => {
  const res = await fetch(`${BASE_URL}/telegram/mi-codigo`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.msg || 'Error');
  return data;
};

export const desvincularTelegram = async (token) => {
  const res = await fetch(`${BASE_URL}/telegram/desvincular`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.msg || 'Error');
  return data;
};
