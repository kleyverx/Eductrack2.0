# Seguridad — Permisos, Minimización de PII y Endurecimiento — Plan de Implementación

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Corregir la fuga de PII de menores en la constancia pública, cerrar dos IDOR de docente (conducta y vinculación), y endurecer el backend (helmet + rate-limit en login + sanitización NoSQL nativa de Mongoose) sin romper lo desplegado.

**Architecture:** Cambios quirúrgicos en controllers/rutas Express existentes + `app.js`. La sanitización NoSQL usa Mongoose nativo (`strictQuery` global + `sanitizeFilter` en el login), NO `express-mongo-sanitize` (rompe en Express 5 por `req.query` de solo lectura). El código de constancia gana un sufijo aleatorio (`crypto.randomBytes`) como token de capacidad; la respuesta pública de verificación se minimiza (nombre parcial).

**Tech Stack:** Node/Express 5, Mongoose 8, `helmet`, `express-rate-limit`, `crypto` (nativo). Frontend React 19 (ajuste menor en la página pública).

## Global Constraints

- **Sin suite de tests automatizada.** Backend se verifica con `node -e` E2E contra el backend local (puerto 5000, nodemon). Frontend con `CI=true npx react-scripts build`.
- **Nunca commitear `.env`.** Verificar `git status --porcelain | grep -i "\.env"` vacío antes de cada commit.
- **Commits en español**, formato `fix:`/`feat:`/`chore:`. **NO añadir coautoría de Claude ni menciones a IA** en los mensajes de commit. Rama `dev-work-kleyver`.
- **NO usar `express-mongo-sanitize`** (incompatible con Express 5: `req.query` es getter de solo lectura → `TypeError`). Usar `mongoose.set('strictQuery', true)` + `.setOptions({ sanitizeFilter: true })`.
- **No romper lo desplegado:** roles existentes, login, constancias ya emitidas (códigos sin sufijo deben seguir verificándose), gestión académica, IA.
- **Backend local corriendo con nodemon** (recarga sola tras cada cambio); esperar ~3s antes de cada verificación E2E.
- Credenciales de prueba: superadmin `11111111`/`super123`, docente `40000000`/`docente123`, estudiante `22222222`/`estudiante123`, representante `50000010`/`50000010`.

---

## File Structure

**Backend (`Backend-Diagnostico-vocacional/src/`):**
- `app.js` — modificar (helmet, `mongoose.set('strictQuery', true)`).
- `routes/auth.routes.js` — modificar (rate-limit en `/login`).
- `controllers/auth.controller.js` — modificar (`login` cast+sanitizeFilter; `updateConducta`, `vincularRepresentado`, `desvincularRepresentado` con checks de propiedad).
- `controllers/constancia.controller.js` — modificar (`generarCodigo` con sufijo aleatorio; `verificar` minimizado).
- `package.json` — deps `helmet`, `express-rate-limit`.

**Frontend (`Frontend-Diagnostico-vocacional/src/`):**
- `pages/public/VerificarConstancia.jsx` — sin cambios de código obligatorios (ya muestra `data.estudiante`; el backend envía el valor minimizado). Se revisa en la Task 5.

---

## Task 1: Endurecimiento base (helmet + strictQuery + rate-limit en login)

**Files:**
- Modify: `Backend-Diagnostico-vocacional/package.json` (deps)
- Modify: `Backend-Diagnostico-vocacional/src/app.js`
- Modify: `Backend-Diagnostico-vocacional/src/routes/auth.routes.js`

**Interfaces:**
- Produces: middleware `helmet()` global; `mongoose.set('strictQuery', true)`; `loginLimiter` (rate-limit) aplicado a `POST /api/auth/login`.

- [ ] **Step 1: Instalar dependencias**

Run:
```bash
cd "Backend-Diagnostico-vocacional" && npm install helmet express-rate-limit
```
Expected: se añaden `helmet` y `express-rate-limit` a `dependencies`. (NO instalar `express-mongo-sanitize`.)

- [ ] **Step 2: Añadir helmet y strictQuery en `app.js`**

