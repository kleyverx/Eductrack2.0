# SPEC — Fase Núcleo Académico: Representante, Asistencia y Constancias

**Fecha:** 2026-07-06
**Estado:** Aprobado para implementación
**Contexto:** EduTrack Insight — gestión académica para Educación Media General venezolana (MPPE).

---

## 1. Resumen

Tres funcionalidades que extienden el núcleo académico existente, sin romper lo desplegado:

1. **Rol Representante** — representante legal que ve el rendimiento, asistencia y boletines de sus representados.
2. **Control de Asistencia** — pase de lista por sección/día con "semáforo de inasistencia" y umbral configurable.
3. **Constancias PDF oficiales** — 4 tipos con número de control único + QR de verificación pública.

Todas siguen los patrones ya establecidos: modelos Mongoose, endpoints `/api/...` con `auth([roles])`, páginas React estilo "Quiet Academic" con dark mode, exportación PDF con jsPDF (membrete RBV/MPPE), y **consultas en bloque** (sin N+1).

---

## 2. Decisiones transversales

### 2.1 Configuración persistente en backend
Hoy la configuración del superadmin (`edutrack_config`) vive en `localStorage`. La asistencia y las constancias necesitan leer ajustes desde el servidor (umbral de inasistencia, nombre de institución). Por eso:

- Nuevo modelo **`Configuracion`** (documento único global).
- Endpoints: `GET /api/config` (autenticado, cualquier rol) y `PUT /api/config` (solo superadmin).
- Campos: `institucion`, `umbralInasistencia` (default **25**), `notaAprobatoria` (10), `umbralVerde` (15), `umbralAmbar` (11).
- `AppConfigPage` (superadmin) pasa de localStorage a estos endpoints.
- Helper backend `getConfig()` con caché en memoria (se invalida al guardar) para no consultar en cada request.

### 2.2 Campo de conducta
Se agrega `conducta: { type: String, default: 'Satisfactoria' }` al modelo `User` (usado en estudiantes). Editable por docente/superadmin. Alimenta la constancia de buena conducta.

### 2.3 Escala de estados de asistencia
`presente` | `ausente` | `justificado`. Solo `ausente` (injustificada) penaliza el %.

---

## 3. Feature A — Rol Representante

### 3.1 Modelo (extensión de `User`)
- `role` enum agrega `'representante'`.
- Nuevo campo: `representados: [{ type: ObjectId, ref: 'User' }]` (default `[]`).
- Sin cambios en el estudiante; el vínculo vive en el representante.

### 3.2 Vínculo (docente/admin asigna)
- Reutiliza/extiende `POST /api/auth/users` (createUser) para aceptar `role: 'representante'` y un campo opcional `representadoId` que lo vincula al crearlo.
- Nuevo endpoint `POST /api/representante/:id/vincular` (docente/superadmin) — body `{ estudianteId }` — agrega el estudiante al array `representados` (con `$addToSet`). Valida que el representante tenga rol correcto y el estudiante exista.
- Nuevo endpoint `DELETE /api/representante/:id/vincular/:estudianteId` — desvincula.
- Contraseña inicial del representante nuevo = su cédula (patrón existente).

### 3.3 Panel del Representante (`/app/representante`)
- Selector de representado (si tiene varios).
- Por representado, **solo lectura**:
  - Materias y notas por lapso (reusa la tabla de `MisMateriasPage`).
  - % de asistencia + semáforo de inasistencia.
  - Boletines publicados (descargables, reusa `exportBoletinPDF`).
  - Perfil vocacional (área destacada) si el estudiante hizo el test.

### 3.4 Endpoints
- `GET /api/representante/mis-representados` (rol representante) → lista con `{ _id, name, apellido, cedula, seccion, promedio, inasistenciaPct }`.
- `GET /api/representante/representado/:id` (rol representante) → detalle académico completo del representado, **validando** que `:id` esté en `req.user.representados`. Reusa la lógica de `misMaterias` + resumen de asistencia.

