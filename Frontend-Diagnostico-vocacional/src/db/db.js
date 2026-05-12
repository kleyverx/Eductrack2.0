import Dexie from 'dexie';
import { generateId } from '../utils/syncUtils';

export const db = new Dexie('EduTrackDB');

// Definición de tablas y sus índices (Usando UUIDs para evitar colisiones en sincronización)
db.version(2).stores({
  subjects: 'id, name, user, lastModified, syncStatus, deleted',
  evaluations: 'id, name, subject, lastModified, syncStatus, deleted',
  grades: 'id, score, evaluation, user, lastModified, syncStatus, deleted',
  vocationalResults: 'id, user, createdAt, lastModified, syncStatus, deleted'
});

/**
 * Helper para marcar un registro como eliminado (Soft Delete)
 */
export async function softDelete(table, id) {
  return await db.table(table).update(id, {
    deleted: true,
    lastModified: Date.now(),
    syncStatus: 'pending'
  });
}

/**
 * Helper para agregar un registro con UUID automático y estado de sincronización
 */
export async function addRecord(table, data) {
  return await db.table(table).add({
    id: generateId(),
    ...data,
    lastModified: Date.now(),
    syncStatus: 'pending',
    deleted: false
  });
}
