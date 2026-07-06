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

// Crea un usuario desde la plataforma (docente: solo estudiantes; superadmin: cualquier rol).
// Si no se envía password, el backend usa la cédula como contraseña inicial.
export const createUser = async (payload, token) => {
  const res = await fetch(`${BASE_URL}/auth/users`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify(payload)
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.msg || 'Error al crear usuario');
  return data;
};

// Importación masiva de estudiantes. estudiantes = [{ cedula, name, apellido }].
export const importarEstudiantes = async (estudiantes, token) => {
  const res = await fetch(`${BASE_URL}/auth/users/importar`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ estudiantes })
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.msg || 'Error en la importación');
  return data;
};

// Lista usuarios (opcionalmente filtrados por rol). Para docente y superadmin.
export const listUsers = async (token, role) => {
  const url = role ? `${BASE_URL}/auth/users?role=${role}` : `${BASE_URL}/auth/users`;
  const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
  const data = await res.json();
  if (!res.ok) throw new Error(data.msg || 'Error al listar usuarios');
  return data;
};

// Cambia el rol de un usuario (superadmin).
export const updateUserRole = async (id, role, token) => {
  const res = await fetch(`${BASE_URL}/auth/user/${id}/role`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ role })
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.msg || 'Error al cambiar rol');
  return data;
};

// Elimina un usuario (superadmin).
export const deleteUser = async (id, token) => {
  const res = await fetch(`${BASE_URL}/auth/user/${id}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` }
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.msg || 'Error al eliminar usuario');
  return data;
};

// Vincula un representante existente con un estudiante (superadmin/docente).
export const vincularRepresentante = async (representanteId, estudianteId, token) => {
  const res = await fetch(`${BASE_URL}/auth/representante/${representanteId}/vincular`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ estudianteId })
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.msg || 'Error al vincular');
  return data;
};