En `app.js`, el bloque de requires del inicio ya tiene `const express = require('express');` y `const mongoose = require('mongoose');`. Añadir tras los requires de librerías:
```js
const helmet = require('helmet');
```
Después de `const app = express();`, y ANTES de `app.use(express.json());`, añadir:
```js
app.disable('x-powered-by');
app.use(helmet());
```
Y justo antes de `mongoose.connect(...)` (cerca del final), añadir:
```js
mongoose.set('strictQuery', true);
```
(helmet no activa `crossOriginEmbedderPolicy` por defecto, así que no rompe el CORS ya configurado.)

- [ ] **Step 3: Añadir el rate-limit al login en `auth.routes.js`**

Al inicio de `auth.routes.js`, tras los requires existentes, añadir:
```js
const rateLimit = require('express-rate-limit');

// Frena fuerza bruta contra el login: 10 intentos por IP cada 15 min.
const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10,
    standardHeaders: true,
    legacyHeaders: false,
    message: { msg: 'Demasiados intentos de inicio de sesión. Intenta de nuevo en unos minutos.' },
});
```
Localizar la ruta de login existente `router.post('/login', login);` y cambiarla por:
```js
router.post('/login', loginLimiter, login);
```

- [ ] **Step 4: Verificar E2E (helmet + login sigue vivo)**

Run (espera ~3s tras guardar):
```bash
cd "Backend-Diagnostico-vocacional" && node -e "
const http=require('http');
function req(method,path,body){return new Promise(rr=>{const d=body?JSON.stringify(body):null;const h={'Content-Type':'application/json'};if(d)h['Content-Length']=Buffer.byteLength(d);const q=http.request({hostname:'localhost',port:5000,path,method,headers:h},res=>{let b='';res.on('data',c=>b+=c);res.on('end',()=>rr({s:res.statusCode,headers:res.headers,d:(()=>{try{return JSON.parse(b)}catch(e){return b.slice(0,80)}})()}));});if(d)q.write(d);q.end();});}
(async()=>{
 const lo=await req('POST','/api/auth/login',{cedula:11111111,password:'super123'});
 console.log('Login superadmin:',lo.s,'| tiene token:',!!lo.d.token);
 console.log('Cabecera helmet (x-dns-prefetch-control):',lo.headers['x-dns-prefetch-control'] || '(ausente)');
 console.log('x-powered-by (esperado ausente):',lo.headers['x-powered-by'] || 'ausente');
})();"
```
Expected: `Login superadmin: 200 | tiene token: true`, la cabecera `x-dns-prefetch-control` presente (helmet activo), `x-powered-by: ausente`.

- [ ] **Step 5: Commit**

```bash
git add Backend-Diagnostico-vocacional/package.json Backend-Diagnostico-vocacional/package-lock.json Backend-Diagnostico-vocacional/src/app.js Backend-Diagnostico-vocacional/src/routes/auth.routes.js
git commit -m "feat(seguridad): helmet, strictQuery global y rate-limit en el login"
```

---

## Task 2: Sanitización NoSQL en el login (cast de cédula + sanitizeFilter)

**Files:**
- Modify: `Backend-Diagnostico-vocacional/src/controllers/auth.controller.js` (función `login`, líneas ~31-55)

**Interfaces:**
- Consumes: nada nuevo.
- Produces: `login` rechaza cédulas no numéricas (400) y neutraliza operadores NoSQL en el filtro.

- [ ] **Step 1: Endurecer `login`**

Reemplazar el cuerpo actual de `exports.login` (que empieza con `const { cedula, password } = req.body;` y hace `const user = await User.findOne({ cedula });`) por:
```js
exports.login = async (req, res) => {
    const { cedula, password } = req.body;

    try {
        // Castear la cédula a número: bloquea inyección NoSQL (ej. { $gt: '' })
        // y garantiza que el filtro sea un valor escalar.
        const cedulaNum = Number(cedula);
        if (!Number.isFinite(cedulaNum)) {
            return res.status(400).json({ msg: 'Cédula inválida' });
        }

        // sanitizeFilter envuelve el valor en $eq como defensa en profundidad.
        const user = await User.findOne({ cedula: cedulaNum }).setOptions({ sanitizeFilter: true });
        if (!user) return res.status(400).json({ msg: 'Usuario no encontrado' });

        const valid = await bcrypt.compare(String(password ?? ''), user.password);
        if (!valid) return res.status(400).json({ msg: 'Contraseña incorrecta' });

        const token = jwt.sign(
            { id: user._id, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: '2d' }
        );

        res.json({
            token,
            user: { id: user._id, cedula: user.cedula, role: user.role, name: user.name }
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ msg: 'Error del servidor' });
    }
};
```

