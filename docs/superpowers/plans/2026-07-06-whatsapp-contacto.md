# WhatsApp + Contacto del Representante — Plan de Implementación

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Botones de WhatsApp (`wa.me`) para comunicación docente↔representante con mensajes pre-armados, y captura/edición del teléfono y email del representante — todo con helper de frontend, sin API de pago.

**Architecture:** El mensaje de WhatsApp se arma 100% en el frontend (`utils/whatsapp.js`) y se abre con `window.open`. Un endpoint nuevo da al docente los teléfonos de representante(s)/estudiante por sección. El detalle del representante ya trae al docente (se le añade el teléfono). La captura de contacto reusa `createUser` (ya acepta telefono/email) y un endpoint de contacto para editar.

**Tech Stack:** React 19 (CRA), Express 5, Mongoose 8. Sin dependencias nuevas.

## Global Constraints

- **Sin suite de tests automatizada.** Backend: `node -e` E2E (puerto 5000, nodemon). Frontend: `CI=true npx react-scripts build`.
- **Nunca commitear `.env`.** Verificar `git status --porcelain | grep -i "\.env"` vacío antes de cada commit.
- **Commits en español** (`feat:`/`fix:`). **NO añadir coautoría de Claude ni menciones a IA.** Rama `dev-work-kleyver`.
- **Estilo Quiet Academic:** fondo `bg-slate-50 dark:bg-slate-950`; tarjetas `bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800`; acento `indigo-600`; siempre variantes `dark:` + `transition-colors duration-300`.
- **No enviar datos académicos por WhatsApp** (la plantilla "notas listas" solo avisa, no incluye la nota).
- **Normalización de teléfono VE:** quitar espacios/guiones/`+`; si empieza con `58` dejarlo; si empieza con `0` reemplazar por `58`; si son 10 dígitos empezando por `4` anteponer `58`; si no es válido, `null`.
- **DEPENDE del plan de seguridad:** este plan debe ejecutarse DESPUÉS de `2026-07-07-seguridad-permisos-hardening.md` (que cambia el código de constancia y endurece permisos). No hay conflicto directo, pero el orden evita re-trabajo.
- `REACT_APP_API_URL` ya incluye `/api`. Token vía `const { token } = useContext(AuthContext)`.

---

## File Structure

**Frontend (`Frontend-Diagnostico-vocacional/src/`):**
- `utils/whatsapp.js` — **nuevo** (normalización + plantillas + abrir WA).
- `api/academico.js` — modificar (+`getRepresentantesSeccion`).
- `api/user.js` — modificar (+`actualizarContacto`).
- `pages/docente/SeccionDetailPage.jsx` — modificar (botón WhatsApp + menú contacto/plantilla por estudiante).
- `pages/representante/RepresentanteDashboard.jsx` — modificar (botón "Contactar docente por WhatsApp").
- `pages/admin/ManageUsersPage.jsx` — modificar (teléfono/email al crear representante + editar contacto).

**Backend (`Backend-Diagnostico-vocacional/src/`):**
- `controllers/academico.controller.js` — modificar (+`getRepresentantesSeccion`).
- `routes/academico.routes.js` — modificar (+ruta).
- `controllers/representante.controller.js` — modificar (populate docente con `telefono`).
- `controllers/auth.controller.js` — modificar (+`updateContacto`).
- `routes/auth.routes.js` — modificar (+ruta contacto).

---

## Task 1: Helper `utils/whatsapp.js` (normalización + plantillas)

**Files:**
- Create: `Frontend-Diagnostico-vocacional/src/utils/whatsapp.js`

**Interfaces:**
- Produces: `normalizarTelefonoVE(tel)→string|null`, `abrirWhatsApp(tel, mensaje)→boolean`, y 5 funciones de plantilla.

- [ ] **Step 1: Crear el helper**

