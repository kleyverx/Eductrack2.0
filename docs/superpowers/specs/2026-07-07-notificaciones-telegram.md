# SPEC — Notificaciones automáticas por Telegram

**Fecha:** 2026-07-07
**Estado:** Aprobado para implementación
**Contexto:** EduTrack Insight (MERN: React 19 + Express 5 + MongoDB/Mongoose 8). Reemplaza el enfoque previo de WhatsApp `wa.me` por un bot de Telegram que **envía notificaciones automáticas** desde el backend a los representantes. Telegram Bot API es gratuita.

---

## 1. Resumen

Un bot de Telegram notifica automáticamente al representante cuando ocurren eventos académicos de su representado. A diferencia de `wa.me` (que solo abre un chat pre-escrito para envío manual), aquí el **servidor envía el mensaje** sin intervención humana, gratis.

Cuatro eventos disparan notificación: **inasistencia del día**, **riesgo de inasistencia (umbral)**, **boletín publicado** y **constancia emitida**. El representante conecta su Telegram mediante un **código de vinculación** que ve en su panel. El envío es **asíncrono** (no bloquea la respuesta HTTP) y la recepción usa **polling** (`getUpdates`, sin webhook ni URL pública).

**Este SPEC deja obsoleto el de WhatsApp** (`2026-07-06-whatsapp-contacto-seguridad.md` y su plan): no se implementa WhatsApp; se implementa Telegram en su lugar. La captura de teléfono del representante NO es necesaria para Telegram (el vínculo es por código, no por teléfono).

---

## 2. Decisiones transversales

- **Token en `.env`:** `TELEGRAM_BOT_TOKEN` (creado con @BotFather). Si la variable NO está definida, el bot no arranca y todas las notificaciones se **omiten silenciosamente** (la app funciona igual, sin errores). Esto permite desplegar sin bot y activarlo después.
- **`axios`** (ya instalado) para llamar a `https://api.telegram.org/bot<TOKEN>/...`. Sin librerías de bot pesadas ni dependencias nuevas.
- **Envío asíncrono, no bloqueante:** los controladores disparan la notificación con `notificarAsync(...)` y NO hacen `await` sobre el envío antes de responder. Reintento simple (2 intentos con pausa) por mensaje; pausa de ~120 ms entre mensajes para respetar el rate-limit de Telegram (~30 msg/s).
- **Fallo aislado:** un error de Telegram nunca debe romper la operación académica (pase de lista, publicar boletín, emitir constancia). Todo el envío va en try/catch y solo se loguea.
- **Alcance:** solo al **representante**. El estudiante queda fuera de alcance.

---

## 3. Feature A — Servicio del bot (`services/telegram.service.js`)

Módulo nuevo que encapsula toda la interacción con Telegram. Exporta:

- `botActivo()` → `boolean` — `true` si `TELEGRAM_BOT_TOKEN` está definido.
- `enviarMensaje(chatId, texto)` → `Promise<boolean>` — POST a `sendMessage` con `parse_mode: 'Markdown'`. Reintenta 1 vez si falla. Devuelve `true`/`false`; nunca lanza.
- `notificarAsync(items)` donde `items = [{ chatId, texto }]` — dispara el envío en segundo plano (no se le hace `await` desde el controlador). Recorre los items con ~120 ms de pausa entre cada uno. Loguea resultados.
- `iniciarPolling()` — arranca el bucle `getUpdates` (long polling con `timeout=30`, `offset` incremental) SOLO si `botActivo()`. Procesa cada update: si el texto es un código de vinculación válido, lo maneja (ver Feature B). Se llama una vez desde `app.js` tras conectar a Mongo.

El polling mantiene el `offset` en memoria (variable del módulo); si el proceso reinicia, Telegram reenvía los updates no confirmados. No requiere persistir el offset.

---

## 4. Feature B — Vinculación por código

### 4.1 Modelo (extensión de `User`)
- `telegramChatId: { type: String, sparse: true }` — el chat de Telegram del usuario (null si no vinculado).
- `telegramCodigo: { type: String }` — código temporal de vinculación (null tras vincular).

### 4.2 Generar el código (representante)
- `GET /api/telegram/mi-codigo` (rol representante) → si el usuario no tiene `telegramChatId`, genera (si no existe) un `telegramCodigo` corto y legible (6 chars alfanuméricos en mayúscula, ej. `AB12CD`), lo guarda y lo devuelve junto con el `username` del bot (`TELEGRAM_BOT_USERNAME` de `.env`, para armar el enlace `https://t.me/<bot>`). Si ya está vinculado, devuelve `{ vinculado: true }`.
- `POST /api/telegram/desvincular` (rol representante) → borra `telegramChatId` (deja de recibir).

### 4.3 Procesar el código (en el polling)
- Cuando llega un mensaje al bot: normalizar el texto (trim, mayúsculas, quitar un `/start ` inicial si viene con deep-link). Buscar `User.findOne({ telegramCodigo: texto })`.
  - Si existe: setear `telegramChatId = update.message.chat.id`, limpiar `telegramCodigo`, y responder por Telegram: `✅ Vinculado, {nombre}. Recibirás avisos de tus representados.`
  - Si no existe: responder `No reconozco ese código. Genéralo desde tu panel en EduTrack.`
- El comando `/start` sin código responde con instrucciones de cómo vincularse.

### 4.4 Panel del representante (frontend)
- En `RepresentanteDashboard`, una tarjeta "Notificaciones por Telegram":
  - Si NO vinculado: botón "Conectar Telegram" → llama `GET /api/telegram/mi-codigo`, muestra el código `AB12CD` y un enlace `https://t.me/<bot>` con instrucciones ("Abre el bot y envía este código").
  - Si vinculado: indicador "✅ Telegram conectado" + botón "Desconectar".

