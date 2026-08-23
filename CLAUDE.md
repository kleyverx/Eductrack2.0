# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

---

# Eductrack2.0 — guía para trabajar en este repo

Sistema académico venezolano (Educación Media General, currículo MPPE) con diagnóstico
vocacional por IA. **Eductrack es un producto propio e independiente** (sin relación con NQLN,
Pictorys ni Grupo Oxford).

Monorepo de dos apps independientes (`Backend-Diagnostico-vocacional/` y
`Frontend-Diagnostico-vocacional/`), cada una con su propio `package.json`. No hay workspaces:
siempre `cd` a la carpeta correspondiente antes de instalar o ejecutar.

## Comandos

### Backend (`Backend-Diagnostico-vocacional/`, puerto 5000)

```bash
npm install
npm run dev          # nodemon src/app.js  → desarrollo
npm start            # node src/app.js     → lo que corre Render

node seed.js             # repobla TODO (usuarios → vocacional → académico). BORRA usuarios.
node seed.js usuarios    # solo usuarios      (los parciales requieren usuarios ya creados)
node seed.js vocacional  # solo test vocacional
node seed.js academico   # solo secciones/materias/planes/notas/asistencia

node seedRepresentanteDemo.js                    # representante demo 12345678/demo123
node seedRepresentanteDemo.js 87654321 miClave   # aditivo e idempotente, no borra nada

node check_db.js     # conteo rápido de usuarios/preguntas/tests
```

Requiere `Backend-Diagnostico-vocacional/.env` (copiar de `.env.template` en la raíz). Sin
`MONGO_URI` ni `JWT_SECRET` no arranca; sin `OPENROUTER_API_KEY` la IA falla; sin
`TELEGRAM_BOT_TOKEN` el bot simplemente queda inactivo (todo lo demás funciona).

### Frontend (`Frontend-Diagnostico-vocacional/`, puerto 3000)

```bash
npm install
npm start
CI=true npx react-scripts build      # verificación real: los warnings de ESLint rompen el build
npx react-scripts test --watchAll=false                    # correr los tests
npx react-scripts test --watchAll=false -t "nombre test"   # un test concreto
```

Necesita `REACT_APP_API_URL` **incluyendo el sufijo `/api`** (ej. `http://localhost:5000/api`);
las funciones de `src/api/` concatenan la ruta directamente sobre esa base.

### Verificación

**No hay suite de tests real.** Existen ficheros de CRA (`src/App.test.js`, `src/simple.test.js`,
`src/components/Sidebar.test.jsx`) pero `App.test.js` sigue siendo la plantilla por defecto
("learn react link") y ya no pasa. No los tomes como red de seguridad.

- **Backend:** scripts `node -e` E2E contra el local (login → token → endpoint).
- **Frontend:** `CI=true npx react-scripts build` es la verificación de referencia.

## Arquitectura

Cliente-servidor 100% online. **Nada de offline-first ni IA local**: parte de la documentación
antigua describe Dexie/IndexedDB y Ollama; nunca se implementó o se reemplazó (ver
`docs/ARQUITECTURA-Y-MODELO-DATOS.md` §1).

```
React 19 SPA (Vercel) ──fetch + JWT──> Express 5 (Render) ──> MongoDB Atlas
      │ jsPDF en el navegador                │
      └── PDFs y QR client-side              ├──> OpenRouter (IA)
                                             └──> Telegram Bot API (avisos)
```

### Backend

- **Punto de entrada `src/app.js`:** helmet → CORS (`FRONTEND_URL` admite varios orígenes
  separados por coma) → montaje de routers → conexión a Mongo → `listen` →
  `telegram.service.iniciarPolling()`. El polling del bot arranca dentro del proceso de la API.
- **Autorización:** un único middleware `auth([roles])` (`src/middlewares/auth.js`) verifica el
  JWT, **carga el `User` completo desde Mongo** y lo deja en `req.user` (documento Mongoose, no
  el payload del token). Se aplica ruta por ruta en los `*.routes.js`; sin argumentos = cualquier
  usuario autenticado.
- **Login por cédula, no por email.** La cédula se castea a `Number` y se consulta con
  `sanitizeFilter` (defensa contra inyección NoSQL). JWT de 2 días con payload `{ id, role }`.
  `express-rate-limit` limita el login a 10 intentos/IP cada 15 min.
