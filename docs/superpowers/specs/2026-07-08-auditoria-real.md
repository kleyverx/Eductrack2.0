# SPEC — Auditoría real (Fase D del módulo de reportes)

**Fecha:** 2026-07-08
**Estado:** Aprobado para implementación
**Contexto:** EduTrack Insight (MERN). Cuarta fase del módulo de reportes. Hoy `AuditLogsPage` es una **maqueta** (`SAMPLE_LOGS` hardcodeados). Esta fase implementa la auditoría real: registrar eventos clave del sistema y mostrarlos.

---

## 1. Resumen

Registrar en la base de datos los eventos importantes que ocurren en la app (quién hizo qué y cuándo), y mostrarlos en el panel de Auditoría del Super Admin, reemplazando la maqueta. Alcance acotado: un modelo, un helper de registro llamado desde unos pocos puntos clave, un endpoint de lectura, y la página real.

---

## 2. Eventos que se registran

Un conjunto acotado de eventos de alto valor:
- **login** — un usuario inicia sesión (actor = quien entra; detalle = su rol).
- **crear-usuario** — se crea un usuario (actor = quien lo crea; detalle = nombre/rol del creado).
- **eliminar-usuario** — se elimina un usuario (actor; detalle = a quién).
- **config** — se cambia la configuración de la institución (actor; detalle = campos cambiados).
- **constancia** — se emite una constancia (actor; detalle = tipo + código).

(No se auditan lecturas ni cada guardado de nota — sería ruido. Solo acciones administrativas/sensibles.)

---

## 3. Modelo `AuditLog`

`models/AuditLog.js`:
```js
{
  accion:  { String, enum: ['login','crear-usuario','eliminar-usuario','config','constancia'], required },
  actor:   { ObjectId, ref: 'User' },      // quién lo hizo (null si no aplica)
  actorNombre: String,                     // snapshot del nombre (para mostrar sin populate)
  actorRol: String,                        // snapshot del rol
  detalle: String,                         // texto legible del evento
}
// timestamps (createdAt = cuándo)
// índice { createdAt: -1 }
```
Snapshot del nombre/rol para que el log siga siendo legible aunque el usuario se elimine después.

---

## 4. Helper de registro

`services/auditoria.service.js`:
```js
registrarAuditoria({ accion, actor, actorNombre, actorRol, detalle })
```
- Crea un `AuditLog`. **A prueba de fallos:** en try/catch, si falla solo loguea — nunca rompe la operación que lo disparó. No se le hace `await` bloqueante donde no convenga (fire-and-forget aceptable).
- Se invoca desde:
  - `auth.controller.js` → `login` (tras emitir el token): `accion:'login'`, actor = user, detalle = `Inició sesión como {rol}`.
  - `auth.controller.js` → `createUser` (tras crear): `accion:'crear-usuario'`, actor = req.user, detalle = `Creó a {nombre} ({rol})`.
  - `auth.controller.js` → `deleteUser` (tras eliminar): `accion:'eliminar-usuario'`, actor = req.user, detalle = `Eliminó al usuario {nombre/cédula}`.
  - `config.controller.js` → `actualizar` (tras guardar): `accion:'config'`, actor = req.user, detalle = `Actualizó la configuración`.
  - `constancia.controller.js` → `emitir` (tras crear): `accion:'constancia'`, actor = req.user, detalle = `Emitió constancia {tipo} ({codigo})`.
- Para `login`, `req.user` no existe aún; usar el `user` recién encontrado como actor.

---

## 5. Endpoint de lectura

`GET /api/admin/auditoria` (superadmin) en `dashboard.routes.js` (o controlador de auditoría):
- Devuelve los últimos N logs (ej. 100) ordenados por `createdAt` desc: `[{ _id, accion, actorNombre, actorRol, detalle, createdAt }]`.
- Opcional: filtro `?accion=login` (si es fácil; si no, se omite esta fase).

Controlador `controllers/auditoria.controller.js` → `listar`.

---

## 6. Frontend — página real

Reescribir `pages/admin/AuditLogsPage.jsx`:
- Quitar `SAMPLE_LOGS` y el aviso de maqueta.
- `useEffect`: `getAuditoria(token).then(setLogs)`. Loader mientras carga; estado vacío si no hay logs ("Aún no hay actividad registrada").
- Mantener el estilo actual (`ACTION_META` con iconos/colores por tipo). Mapear las nuevas `accion` a los iconos: `login`→LogIn, `crear-usuario`→UserPlus, `eliminar-usuario`→Trash2, `config`→Settings, `constancia`→FileText (o el icono disponible).
- Cada fila: icono por acción, `detalle`, `actorNombre` ({actorRol}), y la fecha relativa/absoluta (`new Date(createdAt).toLocaleString('es-VE')`).
- `api/auditoria.js` (nuevo): `getAuditoria(token)`.

---

## 7. Archivos afectados

**Backend:**
| Archivo | Cambio |
|---|---|
| `models/AuditLog.js` | **nuevo** |
| `services/auditoria.service.js` | **nuevo** (`registrarAuditoria`) |
| `controllers/auditoria.controller.js` | **nuevo** (`listar`) |
| `routes/dashboard.routes.js` | +ruta `GET /auditoria` |
| `controllers/auth.controller.js` | invocar registro en login/createUser/deleteUser |
| `controllers/config.controller.js` | invocar registro en actualizar |
| `controllers/constancia.controller.js` | invocar registro en emitir |

**Frontend:**
| Archivo | Cambio |
|---|---|
| `api/auditoria.js` | **nuevo** |
| `pages/admin/AuditLogsPage.jsx` | reescribir de maqueta a datos reales |

Sin dependencias nuevas.

---

## 8. Fuera de alcance

- Auditar cada operación (solo el conjunto acotado de §2).
- Retención/rotación de logs, exportación de auditoría.
- Filtros avanzados / búsqueda (más allá del filtro simple opcional por acción).
- IP/user-agent del actor.

---

## 9. Criterios de aceptación

- [ ] Al iniciar sesión, crear/eliminar usuario, cambiar config o emitir constancia, se crea un `AuditLog`.
- [ ] `GET /api/admin/auditoria` (superadmin) devuelve los eventos recientes; un no-superadmin recibe 403.
- [ ] `AuditLogsPage` muestra los eventos reales (sin la maqueta ni el aviso), con icono, detalle, actor y fecha.
- [ ] Un fallo al registrar auditoría NO rompe la operación que lo disparó (login sigue funcionando, etc.).
- [ ] Build del frontend limpio + endpoint verificado E2E. No se rompe nada existente.