- [ ] **Step 2: Verificar E2E (login normal OK, inyección bloqueada)**

Run (espera ~3s):
```bash
cd "Backend-Diagnostico-vocacional" && node -e "
const http=require('http');
function req(method,path,body){return new Promise(rr=>{const d=body?JSON.stringify(body):null;const h={'Content-Type':'application/json'};if(d)h['Content-Length']=Buffer.byteLength(d);const q=http.request({hostname:'localhost',port:5000,path,method,headers:h},res=>{let b='';res.on('data',c=>b+=c);res.on('end',()=>{try{rr({s:res.statusCode,d:JSON.parse(b)})}catch(e){rr({s:res.statusCode,raw:b.slice(0,80)})}});});if(d)q.write(d);q.end();});}
(async()=>{
 const ok=await req('POST','/api/auth/login',{cedula:11111111,password:'super123'});
 console.log('Login normal:',ok.s,'| token:',!!ok.d.token);
 const inj=await req('POST','/api/auth/login',{cedula:{'\$gt':''},password:'x'});
 console.log('Inyección NoSQL (esperado 400, sin token):',inj.s,'| token:',!!inj.d.token);
 const bad=await req('POST','/api/auth/login',{cedula:'abc',password:'x'});
 console.log('Cédula no numérica (esperado 400):',bad.s);
})();"
```
Expected: `Login normal: 200 | token: true`, `Inyección NoSQL (esperado 400, sin token): 400 | token: false`, `Cédula no numérica (esperado 400): 400`.

- [ ] **Step 3: Commit**

```bash
git add Backend-Diagnostico-vocacional/src/controllers/auth.controller.js
git commit -m "fix(seguridad): login castea la cédula y aplica sanitizeFilter (anti-inyección NoSQL)"
```

---

## Task 3: Cerrar IDOR de conducta y de vinculación (checks de propiedad del docente)

**Files:**
- Modify: `Backend-Diagnostico-vocacional/src/controllers/auth.controller.js` (`vincularRepresentado`, `desvincularRepresentado`, `updateConducta`)

**Interfaces:**
- Consumes: modelo `Seccion` (ya importado como `User`; verificar/añadir require de `Seccion`).
- Produces: los tres endpoints rechazan (403) cuando un docente opera sobre un estudiante que no está en sus secciones; `updateConducta` valida rol destino y longitud.

- [ ] **Step 1: Asegurar el require de `Seccion` en `auth.controller.js`**

Al inicio de `auth.controller.js`, junto a `const User = require('../models/user');`, verificar que exista `const Seccion = require('../models/Seccion');`. Si no está, añadirlo.

- [ ] **Step 2: Añadir un helper de propiedad y endurecer `updateConducta`**

Reemplazar `exports.updateConducta` actual por:
```js
// ¿El estudiante :id pertenece a alguna sección del docente?
async function docenteTieneAlEstudiante(docenteId, estudianteId) {
    return !!(await Seccion.findOne({ docente: docenteId, estudiantes: estudianteId }));
}

// Actualiza la conducta de un estudiante (docente: solo los suyos; superadmin: cualquiera).
exports.updateConducta = async (req, res) => {
    try {
        let { conducta } = req.body;
        if (typeof conducta !== 'string' || !conducta.trim()) {
            return res.status(400).json({ msg: 'Conducta inválida' });
        }
        conducta = conducta.trim().slice(0, 200); // límite defensivo

        const objetivo = await User.findById(req.params.id).select('role');
        if (!objetivo) return res.status(404).json({ msg: 'Usuario no encontrado' });
        if (objetivo.role !== 'estudiante') {
            return res.status(403).json({ msg: 'La conducta solo aplica a estudiantes' });
        }
        if (req.user.role === 'docente' && !(await docenteTieneAlEstudiante(req.user.id, req.params.id))) {
            return res.status(403).json({ msg: 'Ese estudiante no pertenece a tus secciones' });
        }

        const u = await User.findByIdAndUpdate(req.params.id, { conducta }, { new: true }).select('-password');
        res.json({ msg: 'Conducta actualizada', user: u });
    } catch (err) { console.error(err); res.status(500).json({ msg: 'Error al actualizar conducta' }); }
};
```