```js
// Comunicación por WhatsApp vía wa.me (sin API de pago). El mensaje se abre
// pre-escrito y el usuario puede editarlo antes de enviar.

/** Normaliza un teléfono venezolano a dígitos con prefijo 58, o null si inválido. */
export function normalizarTelefonoVE(tel) {
  if (!tel || typeof tel !== 'string') return null;
  let d = tel.replace(/[\s\-()]/g, '').replace(/^\+/, '');
  if (/^58\d{10}$/.test(d)) return d;              // ya tiene prefijo país
  if (/^0\d{10}$/.test(d)) return '58' + d.slice(1); // 0414... -> 58414...
  if (/^4\d{9}$/.test(d)) return '58' + d;          // 414... -> 58414...
  return null;
}

/** Abre WhatsApp con el mensaje pre-armado. Devuelve false si el teléfono es inválido. */
export function abrirWhatsApp(tel, mensaje) {
  const n = normalizarTelefonoVE(tel);
  if (!n) return false;
  const url = `https://wa.me/${n}?text=${encodeURIComponent(mensaje)}`;
  window.open(url, '_blank', 'noopener');
  return true;
}

// --- Plantillas docente -> representante ---
export const plantillaInasistencia = ({ estudiante, seccion, pct, docente, institucion }) =>
  `Estimado(a) representante, le informo que el/la estudiante ${estudiante} presenta ${pct}% de inasistencia en ${seccion}. Agradezco comunicarse conmigo. — Prof. ${docente}, ${institucion}`;

export const plantillaNotasListas = ({ estudiante, lapso, docente, institucion }) =>
  `Estimado(a) representante, le informo que ya están disponibles las calificaciones de ${estudiante} correspondientes al ${lapso}. Puede consultarlas en la plataforma EduTrack. — Prof. ${docente}, ${institucion}`;

export const plantillaCitacion = ({ estudiante, docente, institucion }) =>
  `Estimado(a) representante, le solicito una reunión respecto a ${estudiante}. Quedo atento(a) para coordinar día y hora. — Prof. ${docente}, ${institucion}`;

export const plantillaPersonalizada = ({ estudiante }) =>
  `Estimado(a) representante de ${estudiante}, `;

// --- Plantilla representante -> docente ---
export const plantillaRepresentanteADocente = ({ estudiante, docenteNombre }) =>
  `Estimado(a) Prof. ${docenteNombre}, soy representante de ${estudiante} y quisiera consultarle sobre `;