---

## 5. Feature C — Los cuatro eventos

Cada evento arma `items` (representantes con `telegramChatId` de los estudiantes afectados) y llama `notificarAsync(items)`. Helper compartido `representantesDe(estudianteIds)` → `[{ chatId, estudianteNombre }]` (1 consulta: `User.find({ role:'representante', representados: { $in }, telegramChatId: { $ne: null } })`).

### 5.1 Inasistencia del día
- **Dónde:** `asistencia.controller.js`, `guardarAsistenciaDia`, tras guardar el pase de lista.
- **Condición:** para cada registro con `estado === 'ausente'`.
- **Mensaje:** `📌 {estudiante} fue reportado(a) *ausente* hoy en {etiquetaAnio} {seccion}.`

### 5.2 Riesgo de inasistencia (umbral)
- **Dónde:** mismo `guardarAsistenciaDia`, tras recalcular el resumen (usa `resumenInasistencia` + umbral de config).
- **Condición:** estudiantes cuyo `nivel === 'danger'` (pct ≥ umbral) **y** que no estaban en danger antes de este pase (evitar spam diario). Si detectar el "antes" es costoso, alternativa aceptable: notificar solo cuando el estado del día es ausente Y el nivel es danger. El plan elegirá la más simple sin spamear.
- **Mensaje:** `⚠️ {estudiante} alcanzó {pct}% de inasistencia (umbral {umbral}%). Está en riesgo de perder derecho a evaluación.`

### 5.3 Boletín publicado
- **Dónde:** `academico.controller.js`, `toggleBoletin`, cuando se PUBLICA (no al despublicar).
- **Condición:** a los representantes de todos los estudiantes de la sección.
- **Mensaje:** `📊 Ya están disponibles las calificaciones de {estudiante} del {lapso}. Consúltelas en la plataforma EduTrack.` (sin incluir la nota).

### 5.4 Constancia emitida
- **Dónde:** `constancia.controller.js`, `emitir`, tras crear la constancia (solo tipos por estudiante: estudios, conducta, con-representante; el de rendimiento es por sección, se omite).
- **Mensaje:** `📄 Se emitió una constancia de {tipo} para {estudiante}. Verifíquela: {FRONTEND_URL}/verificar/{codigo}`

---

## 6. Modelos / rutas / archivos

**Backend nuevos/modificados:**
| Archivo | Cambio |
|---|---|
| `services/telegram.service.js` | **nuevo** (envío, notificarAsync, polling, procesar código) |
| `controllers/telegram.controller.js` | **nuevo** (`miCodigo`, `desvincular`) |
| `routes/telegram.routes.js` | **nuevo** (`GET /mi-codigo`, `POST /desvincular`) |
| `models/user.js` | +`telegramChatId`, +`telegramCodigo` |
| `app.js` | montar ruta `/api/telegram`; llamar `iniciarPolling()` tras conectar Mongo |
| `asistencia.controller.js` | disparar eventos 5.1 y 5.2 |
| `academico.controller.js` | disparar evento 5.3 (toggleBoletin) |
| `constancia.controller.js` | disparar evento 5.4 (emitir) |

**Frontend:**
| Archivo | Cambio |
|---|---|
| `api/telegram.js` | **nuevo** (`miCodigo`, `desvincular`) |
| `pages/representante/RepresentanteDashboard.jsx` | tarjeta "Notificaciones por Telegram" |

**Config:** `.env` gana `TELEGRAM_BOT_TOKEN` y `TELEGRAM_BOT_USERNAME`. Documentar en `.env.template` (sin valores reales).

---

## 7. Rutas nuevas

```
GET  /api/telegram/mi-codigo    (rol representante)
POST /api/telegram/desvincular  (rol representante)
```
(La recepción de mensajes del bot NO es una ruta HTTP: es el polling interno.)

---

## 8. Fuera de alcance (esta fase)

- Notificaciones al estudiante (solo representante).
- Comandos interactivos del bot (consultar notas/asistencia por chat).
- Webhook (se usa polling).
- Múltiples instituciones / múltiples bots.
- Envío de imágenes o PDF por Telegram.
- WhatsApp (queda descartado; este SPEC lo reemplaza).

---

## 9. Riesgos y notas de despliegue

- **Render free duerme a los 15 min:** mientras el servicio duerme, el polling no corre; las vinculaciones y notificaciones se procesan al despertar (Telegram retiene los updates ~24h). Aceptable para demo; para producción conviene un plan que no duerma o migrar a webhook.
- **Una sola instancia de polling:** si en el futuro se escala a múltiples instancias, dos pollings con el mismo token se pisan (Telegram da 409). Fuera de alcance ahora (Render free = 1 instancia).
- **Token secreto:** `TELEGRAM_BOT_TOKEN` nunca se commitea (va en `.env`, ya en `.gitignore`).

---

## 10. Criterios de aceptación

- [ ] Un representante ve su código en el panel, lo envía al bot, y queda vinculado (el bot confirma).
- [ ] Al marcar a un estudiante ausente en el pase de lista, su representante vinculado recibe el aviso de inasistencia.
- [ ] Al cruzar el umbral, el representante recibe el aviso de riesgo (sin spamear cada día).
- [ ] Al publicar un boletín, los representantes de la sección reciben el aviso (sin la nota).
- [ ] Al emitir una constancia por estudiante, su representante recibe el enlace de verificación.
- [ ] Si `TELEGRAM_BOT_TOKEN` no está en `.env`, la app funciona normal y no se envía nada (sin errores).
- [ ] Un fallo de Telegram nunca rompe el pase de lista, la publicación de boletín ni la emisión de constancia.
- [ ] Build del frontend limpio; endpoints verificados. No se rompe nada de las fases anteriores.
