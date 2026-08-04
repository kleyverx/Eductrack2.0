const BASE_URL = process.env.REACT_APP_API_URL;

/** Obtiene el registro de auditoría (superadmin). Devuelve un array de eventos. */
export const getAuditoria = async (token) => {
  const res = await fetch(`${BASE_URL}/admin/auditoria`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.msg || 'Error al obtener la auditoría');
  return data;
};
