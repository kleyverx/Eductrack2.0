# Notificaciones por Telegram — Plan de Implementación

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Un bot de Telegram que envía notificaciones automáticas (inasistencia, riesgo, boletín, constancia) a los representantes vinculados, gratis, sin bloquear las operaciones académicas.

**Architecture:** Un servicio backend (`telegram.service.js`) encapsula la API de Telegram vía axios: envío async con reintento, y polling (`getUpdates`) para captar códigos de vinculación. Los controladores existentes disparan `notificarAsync(...)` sin `await`. El representante vincula su chat con un código que ve en su panel. Si `TELEGRAM_BOT_TOKEN` no está en `.env`, todo se omite silenciosamente.

**Tech Stack:** Node/Express 5, Mongoose 8, axios (ya instalado), Telegram Bot API. Frontend React 19. Sin dependencias nuevas.

## Global Constraints

- **Sin suite de tests automatizada.** Backend: `node -e` E2E (puerto 5000, nodemon). Frontend: `CI=true npx react-scripts build`.
- **Nunca commitear `.env`.** Verificar `git status --porcelain | grep -i "\.env"` vacío antes de cada commit. El `TELEGRAM_BOT_TOKEN` va en `.env` (nunca al repo).
- **Commits en español** (`feat:`/`fix:`). **NO añadir coautoría de Claude ni menciones a IA.** Rama `dev-work-kleyver`.
- **Estilo Quiet Academic:** fondo `bg-slate-50 dark:bg-slate-950`; tarjetas `bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800`; acento `indigo-600`; siempre `dark:` + `transition-colors duration-300`.
- **A prueba de fallos:** un error de Telegram NUNCA debe romper el pase de lista, publicar boletín ni emitir constancia. Todo envío en try/catch, solo loguea.
- **Bot opcional:** si `TELEGRAM_BOT_TOKEN` no está definido, `botActivo()` es false; no se arranca polling ni se envía nada, sin errores.
- **Envío no bloqueante:** los controladores llaman `notificarAsync(...)` SIN `await`.
- **Verificación sin bot real:** las Tasks de backend se verifican con el bot DESACTIVADO (sin token) confirmando que (a) los endpoints responden y (b) las operaciones académicas siguen funcionando y no se rompen. La prueba de envío real end-to-end (con token de @BotFather) queda como verificación manual del usuario, documentada en la Task final.
- Backend local con nodemon (recarga sola); esperar ~3s antes de cada E2E.

---

## File Structure

**Backend (`Backend-Diagnostico-vocacional/src/`):**
- `services/telegram.service.js` — **nuevo** (envío, notificarAsync, polling, procesar código, helper `representantesDe`).
- `controllers/telegram.controller.js` — **nuevo** (`miCodigo`, `desvincular`).
- `routes/telegram.routes.js` — **nuevo**.
- `models/user.js` — modificar (+`telegramChatId`, +`telegramCodigo`).
- `app.js` — modificar (montar ruta + `iniciarPolling()`).
- `controllers/asistencia.controller.js` — modificar (eventos inasistencia + riesgo).
- `controllers/academico.controller.js` — modificar (evento boletín).
- `controllers/constancia.controller.js` — modificar (evento constancia).
- `.env.template` — modificar (documentar las 2 vars nuevas).

**Frontend (`Frontend-Diagnostico-vocacional/src/`):**
- `api/telegram.js` — **nuevo**.
- `pages/representante/RepresentanteDashboard.jsx` — modificar (tarjeta Telegram).

---

## Task 1: Servicio del bot + modelo (fundación)

**Files:**
- Create: `Backend-Diagnostico-vocacional/src/services/telegram.service.js`
- Modify: `Backend-Diagnostico-vocacional/src/models/user.js`
- Modify: `Backend-Diagnostico-vocacional/src/app.js`
- Modify: `Backend-Diagnostico-vocacional/.env.template`

**Interfaces:**
- Produces: `botActivo()`, `enviarMensaje(chatId, texto)`, `notificarAsync(items)`, `iniciarPolling()`, `representantesDe(estudianteIds)`, `procesarCodigo(texto, chatId)`.

- [ ] **Step 1: Añadir campos al modelo `user.js`**

En `models/user.js`, dentro del schema (junto a `representados`), añadir:
```js
    // Vinculación con el bot de Telegram (notificaciones al representante).
    telegramChatId: { type: String, sparse: true },
    telegramCodigo: { type: String },
```

