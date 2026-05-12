const BASE_URL = process.env.REACT_APP_API_URL;

export const getUser = async (token) => {
  const res = await fetch(`${BASE_URL}/auth/user`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`
    }
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Error al obtener usuario');
  return data;
};

export const getUserByCedula = async (token, cedula) => {
  const res = await fetch(`${BASE_URL}/auth/user/buscar/${cedula}`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`
    }
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Error al buscar usuario por cédula');
  return data;
};

export const getUserById = async (id, token) => {
  const res = await fetch(`${BASE_URL}/auth/user/${id}`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Error al obtener usuario');
  return data;
};

export const updateUser = async (id, userData, token) => {
  const res = await fetch(`${BASE_URL}/auth/user/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify(userData)
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Error al actualizar usuario');
  return data;
};
