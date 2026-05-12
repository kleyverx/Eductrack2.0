import { v4 as uuidv4 } from 'uuid';

/**
 * Genera un ID único para registros creados offline.
 */
export const generateId = () => {
  return uuidv4();
};

/**
 * Determina si el dispositivo tiene conexión a internet.
 */
export const isOnline = () => {
  return navigator.onLine;
};