### 3.5 Ruteo y sidebar
- `homePathForRole('representante')` → `/app/representante`.
- Sidebar: menú `[{ Mis Representados → /app/representante }]`.
- `ROLE_LABEL.representante = 'Representante'`.

---

## 4. Feature B — Control de Asistencia

### 4.1 Modelo `Asistencia`
```js
{
  seccion:  { ObjectId, ref: 'Seccion', required },
  fecha:    { Date, required },            // normalizada a medianoche
  docente:  { ObjectId, ref: 'User', required },
  registros: [{
    estudiante: { ObjectId, ref: 'User', required },
    estado: { enum: ['presente','ausente','justificado'], default: 'presente' }
  }]
}
// timestamps
// índice único { seccion: 1, fecha: 1 }
```
Un documento por sección/día.

### 4.2 Flujo del docente (`/app/docente/secciones/:id/asistencia`)
- Selector de fecha (default hoy). Carga el registro existente o lista vacía.
- Fila por estudiante con 3 botones (Presente 🟢 / Ausente 🔴 / Justificado 🟡).
- Botón "Marcar todos presentes". Guardado en lote.

### 4.3 Cálculo (global por día)
- Por estudiante: `inasistenciaPct = (ausenciasInjustificadas / diasRegistrados) * 100`, redondeado.
- `diasRegistrados` = número de documentos de asistencia de la sección en los que **ese estudiante tiene un registro** (así, quien se inscribe tarde no se penaliza por días previos a su ingreso). Si `diasRegistrados === 0`, el pct es `0` y nivel `normal`.
- Semáforo (contra `umbralInasistencia` U de config):
  - 🟢 normal: `pct < U * 0.6`
  - 🟡 alerta: `U * 0.6 ≤ pct < U`
  - 🔴 riesgo: `pct ≥ U`

### 4.4 Endpoints
- `GET /api/academico/secciones/:id/asistencia/:fecha` (docente) → pase de lista del día.
- `PUT /api/academico/secciones/:id/asistencia/:fecha` (docente) → guardar en lote. Body `{ registros: [{ estudiante, estado }] }`.
- `GET /api/academico/secciones/:id/asistencia-resumen` (docente) → `[{ estudiante, dias, ausencias, justificadas, pct, nivel }]`. **Cálculo en bloque**: trae todos los docs de asistencia de la sección en 1 consulta y computa en memoria.
- El resumen del estudiante/representante incluye su `inasistenciaPct` y `nivel`.

### 4.5 Visualización
- Panel docente: KPI "Estudiantes en riesgo de inasistencia".
- Detalle de sección: botón "Asistencia" (junto a "Preinforme").
- Panel estudiante y representante: tarjeta/indicador de asistencia con el semáforo.

---

## 5. Feature C — Constancias PDF

### 5.1 Modelo `Constancia`
```js
{
  codigo:   { String, unique, required },   // "EDT-2026-000042"
  tipo:     { enum: ['estudios','conducta','rendimiento','con-representante'], required },
  estudiante:{ ObjectId, ref: 'User' },     // null para 'rendimiento' (es por sección)
  seccion:  { ObjectId, ref: 'Seccion' },
  emitidoPor:{ ObjectId, ref: 'User', required },
  datos:    { Mixed },                        // snapshot: nombres, período, promedio, etc.
}
// timestamps
// índice único { codigo: 1 }
```

### 5.2 Generación del código
- Formato `EDT-{año}-{secuencia6}`. Secuencia = contador de constancias del año + 1, con padding.
- Se genera atómicamente al emitir (contar documentos del año o un contador dedicado).

### 5.3 Tipos (emisor: docente de sus estudiantes | superadmin cualquiera)
1. **estudios** — certifica que [estudiante] está inscrito en [año/sección], período [X].
2. **conducta** — certifica conducta [User.conducta] del estudiante.
3. **rendimiento** — Resumen Final por sección: definitivas de todas las materias × estudiantes (reusa `resumenSeccion`/certificación en bloque).
4. **con-representante** — como estudios + datos del representante legal.

