# Bot de Telegram bidireccional (comandos de consulta) — Plan de Implementación

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ampliar el bot de Telegram para que responda comandos del representante (`/ayuda`, `/misdatos`, `/asistencia`, `/notas`, `/constancia`) con datos de sus representados, en solo lectura, con seguridad por chat_id y botones para elegir cuando hay varios representados.

**Architecture:** El polling de `telegram.service.js` pasa de llamar `procesarCodigo` directo a un router `manejarUpdate(update)` que distingue mensajes de texto (comandos / código de vinculación) y `callback_query` (toques de botón). La lógica de comandos vive en un módulo nuevo `telegram.commands.js` (require perezoso para evitar ciclo). Cada comando resuelve al representante por `telegramChatId`, valida propiedad de los representados, y responde reutilizando la lógica académica existente (`resumenInasistencia`, `calcularLapsosBulk`).

**Tech Stack:** Node/Express 5, Mongoose 8, axios (Telegram Bot API: sendMessage con inline_keyboard, answerCallbackQuery). Sin dependencias nuevas. Sin cambios de frontend ni de modelo.

## Global Constraints

- **Sin suite de tests automatizada.** Backend se verifica con `node -e` E2E que llama a las funciones exportadas del servicio/commands directamente (no hay endpoint HTTP para el bot). Con el bot ACTIVO (token en .env), también se puede verificar el envío real.
- **Nunca commitear `.env`.** Verificar `git status --porcelain | grep -iE "\.env$"` vacío antes de cada commit (`.env.template` SÍ se commitea, el `.env` real NO).
- **Commits en español** (`feat:`/`fix:`). **NO añadir coautoría de Claude ni menciones a IA.** Rama `dev-work-kleyver`.
- **A prueba de fallos:** cada comando en try/catch; ante error responde "Ocurrió un error, intenta más tarde." y loguea. NUNCA tumba el polling.
- **Seguridad:** identidad SIEMPRE por `chat_id` → `User.findOne({ telegramChatId })`. Solo rol `representante`. Solo estudiantes en `user.representados`. Los `callback_data` con `estudianteId` se validan contra `representados` antes de responder.
- **Privacidad:** `/notas` responde promedio general (número) + semáforo por materia (🟢≥15 🟡≥11 🔴<11), SIN el número exacto por materia. `/asistencia` responde % + semáforo (good=🟢 warning=🟡 danger=🔴).
- **No romper lo existente:** la vinculación por código y las notificaciones automáticas deben seguir funcionando.
- Backend local con nodemon (recarga solo); esperar ~4s antes de cada E2E. Bot `@edutrack2bot` activo; representante de prueba `50000010` (2 representados: cédulas 22222222 y 30000000).

---

## File Structure

**Backend (`Backend-Diagnostico-vocacional/src/`):**
- `services/telegram.service.js` — modificar: `enviarConBotones`, `answerCallbackQuery`, `manejarUpdate`, `manejarTexto`, `manejarCallback`; el polling procesa `message` y `callback_query`; require perezoso de commands.
- `services/telegram.commands.js` — **nuevo**: `ejecutarComando(cmd, chatId)`, `ejecutarAccion(accion, estudianteId, chatId)`, helper `resolverRepresentante(chatId)`, y una función por comando.

Sin cambios de modelo, rutas HTTP, seed ni frontend.

---

## Task 1: Helpers de envío con botones + answerCallbackQuery (servicio)

**Files:**
- Modify: `Backend-Diagnostico-vocacional/src/services/telegram.service.js`

**Interfaces:**
- Produces: `enviarConBotones(chatId, texto, botones)` donde `botones = [{ text, callback_data }]` (una fila por botón); `answerCallbackQuery(callbackQueryId)`.

- [ ] **Step 1: Añadir `enviarConBotones` y `answerCallbackQuery`**

En `telegram.service.js`, tras la función `enviarMensaje` (línea ~23), añadir:
```js
/** Envía un mensaje con botones inline. `botones` = [{text, callback_data}] (una fila por botón). Nunca lanza. */
async function enviarConBotones(chatId, texto, botones) {
    if (!API || !chatId) return false;
    try {
        await axios.post(`${API}/sendMessage`, {
            chat_id: chatId, text: texto, parse_mode: 'Markdown',
            reply_markup: { inline_keyboard: botones.map(b => [{ text: b.text, callback_data: b.callback_data }]) },
        }, { timeout: 8000 });
        return true;
    } catch (err) {
        console.error('Telegram enviarConBotones falló:', err.response?.data?.description || err.message);
        return false;
    }
}

/** Confirma un callback_query (quita el "reloj" de carga del botón en Telegram). Nunca lanza. */
async function answerCallbackQuery(callbackQueryId) {
    if (!API) return;
    try { await axios.post(`${API}/answerCallbackQuery`, { callback_query_id: callbackQueryId }, { timeout: 8000 }); }
    catch (err) { console.error('answerCallbackQuery falló:', err.response?.data?.description || err.message); }
}
```