- [ ] **Step 3: Endurecer `vincularRepresentado` y `desvincularRepresentado`**

Reemplazar ambas funciones por:
```js
// Vincula un estudiante a un representante (docente: solo estudiantes suyos; superadmin: cualquiera).
exports.vincularRepresentado = async (req, res) => {
    try {
        const { estudianteId } = req.body;
        const rep = await User.findById(req.params.id);
        if (!rep || rep.role !== 'representante') return res.status(404).json({ msg: 'Representante no encontrado' });
        const est = await User.findOne({ _id: estudianteId, role: 'estudiante' });
        if (!est) return res.status(404).json({ msg: 'Estudiante no encontrado' });
        if (req.user.role === 'docente' && !(await docenteTieneAlEstudiante(req.user.id, est._id))) {
            return res.status(403).json({ msg: 'Ese estudiante no pertenece a tus secciones' });
        }
        await User.updateOne({ _id: rep._id }, { $addToSet: { representados: est._id } });
        res.json({ msg: 'Representado vinculado' });
    } catch (err) { console.error(err); res.status(500).json({ msg: 'Error al vincular' }); }
};

// Desvincula un estudiante de un representante (docente: solo estudiantes suyos; superadmin: cualquiera).
exports.desvincularRepresentado = async (req, res) => {
    try {
        if (req.user.role === 'docente' && !(await docenteTieneAlEstudiante(req.user.id, req.params.estudianteId))) {
            return res.status(403).json({ msg: 'Ese estudiante no pertenece a tus secciones' });
        }
        await User.updateOne({ _id: req.params.id }, { $pull: { representados: req.params.estudianteId } });
        res.json({ msg: 'Representado desvinculado' });
    } catch (err) { console.error(err); res.status(500).json({ msg: 'Error al desvincular' }); }
};
```
(El helper `docenteTieneAlEstudiante` se define una sola vez, en el Step 2. Colocarlo antes de las tres funciones que lo usan.)

- [ ] **Step 4: Verificar E2E (docente NO puede tocar estudiante ajeno)**