- [ ] **Step 2: Crear `services/telegram.service.js`**

```js
const axios = require('axios');
const User = require('../models/user');

const TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const API = TOKEN ? `https://api.telegram.org/bot${TOKEN}` : null;

/** ¿El bot está configurado? */
function botActivo() { return !!TOKEN; }

/** Envía un mensaje; reintenta 1 vez. Nunca lanza. Devuelve boolean. */
async function enviarMensaje(chatId, texto) {
    if (!API || !chatId) return false;
    for (let intento = 0; intento < 2; intento++) {
        try {
            await axios.post(`${API}/sendMessage`, { chat_id: chatId, text: texto, parse_mode: 'Markdown' }, { timeout: 8000 });
            return true;
        } catch (err) {
            if (intento === 1) { console.error('Telegram sendMessage falló:', err.response?.data?.description || err.message); return false; }
            await new Promise(r => setTimeout(r, 500));
        }
    }
    return false;
}

/** Dispara en segundo plano el envío de una lista de {chatId, texto}. NO se le hace await. */
function notificarAsync(items) {
    if (!botActivo() || !Array.isArray(items) || items.length === 0) return;
    (async () => {
        for (const it of items) {
            if (!it?.chatId || !it?.texto) continue;
            await enviarMensaje(it.chatId, it.texto);
            await new Promise(r => setTimeout(r, 120)); // respetar rate-limit de Telegram
        }
    })().catch(e => console.error('notificarAsync error:', e.message));
}

/** Representantes (con Telegram vinculado) de un conjunto de estudiantes. 1 consulta. */
async function representantesDe(estudianteIds) {
    if (!botActivo()) return new Map();
    const reps = await User.find({
        role: 'representante',
        representados: { $in: estudianteIds },
        telegramChatId: { $ne: null },
    }).select('telegramChatId representados').lean();
    // Map estudianteId -> [chatId,...]
    const map = new Map();
    estudianteIds.forEach(id => map.set(String(id), []));
    reps.forEach(r => {
        (r.representados || []).forEach(estId => {
            const k = String(estId);
            if (map.has(k) && r.telegramChatId) map.get(k).push(r.telegramChatId);
        });
    });
    return map;
}

/** Procesa un texto recibido por el bot: si es un código válido, vincula. */
async function procesarCodigo(textoRaw, chatId) {
    let texto = String(textoRaw || '').trim();
    if (texto.toLowerCase().startsWith('/start')) texto = texto.slice(6).trim(); // deep-link /start CODE
    texto = texto.toUpperCase();
    if (!texto) {
        await enviarMensaje(chatId, 'Hola 👋 Para recibir avisos de tu representado, genera tu código en EduTrack (panel del representante) y envíamelo aquí.');
        return;
    }
    const user = await User.findOne({ telegramCodigo: texto });
    if (!user) {
        await enviarMensaje(chatId, 'No reconozco ese código. Genéralo desde tu panel en EduTrack.');
        return;
    }
    user.telegramChatId = String(chatId);
    user.telegramCodigo = undefined;
    await user.save();
    await enviarMensaje(chatId, `✅ Vinculado, ${user.name || ''}. Recibirás avisos de tus representados.`);
}

/** Long-polling de getUpdates. Arranca solo si el bot está activo. */
let _offset = 0;
async function iniciarPolling() {
    if (!botActivo()) { console.log('Telegram: sin TELEGRAM_BOT_TOKEN, bot desactivado.'); return; }
    console.log('Telegram: polling iniciado.');
    // bucle infinito no bloqueante
    (async function loop() {
        try {
            const { data } = await axios.get(`${API}/getUpdates`, { params: { offset: _offset, timeout: 30 }, timeout: 35000 });
            for (const upd of (data.result || [])) {
                _offset = upd.update_id + 1;
                const msg = upd.message;
                if (msg && msg.text) {
                    try { await procesarCodigo(msg.text, msg.chat.id); }
                    catch (e) { console.error('procesarCodigo error:', e.message); }
                }
            }
        } catch (err) {
            if (err.code !== 'ECONNABORTED') console.error('Telegram getUpdates error:', err.response?.data?.description || err.message);
            await new Promise(r => setTimeout(r, 3000)); // backoff ante error
        }
        setImmediate(loop);
    })();
}