- [ ] **Step 2: Exportarlas**

En el `module.exports` del final, añadir `enviarConBotones, answerCallbackQuery`:
```js
module.exports = { botActivo, enviarMensaje, enviarConBotones, answerCallbackQuery, notificarAsync, representantesDe, procesarCodigo, iniciarPolling };
```

- [ ] **Step 3: Verificar (carga sin romper + login vivo)**

Espera ~4s tras guardar. Run:
```bash
cd "Backend-Diagnostico-vocacional" && node -e "
const t=require('./src/services/telegram.service');
console.log('exports:', ['enviarConBotones','answerCallbackQuery','manejarUpdate'].map(k=>k+':'+(typeof t[k])).join(' '));
"
```
Expected: `enviarConBotones:function answerCallbackQuery:function manejarUpdate:undefined` (las dos primeras existen; `manejarUpdate` aún no — se añade en Task 3). Y que el backend siga vivo:
```bash
cd "Backend-Diagnostico-vocacional" && node -e "const http=require('http');const q=http.request({hostname:'localhost',port:5000,path:'/api/config',method:'GET'},r=>console.log('backend vivo:',r.statusCode));q.end();"
```
Expected: `backend vivo: 401`.

- [ ] **Step 4: Commit**

```bash
cd "c:/Users/Kley Marg/Desktop/Eductrack2.0" && git status --porcelain | grep -iE "\.env$" && echo "CUIDADO env" || echo "sin env real - ok"
git add Backend-Diagnostico-vocacional/src/services/telegram.service.js
git commit -m "feat(telegram): helpers de mensaje con botones inline y answerCallbackQuery"
```

---

## Task 2: Módulo de comandos con `/ayuda` y `/misdatos` (los simples primero)

**Files:**
- Create: `Backend-Diagnostico-vocacional/src/services/telegram.commands.js`

**Interfaces:**
- Consumes: `enviarMensaje`, `enviarConBotones` del servicio; modelo `User`.
- Produces: `ejecutarComando(cmd, chatId)`, `resolverRepresentante(chatId)`, y (stubs por ahora) las funciones de cada comando. `ejecutarComando` maneja `/ayuda`, `/start`, `/misdatos`; los demás comandos responden un placeholder que se completa en Tasks 4-5.

- [ ] **Step 1: Crear `telegram.commands.js` con la base + /ayuda + /misdatos**

```js
const User = require('../models/user');

// require perezoso del servicio para evitar ciclo (service -> commands -> service).
function svc() { return require('./telegram.service'); }

const AYUDA = [
    'Comandos disponibles:',
    '/asistencia — % de inasistencia de tu representado',
    '/notas — resumen de calificaciones',
    '/misdatos — a quién representas',
    '/constancia — enlace de verificación de la última constancia',
    '/ayuda — esta ayuda',
].join('\n');

/** Devuelve el User representante vinculado a ese chat, o null. */
async function resolverRepresentante(chatId) {
    const user = await User.findOne({ telegramChatId: String(chatId) })
        .select('name role representados').lean();
    if (!user) return { error: 'no-vinculado' };
    if (user.role !== 'representante') return { error: 'no-representante' };
    return { user };
}

// /misdatos — a quién representa (sin datos académicos).
async function cmdMisDatos(chatId, user) {
    const reps = await User.find({ _id: { $in: user.representados || [] } })
        .select('name apellido cedula').lean();
    if (!reps.length) { await svc().enviarMensaje(chatId, 'Aún no tienes representados vinculados.'); return; }
    const lineas = reps.map(r => `• ${r.name || ''} ${r.apellido || ''} (C.I. ${r.cedula})`.trim());
    await svc().enviarMensaje(chatId, `✅ Telegram vinculado.\nRepresentas a:\n${lineas.join('\n')}`);
}

/** Enruta un comando de texto. `cmd` incluye la barra (ej. "/asistencia"). */
async function ejecutarComando(cmd, chatId) {
    const c = cmd.split(/\s+/)[0].toLowerCase();
    // Ayuda y start no requieren estar vinculado como representante (start ya vinculado muestra ayuda).
    if (c === '/ayuda' || c === '/start') { await svc().enviarMensaje(chatId, AYUDA); return; }

    const { user, error } = await resolverRepresentante(chatId);
    if (error === 'no-vinculado') { await svc().enviarMensaje(chatId, 'Primero vincúlate: genera tu código en el panel del representante de EduTrack y envíamelo aquí.'); return; }
    if (error === 'no-representante') { await svc().enviarMensaje(chatId, 'Este bot es para representantes.'); return; }

    try {
        switch (c) {
            case '/misdatos': await cmdMisDatos(chatId, user); break;
            case '/asistencia': await require('./telegram.commands').cmdAsistencia(chatId, user); break;
            case '/notas': await require('./telegram.commands').cmdNotas(chatId, user); break;
            case '/constancia': await require('./telegram.commands').cmdConstancia(chatId, user); break;
            default: await svc().enviarMensaje(chatId, `Comando no reconocido.\n\n${AYUDA}`);
        }
    } catch (e) {
        console.error('ejecutarComando error:', e.message);
        await svc().enviarMensaje(chatId, 'Ocurrió un error, intenta más tarde.');
    }
}

// Placeholders (se completan en Tasks 4 y 5). Exportados para que el switch los encuentre.
async function cmdAsistencia(chatId) { await svc().enviarMensaje(chatId, '(asistencia próximamente)'); }
async function cmdNotas(chatId) { await svc().enviarMensaje(chatId, '(notas próximamente)'); }
async function cmdConstancia(chatId) { await svc().enviarMensaje(chatId, '(constancia próximamente)'); }

module.exports = { ejecutarComando, resolverRepresentante, cmdMisDatos, cmdAsistencia, cmdNotas, cmdConstancia, AYUDA };
```

