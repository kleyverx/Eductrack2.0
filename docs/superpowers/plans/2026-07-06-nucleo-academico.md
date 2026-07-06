# Núcleo Académico (Representante · Asistencia · Constancias) — Plan de Implementación

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Añadir a EduTrack el rol Representante, el control de asistencia con semáforo de inasistencia configurable, y la emisión de constancias PDF oficiales con QR de verificación — sin romper lo ya desplegado.

**Architecture:** Backend Express/Mongoose (modelos + rutas `/api/...` con `auth([roles])`), frontend React CRA (páginas "Quiet Academic" con dark mode, PDFs con jsPDF). Configuración global persistida en un documento Mongo. Cálculos de resumen siempre en bloque (sin N+1).

**Tech Stack:** Node/Express 5, Mongoose 8, React 19, TailwindCSS, jsPDF + jspdf-autotable, `qrcode` (nueva dep del frontend), OpenRouter (sin cambios).

## Global Constraints

- **Sin suite de tests automatizada.** Cada tarea de backend se verifica con un script `node -e` E2E contra el backend local (puerto 5000, ya corriendo con nodemon). Cada tarea de frontend se verifica con `CI=true npx react-scripts build` (debe compilar SIN que los archivos tocados aparezcan en warnings).
- **Nunca commitear `.env`.** Verificar `git status --porcelain | grep -i "\.env"` vacío antes de cada commit.
- **Roles válidos:** `estudiante`, `docente`, `superadmin`, y el nuevo `representante`. Definidos en `Backend/src/models/user.js` (enum) y `Frontend/src/utils/roles.js`.
- **Escala de notas 1–20**, aprobatoria 10. **Semáforo académico:** 🟢≥15 🟡≥11 🔴<11 (`Frontend/src/utils/academic.js`).
- **Estilo Quiet Academic:** fondo `bg-slate-50 dark:bg-slate-950`; tarjetas `bg-white dark:bg-slate-900 rounded-2xl/3xl border border-slate-100 dark:border-slate-800`; acento `indigo-600`; siempre incluir variantes `dark:` y `transition-colors duration-300`.
- **Credencial de prueba:** superadmin `11111111`/`super123`, docente `40000000`/`docente123`, estudiante `22222222`/`estudiante123`. Login por cédula.
- **Contraseña inicial de usuarios creados = su cédula** (patrón existente en `createUser`).
- **Commits:** en español, formato `feat:`/`fix:`/`docs:`, terminando con `Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>`. Trabajar en rama `dev-work-kleyver`.

---

## File Structure

**Backend (`Backend-Diagnostico-vocacional/src/`):**
- `models/Configuracion.js` — nuevo (doc único global).
- `models/Asistencia.js` — nuevo.
- `models/Constancia.js` — nuevo.
- `models/user.js` — modificar (rol representante, `representados`, `conducta`).
- `controllers/config.controller.js` — nuevo (get/put config + helper `getConfig` cacheado).
- `controllers/representante.controller.js` — nuevo.
- `controllers/asistencia.controller.js` — nuevo.
- `controllers/constancia.controller.js` — nuevo.
- `controllers/auth.controller.js` — modificar (`createUser` acepta rol representante + `representadoId`; nuevo `updateConducta`; endpoints vincular/desvincular representante).
- `routes/config.routes.js`, `routes/representante.routes.js`, `routes/constancia.routes.js` — nuevos.
- `routes/academico.routes.js` — modificar (rutas de asistencia).
- `routes/auth.routes.js` — modificar (vincular representante, conducta).
- `app.js` — modificar (montar rutas nuevas).

**Frontend (`Frontend-Diagnostico-vocacional/src/`):**
- `api/config.js`, `api/representante.js`, `api/asistencia.js`, `api/constancias.js` — nuevos.
- `utils/roles.js` — modificar (rol representante).
- `utils/constanciasPDF.js` — nuevo.
- `pages/representante/RepresentanteDashboard.jsx` — nuevo.
- `pages/docente/AsistenciaPage.jsx` — nuevo.
- `pages/public/VerificarConstancia.jsx` — nuevo.
- `components/EmitirConstanciaModal.jsx` — nuevo.
- `components/Sidebar.jsx`, `App.js`, `pages/admin/AppConfigPage.jsx`, `pages/docente/SeccionDetailPage.jsx`, `pages/admin/ManageUsersPage.jsx` — modificar.

**Seeds:** `Backend/src/seeds/academico.seed.js` y `usuarios.seed.js` — modificar (representante de prueba + asistencia sembrada).

---

## Task 1: Modelo Configuracion + endpoints + persistencia

**Files:**
- Create: `Backend-Diagnostico-vocacional/src/models/Configuracion.js`
- Create: `Backend-Diagnostico-vocacional/src/controllers/config.controller.js`
- Create: `Backend-Diagnostico-vocacional/src/routes/config.routes.js`
- Modify: `Backend-Diagnostico-vocacional/src/app.js`

**Interfaces:**
- Produces: `getConfig()` async helper (devuelve `{ institucion, umbralInasistencia, notaAprobatoria, umbralVerde, umbralAmbar }` con caché); rutas `GET /api/config` (auth cualquiera), `PUT /api/config` (superadmin).

- [ ] **Step 1: Crear el modelo `Configuracion.js`**

```js
const mongoose = require('mongoose');

// Documento único global con los ajustes de la institución.
const ConfiguracionSchema = new mongoose.Schema({
    clave: { type: String, default: 'global', unique: true }, // asegura un solo doc
    institucion: { type: String, default: 'EduTrack Insight' },
    umbralInasistencia: { type: Number, default: 25 }, // % que hace perder derecho a evaluación
    notaAprobatoria: { type: Number, default: 10 },
    umbralVerde: { type: Number, default: 15 },
    umbralAmbar: { type: Number, default: 11 },
    iaActiva: { type: Boolean, default: true },
}, { timestamps: true });

module.exports = mongoose.model('Configuracion', ConfiguracionSchema);
```

- [ ] **Step 2: Crear `config.controller.js` con helper cacheado**

```js
const Configuracion = require('../models/Configuracion');

let _cache = null; // caché en memoria (se invalida al guardar)

/** Devuelve la config global, creándola con defaults si no existe. */
async function getConfig() {
    if (_cache) return _cache;
    let cfg = await Configuracion.findOne({ clave: 'global' });
    if (!cfg) cfg = await Configuracion.create({ clave: 'global' });
    _cache = cfg.toObject();
    return _cache;
}

exports.getConfig = getConfig;

// GET /api/config — cualquier usuario autenticado.
exports.obtener = async (req, res) => {
    try {
        const cfg = await getConfig();
        res.json(cfg);
    } catch (err) {
        console.error(err);
        res.status(500).json({ msg: 'Error al obtener la configuración' });
    }
};

// PUT /api/config — solo superadmin.
exports.actualizar = async (req, res) => {
    try {
        const campos = ['institucion', 'umbralInasistencia', 'notaAprobatoria', 'umbralVerde', 'umbralAmbar', 'iaActiva'];
        const cambios = {};
        campos.forEach(c => { if (req.body[c] !== undefined) cambios[c] = req.body[c]; });
        const cfg = await Configuracion.findOneAndUpdate(
            { clave: 'global' }, cambios, { new: true, upsert: true }
        );
        _cache = cfg.toObject(); // refrescar caché
        res.json({ msg: 'Configuración guardada', config: cfg });
    } catch (err) {
        console.error(err);
        res.status(500).json({ msg: 'Error al guardar la configuración' });
    }
};
```

- [ ] **Step 3: Crear `config.routes.js`**

```js
const express = require('express');
const router = express.Router();
const auth = require('../middlewares/auth');
const c = require('../controllers/config.controller');

router.get('/', auth(), c.obtener);
router.put('/', auth(['superadmin']), c.actualizar);

module.exports = router;
```

- [ ] **Step 4: Montar la ruta en `app.js`**

Añadir junto a los otros `require` de rutas:
```js
const configRoutes = require('./routes/config.routes');
```
Y junto a los otros `app.use('/api/...')`:
```js
app.use('/api/config', configRoutes);
```

- [ ] **Step 5: Verificar E2E**

