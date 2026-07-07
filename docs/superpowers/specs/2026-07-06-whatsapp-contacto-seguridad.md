# SPEC — Fase 3: WhatsApp, Contacto del Representante y Endurecimiento de Seguridad

**Fecha:** 2026-07-06
**Estado:** Aprobado para implementación
**Contexto:** EduTrack Insight — gestión académica MPPE (MERN). Extiende la Fase 2 (rol representante, asistencia, constancias).

---

## 1. Resumen

Tres mejoras, sin romper lo desplegado:

1. **Botones de WhatsApp (`wa.me`)** — comunicación docente↔representante con mensajes pre-armados, todo en el frontend (sin API de pago, sin backend nuevo para el mensaje).
2. **Captura del contacto del representante** — teléfono y email al crear/asignar un representante, y edición del teléfono de representantes ya existentes.
3. **Endurecimiento básico de seguridad** — `helmet`, `express-mongo-sanitize` y `express-rate-limit` (solo en login).

Sigue los patrones ya establecidos: helpers en `utils/`, endpoints `/api/...` con `auth([roles])`, UI "Quiet Academic" con dark mode.

---

## 2. Decisiones transversales

- **El mensaje de WhatsApp se arma en el frontend.** Un helper `utils/whatsapp.js` construye el enlace `https://wa.me/<tel>?text=<mensaje URL-encoded>` con los datos que la página ya tiene, y hace `window.open(url, '_blank')`. No se crea ningún endpoint para esto.
- **Normalización de teléfono venezolano** (en el helper): quitar espacios/guiones; si empieza con `+`, quitarlo; si empieza con `58`, dejarlo; si empieza con `0` (ej. `0414...`), reemplazar el `0` inicial por `58`; si son 10 dígitos empezando por `4` (ej. `4141234567`), anteponer `58`. Resultado: solo dígitos con prefijo país. Si el teléfono no es válido/está vacío, el botón que lo usaría se muestra **deshabilitado**.
- **No se envían datos académicos sensibles por WhatsApp.** La plantilla "notas listas" solo avisa que ya puede consultarlas en la plataforma; nunca escribe la nota/promedio.

---

## 3. Feature A — WhatsApp

### 3.1 Helper `Frontend/src/utils/whatsapp.js`
Exporta:
- `normalizarTelefonoVE(tel)` → string de dígitos con prefijo `58`, o `null` si inválido.
- `abrirWhatsApp(tel, mensaje)` → normaliza, y si es válido hace `window.open('https://wa.me/' + n + '?text=' + encodeURIComponent(mensaje), '_blank')`. Devuelve `false` si el teléfono es inválido.
- Plantillas (funciones puras que devuelven string), para **docente → representante**:
  - `plantillaInasistencia({ estudiante, seccion, pct, docente, institucion })`
  - `plantillaNotasListas({ estudiante, lapso, docente, institucion })`
  - `plantillaCitacion({ estudiante, docente, institucion })`
  - `plantillaPersonalizada({ estudiante, docente, institucion })` (saludo + nombre, resto lo completa el docente)
  - `plantillaRepresentanteADocente({ estudiante, docenteNombre })` (saludo del representante al docente)

Textos base (el usuario puede editarlos en WhatsApp antes de enviar):
- **Inasistencia:** `Estimado(a) representante, le informo que el/la estudiante {estudiante} presenta {pct}% de inasistencia en {seccion}. Agradezco comunicarse conmigo. — Prof. {docente}, {institucion}`
- **Notas listas:** `Estimado(a) representante, le informo que ya están disponibles las calificaciones de {estudiante} correspondientes al {lapso}. Puede consultarlas en la plataforma EduTrack. — Prof. {docente}, {institucion}`
- **Citación:** `Estimado(a) representante, le solicito una reunión respecto a {estudiante}. Quedo atento(a) para coordinar día y hora. — Prof. {docente}, {institucion}`
- **Personalizada:** `Estimado(a) representante de {estudiante}, ` (el docente continúa)
- **Rep → docente:** `Estimado(a) Prof. {docenteNombre}, soy representante de {estudiante} y quisiera consultarle sobre `