Run (espera ~3s). El seed asocia al docente `40000000` con sus secciones; buscamos un estudiante que NO sea suyo. Si todos los estudiantes del seed están en secciones de ese docente, el test crea un estudiante nuevo (no asignado) para probar el 403.
```bash
cd "Backend-Diagnostico-vocacional" && node -e "
const http=require('http');
function login(c,p){return new Promise(r=>{const d=JSON.stringify({cedula:c,password:p});const q=http.request({hostname:'localhost',port:5000,path:'/api/auth/login',method:'POST',headers:{'Content-Type':'application/json','Content-Length':Buffer.byteLength(d)}},res=>{let b='';res.on('data',x=>b+=x);res.on('end',()=>r(JSON.parse(b)));});q.write(d);q.end();});}
function req(method,path,body,token){return new Promise(rr=>{const d=body?JSON.stringify(body):null;const h={'Content-Type':'application/json'};if(d)h['Content-Length']=Buffer.byteLength(d);if(token)h.Authorization='Bearer '+token;const q=http.request({hostname:'localhost',port:5000,path,method,headers:h},res=>{let b='';res.on('data',c=>b+=c);res.on('end',()=>{try{rr({s:res.statusCode,d:JSON.parse(b)})}catch(e){rr({s:res.statusCode,raw:b.slice(0,100)})}});});if(d)q.write(d);q.end();});}
(async()=>{const sa=await login(11111111,'super123'); const doc=await login(40000000,'docente123');
 // Crear un estudiante nuevo NO asignado a ninguna sección
 const cre=await req('POST','/api/auth/users',{name:'Ajeno',apellido:'Test',cedula:70000001,role:'estudiante'},sa.token);
 const ajenoId=cre.d.user?._id;
 // Docente intenta cambiarle la conducta -> 403
 const cond=await req('PUT','/api/auth/user/'+ajenoId+'/conducta',{conducta:'Prueba'},doc.token);
 console.log('Docente conducta a estudiante ajeno (esperado 403):',cond.s);
 // Superadmin sí puede -> 200
 const condSa=await req('PUT','/api/auth/user/'+ajenoId+'/conducta',{conducta:'Satisfactoria'},sa.token);
 console.log('Superadmin conducta (esperado 200):',condSa.s);
 // Conducta a un no-estudiante (el propio docente) -> 403
 const docId=(await req('GET','/api/auth/users?role=docente',null,sa.token)).d[0]._id;
 const condDoc=await req('PUT','/api/auth/user/'+docId+'/conducta',{conducta:'X'},sa.token);
 console.log('Conducta a un docente (esperado 403):',condDoc.s);
 // limpiar
 if(ajenoId) await req('DELETE','/api/auth/user/'+ajenoId,null,sa.token);
})();"
```
Expected: `Docente conducta a estudiante ajeno (esperado 403): 403`, `Superadmin conducta (esperado 200): 200`, `Conducta a un docente (esperado 403): 403`.

- [ ] **Step 5: Commit**

```bash
git add Backend-Diagnostico-vocacional/src/controllers/auth.controller.js
git commit -m "fix(seguridad): checks de propiedad del docente en conducta y vinculación de representados (IDOR)"
```

---

## Task 4: Código de constancia no adivinable + verificación minimizada

**Files:**
- Modify: `Backend-Diagnostico-vocacional/src/controllers/constancia.controller.js` (`generarCodigo`, `verificar`)

**Interfaces:**
- Consumes: `crypto` (nativo de Node).
- Produces: `generarCodigo()` devuelve `EDT-{año}-{secuencia6}-{sufijo}` (sufijo = 8 hex aleatorios); `verificar` devuelve nombre **minimizado** (inicial del nombre + primer apellido) y sigue resolviendo códigos viejos sin sufijo.

- [ ] **Step 1: Añadir require de `crypto` y sufijo aleatorio en `generarCodigo`**

Al inicio de `constancia.controller.js`, tras los requires existentes, añadir:
```js
const crypto = require('crypto');
```
Reemplazar `generarCodigo` por:
```js
/** Genera un código EDT-{año}-{secuencia6}-{sufijo aleatorio no adivinable}. */
async function generarCodigo() {
    const anio = new Date().getUTCFullYear();
    const desde = new Date(Date.UTC(anio, 0, 1));
    const n = await Constancia.countDocuments({ createdAt: { $gte: desde } });
    const sufijo = crypto.randomBytes(4).toString('hex').toUpperCase(); // 8 chars, ~4300M combinaciones
    return `EDT-${anio}-${String(n + 1).padStart(6, '0')}-${sufijo}`;
}
```

- [ ] **Step 2: Minimizar la respuesta pública en `verificar`**