### 5.4 PDF (frontend, jsPDF)
- Membrete RBV/MPPE (helper `encabezado` ya existe en `academicoPDF.js`).
- Incluye el **código de control** y un **QR** (librería `qrcode`, agregada al frontend) apuntando a `{FRONTEND_URL}/verificar/{codigo}`.
- Firmas y sello, coherente con boletines/certificaciones actuales.

### 5.5 Verificación pública
- Ruta pública **`/verificar/:codigo`** (sin login, fuera de `/app`).
- Página muestra: ✅ "Constancia válida — [tipo] emitida a [estudiante] el [fecha] por [institución]", o ❌ "Constancia no encontrada".
- Endpoint público `GET /api/constancias/verificar/:codigo` → devuelve datos mínimos (tipo, estudiante, fecha, institución) o 404. **No requiere auth.**

### 5.6 Endpoints
- `POST /api/constancias` (docente/superadmin) → genera código, guarda registro, devuelve `{ codigo, tipo, datos }` para que el frontend arme el PDF. **Validación de permiso:** para tipos por estudiante (`estudios`, `conducta`, `con-representante`) el docente debe tener a ese estudiante en alguna de sus secciones; para `rendimiento` (por sección) la sección debe pertenecerle. El superadmin puede emitir cualquiera.
- `GET /api/constancias/verificar/:codigo` (público) → datos de verificación o 404.

### 5.7 Frontend
- Desde `SeccionDetailPage` (estudiante del docente) o `ManageUsersPage` (superadmin): menú "Emitir constancia" → elegir tipo → llama `POST /api/constancias` → genera el PDF con el código+QR recibidos.
- Exportadores nuevos en `src/utils/constanciasPDF.js`.

---

## 6. Modelos nuevos / modificados (resumen)

| Modelo | Cambio |
|---|---|
| `User` | +rol `representante`, +`representados[]`, +`conducta` |
| `Configuracion` | **nuevo** (doc único global) |
| `Asistencia` | **nuevo** (por sección/día) |
| `Constancia` | **nuevo** (registro de emisión) |

## 7. Rutas nuevas (backend)

```
GET/PUT /api/config
POST/DELETE /api/representante/:id/vincular[...]
GET  /api/representante/mis-representados
GET  /api/representante/representado/:id
GET/PUT /api/academico/secciones/:id/asistencia/:fecha
GET  /api/academico/secciones/:id/asistencia-resumen
POST /api/constancias
GET  /api/constancias/verificar/:codigo   (público)
```

## 8. Rutas nuevas (frontend)

```
/app/representante                              (rol representante)
/app/docente/secciones/:id/asistencia          (rol docente)
/verificar/:codigo                             (público, sin login)
```

## 9. Fuera de alcance (esta fase)

- 5to año / título de bachiller.
- Notificaciones WhatsApp / circulares.
- PWA offline.
- Pagos Bs/USD, calendario patrio, SNI/OPSU avanzado.
- Auditoría real (sigue como maqueta).

## 10. Criterios de aceptación

- [ ] Un representante inicia sesión y ve notas, asistencia y boletines de sus representados (varios, con selector).
- [ ] El docente pasa lista por sección/día; el % de inasistencia y su semáforo se calculan y muestran a docente, estudiante y representante.
- [ ] El umbral de inasistencia se configura desde el panel del superadmin (persistente en backend) y afecta el semáforo.
- [ ] Se emiten los 4 tipos de constancia en PDF con membrete, código de control y QR.
- [ ] El QR abre `/verificar/:codigo` y confirma la validez de la constancia (o indica que no existe).
- [ ] Build limpio (frontend) y endpoints verificados E2E. Sin N+1 en los nuevos endpoints de resumen.
- [ ] No se rompe nada de lo ya desplegado (roles existentes, gestión académica, IA).