- **Los controladores exportan helpers para otros controladores**, con prefijo `_` cuando son
  internos: `academico.controller` expone `calcularLapsosBulk`, `_getSeccionPropia`,
  `_getSeccionAcceso`; `asistencia.controller` expone `resumenInasistencia(Bulk)`;
  `config.controller` expone `getConfig`. Reutilízalos en vez de duplicar lógica o consultas.
- **Rendimiento:** el patrón dominante es "bulk". `calcularLapsosBulk(materiaIds, lapsos,
  estudianteIds)` resuelve N materias × 3 lapsos × M estudiantes en 2 consultas y devuelve un
  `Map` con clave `` `${materiaId}|${lapso}|${estudianteId}` ``. Cuando añadas paneles o
  reportes, sigue ese camino: nada de N+1 por sección.
- **Configuración institucional:** documento único (`clave: 'global'`) cacheado en memoria en
  `config.controller`; el caché se refresca al guardar. Umbrales de semáforo, nota aprobatoria,
  umbral de inasistencia e `iaActiva` salen de ahí — no los hardcodees en el backend.
- **Auditoría:** `registrarAuditoria()` es *fire-and-forget* y nunca lanza; se llama sin `await`
  desde login, alta/baja de usuarios, cambios de config y emisión de constancias.
- **IA (`aiAsistent.controller.js`):** OpenRouter con cadena de modelos gratuitos. Como
  OpenRouter acepta máximo 3 modelos por petición, la cadena
  (`OPENROUTER_MODEL` + `OPENROUTER_FALLBACK_MODELS`) se parte en grupos de 3 y se prueban en
  orden, con reintento ante 429/5xx. Los modelos free se saturan a menudo: cualquier feature de
  IA debe tolerar fallos.
- **Telegram (`services/telegram.service.js`):** opcional. `botActivo()` cortocircuita todo si
  falta el token; los envíos usan `notificarAsync()` (background, sin `await`, con pausa de
  120 ms por rate-limit) y **nunca** rompen la operación académica que los dispara.

### Modelo de datos: núcleo activo vs. legado

**Activo — sistema académico real:**
`User` (4 roles: `estudiante`/`docente`/`superadmin`/`representante`; `representados[]` para el
representante; `telegramChatId`/`telegramCodigo`) → `Seccion` (año 1–5 + período, pertenece a un
docente) → `Materia` (se autogeneran desde `data/curriculoMPPE.js` al crear la sección) →
`PlanEvaluacion` (una por materia+lapso, actividades con `ponderacion` que **debe sumar 100**,
validado en el schema) → `Nota` (una por estudiante+actividad, 1–20).
Complementos: `Asistencia` (una por sección+día, fecha normalizada a medianoche UTC),
`BoletinPublicado`, `Constancia`, `Configuracion`, `AuditLog`.

**Legado — no construir encima:** `Subject`, `Evaluation`, `Grade` y `ConsultaAsistente` son
vestigios del diseño offline-first (campos `syncStatus`, `deleted`). Duplican Materia/
PlanEvaluacion/Nota y solo los referencia `aiAsistent.controller.js`. Detalle en
`docs/ARQUITECTURA-Y-MODELO-DATOS.md` §4.3 y §7.

### Reglas académicas (invariantes del dominio)

- Escala **1–20**, aprobatoria 10, **3 lapsos**.
- `acumulado(lapso) = Σ nota × (ponderacion / 100)`, redondeado a 2 decimales;
  `evaluado` = suma de ponderaciones ya cargadas (indica cuánto del lapso está calificado).
- `definitiva` = promedio de los 3 lapsos, redondeado a entero, **solo si los 3 existen**;
  si no, `null`.
- Semáforo 🟢 ≥15 · 🟡 ≥11 · 🔴 <11 (umbrales configurables en `Configuracion`).
- El estudiante solo ve su boletín de un lapso si existe `BoletinPublicado` para su sección+lapso.
- Constancias: código `EDT-{año}-{secuencia6}-{sufijoHex8}` (el sufijo aleatorio evita que sean
  adivinables) + verificación pública sin sesión en `/verificar/:codigo`.

### Frontend