Run:
```bash
cd "Backend-Diagnostico-vocacional" && node -e "
const http=require('http');
function login(c,p){return new Promise(r=>{const d=JSON.stringify({cedula:c,password:p});const q=http.request({hostname:'localhost',port:5000,path:'/api/auth/login',method:'POST',headers:{'Content-Type':'application/json','Content-Length':Buffer.byteLength(d)}},res=>{let b='';res.on('data',x=>b+=x);res.on('end',()=>r(JSON.parse(b)));});q.write(d);q.end();});}
function req(method,path,body,token){return new Promise(rr=>{const d=body?JSON.stringify(body):null;const h={'Content-Type':'application/json'};if(d)h['Content-Length']=Buffer.byteLength(d);if(token)h.Authorization='Bearer '+token;const q=http.request({hostname:'localhost',port:5000,path,method,headers:h},res=>{let b='';res.on('data',c=>b+=c);res.on('end',()=>{try{rr({s:res.statusCode,d:JSON.parse(b)})}catch(e){rr({s:res.statusCode,raw:b.slice(0,80)})}});});if(d)q.write(d);q.end();});}
(async()=>{const sa=await login(11111111,'super123');
 const g=await req('GET','/api/config',null,sa.token); console.log('GET config:',g.s,'| umbral:',g.d.umbralInasistencia);
 const p=await req('PUT','/api/config',{umbralInasistencia:20},sa.token); console.log('PUT config:',p.s,'| nuevo umbral:',p.d.config?.umbralInasistencia);
 const est=await login(22222222,'estudiante123'); const p2=await req('PUT','/api/config',{umbralInasistencia:99},est.token); console.log('Estudiante PUT (esperado 403):',p2.s);
 await req('PUT','/api/config',{umbralInasistencia:25},sa.token); // restaurar
})();"
```
Expected: `GET config: 200 | umbral: 25`, `PUT config: 200 | nuevo umbral: 20`, `Estudiante PUT (esperado 403): 403`.

- [ ] **Step 6: Commit**

```bash
git add Backend-Diagnostico-vocacional/src/models/Configuracion.js Backend-Diagnostico-vocacional/src/controllers/config.controller.js Backend-Diagnostico-vocacional/src/routes/config.routes.js Backend-Diagnostico-vocacional/src/app.js
git commit -m "feat(config): configuración global persistente en backend (umbral inasistencia, etc.)"
```

---

## Task 2: AppConfigPage lee/escribe del backend

**Files:**
- Create: `Frontend-Diagnostico-vocacional/src/api/config.js`
- Modify: `Frontend-Diagnostico-vocacional/src/pages/admin/AppConfigPage.jsx`

**Interfaces:**
- Consumes: `GET/PUT /api/config` de Task 1.
- Produces: `getConfig(token)`, `updateConfig(payload, token)` en `api/config.js`.

- [ ] **Step 1: Crear `api/config.js`**

```js
const BASE_URL = process.env.REACT_APP_API_URL;

export const getConfig = async (token) => {
  const res = await fetch(`${BASE_URL}/config`, { headers: { Authorization: `Bearer ${token}` } });
  const data = await res.json();
  if (!res.ok) throw new Error(data.msg || 'Error al obtener configuración');
  return data;
};

export const updateConfig = async (payload, token) => {
  const res = await fetch(`${BASE_URL}/config`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.msg || 'Error al guardar configuración');
  return data.config;
};
```

- [ ] **Step 2: Reescribir `AppConfigPage.jsx` para usar el backend**

Reemplazar la carga/guardado de `localStorage` por `getConfig`/`updateConfig`. Cambios clave:
- Importar: `import { getConfig, updateConfig } from '../../api/config';` y `useContext(AuthContext)` para el token.
- Estado inicial `null`; `useEffect` que hace `getConfig(token).then(setConfig)`.
- `save()` llama `updateConfig({ institucion, notaAprobatoria, umbralVerde, umbralAmbar, iaActiva, umbralInasistencia }, token)`.
- Añadir un `NumberField` nuevo: **"Umbral inasistencia (%)"** ligado a `config.umbralInasistencia`.
- Quitar el aviso de "se guardan localmente en este navegador".
- Mantener el resto de la UI (tarjetas ConfigCard) intacto y con su dark mode.

(El archivo ya existe con la estructura; solo se sustituye la fuente de datos. Conservar el layout Quiet Academic existente.)

- [ ] **Step 3: Verificar build**

Run: `cd "Frontend-Diagnostico-vocacional" && CI=true npx react-scripts build 2>&1 | grep -E "Compiled|Failed|AppConfigPage" | head -5`
Expected: `Compiled successfully.` y que `AppConfigPage` NO aparezca en warnings.

- [ ] **Step 4: Commit**

```bash
git add Frontend-Diagnostico-vocacional/src/api/config.js Frontend-Diagnostico-vocacional/src/pages/admin/AppConfigPage.jsx
git commit -m "feat(config): panel de configuración del superadmin lee/guarda del backend + umbral inasistencia"
```

---

## Task 3: Rol Representante en el modelo + vinculación (backend)

**Files:**
- Modify: `Backend-Diagnostico-vocacional/src/models/user.js`
- Modify: `Backend-Diagnostico-vocacional/src/controllers/auth.controller.js`
- Modify: `Backend-Diagnostico-vocacional/src/routes/auth.routes.js`

**Interfaces:**
- Produces: rol `representante`; `POST /api/auth/users` acepta `role:'representante'` + `representadoId` opcional; `POST /api/auth/representante/:id/vincular` `{estudianteId}`; `DELETE /api/auth/representante/:id/vincular/:estudianteId`; `PUT /api/auth/user/:id/conducta` `{conducta}`.

- [ ] **Step 1: Modificar `user.js`**

En el enum de `role`, agregar `'representante'`:
```js
enum: ['estudiante', 'docente', 'superadmin', 'representante'],
```
Después de `codigoUnidadEducativa: String`, agregar (antes de cerrar el objeto del schema):
```js
    // Conducta del estudiante (para constancia de buena conducta)
    conducta: { type: String, default: 'Satisfactoria' },
    // Estudiantes que representa (solo aplica al rol 'representante')
    representados: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
```

- [ ] **Step 2: Extender `createUser` en `auth.controller.js`**

Localizar `exports.createUser`. Ampliar `validRoles` para incluir representante y aceptar `representadoId`:
- En la desestructuración del body: `const { cedula, name, apellido, email, telefono, role = 'estudiante', password, representadoId } = req.body;`
- Cambiar la lista de roles válidos a `['estudiante', 'docente', 'superadmin', 'representante']`.
- El guard del docente sigue: docente solo crea `estudiante` (no representantes ni docentes).
- Tras crear el usuario, si `role === 'representante'` y viene `representadoId`, agregarlo:
```js
        if (role === 'representante' && representadoId) {
            await User.updateOne({ _id: user._id }, { $addToSet: { representados: representadoId } });
        }
```

- [ ] **Step 3: Añadir controladores de vinculación y conducta en `auth.controller.js`**

```js
// Vincula un estudiante a un representante (docente/superadmin).
exports.vincularRepresentado = async (req, res) => {
    try {
        const { estudianteId } = req.body;
        const rep = await User.findById(req.params.id);
        if (!rep || rep.role !== 'representante') return res.status(404).json({ msg: 'Representante no encontrado' });
        const est = await User.findOne({ _id: estudianteId, role: 'estudiante' });
        if (!est) return res.status(404).json({ msg: 'Estudiante no encontrado' });
        await User.updateOne({ _id: rep._id }, { $addToSet: { representados: est._id } });
        res.json({ msg: 'Representado vinculado' });
    } catch (err) { console.error(err); res.status(500).json({ msg: 'Error al vincular' }); }
};

// Desvincula un estudiante de un representante.
exports.desvincularRepresentado = async (req, res) => {
    try {
        await User.updateOne({ _id: req.params.id }, { $pull: { representados: req.params.estudianteId } });
        res.json({ msg: 'Representado desvinculado' });
    } catch (err) { console.error(err); res.status(500).json({ msg: 'Error al desvincular' }); }
};

// Actualiza la conducta de un estudiante (docente/superadmin).
exports.updateConducta = async (req, res) => {
    try {
        const { conducta } = req.body;
        const u = await User.findByIdAndUpdate(req.params.id, { conducta }, { new: true }).select('-password');
        if (!u) return res.status(404).json({ msg: 'Usuario no encontrado' });
        res.json({ msg: 'Conducta actualizada', user: u });
    } catch (err) { console.error(err); res.status(500).json({ msg: 'Error al actualizar conducta' }); }
};
```

- [ ] **Step 4: Registrar rutas en `auth.routes.js`**

Importar los nuevos controladores en el `require` de `auth.controller` (añadir `vincularRepresentado, desvincularRepresentado, updateConducta`). Añadir:
```js
router.post('/representante/:id/vincular', auth(['superadmin', 'docente']), vincularRepresentado);
router.delete('/representante/:id/vincular/:estudianteId', auth(['superadmin', 'docente']), desvincularRepresentado);
router.put('/user/:id/conducta', auth(['superadmin', 'docente']), updateConducta);
```

- [ ] **Step 5: Verificar E2E**