Reemplazar `exports.verificar` por:
```js
// Nombre minimizado para la verificación pública: "J. Pérez" (no doxear al menor).
function nombreMinimizado(nombreCompleto) {
    if (!nombreCompleto || typeof nombreCompleto !== 'string') return '—';
    const partes = nombreCompleto.trim().split(/\s+/);
    if (partes.length === 1) return partes[0][0].toUpperCase() + '.';
    // datos.estudiante.nombre viene como "Apellido Nombre" -> mostramos "N. Apellido"
    const apellido = partes[0];
    const nombre = partes[partes.length - 1];
    return `${nombre[0].toUpperCase()}. ${apellido}`;
}

// Público: verificar autenticidad (respuesta minimizada, sin nombre completo).
exports.verificar = async (req, res) => {
    try {
        const c = await Constancia.findOne({ codigo: req.params.codigo }).populate('estudiante', 'name apellido').lean();
        if (!c) return res.status(404).json({ valida: false, msg: 'Constancia no encontrada' });
        const TIPO_LABEL = { estudios: 'Constancia de Estudios', conducta: 'Constancia de Buena Conducta', rendimiento: 'Resumen Final de Rendimiento', 'con-representante': 'Constancia de Estudios (con representante)' };
        const nombreCompleto = c.datos?.estudiante?.nombre
            || (c.estudiante ? `${c.estudiante.apellido || ''} ${c.estudiante.name}`.trim() : '');
        const etiqueta = nombreCompleto
            ? nombreMinimizado(nombreCompleto)
            : (c.datos?.seccion ? `Sección ${c.datos.seccion.etiquetaAnio || ''} ${c.datos.seccion.nombre || ''}`.trim() : '—');
        res.json({
            valida: true,
            tipo: TIPO_LABEL[c.tipo] || c.tipo,
            estudiante: etiqueta,
            institucion: c.datos?.institucion || 'EduTrack Insight',
            fecha: c.createdAt,
        });
    } catch (err) { console.error(err); res.status(500).json({ msg: 'Error al verificar' }); }
};
```

- [ ] **Step 3: Verificar E2E (código con sufijo, verificación minimizada, código viejo aún resuelve, enumeración falla)**

Run (espera ~3s):
```bash
cd "Backend-Diagnostico-vocacional" && node -e "
const http=require('http');
function login(c,p){return new Promise(r=>{const d=JSON.stringify({cedula:c,password:p});const q=http.request({hostname:'localhost',port:5000,path:'/api/auth/login',method:'POST',headers:{'Content-Type':'application/json','Content-Length':Buffer.byteLength(d)}},res=>{let b='';res.on('data',x=>b+=x);res.on('end',()=>r(JSON.parse(b)));});q.write(d);q.end();});}
function req(method,path,body,token){return new Promise(rr=>{const d=body?JSON.stringify(body):null;const h={'Content-Type':'application/json'};if(d)h['Content-Length']=Buffer.byteLength(d);if(token)h.Authorization='Bearer '+token;const q=http.request({hostname:'localhost',port:5000,path,method,headers:h},res=>{let b='';res.on('data',c=>b+=c);res.on('end',()=>{try{rr({s:res.statusCode,d:JSON.parse(b)})}catch(e){rr({s:res.statusCode,raw:b.slice(0,120)})}});});if(d)q.write(d);q.end();});}
(async()=>{const doc=await login(40000000,'docente123');
 const sec=(await req('GET','/api/academico/secciones',null,doc.token)).d.find(s=>(s.totalEstudiantes||0)>0)||(await req('GET','/api/academico/secciones',null,doc.token)).d[0];
 const secDet=await req('GET','/api/academico/secciones/'+sec._id,null,doc.token);
 const est=secDet.d.seccion.estudiantes[0];
 const emi=await req('POST','/api/constancias',{tipo:'estudios',estudianteId:est._id},doc.token);
 console.log('Código emitido:',emi.d.codigo,'| formato con sufijo:',/^EDT-\d{4}-\d{6}-[0-9A-F]{8}\$/.test(emi.d.codigo||''));
 const ver=await req('GET','/api/constancias/verificar/'+encodeURIComponent(emi.d.codigo),null,null);
 console.log('Verificar (público):',ver.s,'| válida:',ver.d.valida,'| estudiante minimizado:',JSON.stringify(ver.d.estudiante));
 // Intentar adivinar solo el correlativo sin el sufijo -> 404
 const correlativo=(emi.d.codigo||'').split('-').slice(0,3).join('-');
 const enun=await req('GET','/api/constancias/verificar/'+correlativo,null,null);
 console.log('Enumerar sin sufijo (esperado 404):',enun.s);
})();"
```
Expected: `Código emitido: EDT-2026-0000XX-XXXXXXXX | formato con sufijo: true`, `Verificar (público): 200 | válida: true | estudiante minimizado: "X. Apellido"` (sin nombre completo), `Enumerar sin sufijo (esperado 404): 404`.

