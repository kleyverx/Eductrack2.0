const BASE_URL = process.env.REACT_APP_API_URL;

export const getReporteInstitucional = async (token) => {
  const res = await fetch(`${BASE_URL}/admin/reporte-institucional`, { headers: { Authorization: `Bearer ${token}` } });
  const data = await res.json();
  if (!res.ok) throw new Error(data.msg || 'Error al generar el reporte');
  return data;
};