- [ ] **Step 2: Verificar E2E (llamando a `ejecutarComando` directamente con el chat del representante vinculado)**

El representante `50000010` ya está vinculado (chatId real). Este test obtiene su `telegramChatId` de la BD y llama a `ejecutarComando` — el bot enviará mensajes REALES a ese Telegram. Espera ~4s tras guardar. Run:
```bash
cd "Backend-Diagnostico-vocacional" && node -e "
require('dotenv').config();
const mongoose=require('mongoose');
(async()=>{
 await mongoose.connect(process.env.MONGO_URI);
 const User=require('./src/models/user');
 const { ejecutarComando } = require('./src/services/telegram.commands');
 const rep=await User.findOne({cedula:50000010}).select('telegramChatId').lean();
 if(!rep?.telegramChatId){console.log('rep sin vincular; vincúlalo primero');process.exit(0);}
 console.log('chatId del rep:', rep.telegramChatId);
 await ejecutarComando('/ayuda', rep.telegramChatId);
 await ejecutarComando('/misdatos', rep.telegramChatId);
 console.log('Enviados /ayuda y /misdatos — revisa Telegram del representante.');
 await mongoose.disconnect();
})().catch(e=>{console.error(e.message);process.exit(1);});
"
```
Expected: imprime el chatId y "Enviados..." sin errores; en el Telegram del representante llegan el mensaje de ayuda y el de "Representas a: ...". Si `telegramChatId` es null, primero hay que vincular (enviar el código al bot).

- [ ] **Step 3: Commit**

```bash
cd "c:/Users/Kley Marg/Desktop/Eductrack2.0" && git status --porcelain | grep -iE "\.env$" && echo "CUIDADO env" || echo "sin env real - ok"
git add Backend-Diagnostico-vocacional/src/services/telegram.commands.js
git commit -m "feat(telegram): módulo de comandos con /ayuda y /misdatos (seguridad por chat_id)"
```

---

## Task 3: Router de mensajes en el polling (texto + callback_query)

**Files:**
- Modify: `Backend-Diagnostico-vocacional/src/services/telegram.service.js`

**Interfaces:**
- Consumes: `ejecutarComando` (Task 2), `ejecutarAccion` (Task 4, se referencia con require perezoso), `procesarCodigo` (existente).
- Produces: `manejarUpdate(update)`, `manejarTexto(texto, chatId)`, `manejarCallback(cbq)`; el polling los usa.

- [ ] **Step 1: Añadir el router `manejarUpdate` y sus auxiliares**

En `telegram.service.js`, tras `procesarCodigo` (línea ~74) y antes de `iniciarPolling`, añadir:
```js
/** ¿El texto parece un código de vinculación (6 chars alfanuméricos)? */
function pareceCodigo(texto) {
    return /^[A-Z0-9]{6}$/.test(String(texto || '').trim().toUpperCase());
}

/** Enruta un mensaje de texto: comando, código de vinculación, o ayuda. */
async function manejarTexto(texto, chatId) {
    const t = String(texto || '').trim();
    if (t.startsWith('/')) {
        // /start CODE (deep link) -> tratar como código
        if (t.toLowerCase().startsWith('/start ') && pareceCodigo(t.slice(7))) {
            return procesarCodigo(t.slice(7), chatId);
        }
        return require('./telegram.commands').ejecutarComando(t, chatId);
    }
    if (pareceCodigo(t)) return procesarCodigo(t, chatId);
    // texto libre no reconocido -> ayuda
    return require('./telegram.commands').ejecutarComando('/ayuda', chatId);
}

/** Maneja el toque de un botón inline (callback_query). data = "accion:estudianteId". */
async function manejarCallback(cbq) {
    const chatId = cbq.message?.chat?.id;
    const data = cbq.data || '';
    await answerCallbackQuery(cbq.id);
    const [accion, estudianteId] = data.split(':');
    if (!accion || !estudianteId || !chatId) return;
    return require('./telegram.commands').ejecutarAccion(accion, estudianteId, chatId);
}

/** Punto de entrada del polling para cada update. */
async function manejarUpdate(update) {
    try {
        if (update.message && update.message.text) {
            await manejarTexto(update.message.text, update.message.chat.id);
        } else if (update.callback_query) {
            await manejarCallback(update.callback_query);
        }
    } catch (e) { console.error('manejarUpdate error:', e.message); }
}
```