```

- [ ] **Step 2: Verificar build (el helper compila y no rompe nada)**

Run: `cd "Frontend-Diagnostico-vocacional" && CI=true npx react-scripts build 2>&1 | grep -E "Compiled|Failed|whatsapp" | head -3`
Expected: `Compiled successfully.` (el helper aún no se importa; solo confirma que compila).

- [ ] **Step 3: Commit**

```bash
git add Frontend-Diagnostico-vocacional/src/utils/whatsapp.js
git commit -m "feat(whatsapp): helper de normalización de teléfono VE y plantillas de mensaje"
```

---

## Task 2: Endpoint de representantes/teléfonos por sección (backend)

**Files:**
- Modify: `Backend-Diagnostico-vocacional/src/controllers/academico.controller.js`
- Modify: `Backend-Diagnostico-vocacional/src/routes/academico.routes.js`

**Interfaces:**
- Consumes: `_getSeccionPropia`, modelos `User`/`Seccion`.
- Produces: `GET /api/academico/secciones/:id/contactos` (docente) → `{ representantes: { [estudianteId]: [{_id,name,apellido,telefono}] }, estudiantes: { [estudianteId]: telefono } }`.

- [ ] **Step 1: Añadir el controlador `getContactosSeccion`**

En `academico.controller.js`, al final del archivo (junto a `exports._getSeccionPropia`), añadir:
```js
// Contactos por estudiante de una sección (para WhatsApp del docente): representantes con teléfono + teléfono del estudiante.
exports.getContactosSeccion = async (req, res) => {
    try {
        const { seccion, error } = await getSeccionPropia(req.params.id, req.user.id);
        if (error) return res.status(error.status).json({ msg: error.msg });
        await seccion.populate('estudiantes', 'name apellido cedula telefono');
        const estIds = seccion.estudiantes.map(e => e._id);
        // Representantes que representan a alguno de estos estudiantes (1 consulta).
        const reps = await User.find({ role: 'representante', representados: { $in: estIds } })
            .select('name apellido telefono representados').lean();
        const representantes = {};
        estIds.forEach(id => { representantes[String(id)] = []; });
        reps.forEach(r => {
            (r.representados || []).forEach(estId => {
                const k = String(estId);
                if (representantes[k]) representantes[k].push({ _id: r._id, name: r.name, apellido: r.apellido, telefono: r.telefono || null });
            });
        });
        const estudiantes = {};
        seccion.estudiantes.forEach(e => { estudiantes[String(e._id)] = e.telefono || null; });
        res.json({ representantes, estudiantes });
    } catch (err) { console.error(err); res.status(500).json({ msg: 'Error al obtener contactos' }); }
};
```
(Usa `getSeccionPropia` y `User`/`Seccion` que ya están en el módulo.)

- [ ] **Step 2: Registrar la ruta**

En `academico.routes.js`, junto a las rutas de docente (usa el import `c`), añadir:
```js
router.get('/secciones/:id/contactos', auth(['docente']), c.getContactosSeccion);
```

- [ ] **Step 3: Verificar E2E**

Run (espera ~3s):
```bash
cd "Backend-Diagnostico-vocacional" && node -e "
const http=require('http');
function login(c,p){return new Promise(r=>{const d=JSON.stringify({cedula:c,password:p});const q=http.request({hostname:'localhost',port:5000,path:'/api/auth/login',method:'POST',headers:{'Content-Type':'application/json','Content-Length':Buffer.byteLength(d)}},res=>{let b='';res.on('data',x=>b+=x);res.on('end',()=>r(JSON.parse(b)));});q.write(d);q.end();});}
function req(m,p,b,t){return new Promise(rr=>{const d=b?JSON.stringify(b):null;const h={'Content-Type':'application/json'};if(d)h['Content-Length']=Buffer.byteLength(d);if(t)h.Authorization='Bearer '+t;const q=http.request({hostname:'localhost',port:5000,path:p,method:m,headers:h},res=>{let bb='';res.on('data',c=>bb+=c);res.on('end',()=>{try{rr({s:res.statusCode,d:JSON.parse(bb)})}catch(e){rr({s:res.statusCode})}});});if(d)q.write(d);q.end();});}
(async()=>{const doc=await login(40000000,'docente123');
 const sec=(await req('GET','/api/academico/secciones',null,doc.token)).d[0];
 const con=await req('GET','/api/academico/secciones/'+sec._id+'/contactos',null,doc.token);
 console.log('Contactos:',con.s,'| estudiantes con clave:',Object.keys(con.d.estudiantes||{}).length,'| representantes con clave:',Object.keys(con.d.representantes||{}).length);
 const alguno=Object.values(con.d.representantes||{}).find(a=>a.length>0);
 console.log('¿Algún estudiante con representante?:',!!alguno, alguno?('1er rep tel: '+alguno[0].telefono):'');
})();"
```
Expected: `Contactos: 200 | estudiantes con clave: N | representantes con clave: N`. El estudiante principal (22222222) tiene al representante `50000010` (tel `04145000010`), así que debería aparecer al menos uno con representante.

- [ ] **Step 4: Commit**

```bash
git add Backend-Diagnostico-vocacional/src/controllers/academico.controller.js Backend-Diagnostico-vocacional/src/routes/academico.routes.js
git commit -m "feat(whatsapp): endpoint de contactos por sección (representantes y teléfonos) para el docente"
```

---

## Task 3: Teléfono del docente en el detalle del representante (backend)

**Files:**
- Modify: `Backend-Diagnostico-vocacional/src/controllers/representante.controller.js:25`

**Interfaces:**
- Produces: `grupos[].seccion.docente` incluye `telefono`.

- [ ] **Step 1: Añadir `telefono` al populate del docente**

En `representante.controller.js`, línea 25, cambiar:
```js
    const secciones = await Seccion.find({ estudiantes: estudianteId }).populate('docente', 'name apellido').lean();
```
por:
```js
    const secciones = await Seccion.find({ estudiantes: estudianteId }).populate('docente', 'name apellido telefono').lean();