module.exports = { botActivo, enviarMensaje, notificarAsync, representantesDe, procesarCodigo, iniciarPolling };
```

- [ ] **Step 3: Montar el polling en `app.js`**

En `app.js`, dentro del `.then()` de `mongoose.connect(...)` (donde ya hace `console.log('MongoDB conectado')` y `app.listen(...)`), añadir tras el `app.listen`:
```js
        require('./services/telegram.service').iniciarPolling();
```

- [ ] **Step 4: Documentar las vars en `.env.template`**

Añadir al final de `.env.template`:
```
# Telegram (opcional). Crea el bot con @BotFather. Sin estas vars, el bot se desactiva.
TELEGRAM_BOT_TOKEN=
TELEGRAM_BOT_USERNAME=
```

- [ ] **Step 5: Verificar (bot desactivado no rompe nada)**

Con el `.env` SIN `TELEGRAM_BOT_TOKEN` (estado actual), el arranque debe loguear "bot desactivado" y todo sigue vivo. Run (espera ~3s):
```bash
cd "Backend-Diagnostico-vocacional" && node -e "
const http=require('http');
function req(m,p,b){return new Promise(rr=>{const d=b?JSON.stringify(b):null;const h={'Content-Type':'application/json'};if(d)h['Content-Length']=Buffer.byteLength(d);const q=http.request({hostname:'localhost',port:5000,path:p,method:m,headers:h},res=>{let x='';res.on('data',c=>x+=c);res.on('end',()=>{try{rr({s:res.statusCode,d:JSON.parse(x)})}catch(e){rr({s:res.statusCode})}});});if(d)q.write(d);q.end();});}
(async()=>{const lo=await req('POST','/api/auth/login',{cedula:11111111,password:'super123'});console.log('Login (app viva):',lo.s,'| token:',!!lo.d.token);})();"
```
Expected: `Login (app viva): 200 | token: true` (la app carga el servicio sin romperse; en la consola de nodemon debe verse "Telegram: sin TELEGRAM_BOT_TOKEN, bot desactivado.").

- [ ] **Step 6: Commit**

```bash
git add Backend-Diagnostico-vocacional/src/services/telegram.service.js Backend-Diagnostico-vocacional/src/models/user.js Backend-Diagnostico-vocacional/src/app.js Backend-Diagnostico-vocacional/.env.template
git commit -m "feat(telegram): servicio del bot (envío async, polling, vinculación) y campos en User"
```

---

## Task 2: Endpoints de vinculación (backend)

**Files:**
- Create: `Backend-Diagnostico-vocacional/src/controllers/telegram.controller.js`
- Create: `Backend-Diagnostico-vocacional/src/routes/telegram.routes.js`
- Modify: `Backend-Diagnostico-vocacional/src/app.js`

**Interfaces:**
- Consumes: modelo `User`, `botActivo` del servicio.
- Produces: `GET /api/telegram/mi-codigo` (representante), `POST /api/telegram/desvincular` (representante).

- [ ] **Step 1: Crear `controllers/telegram.controller.js`**

```js
const User = require('../models/user');
const { botActivo } = require('../services/telegram.service');

/** Genera un código legible de 6 chars (sin caracteres ambiguos). */
function generarCodigo() {
    const abc = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let c = '';
    for (let i = 0; i < 6; i++) c += abc[Math.floor(Math.random() * abc.length)];
    return c;
}

// GET /api/telegram/mi-codigo — devuelve el código de vinculación (o estado vinculado).
exports.miCodigo = async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('telegramChatId telegramCodigo name');
        if (!user) return res.status(404).json({ msg: 'Usuario no encontrado' });
        if (user.telegramChatId) return res.json({ vinculado: true, botActivo: botActivo(), botUsername: process.env.TELEGRAM_BOT_USERNAME || null });
        if (!user.telegramCodigo) { user.telegramCodigo = generarCodigo(); await user.save(); }
        res.json({ vinculado: false, codigo: user.telegramCodigo, botActivo: botActivo(), botUsername: process.env.TELEGRAM_BOT_USERNAME || null });
    } catch (err) { console.error(err); res.status(500).json({ msg: 'Error al obtener el código' }); }
};