- [ ] **Step 2: Cambiar el polling para usar `manejarUpdate`**

En `iniciarPolling`, reemplazar el bloque del `for` que hoy es:
```js
            for (const upd of (data.result || [])) {
                _offset = upd.update_id + 1;
                const msg = upd.message;
                if (msg && msg.text) {
                    try { await procesarCodigo(msg.text, msg.chat.id); }
                    catch (e) { console.error('procesarCodigo error:', e.message); }
                }
            }
```
por:
```js
            for (const upd of (data.result || [])) {
                _offset = upd.update_id + 1;
                await manejarUpdate(upd);
            }
```

- [ ] **Step 3: Exportar `manejarUpdate`**

En `module.exports`, añadir `manejarUpdate`:
```js
module.exports = { botActivo, enviarMensaje, enviarConBotones, answerCallbackQuery, notificarAsync, representantesDe, procesarCodigo, manejarUpdate, iniciarPolling };
```

- [ ] **Step 4: Verificar E2E (simular updates sin depender del polling real)**

Espera ~4s. Este test llama `manejarUpdate` con updates falsos usando el chatId real del representante → envía mensajes reales. Run:
```bash
cd "Backend-Diagnostico-vocacional" && node -e "
require('dotenv').config();
const mongoose=require('mongoose');
(async()=>{
 await mongoose.connect(process.env.MONGO_URI);
 const User=require('./src/models/user');
 const { manejarUpdate } = require('./src/services/telegram.service');
 const rep=await User.findOne({cedula:50000010}).select('telegramChatId').lean();
 const chatId=Number(rep.telegramChatId);
 // Simular un update de comando /misdatos
 await manejarUpdate({ update_id: 1, message: { text: '/misdatos', chat: { id: chatId } } });
 // Simular texto libre -> debe responder ayuda
 await manejarUpdate({ update_id: 2, message: { text: 'hola', chat: { id: chatId } } });
 console.log('manejarUpdate procesó /misdatos y texto libre sin lanzar — revisa Telegram.');
 await mongoose.disconnect();
})().catch(e=>{console.error(e.message);process.exit(1);});
"
```
Expected: imprime la línea de éxito sin errores; en Telegram llegan el mensaje de misdatos y el de ayuda. NOTA: como el polling REAL también está corriendo en el backend con nodemon, si envías mensajes de verdad al bot desde tu Telegram también se procesarán — es lo esperado.

- [ ] **Step 5: Commit**

```bash
cd "c:/Users/Kley Marg/Desktop/Eductrack2.0" && git status --porcelain | grep -iE "\.env$" && echo "CUIDADO env" || echo "sin env real - ok"
git add Backend-Diagnostico-vocacional/src/services/telegram.service.js
git commit -m "feat(telegram): router de mensajes en el polling (comandos de texto y botones)"
```

---

## Task 4: Comando /asistencia + acción por botón

**Files:**
- Modify: `Backend-Diagnostico-vocacional/src/services/telegram.commands.js`

**Interfaces:**
- Consumes: `resumenInasistencia` (de `asistencia.controller`), `getConfig` (de `config.controller`), `Seccion`; `enviarMensaje`/`enviarConBotones` del servicio.
- Produces: `cmdAsistencia(chatId, user)` real, `ejecutarAccion(accion, estudianteId, chatId)` (maneja `accion === 'asistencia'`), helper `resumenAsistenciaTexto(estudianteId)`.

- [ ] **Step 1: Añadir imports y helpers de asistencia en `telegram.commands.js`**

Al inicio de `telegram.commands.js`, tras `const User = require('../models/user');`, añadir:
```js
const Seccion = require('../models/Seccion');
const { resumenInasistencia } = require('../controllers/asistencia.controller');
const { getConfig } = require('../controllers/config.controller');

const EMOJI_NIVEL = { good: '🟢', warning: '🟡', danger: '🔴' };
```

- [ ] **Step 2: Reemplazar el placeholder `cmdAsistencia` y añadir helpers + `ejecutarAccion`**