```

- [ ] **Step 2: Verificar E2E**

Run (espera ~3s):
```bash
cd "Backend-Diagnostico-vocacional" && node -e "
const http=require('http');
function login(c,p){return new Promise(r=>{const d=JSON.stringify({cedula:c,password:p});const q=http.request({hostname:'localhost',port:5000,path:'/api/auth/login',method:'POST',headers:{'Content-Type':'application/json','Content-Length':Buffer.byteLength(d)}},res=>{let b='';res.on('data',x=>b+=x);res.on('end',()=>r(JSON.parse(b)));});q.write(d);q.end();});}
function req(m,p,b,t){return new Promise(rr=>{const h={};if(t)h.Authorization='Bearer '+t;const q=http.request({hostname:'localhost',port:5000,path:p,method:m,headers:h},res=>{let bb='';res.on('data',c=>bb+=c);res.on('end',()=>{try{rr({s:res.statusCode,d:JSON.parse(bb)})}catch(e){rr({s:res.statusCode})}});});q.end();});}
(async()=>{const rep=await login(50000010,'50000010');
 const mis=await req('GET','/api/representante/mis-representados',null,rep.token);
 const det=await req('GET','/api/representante/representado/'+mis.d[0]._id,null,rep.token);
 const doc=det.d.grupos?.[0]?.seccion?.docente;
 console.log('Docente en detalle:',doc?.name,'| tiene campo telefono:', 'telefono' in (doc||{}), '| valor:', doc?.telefono);
})();"
```
Expected: `Docente en detalle: <nombre> | tiene campo telefono: true | valor: <tel o undefined>`. (El docente del seed `40000000` tiene teléfono `04144000000`.)

- [ ] **Step 3: Commit**

```bash
git add Backend-Diagnostico-vocacional/src/controllers/representante.controller.js
git commit -m "feat(whatsapp): incluir teléfono del docente en el detalle del representado"
```

---

## Task 4: Endpoint de edición de contacto (backend)

**Files:**
- Modify: `Backend-Diagnostico-vocacional/src/controllers/auth.controller.js`
- Modify: `Backend-Diagnostico-vocacional/src/routes/auth.routes.js`

**Interfaces:**
- Produces: `PUT /api/auth/user/:id/contacto` (superadmin) body `{ telefono?, email? }` → actualiza solo esos campos; maneja colisión de teléfono único.

- [ ] **Step 1: Añadir `updateContacto` en `auth.controller.js`**

Añadir junto a los otros exports:
```js
// Actualiza SOLO teléfono/email de un usuario (superadmin). Respeta el índice único sparse de teléfono.
exports.updateContacto = async (req, res) => {
    try {
        const cambios = {};
        if (req.body.telefono !== undefined) cambios.telefono = String(req.body.telefono).trim() || undefined;
        if (req.body.email !== undefined) cambios.email = String(req.body.email).trim() || undefined;
        if (cambios.telefono) {
            const dup = await User.findOne({ telefono: cambios.telefono, _id: { $ne: req.params.id } }).select('_id');
            if (dup) return res.status(400).json({ msg: 'Ese teléfono ya está registrado en otro usuario' });
        }
        const u = await User.findByIdAndUpdate(req.params.id, cambios, { new: true, runValidators: true }).select('-password');
        if (!u) return res.status(404).json({ msg: 'Usuario no encontrado' });
        res.json({ msg: 'Contacto actualizado', user: u });
    } catch (err) { console.error(err); res.status(500).json({ msg: 'Error al actualizar contacto' }); }
};
```

- [ ] **Step 2: Registrar la ruta en `auth.routes.js`**

Añadir `updateContacto` a la desestructuración del require de `auth.controller` y la ruta (solo superadmin):
```js
router.put('/user/:id/contacto', auth(['superadmin']), updateContacto);
```

- [ ] **Step 3: Verificar E2E**

Run (espera ~3s):
```bash
cd "Backend-Diagnostico-vocacional" && node -e "
const http=require('http');
function login(c,p){return new Promise(r=>{const d=JSON.stringify({cedula:c,password:p});const q=http.request({hostname:'localhost',port:5000,path:'/api/auth/login',method:'POST',headers:{'Content-Type':'application/json','Content-Length':Buffer.byteLength(d)}},res=>{let b='';res.on('data',x=>b+=x);res.on('end',()=>r(JSON.parse(b)));});q.write(d);q.end();});}
function req(m,p,b,t){return new Promise(rr=>{const d=b?JSON.stringify(b):null;const h={'Content-Type':'application/json'};if(d)h['Content-Length']=Buffer.byteLength(d);if(t)h.Authorization='Bearer '+t;const q=http.request({hostname:'localhost',port:5000,path:p,method:m,headers:h},res=>{let bb='';res.on('data',c=>bb+=c);res.on('end',()=>{try{rr({s:res.statusCode,d:JSON.parse(bb)})}catch(e){rr({s:res.statusCode})}});});if(d)q.write(d);q.end();});}
(async()=>{const sa=await login(11111111,'super123');
 const rep=(await req('GET','/api/auth/users?role=representante',null,sa.token)).d[0];
 const up=await req('PUT','/api/auth/user/'+rep._id+'/contacto',{telefono:'04145000010'},sa.token);
 console.log('Actualizar contacto:',up.s,'| tel:',up.d.user?.telefono);
})();"
```
Expected: `Actualizar contacto: 200 | tel: 04145000010`. (Si el teléfono ya es el mismo del representante seed, funciona; si choca con otro usuario, devolvería 400 — usa un valor único si hace falta.)

- [ ] **Step 4: Commit**

```bash
git add Backend-Diagnostico-vocacional/src/controllers/auth.controller.js Backend-Diagnostico-vocacional/src/routes/auth.routes.js
git commit -m "feat(whatsapp): endpoint para editar teléfono/email de contacto de un usuario"
```

---

## Task 5: Botón WhatsApp del docente (frontend)

**Files:**
- Modify: `Frontend-Diagnostico-vocacional/src/api/academico.js` (+`getContactosSeccion`)
- Modify: `Frontend-Diagnostico-vocacional/src/pages/docente/SeccionDetailPage.jsx`

**Interfaces:**
- Consumes: `GET /secciones/:id/contactos` (Task 2), helper `utils/whatsapp.js` (Task 1), `getResumen` de `api/asistencia.js` (ya existe, da el pct de inasistencia).
- Produces: menú WhatsApp de dos pasos (contacto → plantilla) por estudiante.

- [ ] **Step 1: Añadir `getContactosSeccion` en `api/academico.js`**

Añadir (respetando el patrón existente del archivo con `BASE_URL`):
```js
export const getContactosSeccion = async (token, seccionId) => {
  const res = await fetch(`${process.env.REACT_APP_API_URL}/academico/secciones/${seccionId}/contactos`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.msg || 'Error al obtener contactos');
  return data;
};
```

- [ ] **Step 2: Integrar el botón/menú WhatsApp en `SeccionDetailPage.jsx`**

En la pestaña Estudiantes, junto a los botones existentes (CERTIFICACIÓN, CONSTANCIA), añadir un botón "WhatsApp" (icono `MessageCircle`, verde). Requisitos de implementación:
- Importar `MessageCircle` de lucide-react.
- Importar `getContactosSeccion` de `../../api/academico`, `getResumen` de `../../api/asistencia`, y del helper: `abrirWhatsApp, plantillaInasistencia, plantillaNotasListas, plantillaCitacion, plantillaPersonalizada`.
- Al cargar el detalle, además de lo que ya hace, llamar `getContactosSeccion(token, id)` y guardar en estado `contactos` (`{representantes, estudiantes}`); no romper si falla.
- Estado local para el menú abierto: `const [waMenu, setWaMenu] = useState(null)` — guarda `{ estudiante, paso: 'contacto'|'plantilla', contactoSel }`.
- El botón por estudiante abre `setWaMenu({ estudiante: est, paso: 'contacto' })`. Renderiza un popover (posición fija/absoluta) con:
  - **Paso contacto:** lista de contactos con teléfono para ese estudiante: representantes de `contactos.representantes[est._id]` (los que tengan `telefono`) + el estudiante si `contactos.estudiantes[est._id]`. Cada uno muestra nombre + "(representante)"/"(estudiante)". Al elegir → `setWaMenu({ ...prev, paso: 'plantilla', contactoSel })`. Si no hay ninguno con teléfono, mostrar "Sin teléfono registrado" y el botón WhatsApp del estudiante aparece deshabilitado.
  - **Paso plantilla:** 4 botones (Inasistencia, Notas listas, Citación, Personalizada). Al elegir, arma el mensaje y llama `abrirWhatsApp(contactoSel.telefono, mensaje)`, luego `setWaMenu(null)`.
- Datos para las plantillas: `estudiante` = `${est.name} ${est.apellido||''}`.trim(); `seccion` = `${etiquetaAnio} ${seccion.nombre}`; `pct` = el % de inasistencia de ese estudiante (del `getResumen`, mapeado por id; si no hay, `0`); `docente` = nombre del docente (de `useContext(AuthContext).user.name` o similar); `institucion` = puedes usar un texto fijo "EduTrack" o leer de config si está disponible; `lapso` = "lapso actual" (texto genérico, el docente edita).
- El botón deshabilitado usa `disabled` + `title="Sin teléfono registrado"` cuando no hay contactos con teléfono.

- [ ] **Step 3: Verificar build**

Run: `cd "Frontend-Diagnostico-vocacional" && CI=true npx react-scripts build 2>&1 | grep -E "Compiled|Failed|SeccionDetail|academico" | head -5`
Expected: `Compiled successfully.` sin warnings en los archivos tocados. Si falla, corregir imports sin usar / deps de hooks y reintentar.

- [ ] **Step 4: Commit**

```bash
git add Frontend-Diagnostico-vocacional/src/api/academico.js Frontend-Diagnostico-vocacional/src/pages/docente/SeccionDetailPage.jsx
git commit -m "feat(whatsapp): botón del docente para contactar al representante con plantillas de mensaje"
```

---

## Task 6: Botón WhatsApp del representante (frontend)

**Files:**
- Modify: `Frontend-Diagnostico-vocacional/src/pages/representante/RepresentanteDashboard.jsx`

**Interfaces:**
- Consumes: helper `utils/whatsapp.js` (`abrirWhatsApp`, `plantillaRepresentanteADocente`); `grupos[].seccion.docente.telefono` (Task 3).
- Produces: botón "Contactar docente por WhatsApp" por sección.

- [ ] **Step 1: Añadir el botón por sección**

En `RepresentanteDashboard.jsx`, en el encabezado de cada `grupo` (donde se muestra la sección y el docente), añadir un botón "Contactar docente" (icono `MessageCircle`, verde suave). Requisitos:
- Importar `MessageCircle` de lucide-react y `{ abrirWhatsApp, plantillaRepresentanteADocente }` de `../../utils/whatsapp`.
- El botón se muestra habilitado solo si `grupo.seccion.docente?.telefono` es válido; si no, deshabilitado con `title="El docente no tiene teléfono registrado"`.
- Al pulsar: `const msg = plantillaRepresentanteADocente({ estudiante: <nombre del representado activo>, docenteNombre: `${docente.name} ${docente.apellido||''}`.trim() }); abrirWhatsApp(docente.telefono, msg);`
- El nombre del representado activo ya está en el estado del dashboard (el `detalle.estudiante` o el representado seleccionado).

- [ ] **Step 2: Verificar build**

Run: `cd "Frontend-Diagnostico-vocacional" && CI=true npx react-scripts build 2>&1 | grep -E "Compiled|Failed|Representante" | head -4`
Expected: `Compiled successfully.` sin warnings en el archivo tocado.

- [ ] **Step 3: Commit**

```bash
git add Frontend-Diagnostico-vocacional/src/pages/representante/RepresentanteDashboard.jsx
git commit -m "feat(whatsapp): botón del representante para contactar al docente de la sección"
```

---

## Task 7: Captura y edición de contacto del representante (frontend)

**Files:**
- Modify: `Frontend-Diagnostico-vocacional/src/api/user.js` (+`actualizarContacto`)
- Modify: `Frontend-Diagnostico-vocacional/src/pages/admin/ManageUsersPage.jsx`

**Interfaces:**
- Consumes: `PUT /api/auth/user/:id/contacto` (Task 4); `createUser` (ya acepta telefono/email).
- Produces: campos teléfono/email al crear representante en `AsignarRepresentanteModal`; botón "Editar contacto" para representantes.

- [ ] **Step 1: Añadir `actualizarContacto` en `api/user.js`**

```js
export const actualizarContacto = async (id, payload, token) => {
  const res = await fetch(`${BASE_URL}/auth/user/${id}/contacto`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.msg || 'Error al actualizar contacto');
  return data.user;
};
```

- [ ] **Step 2: Campos teléfono/email al crear representante**

En `ManageUsersPage.jsx`, dentro de `AsignarRepresentanteModal`, modo "Crear nuevo": añadir dos inputs — **teléfono** (placeholder "04141234567") y **email** (opcional) — y pasarlos en el `createUser({ role:'representante', name, apellido, cedula, telefono, email, representadoId }, token)`. Estilo Quiet Academic (inputs `bg-slate-50 dark:bg-slate-800 border rounded-xl`).

- [ ] **Step 3: Botón "Editar contacto" para representantes existentes**

En la fila de cada usuario con `role === 'representante'`, añadir un botón (icono `Pencil` o `Phone`) que abre un modal pequeño con inputs teléfono/email precargados (si los tiene) y un botón "Guardar" → `actualizarContacto(u._id, { telefono, email }, token)`. Al guardar, recargar la lista (`load`) y mostrar mensaje. Manejar el error de teléfono duplicado (muestra el `msg` del backend en rose).

- [ ] **Step 4: Verificar build**

Run: `cd "Frontend-Diagnostico-vocacional" && CI=true npx react-scripts build 2>&1 | grep -E "Compiled|Failed|ManageUsers|user.js" | head -5`
Expected: `Compiled successfully.` sin warnings en los archivos tocados.

- [ ] **Step 5: Commit y push**

```bash
git add Frontend-Diagnostico-vocacional/src/api/user.js Frontend-Diagnostico-vocacional/src/pages/admin/ManageUsersPage.jsx
git commit -m "feat(whatsapp): capturar teléfono/email al crear representante y editar contacto de representantes"
git push origin dev-work-kleyver
```

---

## Task 8: Documentación (FLUJOS.md)

**Files:**
- Modify: `FLUJOS.md`

- [ ] **Step 1: Documentar WhatsApp y contacto**

Añadir a `FLUJOS.md`: (a) en el flujo del Docente, el botón WhatsApp con las plantillas (inasistencia/notas listas/citación/personalizada) y que elige el contacto; (b) en el flujo del Representante, el botón "Contactar docente"; (c) en el Super Admin, que puede registrar teléfono/email al crear un representante y editar su contacto; (d) nota de que los mensajes se abren pre-escritos y editables, sin enviar notas por WhatsApp.

- [ ] **Step 2: Commit y push**

```bash
git add FLUJOS.md
git commit -m "docs(flujos): botones de WhatsApp docente-representante y captura de contacto"
git push origin dev-work-kleyver
```

---

## Self-Review (cobertura del spec)

- §3.1 helper whatsapp.js (normalización + plantillas) → Task 1. ✅
- §3.2 docente → representante (menú contacto + plantilla, deshabilitado sin tel) → Task 5. ✅
- §3.3 representante → docente (populate telefono + botón) → Task 3 (backend), Task 6 (frontend). ✅
- §3.4 endpoint de representantes/teléfonos por sección → Task 2. ✅
- §4.1 contacto al crear representante → Task 7. ✅
- §4.2 editar contacto existente (endpoint + UI) → Task 4 (backend), Task 7 (frontend). ✅
- §4.3 seed con teléfono → ya cubierto en Fase 2 (representante 50000010 tiene 04145000010); no requiere tarea nueva. ✅
- No enviar notas por WhatsApp (plantilla "notas listas" solo avisa) → Task 1. ✅

**Consistencia de tipos:** `getContactosSeccion` (Task 2/5), `getResumen` (existente), `abrirWhatsApp`/plantillas (Task 1) usadas con las mismas firmas en Task 5/6. `actualizarContacto(id, payload, token)` (Task 7) ↔ `PUT /user/:id/contacto` (Task 4).

**Nota de método:** sin tests automatizados; verificación por E2E `node -e` (backend) y build CRA (frontend), consistente con la Fase 2. Este plan asume ejecutado antes el plan de seguridad `2026-07-07-seguridad-permisos-hardening.md`.