Run:
```bash
cd "Backend-Diagnostico-vocacional" && node -e "
const http=require('http');
function login(c,p){return new Promise(r=>{const d=JSON.stringify({cedula:c,password:p});const q=http.request({hostname:'localhost',port:5000,path:'/api/auth/login',method:'POST',headers:{'Content-Type':'application/json','Content-Length':Buffer.byteLength(d)}},res=>{let b='';res.on('data',x=>b+=x);res.on('end',()=>r(JSON.parse(b)));});q.write(d);q.end();});}
function req(method,path,body,token){return new Promise(rr=>{const d=body?JSON.stringify(body):null;const h={'Content-Type':'application/json'};if(d)h['Content-Length']=Buffer.byteLength(d);if(token)h.Authorization='Bearer '+token;const q=http.request({hostname:'localhost',port:5000,path,method,headers:h},res=>{let b='';res.on('data',c=>b+=c);res.on('end',()=>{try{rr({s:res.statusCode,d:JSON.parse(b)})}catch(e){rr({s:res.statusCode,raw:b.slice(0,100)})}});});if(d)q.write(d);q.end();});}
(async()=>{const sa=await login(11111111,'super123');
 const est=(await req('GET','/api/auth/users?role=estudiante',null,sa.token)).d[0];
 const cre=await req('POST','/api/auth/users',{name:'Rep',apellido:'Prueba',cedula:60000001,role:'representante',representadoId:est._id},sa.token);
 console.log('Crear representante:',cre.s,'| rol:',cre.d.user?.role);
 const login2=await login(60000001,'60000001'); console.log('Login representante (pass=cédula):',login2.s,'| rol:',login2.user?.role);
 // limpiar
 if(cre.d.user?._id) await req('DELETE','/api/auth/user/'+cre.d.user._id,null,sa.token);
 console.log('OK');
})();"
```
Expected: `Crear representante: 201 | rol: representante`, `Login representante (pass=cédula): 200 | rol: representante`, `OK`.

- [ ] **Step 6: Commit**

```bash
git add Backend-Diagnostico-vocacional/src/models/user.js Backend-Diagnostico-vocacional/src/controllers/auth.controller.js Backend-Diagnostico-vocacional/src/routes/auth.routes.js
git commit -m "feat(representante): rol representante, vinculación de representados y campo conducta"
```

---

## Task 4: Modelo Asistencia + endpoints (backend)

**Files:**
- Create: `Backend-Diagnostico-vocacional/src/models/Asistencia.js`
- Create: `Backend-Diagnostico-vocacional/src/controllers/asistencia.controller.js`
- Modify: `Backend-Diagnostico-vocacional/src/routes/academico.routes.js`

**Interfaces:**
- Consumes: `getConfig()` (Task 1), helpers `getSeccionPropia` de `academico.controller` (exportarlo o replicar).
- Produces: `GET /api/academico/secciones/:id/asistencia/:fecha`, `PUT .../asistencia/:fecha`, `GET .../asistencia-resumen`; función exportada `resumenInasistencia(seccionId, umbral)` → `Map<estId, {dias,ausencias,justificadas,pct,nivel}>`.

- [ ] **Step 1: Crear `Asistencia.js`**

```js
const mongoose = require('mongoose');

const AsistenciaSchema = new mongoose.Schema({
    seccion: { type: mongoose.Schema.Types.ObjectId, ref: 'Seccion', required: true },
    fecha: { type: Date, required: true }, // normalizada a medianoche UTC
    docente: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    registros: [{
        estudiante: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
        estado: { type: String, enum: ['presente', 'ausente', 'justificado'], default: 'presente' },
    }],
}, { timestamps: true });

AsistenciaSchema.index({ seccion: 1, fecha: 1 }, { unique: true });

module.exports = mongoose.model('Asistencia', AsistenciaSchema);
```

- [ ] **Step 2: Exportar `getSeccionPropia` desde `academico.controller.js`**

Al final de `academico.controller.js`, exportar el helper para reutilizarlo:
```js
exports._getSeccionPropia = getSeccionPropia;
```
(`getSeccionPropia(seccionId, docenteId)` ya existe y devuelve `{ seccion } | { error }`.)

- [ ] **Step 3: Crear `asistencia.controller.js`**

```js
const Asistencia = require('../models/Asistencia');
const Seccion = require('../models/Seccion');
const { _getSeccionPropia } = require('./academico.controller');
const { getConfig } = require('./config.controller');

/** Normaliza una fecha (YYYY-MM-DD) a medianoche UTC. */
function normalizarFecha(str) {
    const d = new Date(str);
    if (Number.isNaN(d.getTime())) return null;
    return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
}

/** Nivel de inasistencia según el umbral configurado. */
function nivelInasistencia(pct, umbral) {
    if (pct >= umbral) return 'danger';
    if (pct >= umbral * 0.6) return 'warning';
    return 'good';
}

/**
 * Resumen de inasistencia de toda la sección en bloque (1 consulta).
 * @returns {Map<string, {dias,ausencias,justificadas,pct,nivel}>}
 */
async function resumenInasistencia(seccionId, umbral) {
    const docs = await Asistencia.find({ seccion: seccionId }).lean();
    const acc = new Map(); // estId -> {dias, ausencias, justificadas}
    docs.forEach(doc => {
        doc.registros.forEach(r => {
            const k = String(r.estudiante);
            if (!acc.has(k)) acc.set(k, { dias: 0, ausencias: 0, justificadas: 0 });
            const a = acc.get(k);
            a.dias++;
            if (r.estado === 'ausente') a.ausencias++;
            else if (r.estado === 'justificado') a.justificadas++;
        });
    });
    const out = new Map();
    acc.forEach((a, k) => {
        const pct = a.dias ? Math.round((a.ausencias / a.dias) * 100) : 0;
        out.set(k, { ...a, pct, nivel: nivelInasistencia(pct, umbral) });
    });
    return out;
}
exports.resumenInasistencia = resumenInasistencia;

// GET pase de lista de un día (existente o lista vacía con los estudiantes de la sección).
exports.getAsistenciaDia = async (req, res) => {
    try {
        const { seccion, error } = await _getSeccionPropia(req.params.id, req.user.id);
        if (error) return res.status(error.status).json({ msg: error.msg });
        const fecha = normalizarFecha(req.params.fecha);
        if (!fecha) return res.status(400).json({ msg: 'Fecha inválida (usa YYYY-MM-DD)' });

        await seccion.populate('estudiantes', 'name apellido cedula');
        const doc = await Asistencia.findOne({ seccion: seccion._id, fecha }).lean();
        const estadoPorEst = {};
        (doc?.registros || []).forEach(r => { estadoPorEst[String(r.estudiante)] = r.estado; });

        res.json({
            seccion: seccion._id,
            fecha: req.params.fecha,
            existe: !!doc,
            estudiantes: seccion.estudiantes.map(e => ({
                _id: e._id, name: e.name, apellido: e.apellido, cedula: e.cedula,
                estado: estadoPorEst[String(e._id)] || 'presente',
            })),
        });
    } catch (err) { console.error(err); res.status(500).json({ msg: 'Error al obtener la asistencia' }); }
};

// PUT guardar el pase de lista de un día (upsert).
exports.guardarAsistenciaDia = async (req, res) => {
    try {
        const { seccion, error } = await _getSeccionPropia(req.params.id, req.user.id);
        if (error) return res.status(error.status).json({ msg: error.msg });
        const fecha = normalizarFecha(req.params.fecha);
        if (!fecha) return res.status(400).json({ msg: 'Fecha inválida' });
        const { registros } = req.body;
        if (!Array.isArray(registros)) return res.status(400).json({ msg: 'registros debe ser un array' });

        const limpios = registros
            .filter(r => ['presente', 'ausente', 'justificado'].includes(r.estado))
            .map(r => ({ estudiante: r.estudiante, estado: r.estado }));

        await Asistencia.findOneAndUpdate(
            { seccion: seccion._id, fecha },
            { seccion: seccion._id, fecha, docente: req.user.id, registros: limpios },
            { upsert: true, new: true }
        );
        res.json({ msg: 'Asistencia guardada' });
    } catch (err) { console.error(err); res.status(500).json({ msg: 'Error al guardar la asistencia' }); }
};

// GET resumen de inasistencia por estudiante de la sección.
exports.getAsistenciaResumen = async (req, res) => {
    try {
        const { seccion, error } = await _getSeccionPropia(req.params.id, req.user.id);
        if (error) return res.status(error.status).json({ msg: error.msg });
        await seccion.populate('estudiantes', 'name apellido cedula');
        const cfg = await getConfig();
        const mapa = await resumenInasistencia(seccion._id, cfg.umbralInasistencia);
        res.json({
            umbral: cfg.umbralInasistencia,
            estudiantes: seccion.estudiantes.map(e => {
                const r = mapa.get(String(e._id)) || { dias: 0, ausencias: 0, justificadas: 0, pct: 0, nivel: 'good' };
                return { _id: e._id, name: e.name, apellido: e.apellido, cedula: e.cedula, ...r };
            }),
        });
    } catch (err) { console.error(err); res.status(500).json({ msg: 'Error al obtener el resumen' }); }
};
```

- [ ] **Step 4: Registrar rutas en `academico.routes.js`**

Importar el controlador: `const asis = require('../controllers/asistencia.controller');`. Añadir (junto a las rutas de docente):
```js
router.get('/secciones/:id/asistencia-resumen', auth(['docente']), asis.getAsistenciaResumen);
router.get('/secciones/:id/asistencia/:fecha', auth(['docente']), asis.getAsistenciaDia);
router.put('/secciones/:id/asistencia/:fecha', auth(['docente']), asis.guardarAsistenciaDia);
```
(La ruta `-resumen` va ANTES de `/:fecha` para que no la capture el parámetro.)

