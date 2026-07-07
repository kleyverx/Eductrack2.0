# SPEC — Seguridad: Permisos, Minimización de Datos y Endurecimiento

**Fecha:** 2026-07-07
**Estado:** Aprobado para implementación
**Contexto:** EduTrack Insight (MERN: React 19 + Express 5 + MongoDB/Mongoose 8, JWT + bcrypt, login por cédula). Consolida los hallazgos de la revisión de seguridad de la Fase 2 y corrige el endurecimiento planteado en la Fase 3 con base en la documentación oficial verificada vía Context7.

---

## 1. Resumen

Corrige tres debilidades de autorización/exposición detectadas en la revisión de seguridad y aplica un endurecimiento base del backend, **sin romper lo desplegado**. Es un SPEC de seguridad puro: no añade funcionalidad de negocio nueva; refuerza la existente.

Tres frentes:
1. **Fugas de autorización (IDOR) y de PII** — 3 hallazgos concretos.
2. **Endurecimiento de plataforma** — helmet + rate-limit (login), verificados compatibles con Express 5.
3. **Sanitización NoSQL** — vía Mongoose nativo (`sanitizeFilter`/`strictQuery`), NO vía `express-mongo-sanitize` (incompatible con Express 5).

---

## 2. Hallazgos que se corrigen (de la revisión de seguridad, jul 2026)

### 2.1 HIGH — PII de menores enumerable en la constancia pública
**Ubicación:** `constancia.controller.js` (`generarCodigo`, `verificar`), `constancia.routes.js`.
**Problema:** `GET /api/constancias/verificar/:codigo` es público (sin auth) y devuelve el **nombre completo del estudiante** (menor). El código `EDT-{año}-{countDocuments+1}` es **secuencial y enumerable** → un anónimo recorre `EDT-2026-000001..N` y cosecha nombres de menores + tipo de trámite.

**Fix:**
- **Código no adivinable:** el código de verificación pasa a `EDT-{año}-{secuencia6}-{sufijoAleatorio}` donde `sufijoAleatorio = crypto.randomBytes(5).toString('base32')` (o hex de 8-10 chars). El correlativo se mantiene para lectura humana/orden, pero **la barrera de acceso es el sufijo aleatorio** (token de capacidad). El campo `codigo` completo (con sufijo) es lo que va en el QR y en la URL `/verificar/:codigo`.
- **Compatibilidad:** las constancias ya emitidas (Fase 2) tienen códigos sin sufijo; el endpoint `verificar` debe seguir resolviéndolas (buscar por `codigo` exacto sigue funcionando). El cambio solo afecta a las nuevas.
- **Minimización de la respuesta pública:** `verificar` deja de devolver el nombre completo. Devuelve: `valida`, `tipo`, **`estudiante` en forma minimizada** (iniciales + primer apellido, ej. "J. Pérez"), `institucion`, `fecha`. Objetivo: permitir verificar autenticidad sin doxear al menor. (Decisión de producto: si se requiere el nombre completo para validez legal, mostrarlo solo tras un segundo factor — fuera de alcance; por defecto, minimizar.)

### 2.2 MEDIUM — Docente edita la conducta de cualquier usuario (IDOR de escritura)
**Ubicación:** `auth.controller.js` (`updateConducta`), `auth.routes.js` (`PUT /api/user/:id/conducta`, permite docente).
**Problema:** `updateConducta` hace `findByIdAndUpdate(req.params.id, { conducta })` sin verificar que el objetivo sea un **estudiante de una sección del docente**, ni que sea rol `estudiante`. Un docente puede sobrescribir `conducta` de estudiantes ajenos, otros docentes o superadmin. El campo alimenta la Constancia de Buena Conducta (integridad de documento oficial de un menor).

**Fix:**
- Si `req.user.role === 'docente'`: validar `Seccion.findOne({ docente: req.user.id, estudiantes: req.params.id })`; si no pertenece, `403`.
- Validar que el usuario objetivo tenga `role === 'estudiante'` (la conducta solo aplica a estudiantes); si no, `400/403`.
- Validar el contenido de `conducta`: string no vacío, longitud ≤ 200, recortado (`trim`). Rechazar si excede.

### 2.3 MEDIUM — Docente vincula estudiante ajeno a un representante (IDOR)
**Ubicación:** `auth.controller.js` (`vincularRepresentado`), `auth.routes.js` (permite docente).
**Problema:** `vincularRepresentado` no valida que el estudiante pertenezca a las secciones del docente. Explotación plena requiere colusión con un representante (el docente no crea representantes), pero es una violación de autorización real.

**Fix:** Si `req.user.role === 'docente'`: validar `Seccion.findOne({ docente: req.user.id, estudiantes: estudianteId })` antes de vincular; si no pertenece, `403`. El superadmin no se restringe. Aplicar el mismo check a `desvincularRepresentado`.

---

## 3. Endurecimiento de plataforma (backend `app.js`)

**Verificado con Context7 (doc oficial):**

### 3.1 helmet
- `app.use(helmet())` **antes** de las rutas. Fija 13 cabeceras seguras por defecto.
- **Compatibilidad CORS confirmada:** helmet **no** activa `Cross-Origin-Embedder-Policy` por defecto, por lo que no rompe las peticiones cross-origin del frontend (Vercel → Render). No requiere configuración especial. Opcional: `app.disable('x-powered-by')`.