Reemplazar la función placeholder:
```js
async function cmdAsistencia(chatId) { await svc().enviarMensaje(chatId, '(asistencia próximamente)'); }
```
por:
```js
/** Nombre corto de un representado. */
async function nombreDe(estudianteId) {
    const e = await User.findById(estudianteId).select('name apellido').lean();
    return e ? `${e.name || ''} ${e.apellido || ''}`.trim() : 'Estudiante';
}

/** Texto de resumen de inasistencia de un estudiante (todas sus secciones). */
async function resumenAsistenciaTexto(estudianteId) {
    const cfg = await getConfig();
    const secciones = await Seccion.find({ estudiantes: estudianteId }).select('nombre anio').lean();
    if (!secciones.length) return 'Sin secciones registradas.';
    const nombre = await nombreDe(estudianteId);
    const lineas = [];
    for (const sec of secciones) {
        const mapa = await resumenInasistencia(sec._id, cfg.umbralInasistencia);
        const r = mapa.get(String(estudianteId)) || { pct: 0, nivel: 'good' };
        lineas.push(`${sec.anio}° ${sec.nombre}: ${r.pct}% ${EMOJI_NIVEL[r.nivel] || ''}`);
    }
    return `📋 *${nombre}* — inasistencia (umbral ${cfg.umbralInasistencia}%)\n${lineas.join('\n')}`;
}

// /asistencia — directo si 1 representado; botones si varios.
async function cmdAsistencia(chatId, user) {
    const reps = user.representados || [];
    if (reps.length === 0) { await svc().enviarMensaje(chatId, 'No tienes representados vinculados.'); return; }
    if (reps.length === 1) { await svc().enviarMensaje(chatId, await resumenAsistenciaTexto(reps[0])); return; }
    const botones = [];
    for (const id of reps) botones.push({ text: await nombreDe(id), callback_data: `asistencia:${id}` });
    await svc().enviarConBotones(chatId, 'Elige un representado:', botones);
}

/** Ejecuta la acción de un botón, validando que el estudiante sea del representante. */
async function ejecutarAccion(accion, estudianteId, chatId) {
    try {
        const { user, error } = await resolverRepresentante(chatId);
        if (error) { await svc().enviarMensaje(chatId, 'Primero vincúlate desde tu panel en EduTrack.'); return; }
        const esSuyo = (user.representados || []).map(String).includes(String(estudianteId));
        if (!esSuyo) { await svc().enviarMensaje(chatId, 'Ese estudiante no es tu representado.'); return; }
        switch (accion) {
            case 'asistencia': await svc().enviarMensaje(chatId, await resumenAsistenciaTexto(estudianteId)); break;
            case 'notas': await svc().enviarMensaje(chatId, await require('./telegram.commands').resumenNotasTexto(estudianteId)); break;
            case 'constancia': await svc().enviarMensaje(chatId, await require('./telegram.commands').resumenConstanciaTexto(estudianteId)); break;
            default: await svc().enviarMensaje(chatId, 'Acción no reconocida.');
        }
    } catch (e) {
        console.error('ejecutarAccion error:', e.message);
        await svc().enviarMensaje(chatId, 'Ocurrió un error, intenta más tarde.');
    }
}
```

- [ ] **Step 3: Actualizar el `module.exports`**

Cambiar el export para incluir lo nuevo:
```js
module.exports = { ejecutarComando, ejecutarAccion, resolverRepresentante, cmdMisDatos, cmdAsistencia, cmdNotas, cmdConstancia, resumenAsistenciaTexto, AYUDA };
```
(`resumenNotasTexto` y `resumenConstanciaTexto` se añaden en Task 5; el switch de `ejecutarAccion` las llama con require perezoso, así que aún no fallan porque solo se invocan al tocar esos botones. Para evitar un `undefined` si alguien toca 'notas' antes de Task 5, el placeholder `cmdNotas` sigue existiendo; `resumenNotasTexto` se define en Task 5.)

- [ ] **Step 4: Verificar E2E (asistencia del representante multi-representado → botones)**

El representante `50000010` tiene 2 representados, así que `/asistencia` debe enviar BOTONES. Espera ~4s. Run:
```bash
cd "Backend-Diagnostico-vocacional" && node -e "
require('dotenv').config();
const mongoose=require('mongoose');
(async()=>{
 await mongoose.connect(process.env.MONGO_URI);
 const User=require('./src/models/user');
 const cmds=require('./src/services/telegram.commands');
 const rep=await User.findOne({cedula:50000010}).select('telegramChatId representados').lean();
 const chatId=Number(rep.telegramChatId);
 // /asistencia -> como tiene 2, envía botones
 await cmds.ejecutarComando('/asistencia', chatId);
 // Simular que toca el botón del primer representado
 await cmds.ejecutarAccion('asistencia', String(rep.representados[0]), chatId);
 // Intentar acción con un estudiante que NO es suyo -> rechazo
 const ajeno=await User.findOne({role:'estudiante', _id:{ \$nin: rep.representados }}).select('_id').lean();
 await cmds.ejecutarAccion('asistencia', String(ajeno._id), chatId);
 console.log('Enviados: botones de /asistencia, resumen del 1er representado, y rechazo de ajeno — revisa Telegram.');
 await mongoose.disconnect();
})().catch(e=>{console.error(e.message);process.exit(1);});
"
```
Expected: sin errores; en Telegram llegan (1) el mensaje con botones "Elige un representado", (2) el resumen de inasistencia del primer representado, (3) "Ese estudiante no es tu representado." (la validación de propiedad funciona).