- [ ] **Step 5: Verificar E2E**

Run:
```bash
cd "Backend-Diagnostico-vocacional" && node -e "
const http=require('http');
function login(c,p){return new Promise(r=>{const d=JSON.stringify({cedula:c,password:p});const q=http.request({hostname:'localhost',port:5000,path:'/api/auth/login',method:'POST',headers:{'Content-Type':'application/json','Content-Length':Buffer.byteLength(d)}},res=>{let b='';res.on('data',x=>b+=x);res.on('end',()=>r(JSON.parse(b)));});q.write(d);q.end();});}
function req(method,path,body,token){return new Promise(rr=>{const d=body?JSON.stringify(body):null;const h={'Content-Type':'application/json'};if(d)h['Content-Length']=Buffer.byteLength(d);if(token)h.Authorization='Bearer '+token;const q=http.request({hostname:'localhost',port:5000,path,method,headers:h},res=>{let b='';res.on('data',c=>b+=c);res.on('end',()=>{try{rr({s:res.statusCode,d:JSON.parse(b)})}catch(e){rr({s:res.statusCode,raw:b.slice(0,100)})}});});if(d)q.write(d);q.end();});}
(async()=>{const doc=await login(40000000,'docente123');
 const sec=(await req('GET','/api/academico/secciones',null,doc.token)).d.find(s=>s.totalEstudiantes>0);
 const dia=await req('GET','/api/academico/secciones/'+sec._id+'/asistencia/2026-01-15',null,doc.token);
 console.log('GET día:',dia.s,'| estudiantes:',dia.d.estudiantes?.length,'| existe:',dia.d.existe);
 const ids=dia.d.estudiantes.map(e=>e._id);
 const regs=ids.map((id,i)=>({estudiante:id,estado:i===0?'ausente':i===1?'justificado':'presente'}));
 const put=await req('PUT','/api/academico/secciones/'+sec._id+'/asistencia/2026-01-15',{registros:regs},doc.token);
 console.log('PUT:',put.s,'|',put.d.msg);
 const resu=await req('GET','/api/academico/secciones/'+sec._id+'/asistencia-resumen',null,doc.token);
 const primero=resu.d.estudiantes.find(e=>e._id===ids[0]);
 console.log('Resumen:',resu.s,'| umbral:',resu.d.umbral,'| 1er estudiante pct:',primero.pct,'nivel:',primero.nivel);
})();"
```
Expected: `GET día: 200 | estudiantes: N | existe: false` (o true en reintentos), `PUT: 200 | Asistencia guardada`, `Resumen: 200 | umbral: 25 | 1er estudiante pct: 100 nivel: danger`.

- [ ] **Step 6: Commit**

```bash
git add Backend-Diagnostico-vocacional/src/models/Asistencia.js Backend-Diagnostico-vocacional/src/controllers/asistencia.controller.js Backend-Diagnostico-vocacional/src/controllers/academico.controller.js Backend-Diagnostico-vocacional/src/routes/academico.routes.js
git commit -m "feat(asistencia): pase de lista por sección/día y resumen de inasistencia con umbral configurable"
```

---

## Task 5: Controlador y rutas del Representante (backend)

**Files:**
- Create: `Backend-Diagnostico-vocacional/src/controllers/representante.controller.js`
- Create: `Backend-Diagnostico-vocacional/src/routes/representante.routes.js`
- Modify: `Backend-Diagnostico-vocacional/src/app.js`

**Interfaces:**
- Consumes: modelos `User`, `Seccion`, `Materia`, `PlanEvaluacion`, `Nota`, `result`; `calcularLapsosBulk` y `_getSeccionPropia` de `academico.controller`; `resumenInasistencia` de `asistencia.controller`; `getConfig`.
- Produces: `GET /api/representante/mis-representados`, `GET /api/representante/representado/:id`.

- [ ] **Step 1: Crear `representante.controller.js`**

```js
const User = require('../models/user');
const Seccion = require('../models/Seccion');
const Materia = require('../models/Materia');
const result = require('../models/result');
const { calcularLapsosBulk } = require('./academico.controller');
const { resumenInasistencia } = require('./asistencia.controller');
const { getConfig } = require('./config.controller');
const { ANIO_LABEL } = require('../data/curriculoMPPE');

// Verifica que el estudiante :id sea representado del usuario actual.
function esRepresentado(req, estudianteId) {
    return (req.user.representados || []).map(String).includes(String(estudianteId));
}

// Detalle académico de un estudiante (materias por lapso + asistencia + vocacional).
async function detalleEstudiante(estudianteId) {
    const secciones = await Seccion.find({ estudiantes: estudianteId }).populate('docente', 'name apellido').lean();
    const cfg = await getConfig();
    const grupos = [];
    for (const sec of secciones) {
        const materias = await Materia.find({ seccion: sec._id }).sort({ nombre: 1 }).lean();
        const bulk = await calcularLapsosBulk(materias.map(m => m._id), [1, 2, 3], [estudianteId]);
        const items = materias.map(m => {
            const lapsos = {};
            [1, 2, 3].forEach(l => { lapsos[l] = { acumulado: bulk.get(`${String(m._id)}|${l}|${String(estudianteId)}`)?.acumulado ?? null }; });
            const vals = [1, 2, 3].map(l => lapsos[l].acumulado).filter(v => v !== null);
            const definitiva = vals.length === 3 ? Math.round(vals.reduce((s, v) => s + v, 0) / 3) : null;
            return { _id: m._id, nombre: m.nombre, lapsos, definitiva };
        });
        const inas = await resumenInasistencia(sec._id, cfg.umbralInasistencia);
        const asis = inas.get(String(estudianteId)) || { dias: 0, ausencias: 0, justificadas: 0, pct: 0, nivel: 'good' };
        grupos.push({
            seccion: { _id: sec._id, nombre: sec.nombre, anio: sec.anio, etiquetaAnio: ANIO_LABEL[sec.anio], periodo: sec.periodo, docente: sec.docente },
            materias: items,
            asistencia: { ...asis, umbral: cfg.umbralInasistencia },
        });
    }
    return grupos;
}

exports.misRepresentados = async (req, res) => {
    try {
        const reps = await User.find({ _id: { $in: req.user.representados || [] } }).select('name apellido cedula').lean();
        // Perfil vocacional (área top) por representado
        const conArea = await Promise.all(reps.map(async (r) => {
            const vr = await result.findOne({ user: r._id }).sort({ createdAt: -1 }).lean();
            let topArea = null;
            if (vr?.results) {
                const scores = vr.results instanceof Map ? Object.fromEntries(vr.results) : vr.results;
                const e = Object.entries(scores).sort(([, a], [, b]) => b - a);
                if (e.length) topArea = e[0][0];
            }
            return { ...r, topArea };
        }));
        res.json(conArea);
    } catch (err) { console.error(err); res.status(500).json({ msg: 'Error al obtener representados' }); }
};

exports.representadoDetalle = async (req, res) => {
    try {
        if (!esRepresentado(req, req.params.id)) return res.status(403).json({ msg: 'Ese estudiante no es tu representado' });
        const estudiante = await User.findById(req.params.id).select('name apellido cedula').lean();
        if (!estudiante) return res.status(404).json({ msg: 'Estudiante no encontrado' });
        const grupos = await detalleEstudiante(req.params.id);
        res.json({ estudiante, grupos });
    } catch (err) { console.error(err); res.status(500).json({ msg: 'Error al obtener el detalle' }); }
};
```

- [ ] **Step 2: Crear `representante.routes.js`**

```js
const express = require('express');
const router = express.Router();
const auth = require('../middlewares/auth');
const c = require('../controllers/representante.controller');

router.get('/mis-representados', auth(['representante']), c.misRepresentados);
router.get('/representado/:id', auth(['representante']), c.representadoDetalle);

module.exports = router;
```

- [ ] **Step 3: Montar en `app.js`**

```js
const representanteRoutes = require('./routes/representante.routes');
// ...
app.use('/api/representante', representanteRoutes);
```

- [ ] **Step 4: Verificar E2E** (crea representante temporal, vincula, consulta, limpia)