// POST /api/telegram/desvincular — el representante deja de recibir avisos.
exports.desvincular = async (req, res) => {
    try {
        await User.updateOne({ _id: req.user.id }, { $unset: { telegramChatId: '' } });
        res.json({ msg: 'Telegram desvinculado' });
    } catch (err) { console.error(err); res.status(500).json({ msg: 'Error al desvincular' }); }
};
```

- [ ] **Step 2: Crear `routes/telegram.routes.js`**

```js
const express = require('express');
const router = express.Router();
const auth = require('../middlewares/auth');
const c = require('../controllers/telegram.controller');

router.get('/mi-codigo', auth(['representante']), c.miCodigo);
router.post('/desvincular', auth(['representante']), c.desvincular);

module.exports = router;
```

- [ ] **Step 3: Montar en `app.js`**

Añadir junto a los otros requires de rutas: `const telegramRoutes = require('./routes/telegram.routes');` y junto a los `app.use('/api/...')`: `app.use('/api/telegram', telegramRoutes);`.

- [ ] **Step 4: Verificar E2E**

Run (espera ~3s):
```bash
cd "Backend-Diagnostico-vocacional" && node -e "
const http=require('http');
function login(c,p){return new Promise(r=>{const d=JSON.stringify({cedula:c,password:p});const q=http.request({hostname:'localhost',port:5000,path:'/api/auth/login',method:'POST',headers:{'Content-Type':'application/json','Content-Length':Buffer.byteLength(d)}},res=>{let b='';res.on('data',x=>b+=x);res.on('end',()=>r(JSON.parse(b)));});q.write(d);q.end();});}
function req(m,p,b,t){return new Promise(rr=>{const d=b?JSON.stringify(b):null;const h={'Content-Type':'application/json'};if(d)h['Content-Length']=Buffer.byteLength(d);if(t)h.Authorization='Bearer '+t;const q=http.request({hostname:'localhost',port:5000,path:p,method:m,headers:h},res=>{let x='';res.on('data',c=>x+=c);res.on('end',()=>{try{rr({s:res.statusCode,d:JSON.parse(x)})}catch(e){rr({s:res.statusCode})}});});if(d)q.write(d);q.end();});}
(async()=>{const rep=await login(50000010,'50000010');
 const cod=await req('GET','/api/telegram/mi-codigo',null,rep.token);
 console.log('mi-codigo:',cod.s,'| vinculado:',cod.d.vinculado,'| código:',cod.d.codigo,'| botActivo:',cod.d.botActivo);
 const cod2=await req('GET','/api/telegram/mi-codigo',null,rep.token);
 console.log('código estable (mismo):',cod.d.codigo===cod2.d.codigo);
 const otro=await login(22222222,'estudiante123');
 const den=await req('GET','/api/telegram/mi-codigo',null,otro.token);
 console.log('estudiante (esperado 403):',den.s);
})();"
```
Expected: `mi-codigo: 200 | vinculado: false | código: XXXXXX | botActivo: false`, `código estable (mismo): true`, `estudiante (esperado 403): 403`.

- [ ] **Step 5: Commit**

```bash
git add Backend-Diagnostico-vocacional/src/controllers/telegram.controller.js Backend-Diagnostico-vocacional/src/routes/telegram.routes.js Backend-Diagnostico-vocacional/src/app.js
git commit -m "feat(telegram): endpoints de código de vinculación y desvinculación del representante"
```

---

## Task 3: Disparar los eventos de asistencia (inasistencia + riesgo)

**Files:**
- Modify: `Backend-Diagnostico-vocacional/src/controllers/asistencia.controller.js` (`guardarAsistenciaDia`, líneas ~85-90)

**Interfaces:**
- Consumes: `notificarAsync`, `representantesDe` del servicio; `resumenInasistencia` (ya en el módulo), `getConfig`.
- Produces: notificaciones al guardar el pase de lista.

- [ ] **Step 1: Importar el servicio y los datos necesarios**

Al inicio de `asistencia.controller.js`, tras los requires existentes, añadir:
```js
const { notificarAsync, representantesDe, botActivo } = require('../services/telegram.service');
```

- [ ] **Step 2: Disparar notificaciones tras guardar el pase de lista**

En `guardarAsistenciaDia`, entre el `await Asistencia.findOneAndUpdate(...)` y el `res.json({ msg: 'Asistencia guardada' })`, insertar (respondemos al docente ANTES de calcular notificaciones para no bloquear; el envío es async):
```js
        res.json({ msg: 'Asistencia guardada' });

        // Notificaciones a representantes (async, no bloquea la respuesta ya enviada).
        if (botActivo()) {
            try {
                await seccion.populate('estudiantes', 'name apellido');
                const nombre = {};
                seccion.estudiantes.forEach(e => { nombre[String(e._id)] = `${e.name || ''} ${e.apellido || ''}`.trim(); });
                const etiqueta = `${seccion.anio}° ${seccion.nombre}`;
                const ausentes = limpios.filter(r => r.estado === 'ausente').map(r => String(r.estudiante));
                const cfg = await getConfig();
                const resumen = await resumenInasistencia(seccion._id, cfg.umbralInasistencia);
                const mapaRep = await representantesDe(seccion.estudiantes.map(e => e._id));
                const items = [];
                ausentes.forEach(estId => {
                    const chats = mapaRep.get(estId) || [];
                    const est = nombre[estId] || 'su representado';
                    chats.forEach(chatId => items.push({ chatId, texto: `📌 ${est} fue reportado(a) *ausente* hoy en ${etiqueta}.` }));
                    // Riesgo: solo si el estudiante ausente cruzó el umbral (evita spam a los presentes).
                    const r = resumen.get(estId);
                    if (r && r.nivel === 'danger') {
                        chats.forEach(chatId => items.push({ chatId, texto: `⚠️ ${est} alcanzó ${r.pct}% de inasistencia (umbral ${cfg.umbralInasistencia}%). Está en riesgo de perder derecho a evaluación.` }));
                    }
                });
                notificarAsync(items);
            } catch (e) { console.error('Notif asistencia:', e.message); }
        }
        return;
    } catch (err) { console.error(err); res.status(500).json({ msg: 'Error al guardar la asistencia' }); }
};
```
IMPORTANTE: como ahora hay código DESPUÉS del `res.json`, el `res.json` ya no es la última línea del `try`. Reemplazar el bloque final del `try` de `guardarAsistenciaDia` por lo de arriba (el `res.json` + el bloque de notificaciones + `return`), manteniendo el `catch` existente. Verificar que `resumenInasistencia` esté disponible en el scope del módulo (está definida en el mismo archivo).

- [ ] **Step 3: Verificar E2E (con bot desactivado: no rompe, sigue guardando)**

Run (espera ~3s):
```bash
cd "Backend-Diagnostico-vocacional" && node -e "
const http=require('http');
function login(c,p){return new Promise(r=>{const d=JSON.stringify({cedula:c,password:p});const q=http.request({hostname:'localhost',port:5000,path:'/api/auth/login',method:'POST',headers:{'Content-Type':'application/json','Content-Length':Buffer.byteLength(d)}},res=>{let b='';res.on('data',x=>b+=x);res.on('end',()=>r(JSON.parse(b)));});q.write(d);q.end();});}
function req(m,p,b,t){return new Promise(rr=>{const d=b?JSON.stringify(b):null;const h={'Content-Type':'application/json'};if(d)h['Content-Length']=Buffer.byteLength(d);if(t)h.Authorization='Bearer '+t;const q=http.request({hostname:'localhost',port:5000,path:p,method:m,headers:h},res=>{let x='';res.on('data',c=>x+=c);res.on('end',()=>{try{rr({s:res.statusCode,d:JSON.parse(x)})}catch(e){rr({s:res.statusCode})}});});if(d)q.write(d);q.end();});}
(async()=>{const doc=await login(40000000,'docente123');
 const sec=(await req('GET','/api/academico/secciones',null,doc.token)).d[0];
 const dia=await req('GET','/api/academico/secciones/'+sec._id+'/asistencia/2026-03-01',null,doc.token);
 const ids=dia.d.estudiantes.map(e=>e._id);
 const regs=ids.map((id,i)=>({estudiante:id,estado:i===0?'ausente':'presente'}));
 const put=await req('PUT','/api/academico/secciones/'+sec._id+'/asistencia/2026-03-01',{registros:regs},doc.token);
 console.log('Guardar pase de lista (con bot off):',put.s,'|',put.d.msg);
})();"
```
Expected: `Guardar pase de lista (con bot off): 200 | Asistencia guardada` (con el bot desactivado, el bloque de notificación se salta por `botActivo()` y el guardado funciona igual).

- [ ] **Step 4: Commit**

```bash
git add Backend-Diagnostico-vocacional/src/controllers/asistencia.controller.js
git commit -m "feat(telegram): notificar inasistencia y riesgo al representante al pasar lista"
```

---

## Task 4: Disparar eventos de boletín y constancia

**Files:**
- Modify: `Backend-Diagnostico-vocacional/src/controllers/academico.controller.js` (`toggleBoletin`, líneas ~632-638)
- Modify: `Backend-Diagnostico-vocacional/src/controllers/constancia.controller.js` (`emitir`, líneas ~77-79)

**Interfaces:**
- Consumes: `notificarAsync`, `representantesDe`, `botActivo`.

- [ ] **Step 1: Evento boletín en `academico.controller.js`**

Al inicio del archivo, tras los requires, añadir:
```js
const { notificarAsync, representantesDe, botActivo } = require('../services/telegram.service');
```
En `toggleBoletin`, dentro del `if (publicar)`, entre el `await BoletinPublicado.findOneAndUpdate(...)` y el `return res.json(...)`, insertar:
```js
            const respuesta = res.json({ msg: `Boletín del ${lapso}° lapso publicado`, publicado: true });
            if (botActivo()) {
                try {
                    await seccion.populate('estudiantes', 'name apellido');
                    const LAPSO = { 1: '1er lapso', 2: '2do lapso', 3: '3er lapso' };
                    const mapaRep = await representantesDe(seccion.estudiantes.map(e => e._id));
                    const items = [];
                    seccion.estudiantes.forEach(e => {
                        const est = `${e.name || ''} ${e.apellido || ''}`.trim();
                        (mapaRep.get(String(e._id)) || []).forEach(chatId =>
                            items.push({ chatId, texto: `📊 Ya están disponibles las calificaciones de ${est} del ${LAPSO[lapso]}. Consúltelas en la plataforma EduTrack.` }));
                    });
                    notificarAsync(items);
                } catch (e) { console.error('Notif boletín:', e.message); }
            }
            return respuesta;