- [ ] **Step 4: Commit**

```bash
git add Backend-Diagnostico-vocacional/src/controllers/constancia.controller.js
git commit -m "fix(seguridad): código de constancia con sufijo aleatorio y verificación pública minimizada (anti-enumeración de PII)"
```

---

## Task 5: Verificación integral + frontend build

**Files:**
- Review: `Frontend-Diagnostico-vocacional/src/pages/public/VerificarConstancia.jsx` (sin cambios esperados; la etiqueta ya usa `data.estudiante`)
- Review: `Frontend-Diagnostico-vocacional/src/utils/constanciasPDF.js` (el QR usa `resp.codigo`, que ya trae el sufijo — funciona sin cambios)

**Interfaces:**
- Consumes: los endpoints modificados en Tasks 1-4.

- [ ] **Step 1: Confirmar que el frontend no necesita cambios**

La página pública muestra `<Fila label="Estudiante" value={data.estudiante} />` y `<Fila label="Código" value={codigo} />`. Con el backend enviando el nombre minimizado y el `codigo` con sufijo en la URL, no hace falta tocar el JSX. Verificar leyendo el archivo que efectivamente usa `data.estudiante` (no reconstruye el nombre por su cuenta).

- [ ] **Step 2: Build del frontend**

Run: `cd "Frontend-Diagnostico-vocacional" && CI=true npx react-scripts build 2>&1 | grep -E "Compiled|Failed" | head -3`
Expected: `Compiled successfully.` (no se tocó código de frontend; solo confirma que nada quedó roto).

- [ ] **Step 3: E2E integral de regresión (todo lo anterior sigue vivo)**

Run (espera ~3s):
```bash
cd "Backend-Diagnostico-vocacional" && node -e "
const http=require('http');
function login(c,p){return new Promise(r=>{const d=JSON.stringify({cedula:c,password:p});const q=http.request({hostname:'localhost',port:5000,path:'/api/auth/login',method:'POST',headers:{'Content-Type':'application/json','Content-Length':Buffer.byteLength(d)}},res=>{let b='';res.on('data',x=>b+=x);res.on('end',()=>r(JSON.parse(b)));});q.write(d);q.end();});}
(async()=>{
 const sa=await login(11111111,'super123'); console.log('superadmin:',!!sa.token);
 const doc=await login(40000000,'docente123'); console.log('docente:',!!doc.token);
 const est=await login(22222222,'estudiante123'); console.log('estudiante:',!!est.token);
 const rep=await login(50000010,'50000010'); console.log('representante:',!!rep.token);
})();"
```
Expected: los 4 logins devuelven `true` (los roles existentes siguen funcionando tras el endurecimiento).

- [ ] **Step 4: Commit (si hubo algún ajuste de frontend) y push**

Si no hubo cambios de frontend, no hay nada que commitear en este paso. Empujar la rama:
```bash
git push origin dev-work-kleyver
```

---

## Self-Review (cobertura del spec)

- §2.1 PII enumerable (código no adivinable + respuesta minimizada) → Task 4. ✅
- §2.2 IDOR conducta (propiedad + rol + longitud) → Task 3. ✅
- §2.3 IDOR vincular/desvincular → Task 3. ✅
- §3.1 helmet → Task 1. ✅
- §3.2 rate-limit login → Task 1. ✅
- §3.3 sanitización NoSQL (strictQuery global + sanitizeFilter en login + cast cédula) → Task 1 (strictQuery) + Task 2 (login). ✅
- Compatibilidad constancias viejas → Task 4 (verificar busca por `codigo` exacto, funciona para códigos con y sin sufijo). ✅
- No usar express-mongo-sanitize → respetado (Global Constraints + Task 1 Step 1). ✅

**Nota de método:** el proyecto no tiene tests automatizados; cada tarea se verifica con E2E `node -e` (backend) o build CRA (frontend), consistente con la Fase 2.