### 3.2 Docente → representante (`SeccionDetailPage`, pestaña Estudiantes)
- Por estudiante, un botón "WhatsApp" (icono `MessageCircle`, verde). Al pulsarlo abre un **popover/menú en dos pasos**:
  1. **Elegir contacto:** lista los teléfonos disponibles — el/los representante(s) del estudiante (los que tengan teléfono) y el propio estudiante (si tiene teléfono). Muestra nombre + rol.
  2. **Elegir plantilla:** Inasistencia · Notas listas · Citación · Personalizada. Al elegir, arma el mensaje y llama `abrirWhatsApp`.
- El botón se **deshabilita** (con tooltip "Sin teléfono registrado") si ningún contacto del estudiante tiene teléfono.
- Para la plantilla de inasistencia se usa el `pct` que ya trae el chip de inasistencia de la sección (Fase 2, `getResumen`). Si no hay dato, usa `pct = 0` y el docente edita.
- **Datos que necesita la página:** los representantes de cada estudiante con su teléfono. Como `SeccionDetailPage` hoy no los tiene, se añade un endpoint (ver 3.4).

### 3.3 Representante → docente (`RepresentanteDashboard`)
- Por sección del representado, un botón "Contactar docente por WhatsApp". Usa `grupos[].seccion.docente` (nombre + teléfono) y `plantillaRepresentanteADocente`.
- Deshabilitado si el docente no tiene teléfono.
- **Cambio backend:** en `representante.controller.js`, `detalleEstudiante` popula el docente con `'name apellido telefono'` (hoy es `'name apellido'`).

### 3.4 Endpoint de representantes por estudiante (para el docente)
- `GET /api/academico/secciones/:id/representantes` (rol docente, valida sección propia con `_getSeccionPropia`) → `{ [estudianteId]: [{ _id, name, apellido, telefono }] }`. Consulta en bloque: `User.find({ role:'representante', representados: { $in: estudianteIds } })` y agrupa en memoria (sin N+1). También incluye el teléfono del propio estudiante en la respuesta (`estudiantesTelefono: { [id]: telefono }`) para el menú de contacto.
- Alternativamente, si es más simple, extender la respuesta de `getSeccion` (`GET /secciones/:id`) para incluir estos datos. El plan decidirá; el criterio es: el docente debe poder ver, por estudiante, los teléfonos de representante(s) y del estudiante.

---

## 4. Feature B — Contacto del representante

### 4.1 Al crear/asignar (frontend)
- En `AsignarRepresentanteModal` (dentro de `ManageUsersPage`), modo "Crear nuevo": añadir campos **teléfono** (requerido para que el WhatsApp sirva, pero no bloqueante) y **email** (opcional). Se envían a `createUser` (que ya acepta `telefono`/`email` — verificado en el backend).

### 4.2 Editar contacto de un representante existente
- En `ManageUsersPage`, para usuarios con `role === 'representante'` (y opcionalmente docente), un botón "Editar contacto" (icono lápiz) que abre un modal pequeño para fijar/corregir `telefono` y `email`.
- Backend: reusar `PUT /api/auth/user/:id` (`updateUser` ya existe) o añadir `PUT /api/auth/user/:id/contacto` (superadmin) que actualiza solo `telefono`/`email`. El plan elegirá; preferencia: endpoint dedicado `contacto` para no exponer edición amplia.
- Validar unicidad de teléfono (el índice `sparse unique` de `telefono` ya lo garantiza; capturar el error y devolver mensaje claro si el teléfono ya existe).

### 4.3 Seed
- Dar teléfono al representante de prueba `50000010` (ej. `04145000010` — ya lo tiene en el seed de Fase 2). Verificar que quede con teléfono para probar el flujo.

---

## 5. Feature C — Endurecimiento de seguridad (backend `app.js`)

### 5.1 Dependencias nuevas
`helmet`, `express-rate-limit`, `express-mongo-sanitize` (todas maduras y ligeras).

