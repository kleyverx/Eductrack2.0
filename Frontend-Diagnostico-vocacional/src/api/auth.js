const BASE_URL = process.env.REACT_APP_API_URL;

export const registerUser = async (formData) => {
  const res = await fetch(`${BASE_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(formData),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.msg || 'Error en el registro');
  return data;
};

export const loginUser = async (formData) => {
  const res = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(formData),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.msg || 'Error en el login');
  return data;
};
export const changePassword = async (id, passwordData, token) => {
  const url = id ? `${BASE_URL}/auth/user/${id}/password` : `${BASE_URL}/auth/password`;

  const res = await fetch(url, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(passwordData),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.msg || 'Error al cambiar contraseña');
  return data;
};