```
Y ELIMINAR la línea original `return res.json({ msg: `Boletín del ${lapso}° lapso publicado`, publicado: true });` (queda reemplazada por el bloque anterior). El `else`/despublicar y el resto quedan igual.

- [ ] **Step 2: Evento constancia en `constancia.controller.js`**

Al inicio del archivo, tras los requires, añadir:
```js
const { notificarAsync, representantesDe, botActivo } = require('../services/telegram.service');
```
En `emitir`, entre `await Constancia.create({...})` y `res.status(201).json({...})`, insertar (solo para constancias por estudiante — `estudianteRef` no nulo):
```js
        res.status(201).json({ codigo, tipo, datos, fecha: new Date() });
        if (botActivo() && estudianteRef) {
            try {
                const mapaRep = await representantesDe([estudianteRef]);
                const chats = mapaRep.get(String(estudianteRef)) || [];
                const nombreEst = datos?.estudiante?.nombre || 'su representado';
                const url = `${process.env.FRONTEND_URL?.split(',')[0] || ''}/verificar/${codigo}`;
                const items = chats.map(chatId => ({ chatId, texto: `📄 Se emitió una constancia de ${tipo} para ${nombreEst}. Verifíquela: ${url}` }));
                notificarAsync(items);
            } catch (e) { console.error('Notif constancia:', e.message); }
        }
        return;