- [ ] **Step 5: Commit**

```bash
cd "c:/Users/Kley Marg/Desktop/Eductrack2.0" && git status --porcelain | grep -iE "\.env$" && echo "CUIDADO env" || echo "sin env real - ok"
git add Backend-Diagnostico-vocacional/src/services/telegram.commands.js
git commit -m "feat(telegram): comando /asistencia con botones y validación de propiedad del representado"
```

---

## Task 5: Comandos /notas y /constancia

**Files:**
- Modify: `Backend-Diagnostico-vocacional/src/services/telegram.commands.js`

**Interfaces:**
- Consumes: `calcularLapsosBulk` (de `academico.controller`), `Materia`, `Constancia`; `ANIO_LABEL`.
- Produces: `cmdNotas(chatId, user)`, `cmdConstancia(chatId, user)`, `resumenNotasTexto(estudianteId)`, `resumenConstanciaTexto(estudianteId)`.

- [ ] **Step 1: Añadir imports para notas/constancia**

Al inicio de `telegram.commands.js`, junto a los otros requires, añadir:
```js
const Materia = require('../models/Materia');
const Constancia = require('../models/Constancia');
const { calcularLapsosBulk } = require('../controllers/academico.controller');

/** Semáforo de una nota (escala 1-20): 🟢≥15 🟡≥11 🔴<11. */
function emojiNota(n) { if (n == null) return '⚪'; if (n >= 15) return '🟢'; if (n >= 11) return '🟡'; return '🔴'; }
```

- [ ] **Step 2: Reemplazar los placeholders `cmdNotas` y `cmdConstancia` + helpers**

Reemplazar:
```js
async function cmdNotas(chatId) { await svc().enviarMensaje(chatId, '(notas próximamente)'); }
async function cmdConstancia(chatId) { await svc().enviarMensaje(chatId, '(constancia próximamente)'); }
```
por:
```js
/** Resumen de notas SIN números exactos por materia: promedio general + semáforo por materia. */
async function resumenNotasTexto(estudianteId) {
    const nombre = await nombreDe(estudianteId);
    const secciones = await Seccion.find({ estudiantes: estudianteId }).select('nombre anio').lean();
    if (!secciones.length) return `📚 ${nombre}\nSin secciones registradas.`;
    const bloques = [];
    for (const sec of secciones) {
        const materias = await Materia.find({ seccion: sec._id }).sort({ nombre: 1 }).lean();
        if (!materias.length) continue;
        const bulk = await calcularLapsosBulk(materias.map(m => m._id), [1, 2, 3], [estudianteId]);
        const defs = [];
        const partesMateria = materias.map(m => {
            const vals = [1, 2, 3].map(l => bulk.get(`${String(m._id)}|${l}|${String(estudianteId)}`)?.acumulado).filter(v => v != null);
            const def = vals.length === 3 ? Math.round(vals.reduce((s, v) => s + v, 0) / 3) : (vals.length ? Math.round(vals.reduce((s, v) => s + v, 0) / vals.length) : null);
            if (def != null) defs.push(def);
            return `${m.nombre} ${emojiNota(def)}`;
        });
        const promedio = defs.length ? Math.round(defs.reduce((s, v) => s + v, 0) / defs.length) : null;
        bloques.push(`*${sec.anio}° ${sec.nombre}* — Promedio: ${promedio != null ? promedio + ' ' + emojiNota(promedio) : '—'}\n${partesMateria.join(' · ')}`);
    }
    return `📚 *${nombre}*\n${bloques.join('\n\n')}\n\n_Consulta el detalle en la plataforma._`;
}

/** Enlace de verificación de la última constancia del estudiante. */
async function resumenConstanciaTexto(estudianteId) {
    const nombre = await nombreDe(estudianteId);
    const c = await Constancia.findOne({ estudiante: estudianteId }).sort({ createdAt: -1 }).select('codigo tipo').lean();
    if (!c) return `No hay constancias emitidas para ${nombre} todavía.`;
    const base = (process.env.FRONTEND_URL || '').split(',')[0] || '';
    return `📄 Última constancia de ${nombre} (${c.tipo}):\n${base}/verificar/${c.codigo}`;
}

// /notas — directo si 1; botones si varios (callback_data notas:<id>).
async function cmdNotas(chatId, user) {
    const reps = user.representados || [];
    if (reps.length === 0) { await svc().enviarMensaje(chatId, 'No tienes representados vinculados.'); return; }
    if (reps.length === 1) { await svc().enviarMensaje(chatId, await resumenNotasTexto(reps[0])); return; }
    const botones = [];
    for (const id of reps) botones.push({ text: await nombreDe(id), callback_data: `notas:${id}` });
    await svc().enviarConBotones(chatId, 'Elige un representado:', botones);
}

// /constancia — directo si 1; botones si varios (callback_data constancia:<id>).
async function cmdConstancia(chatId, user) {
    const reps = user.representados || [];
    if (reps.length === 0) { await svc().enviarMensaje(chatId, 'No tienes representados vinculados.'); return; }
    if (reps.length === 1) { await svc().enviarMensaje(chatId, await resumenConstanciaTexto(reps[0])); return; }
    const botones = [];
    for (const id of reps) botones.push({ text: await nombreDe(id), callback_data: `constancia:${id}` });
    await svc().enviarConBotones(chatId, 'Elige un representado:', botones);
}
```