Run:
```bash
cd "Backend-Diagnostico-vocacional" && node -e "
const http=require('http');
function login(c,p){return new Promise(r=>{const d=JSON.stringify({cedula:c,password:p});const q=http.request({hostname:'localhost',port:5000,path:'/api/auth/login',method:'POST',headers:{'Content-Type':'application/json','Content-Length':Buffer.byteLength(d)}},res=>{let b='';res.on('data',x=>b+=x);res.on('end',()=>r(JSON.parse(b)));});q.write(d);q.end();});}
function req(method,path,body,token){return new Promise(rr=>{const d=body?JSON.stringify(body):null;const h={'Content-Type':'application/json'};if(d)h['Content-Length']=Buffer.byteLength(d);if(token)h.Authorization='Bearer '+token;const q=http.request({hostname:'localhost',port:5000,path,method,headers:h},res=>{let b='';res.on('data',c=>b+=c);res.on('end',()=>{try{rr({s:res.statusCode,d:JSON.parse(b)})}catch(e){rr({s:res.statusCode,raw:b.slice(0,100)})}});});if(d)q.write(d);q.end();});}
(async()=>{const sa=await login(11111111,'super123');
 const est=(await req('GET','/api/auth/users?role=estudiante',null,sa.token)).d.find(e=>e.cedula===22222222)||{}; 
 const cre=await req('POST','/api/auth/users',{name:'RepA',apellido:'Test',cedula:60000002,role:'representante',representadoId:est._id},sa.token);
 const rep=await login(60000002,'60000002');
 const mis=await req('GET','/api/representante/mis-representados',null,rep.token);
 console.log('mis-representados:',mis.s,'| cantidad:',mis.d.length,'| 1er:',mis.d[0]?.name,'área:',mis.d[0]?.topArea);
 const det=await req('GET','/api/representante/representado/'+est._id,null,rep.token);
 console.log('detalle:',det.s,'| grupos:',det.d.grupos?.length,'| 1ra materia:',det.d.grupos?.[0]?.materias?.[0]?.nombre,'| asistencia pct:',det.d.grupos?.[0]?.asistencia?.pct);
 const otro=(await req('GET','/api/auth/users?role=estudiante',null,sa.token)).d.find(e=>e.cedula!==22222222);
 const deneg=await req('GET','/api/representante/representado/'+otro._id,null,rep.token);
 console.log('detalle de NO representado (esperado 403):',deneg.s);
 if(cre.d.user?._id) await req('DELETE','/api/auth/user/'+cre.d.user._id,null,sa.token);
})();"
```
Expected: `mis-representados: 200 | cantidad: 1 | 1er: Estudiante área: ...`, `detalle: 200 | grupos: N | 1ra materia: ... | asistencia pct: ...`, `detalle de NO representado (esperado 403): 403`.

- [ ] **Step 5: Commit**

```bash
git add Backend-Diagnostico-vocacional/src/controllers/representante.controller.js Backend-Diagnostico-vocacional/src/routes/representante.routes.js Backend-Diagnostico-vocacional/src/app.js
git commit -m "feat(representante): endpoints mis-representados y detalle del representado (notas + asistencia + vocacional)"
```

---

## Task 6: Modelo Constancia + endpoints + verificación pública (backend)

**Files:**
- Create: `Backend-Diagnostico-vocacional/src/models/Constancia.js`
- Create: `Backend-Diagnostico-vocacional/src/controllers/constancia.controller.js`
- Create: `Backend-Diagnostico-vocacional/src/routes/constancia.routes.js`
- Modify: `Backend-Diagnostico-vocacional/src/app.js`

**Interfaces:**
- Consumes: `User`, `Seccion`, `Materia`; `calcularLapsosBulk`, `_getSeccionPropia`; `getConfig`; `ANIO_LABEL`.
- Produces: `POST /api/constancias` (docente/superadmin), `GET /api/constancias/verificar/:codigo` (público).

- [ ] **Step 1: Crear `Constancia.js`**

```js
const mongoose = require('mongoose');

const ConstanciaSchema = new mongoose.Schema({
    codigo: { type: String, required: true, unique: true },
    tipo: { type: String, enum: ['estudios', 'conducta', 'rendimiento', 'con-representante'], required: true },
    estudiante: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    seccion: { type: mongoose.Schema.Types.ObjectId, ref: 'Seccion' },
    emitidoPor: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    datos: { type: mongoose.Schema.Types.Mixed },
}, { timestamps: true });

module.exports = mongoose.model('Constancia', ConstanciaSchema);
```

- [ ] **Step 2: Crear `constancia.controller.js`**

```js
const Constancia = require('../models/Constancia');
const User = require('../models/user');
const Seccion = require('../models/Seccion');
const Materia = require('../models/Materia');
const { calcularLapsosBulk, _getSeccionPropia } = require('./academico.controller');
const { getConfig } = require('./config.controller');
const { ANIO_LABEL } = require('../data/curriculoMPPE');

/** Genera un código correlativo EDT-{año}-{secuencia6}. */
async function generarCodigo() {
    const anio = new Date().getUTCFullYear();
    const desde = new Date(Date.UTC(anio, 0, 1));
    const n = await Constancia.countDocuments({ createdAt: { $gte: desde } });
    return `EDT-${anio}-${String(n + 1).padStart(6, '0')}`;
}

// ¿El docente tiene a este estudiante en alguna de sus secciones?
async function docenteTieneEstudiante(docenteId, estudianteId) {
    return !!(await Seccion.findOne({ docente: docenteId, estudiantes: estudianteId }));
}

exports.emitir = async (req, res) => {
    try {
        const { tipo, estudianteId, seccionId } = req.body;
        const cfg = await getConfig();

        if (!['estudios', 'conducta', 'rendimiento', 'con-representante'].includes(tipo)) {
            return res.status(400).json({ msg: 'Tipo de constancia inválido' });
        }

        let datos = { institucion: cfg.institucion };
        let estudianteRef = null, seccionRef = null;

        if (tipo === 'rendimiento') {
            // Por sección: valida propiedad si es docente
            let seccion;
            if (req.user.role === 'docente') {
                const r = await _getSeccionPropia(seccionId, req.user.id);
                if (r.error) return res.status(r.error.status).json({ msg: r.error.msg });
                seccion = r.seccion;
            } else {
                seccion = await Seccion.findById(seccionId);
                if (!seccion) return res.status(404).json({ msg: 'Sección no encontrada' });
            }
            await seccion.populate('estudiantes', 'name apellido cedula');
            const materias = await Materia.find({ seccion: seccion._id }).sort({ nombre: 1 }).lean();
            const bulk = await calcularLapsosBulk(materias.map(m => m._id), [1, 2, 3], seccion.estudiantes.map(e => e._id));
            datos.seccion = { nombre: seccion.nombre, anio: seccion.anio, etiquetaAnio: ANIO_LABEL[seccion.anio], periodo: seccion.periodo };
            datos.materias = materias.map(m => ({ nombre: m.nombre }));
            datos.filas = seccion.estudiantes.map(e => ({
                nombre: `${e.apellido || ''} ${e.name}`.trim(), cedula: e.cedula,
                notas: materias.map(m => {
                    const v = [1, 2, 3].map(l => bulk.get(`${String(m._id)}|${l}|${String(e._id)}`)?.acumulado).filter(x => x != null);
                    return v.length === 3 ? Math.round(v.reduce((s, x) => s + x, 0) / 3) : null;
                }),
            }));
            seccionRef = seccion._id;
        } else {
            // Por estudiante
            const est = await User.findById(estudianteId).select('name apellido cedula conducta').lean();
            if (!est) return res.status(404).json({ msg: 'Estudiante no encontrado' });
            if (req.user.role === 'docente' && !(await docenteTieneEstudiante(req.user.id, estudianteId))) {
                return res.status(403).json({ msg: 'Este estudiante no pertenece a tus secciones' });
            }
            const sec = await Seccion.findOne({ estudiantes: estudianteId }).lean();
            datos.estudiante = { nombre: `${est.apellido || ''} ${est.name}`.trim(), cedula: est.cedula };
            if (sec) datos.seccion = { etiquetaAnio: ANIO_LABEL[sec.anio], nombre: sec.nombre, periodo: sec.periodo };
            if (tipo === 'conducta') datos.conducta = est.conducta || 'Satisfactoria';
            if (tipo === 'con-representante') {
                const rep = await User.findOne({ role: 'representante', representados: estudianteId }).select('name apellido cedula').lean();
                datos.representante = rep ? { nombre: `${rep.apellido || ''} ${rep.name}`.trim(), cedula: rep.cedula } : null;
            }
            estudianteRef = est._id;
            seccionRef = sec?._id;
        }

        const codigo = await generarCodigo();
        await Constancia.create({ codigo, tipo, estudiante: estudianteRef, seccion: seccionRef, emitidoPor: req.user.id, datos });
        res.status(201).json({ codigo, tipo, datos, fecha: new Date() });
    } catch (err) { console.error(err); res.status(500).json({ msg: 'Error al emitir la constancia' }); }
};

// Público: verificar autenticidad.
exports.verificar = async (req, res) => {
    try {
        const c = await Constancia.findOne({ codigo: req.params.codigo }).populate('estudiante', 'name apellido').lean();
        if (!c) return res.status(404).json({ valida: false, msg: 'Constancia no encontrada' });
        const TIPO_LABEL = { estudios: 'Constancia de Estudios', conducta: 'Constancia de Buena Conducta', rendimiento: 'Resumen Final de Rendimiento', 'con-representante': 'Constancia de Estudios (con representante)' };
        res.json({
            valida: true,
            tipo: TIPO_LABEL[c.tipo] || c.tipo,
            estudiante: c.datos?.estudiante?.nombre || (c.estudiante ? `${c.estudiante.apellido || ''} ${c.estudiante.name}`.trim() : (c.datos?.seccion ? `Sección ${c.datos.seccion.etiquetaAnio || ''} ${c.datos.seccion.nombre || ''}` : '—')),
            institucion: c.datos?.institucion || 'EduTrack Insight',
            fecha: c.createdAt,
        });
    } catch (err) { console.error(err); res.status(500).json({ msg: 'Error al verificar' }); }
};
```