```
Y ELIMINAR la línea original `res.status(201).json({ codigo, tipo, datos, fecha: new Date() });` (reemplazada por el bloque). El `catch` del final queda igual.

- [ ] **Step 3: Verificar E2E (con bot off, boletín y constancia siguen funcionando)**

Run (espera ~3s):
```bash
cd "Backend-Diagnostico-vocacional" && node -e "
const http=require('http');
function login(c,p){return new Promise(r=>{const d=JSON.stringify({cedula:c,password:p});const q=http.request({hostname:'localhost',port:5000,path:'/api/auth/login',method:'POST',headers:{'Content-Type':'application/json','Content-Length':Buffer.byteLength(d)}},res=>{let b='';res.on('data',x=>b+=x);res.on('end',()=>r(JSON.parse(b)));});q.write(d);q.end();});}
function req(m,p,b,t){return new Promise(rr=>{const d=b?JSON.stringify(b):null;const h={'Content-Type':'application/json'};if(d)h['Content-Length']=Buffer.byteLength(d);if(t)h.Authorization='Bearer '+t;const q=http.request({hostname:'localhost',port:5000,path:p,method:m,headers:h},res=>{let x='';res.on('data',c=>x+=c);res.on('end',()=>{try{rr({s:res.statusCode,d:JSON.parse(x)})}catch(e){rr({s:res.statusCode,raw:x.slice(0,100)})}});});if(d)q.write(d);q.end();});}
(async()=>{const doc=await login(40000000,'docente123');
 const sec=(await req('GET','/api/academico/secciones',null,doc.token)).d[0];
 const bol=await req('PUT','/api/academico/secciones/'+sec._id+'/boletines/1',{publicar:true},doc.token);
 console.log('Publicar boletín (bot off):',bol.s,'|',bol.d.msg);
 const secDet=await req('GET','/api/academico/secciones/'+sec._id,null,doc.token);
 const est=secDet.d.seccion.estudiantes[0];
 const con=await req('POST','/api/constancias',{tipo:'estudios',estudianteId:est._id},doc.token);
 console.log('Emitir constancia (bot off):',con.s,'| código:',con.d.codigo);
})();"
```
Expected: `Publicar boletín (bot off): 200 | Boletín del 1° lapso publicado`, `Emitir constancia (bot off): 201 | código: EDT-...` (ambas operaciones funcionan con el bot desactivado; el código de constancia trae el sufijo aleatorio de la fase de seguridad).

- [ ] **Step 4: Commit**

```bash
git add Backend-Diagnostico-vocacional/src/controllers/academico.controller.js Backend-Diagnostico-vocacional/src/controllers/constancia.controller.js
git commit -m "feat(telegram): notificar boletín publicado y constancia emitida al representante"
```

---

## Task 5: Panel del representante — tarjeta de Telegram (frontend)

**Files:**
- Create: `Frontend-Diagnostico-vocacional/src/api/telegram.js`
- Modify: `Frontend-Diagnostico-vocacional/src/pages/representante/RepresentanteDashboard.jsx`

**Interfaces:**
- Consumes: `GET /api/telegram/mi-codigo`, `POST /api/telegram/desvincular`.
- Produces: tarjeta "Notificaciones por Telegram".

- [ ] **Step 1: Crear `api/telegram.js`**

```js
const BASE_URL = process.env.REACT_APP_API_URL;
export const miCodigoTelegram = async (token) => {
  const res = await fetch(`${BASE_URL}/telegram/mi-codigo`, { headers: { Authorization: `Bearer ${token}` } });
  const data = await res.json();
  if (!res.ok) throw new Error(data.msg || 'Error');
  return data;
};
export const desvincularTelegram = async (token) => {
  const res = await fetch(`${BASE_URL}/telegram/desvincular`, { method: 'POST', headers: { Authorization: `Bearer ${token}` } });
  const data = await res.json();
  if (!res.ok) throw new Error(data.msg || 'Error');
  return data;
};
```

- [ ] **Step 2: Añadir la tarjeta en `RepresentanteDashboard.jsx`**

Importar `{ miCodigoTelegram, desvincularTelegram }` de `../../api/telegram` y el icono `Send` (o `Bell`) de lucide-react. Añadir estado `const [tg, setTg] = useState(null)`. En el `useEffect` inicial (o uno nuevo con `[token]`), llamar `miCodigoTelegram(token).then(setTg).catch(() => {})`. Renderizar una tarjeta Quiet Academic bajo el encabezado del representado:
- Si `tg?.vinculado`: "✅ Telegram conectado — recibes avisos de tus representados" + botón "Desconectar" → `desvincularTelegram(token).then(() => miCodigoTelegram(token).then(setTg))`.
- Si `tg && !tg.vinculado`: muestra el código en grande (`tg.codigo`), y si `tg.botUsername`, un enlace `https://t.me/${tg.botUsername}` ("Abrir bot"); instrucción "Abre nuestro bot de Telegram y envía este código para recibir avisos". Si `!tg.botActivo`, muestra en tono atenuado "Las notificaciones por Telegram aún no están activas en el servidor" (para que no confunda en local sin token).
- Estilo Quiet Academic + dark mode (tarjeta `bg-white dark:bg-slate-900 rounded-2xl border ...`).