- [ ] **Step 3: Actualizar el `module.exports`**

```js
module.exports = { ejecutarComando, ejecutarAccion, resolverRepresentante, cmdMisDatos, cmdAsistencia, cmdNotas, cmdConstancia, resumenAsistenciaTexto, resumenNotasTexto, resumenConstanciaTexto, AYUDA };
```

- [ ] **Step 4: Verificar E2E (notas resumidas + constancia)**

Espera ~4s. Run:
```bash
cd "Backend-Diagnostico-vocacional" && node -e "
require('dotenv').config();
const mongoose=require('mongoose');
(async()=>{
 await mongoose.connect(process.env.MONGO_URI);
 const User=require('./src/models/user');
 const cmds=require('./src/services/telegram.commands');
 const rep=await User.findOne({cedula:50000010}).select('telegramChatId representados').lean();
 const chatId=Number(rep.telegramChatId);
 const est=String(rep.representados[0]);
 // Verificar el texto de notas NO contiene 'Promedio: <n>' con nota por materia numérica: debe traer emojis por materia
 const notas=await cmds.resumenNotasTexto(est);
 console.log('¿notas trae semáforo por materia (🟢/🟡/🔴)?:', /[🟢🟡🔴]/.test(notas));
 console.log('¿notas EVITA listar nota exacta por materia? (no debe haber patrón \"Materia 15\"): muestra emoji, no número por materia');
 // Enviar de verdad
 await cmds.ejecutarAccion('notas', est, chatId);
 await cmds.ejecutarAccion('constancia', est, chatId);
 console.log('Enviados resumen de notas y constancia — revisa Telegram.');
 await mongoose.disconnect();
})().catch(e=>{console.error(e.message);process.exit(1);});
"
```
Expected: `¿notas trae semáforo por materia...?: true`; sin errores; en Telegram llegan el resumen de notas (con 🟢🟡🔴 por materia + promedio general, sin la nota exacta por materia) y el enlace de la última constancia (o "No hay constancias..." si ese representado no tiene).

- [ ] **Step 5: Commit**

```bash
cd "c:/Users/Kley Marg/Desktop/Eductrack2.0" && git status --porcelain | grep -iE "\.env$" && echo "CUIDADO env" || echo "sin env real - ok"
git add Backend-Diagnostico-vocacional/src/services/telegram.commands.js
git commit -m "feat(telegram): comandos /notas (resumen con semáforo) y /constancia (enlace de verificación)"
```

---

## Task 6: Registrar comandos en el bot + verificación integral + docs

**Files:**
- Modify: `Backend-Diagnostico-vocacional/src/services/telegram.service.js` (registrar comandos con setMyCommands al iniciar — opcional pero mejora UX)
- Modify: `FLUJOS.md`

**Interfaces:**
- Consumes: todo lo anterior.

- [ ] **Step 1: Registrar la lista de comandos con Telegram (menú del cliente)**

En `telegram.service.js`, en `iniciarPolling`, tras el `console.log('Telegram: polling iniciado.')`, añadir una llamada que registra los comandos (para que aparezcan en el menú "/" del chat):
```js
    axios.post(`${API}/setMyCommands`, {
        commands: [
            { command: 'asistencia', description: '% de inasistencia de tu representado' },
            { command: 'notas', description: 'Resumen de calificaciones' },
            { command: 'misdatos', description: 'A quién representas' },
            { command: 'constancia', description: 'Enlace de tu última constancia' },
            { command: 'ayuda', description: 'Ver los comandos' },
        ],
    }, { timeout: 8000 }).catch(e => console.error('setMyCommands falló:', e.response?.data?.description || e.message));
```
(Es fire-and-forget; si falla no afecta el polling.)

- [ ] **Step 2: Verificar E2E integral (todos los comandos, con el chat real)**