### 5.2 Montaje en `app.js` (orden importa)
1. `app.use(helmet())` — antes de las rutas. Cabeceras HTTP seguras. Verificar que no rompa CORS ni las respuestas JSON (helmet por defecto es compatible; si `crossOriginResourcePolicy` estorba en despliegue, ajustarlo).
2. `app.use(mongoSanitize())` — tras `express.json()`, antes de las rutas. Elimina claves con `$`/`.` de `req.body/query/params` (anti-inyección NoSQL).
3. `rateLimit` **solo en login**: crear un limitador `{ windowMs: 15*60*1000, max: 10, standardHeaders: true, legacyHeaders: false, message: { msg: 'Demasiados intentos de inicio de sesión. Intenta de nuevo en unos minutos.' } }` y aplicarlo en la ruta `POST /api/auth/login` (en `auth.routes.js`, como middleware antes de `login`). Responde 429 al superar el límite.

### 5.3 Compatibilidad
- Express 5 + estos paquetes: verificar versiones compatibles con Express 5 (`express-mongo-sanitize` puede requerir un pequeño ajuste si muta `req.query`, que en Express 5 es de solo lectura; si falla, usar una alternativa equivalente o sanitizar solo `body`). El plan debe verificar esto en E2E.
- Render/Vercel: no requiere variables de entorno nuevas.

---

## 6. Archivos afectados (resumen)

**Frontend:**
- `src/utils/whatsapp.js` — **nuevo** (normalización + plantillas + abrir WA).
- `src/api/academico.js` — +`getRepresentantesSeccion` (o ampliación de `getSeccion`).
- `src/api/user.js` — +`actualizarContacto` (si se usa endpoint dedicado).
- `src/pages/docente/SeccionDetailPage.jsx` — botón WhatsApp + menú de contacto/plantilla por estudiante.
- `src/pages/representante/RepresentanteDashboard.jsx` — botón "Contactar docente por WhatsApp".
- `src/pages/admin/ManageUsersPage.jsx` — campos teléfono/email al crear representante + botón "Editar contacto".

**Backend:**
- `src/app.js` — helmet, mongo-sanitize, (require de rate-limit).
- `src/routes/auth.routes.js` — rate-limit en `/login`; ruta de contacto (si dedicada).
- `src/controllers/auth.controller.js` — `updateContacto` (si dedicado).
- `src/controllers/representante.controller.js` — populate docente con `telefono`.
- `src/controllers/academico.controller.js` + `src/routes/academico.routes.js` — endpoint de representantes por sección.
- `package.json` — deps `helmet`, `express-rate-limit`, `express-mongo-sanitize`.

---

## 7. Fuera de alcance (esta fase)

- Compartir constancia (PDF) por WhatsApp.
- Notificaciones automáticas / masivas por WhatsApp.
- Datos completos del estudiante (fecha nacimiento, dirección) y de la institución (código DEA, director).
- Aviso de privacidad / consentimiento legal (LOPD, menores).
- WhatsApp Business API (de pago).

---

## 8. Criterios de aceptación

- [ ] El docente, desde un estudiante, abre WhatsApp hacia el representante (o el estudiante) con un mensaje pre-armado según la plantilla elegida; el botón se deshabilita si no hay teléfono.
- [ ] Las 4 plantillas docente→representante generan el texto correcto; "notas listas" NO incluye la nota.
- [ ] El representante abre WhatsApp hacia el docente de la sección de su representado, con saludo pre-armado.
- [ ] El teléfono venezolano se normaliza correctamente (`0414...` → `58414...`) para todos los formatos comunes.
- [ ] Se puede registrar teléfono/email al crear un representante y editar el teléfono de uno existente.
- [ ] `helmet` y `mongo-sanitize` activos sin romper CORS, login ni las rutas existentes (verificado E2E).
- [ ] El login bloquea tras 10 intentos fallidos en 15 min (429) y vuelve a permitir después.
- [ ] Build del frontend limpio (CI=true) y endpoints verificados E2E. No se rompe nada de las Fases 1-2.