- [ ] **Step 3: Crear `constancia.routes.js`**

```js
const express = require('express');
const router = express.Router();
const auth = require('../middlewares/auth');
const c = require('../controllers/constancia.controller');

router.post('/', auth(['docente', 'superadmin']), c.emitir);
router.get('/verificar/:codigo', c.verificar); // público, sin auth

module.exports = router;
```

- [ ] **Step 4: Montar en `app.js`**

```js
const constanciaRoutes = require('./routes/constancia.routes');
// ...
app.use('/api/constancias', constanciaRoutes);
```

- [ ] **Step 5: Verificar E2E** (emitir estudios + verificar código + rendimiento)

Run:
```bash
cd "Backend-Diagnostico-vocacional" && node -e "
const http=require('http');
function login(c,p){return new Promise(r=>{const d=JSON.stringify({cedula:c,password:p});const q=http.request({hostname:'localhost',port:5000,path:'/api/auth/login',method:'POST',headers:{'Content-Type':'application/json','Content-Length':Buffer.byteLength(d)}},res=>{let b='';res.on('data',x=>b+=x);res.on('end',()=>r(JSON.parse(b)));});q.write(d);q.end();});}
function req(method,path,body,token){return new Promise(rr=>{const d=body?JSON.stringify(body):null;const h={'Content-Type':'application/json'};if(d)h['Content-Length']=Buffer.byteLength(d);if(token)h.Authorization='Bearer '+token;const q=http.request({hostname:'localhost',port:5000,path,method,headers:h},res=>{let b='';res.on('data',c=>b+=c);res.on('end',()=>{try{rr({s:res.statusCode,d:JSON.parse(b)})}catch(e){rr({s:res.statusCode,raw:b.slice(0,120)})}});});if(d)q.write(d);q.end();});}
(async()=>{const doc=await login(40000000,'docente123');
 const sec=(await req('GET','/api/academico/secciones',null,doc.token)).d.find(s=>s.totalEstudiantes>0);
 const secDet=await req('GET','/api/academico/secciones/'+sec._id,null,doc.token);
 const est=secDet.d.seccion.estudiantes[0];
 const c1=await req('POST','/api/constancias',{tipo:'estudios',estudianteId:est._id},doc.token);
 console.log('Emitir estudios:',c1.s,'| código:',c1.d.codigo,'| estudiante:',c1.d.datos?.estudiante?.nombre);
 const ver=await req('GET','/api/constancias/verificar/'+c1.d.codigo,null,null);
 console.log('Verificar (público):',ver.s,'| válida:',ver.d.valida,'| tipo:',ver.d.tipo);
 const c2=await req('POST','/api/constancias',{tipo:'rendimiento',seccionId:sec._id},doc.token);
 console.log('Emitir rendimiento:',c2.s,'| código:',c2.d.codigo,'| filas:',c2.d.datos?.filas?.length);
 const vermal=await req('GET','/api/constancias/verificar/EDT-9999-000000',null,null);
 console.log('Verificar inexistente (esperado 404):',vermal.s);
})();"
```
Expected: `Emitir estudios: 201 | código: EDT-2026-000001 | estudiante: ...`, `Verificar (público): 200 | válida: true | tipo: Constancia de Estudios`, `Emitir rendimiento: 201 | código: ... | filas: N`, `Verificar inexistente (esperado 404): 404`.

- [ ] **Step 6: Commit**

```bash
git add Backend-Diagnostico-vocacional/src/models/Constancia.js Backend-Diagnostico-vocacional/src/controllers/constancia.controller.js Backend-Diagnostico-vocacional/src/routes/constancia.routes.js Backend-Diagnostico-vocacional/src/app.js
git commit -m "feat(constancias): emisión de 4 tipos con código de control y verificación pública"
```

---

## Task 7: Rol representante en frontend (roles, ruteo, sidebar)

**Files:**
- Modify: `Frontend-Diagnostico-vocacional/src/utils/roles.js`
- Modify: `Frontend-Diagnostico-vocacional/src/components/Sidebar.jsx`
- Modify: `Frontend-Diagnostico-vocacional/src/App.js`
- Create: `Frontend-Diagnostico-vocacional/src/api/representante.js`
- Create: `Frontend-Diagnostico-vocacional/src/pages/representante/RepresentanteDashboard.jsx`

**Interfaces:**
- Consumes: `GET /api/representante/mis-representados`, `/representado/:id` (Task 5).
- Produces: rol `representante` en ROLES/HOME_BY_ROLE/ROLE_LABEL; ruta `/app/representante`; página del panel.

- [ ] **Step 1: Añadir el rol en `roles.js`**

En `ROLES` añadir `REPRESENTANTE: 'representante'`. En `HOME_BY_ROLE` añadir `[ROLES.REPRESENTANTE]: '/app/representante'`. En `ROLE_LABEL` añadir `[ROLES.REPRESENTANTE]: 'Representante'`.

- [ ] **Step 2: Crear `api/representante.js`**

```js
const BASE_URL = process.env.REACT_APP_API_URL;
async function get(path, token) {
  const res = await fetch(`${BASE_URL}/representante${path}`, { headers: { Authorization: `Bearer ${token}` } });
  const data = await res.json();
  if (!res.ok) throw new Error(data.msg || 'Error');
  return data;
}
export const misRepresentados = (token) => get('/mis-representados', token);
export const representadoDetalle = (token, id) => get(`/representado/${id}`, token);
```

- [ ] **Step 3: Añadir el menú del representante en `Sidebar.jsx`**

Importar `Users` (ya suele estar) e incluir en `MENU_BY_ROLE`:
```js
  [ROLES.REPRESENTANTE]: [
    { name: 'Mis Representados', path: '/app/representante', icon: Users },
  ],
```

- [ ] **Step 4: Crear `RepresentanteDashboard.jsx`**

Página que:
- Carga `misRepresentados(token)`. Si hay varios, muestra un selector (chips o dropdown).
- Al elegir uno, carga `representadoDetalle(token, id)` y muestra, por sección: tabla de materias × lapsos + definitiva (idéntica a `MisMateriasPage`), y una tarjeta de **asistencia** con el semáforo (usar `pct`, `nivel`: good=emerald, warning=amber, danger=rose) y el texto "X% de inasistencia (umbral Y%)".
- Header con nombre del representado y su área vocacional.
- Estilo Quiet Academic + dark mode (fondo slate, tarjetas blancas/slate-900). Usa `getScoreStyles` de `utils/academic` para colorear notas.

- [ ] **Step 5: Rutear en `App.js`**

Importar `RepresentanteDashboard` y `ROLES`. Dentro de `/app` (tras las rutas del docente), añadir:
```jsx
                <Route element={<ProtectedRoute allowedRoles={[ROLES.REPRESENTANTE]} />}>
                  <Route path="representante" element={<RepresentanteDashboard />} />
                </Route>
```

- [ ] **Step 6: Verificar build**

Run: `cd "Frontend-Diagnostico-vocacional" && CI=true npx react-scripts build 2>&1 | grep -E "Compiled|Failed|Representante|Sidebar|roles" | head -6`
Expected: `Compiled successfully.` sin warnings en los archivos tocados.

- [ ] **Step 7: Commit**

```bash
git add Frontend-Diagnostico-vocacional/src/utils/roles.js Frontend-Diagnostico-vocacional/src/api/representante.js Frontend-Diagnostico-vocacional/src/components/Sidebar.jsx Frontend-Diagnostico-vocacional/src/App.js Frontend-Diagnostico-vocacional/src/pages/representante/RepresentanteDashboard.jsx
git commit -m "feat(representante): panel del representante con notas y asistencia de sus representados"
```

---

## Task 8: Página de Asistencia del docente (frontend)

**Files:**
- Create: `Frontend-Diagnostico-vocacional/src/api/asistencia.js`
- Create: `Frontend-Diagnostico-vocacional/src/pages/docente/AsistenciaPage.jsx`
- Modify: `Frontend-Diagnostico-vocacional/src/App.js`
- Modify: `Frontend-Diagnostico-vocacional/src/pages/docente/SeccionDetailPage.jsx`

**Interfaces:**
- Consumes: `GET/PUT .../asistencia/:fecha`, `GET .../asistencia-resumen` (Task 4).
- Produces: `api/asistencia.js` (`getDia`, `guardarDia`, `getResumen`); ruta `/app/docente/secciones/:id/asistencia`.