Espera ~4s. Run:
```bash
cd "Backend-Diagnostico-vocacional" && node -e "
require('dotenv').config();
const mongoose=require('mongoose');
(async()=>{
 await mongoose.connect(process.env.MONGO_URI);
 const User=require('./src/models/user');
 const { ejecutarComando } = require('./src/services/telegram.commands');
 const rep=await User.findOne({cedula:50000010}).select('telegramChatId').lean();
 const chatId=Number(rep.telegramChatId);
 for (const c of ['/ayuda','/misdatos','/asistencia','/notas','/constancia']) {
   await ejecutarComando(c, chatId);
   await new Promise(r=>setTimeout(r,200));
 }
 // Chat NO vinculado -> debe recibir 'vincúlate'
 await ejecutarComando('/asistencia', 999999999);
 console.log('Enviados los 5 comandos al representante + prueba de chat no vinculado. Revisa Telegram.');
 await mongoose.disconnect();
})().catch(e=>{console.error(e.message);process.exit(1);});
"
```
Expected: sin errores; en el Telegram del representante llegan las 5 respuestas; el chat 999999999 (no vinculado) recibiría el mensaje de "vincúlate" (no se ve porque ese chat no existe, pero no debe lanzar error).

- [ ] **Step 3: Verificar que NO se rompió lo existente (notificaciones + login)**

Run:
```bash
cd "Backend-Diagnostico-vocacional" && node -e "
const http=require('http');
function login(c,p){return new Promise(r=>{const d=JSON.stringify({cedula:c,password:p});const q=http.request({hostname:'localhost',port:5000,path:'/api/auth/login',method:'POST',headers:{'Content-Type':'application/json','Content-Length':Buffer.byteLength(d)}},res=>{let b='';res.on('data',x=>b+=x);res.on('end',()=>r(JSON.parse(b)));});q.write(d);q.end();});}
(async()=>{for(const[c,p,rol] of [[11111111,'super123','superadmin'],[50000010,'50000010','representante']]){const r=await login(c,p);console.log(rol+':',!!r.token);}})();"
```
Expected: `superadmin: true`, `representante: true`.

- [ ] **Step 4: Actualizar `FLUJOS.md`**

En la sección "🔔 Notificaciones por Telegram", añadir un apartado "El representante también puede CONSULTAR escribiéndole al bot:" con la lista de comandos (`/asistencia`, `/notas`, `/misdatos`, `/constancia`, `/ayuda`) y una nota de que `/notas` muestra un resumen con semáforo (no las notas exactas) y que solo responde al representante vinculado.

- [ ] **Step 5: Commit y push**

```bash
cd "c:/Users/Kley Marg/Desktop/Eductrack2.0" && git status --porcelain | grep -iE "\.env$" && echo "CUIDADO env" || echo "sin env real - ok"
git add Backend-Diagnostico-vocacional/src/services/telegram.service.js FLUJOS.md
git commit -m "feat(telegram): registrar menú de comandos del bot y documentar comandos del representante"
git push origin dev-work-kleyver
```

---

## Self-Review (cobertura del spec)

- §3 router de mensajes (manejarUpdate/Texto/Callback, enviarConBotones, answerCallbackQuery) → Task 1 (helpers), Task 3 (router). ✅
- §4.1 /ayuda → Task 2. ✅
- §4.2 /misdatos → Task 2. ✅
- §4.3 /asistencia (directo/botones + acción) → Task 4. ✅
- §4.4 /notas (resumen sin números exactos) → Task 5. ✅
- §4.5 /constancia (enlace última) → Task 5. ✅
- §2/§6 seguridad por chat_id + rol representante + aislamiento por representados + validación de callback_data → Task 2 (`resolverRepresentante`), Task 4 (`ejecutarAccion` valida `esSuyo`). ✅
- §2 require perezoso para evitar ciclo → Task 2/3/4 (`require('./telegram.commands')` dentro de funciones). ✅
- §2 a prueba de fallos (try/catch, no tumba polling) → Task 2 (`ejecutarComando`), Task 3 (`manejarUpdate`), Task 4 (`ejecutarAccion`). ✅
- §8 criterios de aceptación → Task 6 (integral). ✅
- setMyCommands (menú, opcional del spec §7) → Task 6. ✅

**Consistencia de tipos:** `ejecutarComando(cmd, chatId)`, `ejecutarAccion(accion, estudianteId, chatId)`, `resolverRepresentante(chatId)→{user}|{error}`, `enviarConBotones(chatId, texto, [{text,callback_data}])`, `callback_data='accion:estudianteId'` — usados idénticos en Tasks 1-5. Los `resumen*Texto(estudianteId)→string` se definen antes de ser llamados por `ejecutarAccion` (Task 4 define asistencia; Task 5 añade notas/constancia; el switch usa require perezoso, así que el orden de ejecución de tasks respeta las dependencias).

**Nota de método:** el bot no tiene endpoint HTTP; la verificación es llamando a las funciones exportadas (`ejecutarComando`/`ejecutarAccion`/`manejarUpdate`) con el `telegramChatId` real del representante `50000010` (ya vinculado), lo que envía mensajes REALES a Telegram — verificación end-to-end auténtica. Sin suite de tests automatizada, consistente con las fases anteriores.