- **Ruteo (`src/App.js`):** todo cuelga de `/app` dentro de `MainLayout`, envuelto en
  `ProtectedRoute`; cada bloque de rol se anida en otro `<ProtectedRoute allowedRoles={[...]}/>`.
  Rol no permitido → redirige al home de *su* rol. `src/utils/roles.js` (`ROLES`, `HOME_BY_ROLE`,
  `homePathForRole`) es la única fuente de verdad de roles y rutas de inicio: úsalo, no strings
  sueltos. Varias pantallas de docente se reutilizan en solo lectura bajo `/app/admin/...`.
- **Capa API (`src/api/*.js`):** `fetch` (no axios, pese a estar instalado), un helper `request()`
  por módulo y **el token se pasa como argumento explícito** en cada llamada —no hay interceptor
  ni instancia global. Mantén ese patrón al añadir endpoints.
- **`AuthContext`:** guarda el token en `localStorage` y revalida su expiración cada minuto. Ojo
  con esto: al **iniciar sesión** el `user` viene del backend (`id`, `cedula`, `role`, `name`),
  pero tras **recargar la página** se reconstruye con `jwtDecode` y solo quedan `id` y `role`.
  Cualquier campo extra (p. ej. `user.name`) debe leerse del endpoint del usuario, no asumirse.
- **`src/utils/academic.js`:** fuente única del semáforo (umbrales, etiquetas y paleta Tailwind
  por nivel). Cualquier tarjeta, KPI o gráfico debe pasar por `getRiskLevel`/`getScoreStyles`.
- **PDFs:** se generan en el navegador con jsPDF + jspdf-autotable, en `src/utils/*PDF.js`
  (`academicoPDF`, `constanciasPDF`, `reportesPDF`, `exportToPDF`). El backend no genera PDFs.
- **Estilo "Quiet Academic":** Tailwind con `darkMode: 'class'` (`ThemeContext`), paleta
  slate/indigo + emerald/amber/rose del semáforo, tipografías Inter Tight (sans) y Fraunces
  (display), iconos Lucide-React.

## Documentación del repo

- `README.md` — visión general, stack, instalación, credenciales de prueba.
- `FLUJOS.md` — guía paso a paso por rol. **Actualízalo cuando cambie un flujo de usuario.**
- `docs/ARQUITECTURA-Y-MODELO-DATOS.md` — modelo E-R real, activo vs. legado, deuda técnica.
- `docs/DIAGRAMAS-USUARIO-Y-FLUJOS.md` — casos de uso y diagramas de proceso por rol.
- `docs/superpowers/specs/` y `docs/superpowers/plans/` — SPEC y plan de cada fase
  (brainstorming → spec → plan → construcción). **Consúltalos antes de tocar una feature.**
- `DEPLOY.md`, `DEVELOPMENT.md`, `CONTRIBUTING.md` — despliegue y flujo de colaboración.

### Contexto de negocio (Cerebro)

Wiki en Obsidian con todos los proyectos del escritorio. Página de este proyecto:
`C:/Users/Kleyver/Documents/Obsidian Vault/Cerebro-work/Cerebro/proyectos/eductrack.md`
(panorama: `.../Cerebro/index.md` y `.../Cerebro/conexiones/mapa-general.md`).
Se mantiene desde su propia bóveda, no desde este repo: tras cambios relevantes aquí, abre
Claude Code en la bóveda y pide "re-analiza eductrack".

## Convenciones

- **Commits y comentarios en español** (`feat:`/`fix:`/`docs:`). **No añadir coautoría de Claude
  ni menciones a IA** en commits, PRs ni descripciones.
- Ramas `feat/nombre-tarea` → PR a `dev` → `main`. Sin merge directo a `main`/`dev`.
- Los mensajes de error de la API viajan siempre en la clave `msg`; el frontend lee `data.msg`.
- **Nunca commitear `.env`** (MONGO_URI, JWT_SECRET, OPENROUTER_API_KEY, tokens de Telegram).
- **Despliegue:** Frontend en Vercel, Backend en Render (blueprint en `render.yaml`,
  `healthCheckPath: /`), DB en MongoDB Atlas (habilitar `0.0.0.0/0`). Al añadir una variable de
  entorno, actualiza `.env.template` **y** `render.yaml`.