- [ ] **Step 1: Crear `api/asistencia.js`**

```js
const BASE_URL = process.env.REACT_APP_API_URL;
async function req(method, path, token, body) {
  const res = await fetch(`${BASE_URL}/academico${path}`, {
    method, headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.msg || 'Error');
  return data;
}
export const getDia = (token, seccionId, fecha) => req('GET', `/secciones/${seccionId}/asistencia/${fecha}`, token);
export const guardarDia = (token, seccionId, fecha, registros) => req('PUT', `/secciones/${seccionId}/asistencia/${fecha}`, token, { registros });
export const getResumen = (token, seccionId) => req('GET', `/secciones/${seccionId}/asistencia-resumen`, token);
```

- [ ] **Step 2: Crear `AsistenciaPage.jsx`**

Página con dos vistas (pestañas "Pase de lista" / "Resumen"):
- **Pase de lista:** input `type="date"` (default hoy en formato YYYY-MM-DD), carga `getDia`. Fila por estudiante con 3 botones toggle (Presente=emerald, Ausente=rose, Justificado=amber) que setean `estado` en un estado local `{ [estId]: estado }`. Botón "Marcar todos presentes". Botón "Guardar" → `guardarDia(token, id, fecha, registros)` con mensaje flash.
- **Resumen:** `getResumen` → tabla estudiante | días | ausencias | % inasistencia (con color por `nivel`) | estado (Normal/Alerta/Riesgo). Muestra el umbral configurado.
- Estilo Quiet Academic + dark mode. Header "Volver a la sección" (`/app/docente/secciones/:id`).

- [ ] **Step 3: Rutear en `App.js`**

Importar `AsistenciaPage`. Junto a las rutas del docente:
```jsx
                  <Route path="docente/secciones/:id/asistencia" element={<AsistenciaPage />} />
```

- [ ] **Step 4: Enlazar desde `SeccionDetailPage.jsx`**

Junto al botón "Preinforme" del header, añadir un botón "Asistencia":
```jsx
          <Link to={`/app/docente/secciones/${seccion._id}/asistencia`}
            className="inline-flex items-center gap-2 text-sm font-semibold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/30 px-4 py-2.5 rounded-xl hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-colors">
            <CalendarCheck className="w-4 h-4" /> Asistencia
          </Link>
```
(Importar `CalendarCheck` de lucide-react.)

- [ ] **Step 5: Verificar build**

Run: `cd "Frontend-Diagnostico-vocacional" && CI=true npx react-scripts build 2>&1 | grep -E "Compiled|Failed|Asistencia|SeccionDetail" | head -6`
Expected: `Compiled successfully.` sin warnings en archivos tocados.

- [ ] **Step 6: Commit**

```bash
git add Frontend-Diagnostico-vocacional/src/api/asistencia.js Frontend-Diagnostico-vocacional/src/pages/docente/AsistenciaPage.jsx Frontend-Diagnostico-vocacional/src/App.js Frontend-Diagnostico-vocacional/src/pages/docente/SeccionDetailPage.jsx
git commit -m "feat(asistencia): página de pase de lista y resumen de inasistencia del docente"
```

---

## Task 9: Emisión de constancias + verificación pública (frontend)

**Files:**
- Modify: `Frontend-Diagnostico-vocacional/package.json` (dep `qrcode`)
- Create: `Frontend-Diagnostico-vocacional/src/api/constancias.js`
- Create: `Frontend-Diagnostico-vocacional/src/utils/constanciasPDF.js`
- Create: `Frontend-Diagnostico-vocacional/src/components/EmitirConstanciaModal.jsx`
- Create: `Frontend-Diagnostico-vocacional/src/pages/public/VerificarConstancia.jsx`
- Modify: `Frontend-Diagnostico-vocacional/src/App.js`
- Modify: `Frontend-Diagnostico-vocacional/src/pages/docente/SeccionDetailPage.jsx`

**Interfaces:**
- Consumes: `POST /api/constancias`, `GET /api/constancias/verificar/:codigo` (Task 6).
- Produces: `api/constancias.js` (`emitir`, `verificar`); `constanciasPDF.js` (`exportConstanciaPDF(datos)` async); modal de emisión; página pública `/verificar/:codigo`.

- [ ] **Step 1: Instalar `qrcode`**

Run: `cd "Frontend-Diagnostico-vocacional" && npm install qrcode`
Expected: se agrega `qrcode` a dependencies.

- [ ] **Step 2: Crear `api/constancias.js`**

```js
const BASE_URL = process.env.REACT_APP_API_URL;
export const emitirConstancia = async (payload, token) => {
  const res = await fetch(`${BASE_URL}/constancias`, {
    method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.msg || 'Error al emitir');
  return data;
};
export const verificarConstancia = async (codigo) => {
  const res = await fetch(`${BASE_URL}/constancias/verificar/${codigo}`);
  const data = await res.json();
  return { ok: res.ok, ...data };
};
```

- [ ] **Step 3: Crear `constanciasPDF.js`**

Exporta `async function exportConstanciaPDF(resp)` donde `resp = { codigo, tipo, datos, fecha }`:
- Usa `jsPDF` + `jspdf-autotable`. Encabezado membretado RBV/MPPE (replicar el patrón `encabezado` de `academicoPDF.js`, leyendo institución de `resp.datos.institucion`).
- Cuerpo según `tipo`:
  - `estudios`/`con-representante`: párrafo "Se certifica que el estudiante [nombre], C.I. [cédula], se encuentra inscrito en [etiquetaAnio] sección [nombre], período [periodo]." Para `con-representante` añade "Representante legal: [representante.nombre], C.I. [cédula]".
  - `conducta`: "...observó una conducta [conducta] durante el período [periodo]."
  - `rendimiento`: tabla con `autoTable` (columnas: N°, Estudiante, ...materias, con las definitivas de `datos.filas`).
- Pie: **código de control** `resp.codigo` + **QR** generado con `QRCode.toDataURL(`${window.location.origin}/verificar/${resp.codigo}`)` embebido con `doc.addImage`. Firmas y sello.
- `doc.save(`Constancia_${resp.tipo}_${resp.codigo}.pdf`)`.

- [ ] **Step 4: Crear `EmitirConstanciaModal.jsx`**

Modal (reusa `components/ui/Modal.jsx`) que recibe `{ open, onClose, estudiante?, seccion?, token }`:
- Selector de tipo (estudios / conducta / con-representante para estudiante; rendimiento si viene `seccion`).
- Botón "Emitir" → llama `emitirConstancia({ tipo, estudianteId, seccionId }, token)` → al recibir la respuesta, `await exportConstanciaPDF(resp)` y cierra. Muestra loader/errores.

- [ ] **Step 5: Crear `VerificarConstancia.jsx` (público)**

Página en ruta `/verificar/:codigo` (sin login):
- `useParams` → `verificarConstancia(codigo)`.
- Si `valida`: tarjeta verde con ✅ "Constancia válida", tipo, estudiante, institución y fecha.
- Si no: tarjeta roja ❌ "Constancia no encontrada".
- Estilo Quiet Academic centrado, dark mode, con el logo/nombre EduTrack arriba.

- [ ] **Step 6: Rutear en `App.js`**

Importar `VerificarConstancia`. Como ruta **pública** (fuera de `/app`, junto a `/auth`):
```jsx
            <Route path="/verificar/:codigo" element={<VerificarConstancia />} />
```

- [ ] **Step 7: Enlazar emisión desde `SeccionDetailPage.jsx`**

En la pestaña Estudiantes, junto al botón "CERTIFICACIÓN" de cada estudiante, añadir un botón "CONSTANCIA" que abre `EmitirConstanciaModal` con ese estudiante. Añadir estado `constanciaEst` y el `<EmitirConstanciaModal>` al final. También un botón "Constancia de rendimiento" en el header (pasa `seccion`).

- [ ] **Step 8: Verificar build**

Run: `cd "Frontend-Diagnostico-vocacional" && CI=true npx react-scripts build 2>&1 | grep -E "Compiled|Failed|Constancia|Verificar" | head -6`
Expected: `Compiled successfully.` sin warnings en archivos tocados.

- [ ] **Step 9: Commit**

```bash
git add Frontend-Diagnostico-vocacional/package.json Frontend-Diagnostico-vocacional/package-lock.json Frontend-Diagnostico-vocacional/src/api/constancias.js Frontend-Diagnostico-vocacional/src/utils/constanciasPDF.js Frontend-Diagnostico-vocacional/src/components/EmitirConstanciaModal.jsx Frontend-Diagnostico-vocacional/src/pages/public/VerificarConstancia.jsx Frontend-Diagnostico-vocacional/src/App.js Frontend-Diagnostico-vocacional/src/pages/docente/SeccionDetailPage.jsx
git commit -m "feat(constancias): emisión PDF con QR y página pública de verificación"
```

---

## Task 10: Semáforo de inasistencia en paneles + asignar representante (frontend)

