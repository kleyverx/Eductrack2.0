/**
 * Definición central de roles y sus rutas de inicio.
 * Un único lugar de la verdad para el ruteo y los permisos por rol.
 */

export const ROLES = {
  ESTUDIANTE: 'estudiante',
  DOCENTE: 'docente',
  REPRESENTANTE: 'representante',
  SUPERADMIN: 'superadmin',
};

/** Ruta de inicio (home) a la que se redirige cada rol tras iniciar sesión. */
export const HOME_BY_ROLE = {
  [ROLES.ESTUDIANTE]: '/app/dashboard',
  [ROLES.DOCENTE]: '/app/docente',
  [ROLES.REPRESENTANTE]: '/app/representante',
  [ROLES.SUPERADMIN]: '/app/admin',
};

/**
 * Devuelve la ruta de inicio según el rol del usuario.
 * @param {string} role
 * @returns {string}
 */
export function homePathForRole(role) {
  return HOME_BY_ROLE[role] || '/app/dashboard';
}

/** Etiqueta legible del rol para mostrar en la UI. */
export const ROLE_LABEL = {
  [ROLES.ESTUDIANTE]: 'Estudiante',
  [ROLES.DOCENTE]: 'Docente',
  [ROLES.REPRESENTANTE]: 'Representante',
  [ROLES.SUPERADMIN]: 'Super Admin',
};