- [ ] **Step 3: Verificar build**

Run: `cd "Frontend-Diagnostico-vocacional" && CI=true npx react-scripts build 2>&1 | grep -E "Compiled|Failed|Representante|telegram" | head -5`
Expected: `Compiled successfully.` sin warnings en los archivos tocados.

- [ ] **Step 4: Commit**

```bash
git add Frontend-Diagnostico-vocacional/src/api/telegram.js Frontend-Diagnostico-vocacional/src/pages/representante/RepresentanteDashboard.jsx
git commit -m "feat(telegram): tarjeta de vinculación de Telegram en el panel del representante"
```

---

## Task 6: Verificación integral + prueba real opcional + docs

**Files:**
- Modify: `FLUJOS.md`

- [ ] **Step 1: E2E de regresión (bot off: nada roto en los 4 roles y flujos)**

Run (espera ~3s):
```bash
cd "Backend-Diagnostico-vocacional" && node -e "
const http=require('http');
function login(c,p){return new Promise(r=>{const d=JSON.stringify({cedula:c,password:p});const q=http.request({hostname:'localhost',port:5000,path:'/api/auth/login',method:'POST',headers:{'Content-Type':'application/json','Content-Length':Buffer.byteLength(d)}},res=>{let b='';res.on('data',x=>b+=x);res.on('end',()=>r(JSON.parse(b)));});q.write(d);q.end();});}
(async()=>{
 for (const [c,p,rol] of [[11111111,'super123','superadmin'],[40000000,'docente123','docente'],[22222222,'estudiante123','estudiante'],[50000010,'50000010','representante']]) {
   const r=await login(c,p); console.log(rol+':',!!r.token);
 }
})();"
```
Expected: los 4 roles `true`.