**Files:**
- Modify: `Frontend-Diagnostico-vocacional/src/pages/docente/TeacherDashboard.jsx`
- Modify: `Frontend-Diagnostico-vocacional/src/pages/docente/SeccionDetailPage.jsx`
- Modify: `Frontend-Diagnostico-vocacional/src/pages/admin/ManageUsersPage.jsx`

**Interfaces:**
- Consumes: `getResumen` (asistencia), `createUser`/vincular (auth).
- Produces: KPI/indicador de inasistencia; opción "Asignar representante" en gestión de usuarios.

- [ ] **Step 1: KPI de inasistencia en el panel docente**

En `TeacherDashboard.jsx`, tras cargar `resumenDocente`, no hay dato de inasistencia global; en su lugar, en la lista de secciones ya existente, cada `Link` de sección puede mostrar un badge si hay estudiantes en riesgo. Para mantenerlo simple y sin N+1, **añadir en el detalle de sección** (`SeccionDetailPage`, pestaña Estudiantes) una columna/chip de % de inasistencia por estudiante consultando `getResumen(token, seccion._id)` una vez al cargar la sección, y mapear por estudiante.

- [ ] **Step 2: Mostrar inasistencia en la pestaña Estudiantes de `SeccionDetailPage`**

Al cargar el detalle, llamar `getResumen(token, id)` y guardar un `Map` estId→{pct,nivel}. En cada fila de estudiante, mostrar un chip con el % y color por nivel (good=emerald, warning=amber, danger=rose). Si `dias===0`, mostrar "—".

- [ ] **Step 3: "Asignar representante" en `ManageUsersPage`**

Añadir, para usuarios con rol `estudiante`, un botón "Representante" que abre un pequeño modal: buscar representante existente por cédula (usar `listUsers(token,'representante')` + filtro) y vincular con `POST /auth/representante/:id/vincular {estudianteId}`, o crear uno nuevo con `createUser({role:'representante', representadoId})`. Mensaje de éxito.

- [ ] **Step 4: Verificar build**

Run: `cd "Frontend-Diagnostico-vocacional" && CI=true npx react-scripts build 2>&1 | grep -E "Compiled|Failed|TeacherDashboard|SeccionDetail|ManageUsers" | head -6`
Expected: `Compiled successfully.` sin warnings en archivos tocados.

- [ ] **Step 5: Commit**

```bash
git add Frontend-Diagnostico-vocacional/src/pages/docente/TeacherDashboard.jsx Frontend-Diagnostico-vocacional/src/pages/docente/SeccionDetailPage.jsx Frontend-Diagnostico-vocacional/src/pages/admin/ManageUsersPage.jsx
git commit -m "feat(asistencia): indicador de inasistencia en secciones + asignar representante desde gestión de usuarios"
```

---

## Task 11: Seeds — representante de prueba + asistencia sembrada

**Files:**
- Modify: `Backend-Diagnostico-vocacional/src/seeds/usuarios.seed.js`
- Modify: `Backend-Diagnostico-vocacional/src/seeds/academico.seed.js`

**Interfaces:**
- Consumes: modelos `User`, `Asistencia`.
- Produces: un representante `50000010`/`50000010` vinculado al estudiante principal; ~10 días de asistencia sembrados por sección.

- [ ] **Step 1: Sembrar un representante en `usuarios.seed.js`**

Tras crear los estudiantes, crear un representante vinculado al estudiante principal:
```js
  const repPwd = await bcrypt.hash('50000010', 10);
  const representante = await User.create({
    cedula: 50000010, password: repPwd, role: 'representante',
    name: 'Rosa', apellido: 'Representante', telefono: '04145000010',
    representados: [estudiantePrincipal._id, estudiantes[0]._id], // 2 representados
  });
  // ...devolver representante en el return
```
Añadir `representante` al objeto retornado.

- [ ] **Step 2: Sembrar asistencia en `academico.seed.js`**

Requerir `Asistencia` y `Configuracion`. Tras crear notas por sección, sembrar ~10 días hábiles de asistencia con algunas ausencias determinísticas:
```js
const Asistencia = require('../models/Asistencia');
// ...dentro del loop por sección, con estudianteIds:
const base = Date.UTC(2026, 0, 12); // lunes
for (let dia = 0; dia < 10; dia++) {
  const fecha = new Date(base + dia * 86400000);
  const registros = estudianteIds.map((id, i) => ({
    estudiante: id,
    // el 3er estudiante falta 4 días (para ver semáforo rojo), otros esporádico
    estado: (i === 2 && dia < 4) ? 'ausente' : (i === 1 && dia === 0) ? 'justificado' : 'presente',
  }));
  await Asistencia.create({ seccion: seccion._id, fecha, docente: docente._id, registros });
}
```
Y en `limpiar`, agregar `await Asistencia.deleteMany({});`.

- [ ] **Step 3: Limpiar Configuracion/Constancia en el seed maestro (opcional)**

En `academico.seed.js` `limpiar`, añadir limpieza de constancias si el modelo existe: `try { await require('../models/Constancia').deleteMany({}); } catch(e){}`.

- [ ] **Step 4: Ejecutar el seed y verificar**

Run:
```bash
cd "Backend-Diagnostico-vocacional" && node seed.js 2>&1 | tail -12
```
Expected: seeding completado; incluye el representante. Luego verificar login del representante:
```bash
node -e "const http=require('http');const d=JSON.stringify({cedula:50000010,password:'50000010'});const q=http.request({hostname:'localhost',port:5000,path:'/api/auth/login',method:'POST',headers:{'Content-Type':'application/json','Content-Length':Buffer.byteLength(d)}},r=>{let b='';r.on('data',c=>b+=c);r.on('end',()=>{const j=JSON.parse(b);console.log('Login representante:',r.statusCode,'| rol:',j.user?.role);});});q.write(d);q.end();"
```
Expected: `Login representante: 200 | rol: representante`.

- [ ] **Step 5: Commit**

```bash
git add Backend-Diagnostico-vocacional/src/seeds/usuarios.seed.js Backend-Diagnostico-vocacional/src/seeds/academico.seed.js
git commit -m "feat(seed): representante de prueba (50000010) y asistencia sembrada por sección"
```

---

## Task 12: Verificación integral, memoria y actualización de FLUJOS.md

**Files:**
- Modify: `FLUJOS.md`
- Modify: memoria del proyecto (fuera del repo).

- [ ] **Step 1: Verificación E2E integral por rol**

Correr un script que valide el flujo completo: superadmin cambia umbral → docente pasa lista → estudiante/representante ven el % → emitir constancia y verificar el código. (Reusar los scripts de las tareas anteriores encadenados.)

- [ ] **Step 2: Build final del frontend sin warnings propios**

Run: `cd "Frontend-Diagnostico-vocacional" && CI=true npx react-scripts build 2>&1 | grep -E "Compiled|Failed|^src\\\\" | head`
Expected: `Compiled successfully.` y ningún archivo nuevo/modificado en la lista de warnings.

- [ ] **Step 3: Actualizar `FLUJOS.md`**

Añadir a la guía: el rol Representante y su panel; el flujo de asistencia del docente; la emisión de constancias y la verificación por QR; las nuevas credenciales de prueba (representante `50000010`/`50000010`).

- [ ] **Step 4: Actualizar la memoria del proyecto**

Añadir una memoria `nucleo-academico-fase2` documentando: rol representante (modelo `representados`), asistencia (modelo, umbral en Configuracion, semáforo), constancias (código EDT-año-secuencia, QR → /verificar/:codigo), y que Configuracion ahora es backend (no localStorage).

- [ ] **Step 5: Commit y push**

```bash
git add FLUJOS.md
git commit -m "docs(flujos): representante, asistencia y constancias en la guía de uso"
git push
```

---

## Self-Review (cobertura del spec)

- Config persistente (§2.1) → Task 1, 2. ✅
- Campo conducta (§2.2) → Task 3. ✅
- Rol representante modelo/vínculo (§3.1-3.2) → Task 3. ✅
- Panel representante (§3.3) + endpoints (§3.4) → Task 5 (backend), Task 7 (frontend). ✅
- Ruteo/sidebar representante (§3.5) → Task 7. ✅
- Modelo/flujo/cálculo/endpoints asistencia (§4) → Task 4 (backend), Task 8 (frontend). ✅
- Semáforo inasistencia en paneles (§4.5) → Task 8, 10. ✅
- Modelo/código/tipos constancia (§5.1-5.3) → Task 6. ✅
- PDF con QR (§5.4) + verificación pública (§5.5) + endpoints (§5.6) → Task 6 (backend), Task 9 (frontend). ✅
- Emisión desde UI (§5.7) → Task 9, 10. ✅
- Criterios de aceptación (§10) → Task 12. ✅

**Nota de método:** el proyecto no tiene tests automatizados; cada tarea se verifica con E2E `node -e` (backend) o build CRA (frontend), consistente con toda la sesión. El backend local (nodemon) recarga solo tras cada cambio; si una verificación falla por "recién guardado", reintentar tras 2-3s.