### 3.2 Rate limit en login
- `express-rate-limit` (librería oficial, compatible con Express 5). Limitador **solo** en `POST /api/auth/login`:
  ```js
  const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, max: 10,
    standardHeaders: true, legacyHeaders: false,
    message: { msg: 'Demasiados intentos de inicio de sesión. Intenta de nuevo en unos minutos.' },
  });
  ```
- Aplicar como middleware antes de `login` en `auth.routes.js`. Responde 429 al superar el umbral.

### 3.3 Sanitización NoSQL — vía Mongoose, NO express-mongo-sanitize
**Corrección crítica (verificada con Context7):** `express-mongo-sanitize` muta `req.query`, pero **Express 5 define `req.query` como getter de solo lectura** → el middleware lanza `TypeError` y rompe el servidor. **No se usa.**

En su lugar, defensa nativa de Mongoose 8:
- **Global:** `mongoose.set('strictQuery', true)` — descarta campos fuera del schema en filtros de query (evita que un filtro inesperado devuelva todo).
- **En queries con filtros de valores de usuario** (el caso crítico es el login por cédula): usar `.setOptions({ sanitizeFilter: true })`, que envuelve los valores en `$eq` y neutraliza operadores inyectados (`{ $ne: null }`, `{ $gt: '' }`).
  - **Login (`auth.controller.js`):** `User.findOne({ cedula: req.body.cedula }).setOptions({ sanitizeFilter: true })` y castear `cedula` a `Number(req.body.cedula)` (además, si es `NaN`, rechazar con 400). Esto cierra el vector de inyección NoSQL en el punto más sensible.
  - Revisar otros `findOne`/`find` que reciban valores directos de `req.body`/`req.query`/`req.params` como **valores de filtro** (no como `_id`, que Mongoose ya castea a ObjectId). Aplicar `sanitizeFilter: true` donde corresponda.

---

## 4. Archivos afectados (resumen)

**Backend:**
- `src/app.js` — `helmet()`, `mongoose.set('strictQuery', true)`.
- `src/routes/auth.routes.js` — `loginLimiter` en `/login`.
- `src/controllers/auth.controller.js` — `login` (cast cédula + `sanitizeFilter`), `updateConducta` (checks de propiedad/rol/longitud), `vincularRepresentado`/`desvincularRepresentado` (check de sección propia para docente).
- `src/controllers/constancia.controller.js` — `generarCodigo` (sufijo aleatorio), `verificar` (respuesta minimizada).
- `package.json` — deps `helmet`, `express-rate-limit`. (NO `express-mongo-sanitize`.)

**Frontend:**
- `src/pages/public/VerificarConstancia.jsx` — ajustar al nuevo shape minimizado de la respuesta (nombre parcial).
- `src/utils/constanciasPDF.js` — el QR ya usa `resp.codigo`; con el sufijo incluido funciona sin cambios (verificar).

---

## 5. Verificación (sin suite de tests; E2E `node -e` + build CRA)

- [ ] **Constancia:** emitir una constancia nueva → el `codigo` incluye sufijo aleatorio; `verificar` con el código correcto devuelve `valida:true` con nombre **minimizado**; un código con correlativo adivinado pero sufijo incorrecto devuelve 404. Constancias viejas (sin sufijo) siguen verificándose.
- [ ] **Conducta:** un docente NO puede cambiar la conducta de un estudiante que no es de su sección (403), ni de otro docente/superadmin (403); sí puede la de sus estudiantes. String > 200 chars → rechazado.
- [ ] **Vincular:** un docente NO puede vincular a un estudiante ajeno (403); el superadmin sí.
- [ ] **Login hardening:** login normal sigue funcionando; `cedula` no numérica → 400; enviar `{ cedula: { "$gt": "" } }` NO inicia sesión (sanitizeFilter); tras 10 intentos fallidos en 15 min → 429.
- [ ] **helmet:** las cabeceras de seguridad aparecen en las respuestas; el frontend (Vercel/local) sigue consumiendo la API sin errores CORS.
- [ ] Build del frontend limpio (CI=true). No se rompe nada de las Fases 1-2.

---

## 6. Fuera de alcance

- Auditoría real (modelo `AuditLog`) — sigue pendiente, va en su propio SPEC.
- Rotación/expiración de JWT, refresh tokens, 2FA.
- Cifrado en reposo de PII, cumplimiento LOPD/consentimiento de menores.
- Revisión de dependencias desactualizadas (se gestiona aparte).

---

## 7. Notas de la comparación con la documentación oficial (Context7)

- **Express 5.1:** `req.query` es un getter de solo lectura (confirmado en `lib/request.js`) → descarta `express-mongo-sanitize`. Referencia: doc oficial de Express 5 (breaking changes).
- **Mongoose 8.19:** `sanitizeFilter` (envuelve en `$eq`) + `strictQuery` son la defensa recomendada contra query selector injection; la propia doc advierte "no hagas `Model.find(req.query)`". Referencia: guía de migración a Mongoose 6 y guía de queries.
- **Helmet:** `helmet()` fija 13 cabeceras; `crossOriginEmbedderPolicy` off por defecto → compatible con API JSON cross-origin. Referencia: README oficial de helmet.