- [ ] **Step 2: Build final del frontend**

Run: `cd "Frontend-Diagnostico-vocacional" && CI=true npx react-scripts build 2>&1 | grep -E "Compiled|Failed" | head -2`
Expected: `Compiled successfully.`

- [ ] **Step 3: (Manual, opcional — requiere token real) Prueba end-to-end del bot**

Documentar para el usuario (NO ejecutable por el agente): crear bot con @BotFather, poner `TELEGRAM_BOT_TOKEN` y `TELEGRAM_BOT_USERNAME` en `.env`, reiniciar backend (nodemon lo hace), entrar como representante `50000010`, generar el código, enviarlo al bot (debe responder "✅ Vinculado"), luego pasar lista marcando ausente a un representado y confirmar que llega el aviso a Telegram.

- [ ] **Step 4: Actualizar `FLUJOS.md`**

Añadir: sección "Notificaciones por Telegram" — el representante conecta su Telegram con un código desde su panel y recibe avisos automáticos de inasistencia, riesgo, boletines y constancias. Nota de que requiere configurar el bot en el servidor (`TELEGRAM_BOT_TOKEN`).

- [ ] **Step 5: Commit y push**

```bash
git add FLUJOS.md
git commit -m "docs(flujos): notificaciones por Telegram para el representante"
git push origin dev-work-kleyver
```

---

## Self-Review (cobertura del spec)

- §3 servicio del bot (envío async + polling + representantesDe) → Task 1. ✅
- §4 vinculación por código (campos User, endpoints, procesarCodigo, panel) → Task 1 (campos+servicio), Task 2 (endpoints), Task 5 (panel). ✅
- §5.1 inasistencia + §5.2 riesgo → Task 3. ✅
- §5.3 boletín → Task 4. ✅
- §5.4 constancia → Task 4. ✅
- §2 bot opcional (sin token = omitido sin error) → cubierto por `botActivo()` en todas las tareas; verificado con bot off en Tasks 1,3,4. ✅
- §9 despliegue/riesgos (polling, Render duerme) → documentado en spec; prueba real manual en Task 6 Step 3. ✅
- §10 criterios → Task 6. ✅

**Consistencia de tipos:** `notificarAsync(items:[{chatId,texto}])`, `representantesDe(ids)→Map<string,string[]>`, `botActivo()→bool` usados idénticos en Tasks 1,3,4. `miCodigoTelegram/desvincularTelegram` (Task 5) ↔ `/mi-codigo`,`/desvincular` (Task 2).

**Nota de método:** sin tests automatizados; verificación por E2E `node -e` con el bot DESACTIVADO (confirma que nada se rompe) + build CRA. La prueba de envío real con token de @BotFather es verificación manual del usuario (Task 6 Step 3). Este plan asume ejecutadas antes las fases de núcleo académico y seguridad (el código de constancia con sufijo ya existe).
