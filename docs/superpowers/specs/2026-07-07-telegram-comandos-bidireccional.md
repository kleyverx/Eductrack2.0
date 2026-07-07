# SPEC — Bot de Telegram bidireccional: comandos de consulta del representante

**Fecha:** 2026-07-07
**Estado:** Aprobado para implementación
**Contexto:** EduTrack Insight (MERN). Extiende el bot de Telegram (que hoy solo NOTIFICA) para que también RESPONDA comandos que el representante le pide. Reutiliza la infraestructura existente: `telegram.service.js` con polling (`getUpdates`) y `procesarCodigo` para la vinculación.

---

## 1. Resumen

El bot pasa de una vía (notifica) a dos vías (conversa). Un representante vinculado le escribe comandos y el bot responde con datos de sus representados, **en solo lectura**. Comandos: `/ayuda`, `/misdatos`, `/asistencia`, `/notas`, `/constancia`.

Decisiones clave (ya acordadas):
- **Seguridad por `chat_id`:** el bot identifica a quien escribe por su `telegramChatId`; solo responde a representantes vinculados y solo con datos de SUS representados.
- **Privacidad de menores:** `/notas` da un **resumen** (promedio general + semáforo por materia 🟢🟡🔴), NO los números exactos. `/asistencia` da % + semáforo.
- **Multi-representado con botones:** si el representante tiene varios, el bot muestra botones (inline keyboard) para elegir; con uno solo, responde directo.
- **Fuera de alcance:** citas con el director (fase futura), comandos para otros roles, notas exactas, generar PDF por el bot.

---

## 2. Decisiones transversales

- **Router de mensajes:** hoy el polling llama `procesarCodigo(texto, chatId)`. Se amplía a un manejador `manejarUpdate(update)` que distingue **mensajes de texto** (comandos o código de vinculación) y **callback_query** (toques de botón). La lógica de comandos vive en un módulo nuevo `telegram.commands.js` para no engordar `telegram.service.js`.
- **Identidad:** cada comando arranca con `User.findOne({ telegramChatId: String(chatId) })`. Si no existe → mensaje de "vincúlate primero" (salvo que el texto sea un código de 6 chars, que se intenta vincular como hoy). Si existe pero no es `representante` → "Este bot es para representantes."
- **Aislamiento:** un comando solo consulta estudiantes en `user.representados`. Los botones llevan un `estudianteId`; antes de responder se valida que ese id esté en `user.representados` (rechazar si no).
- **Reutilización:** `/asistencia` usa `resumenInasistencia` (de `asistencia.controller`); `/notas` usa `calcularLapsosBulk` (de `academico.controller`) + `getConfig` + `ANIO_LABEL`. La lógica ya existe en `representante.controller.js` (`detalleEstudiante`); el módulo de comandos la replica de forma mínima o importa los helpers.
- **A prueba de fallos:** cada comando en try/catch; ante error responde "Ocurrió un error, intenta más tarde." y loguea. Nunca tumba el polling.
- **Solo lectura:** ningún comando modifica datos.

---

## 3. Feature A — Router de mensajes (ampliar `telegram.service.js`)

- El bucle de polling deja de llamar directamente a `procesarCodigo`; ahora llama `manejarUpdate(update)`.
- `manejarUpdate(update)`:
  - Si `update.message?.text`: `manejarTexto(texto, chatId)`.
  - Si `update.callback_query`: `manejarCallback(callbackQuery)` (toque de botón).
- `manejarTexto(texto, chatId)`:
  - Normaliza. Si empieza con `/` → es comando → delega en `telegram.commands.js` (`ejecutarComando(cmd, chatId)`).
  - Si NO empieza con `/` y parece código de vinculación (6 chars alfanum) → `procesarCodigo` (comportamiento actual).
  - Si no → responde con `/ayuda` breve.
- El servicio exporta un helper `enviarConBotones(chatId, texto, botones)` que usa `sendMessage` con `reply_markup: { inline_keyboard }` (cada botón: `{ text, callback_data }`).
- `manejarCallback(cbq)`: extrae `chatId`, `data` (ej. `asistencia:<estudianteId>`), responde el `answerCallbackQuery` (para quitar el "reloj" de Telegram) y ejecuta la acción con el `estudianteId` (validando propiedad).

`callback_data` de Telegram tiene límite de 64 bytes → usar formato compacto `accion:estudianteId` (el ObjectId cabe).

---

## 4. Feature B — Módulo de comandos (`telegram.commands.js`)

Módulo nuevo. Depende de: `User`, `Seccion`, `Materia`, `resumenInasistencia`, `calcularLapsosBulk`, `getConfig`, `ANIO_LABEL`, `Constancia`, y del servicio (`enviarMensaje`, `enviarConBotones`). Exporta `ejecutarComando(cmd, chatId)` y `ejecutarAccion(accion, estudianteId, chatId)`.

Helper interno `resolverRepresentante(chatId)` → devuelve el `User` representante vinculado o `null` (con su `representados`).

### 4.1 `/ayuda` (y `/start` de un ya vinculado)
Responde el listado:
```
Comandos disponibles:
/asistencia — % de inasistencia de tu representado
/notas — resumen de calificaciones
/misdatos — a quién representas
/constancia — enlace de verificación de la última constancia
/ayuda — esta ayuda
```

### 4.2 `/misdatos`
Lista nombre y cédula de cada representado, y confirma "✅ Telegram vinculado". Sin datos académicos.

### 4.3 `/asistencia`
- Si 1 representado: responde directo con `resumenInasistencia` de sus secciones → `{pct}% de inasistencia {emoji semáforo}` (good=🟢, warning=🟡, danger=🔴) + "umbral {U}%".
- Si varios: `enviarConBotones(chatId, 'Elige un representado:', [...])` con `callback_data: asistencia:<estudianteId>`.
- La acción `asistencia:<id>` (callback) valida propiedad y responde el resumen de ese estudiante.

### 4.4 `/notas`
- Igual patrón (directo si 1, botones si varios; `callback_data: notas:<id>`).
- Respuesta = **resumen sin números exactos**: por cada materia, el semáforo según su definitiva (o acumulado si no hay 3 lapsos): 🟢≥15, 🟡≥11, 🔴<11; y el **promedio general** (número, es agregado, menos sensible que la nota por materia). Ej.:
```
📚 Juan — 1° A
Promedio general: 14 🟡
Matemática 🟢 · Castellano 🟡 · Biología 🔴 · ...
Consulta el detalle en la plataforma.
```

### 4.5 `/constancia`
- Igual patrón (directo/botones; `callback_data: constancia:<id>`).
- Busca la última `Constancia` del estudiante (`estudiante: id`, orden `createdAt` desc). Si existe, responde el enlace `{FRONTEND_URL}/verificar/{codigo}`. Si no, "No hay constancias emitidas para {nombre} todavía."

---

## 5. Modelos / archivos

**Backend:**
| Archivo | Cambio |
|---|---|
| `services/telegram.service.js` | modificar: `manejarUpdate`, `manejarTexto`, `manejarCallback`, `enviarConBotones`, `answerCallbackQuery`; el polling procesa `message` y `callback_query`. |
| `controllers/telegram.commands.js` | **nuevo** (o `services/telegram.commands.js`): `ejecutarComando`, `ejecutarAccion`, helpers de cada comando. |

No hay cambios de modelo (todo se lee de lo existente). No hay rutas HTTP nuevas (el bot es interno). No hay cambios de frontend.

**Nota de dependencia circular:** `telegram.commands.js` importa del servicio y viceversa (el servicio llama a commands). Para evitar el ciclo: el servicio importa `commands` de forma perezosa (`require` dentro de la función `manejarUpdate`), o commands recibe las funciones de envío por parámetro. El plan decidirá; preferencia: `require` perezoso dentro del handler.

---

## 6. Seguridad (resumen)

- Identidad SIEMPRE por `chat_id` → `telegramChatId`. Nunca por lo que el usuario diga.
- Rol: solo `representante`. Otros roles → mensaje de rechazo, sin datos.
- Aislamiento: solo estudiantes en `user.representados`; los `callback_data` con `estudianteId` se validan contra `representados` antes de responder.
- Los datos expuestos son mínimos: asistencia (% + semáforo), notas (semáforo + promedio, sin nota exacta), constancia (enlace público). Sin cédulas de terceros, sin datos de otros estudiantes.

---

## 7. Fuera de alcance (esta fase)

- **Citas con el director** (fase futura, SPEC propio): solicitar, notificar al director, confirmar/rechazar.
- Comandos para docente/estudiante/superadmin.
- Notas con números exactos por Telegram.
- Generación de PDF por el bot.
- Menús persistentes / comandos registrados con @BotFather (setMyCommands) — opcional, se puede añadir luego.

---

## 8. Criterios de aceptación

- [ ] Un representante vinculado envía `/ayuda` y recibe el listado de comandos.
- [ ] `/misdatos` responde a quién representa, sin datos académicos.
- [ ] `/asistencia` responde el % + semáforo (directo si 1 representado; con botones si varios).
- [ ] `/notas` responde promedio general + semáforo por materia, SIN números exactos por materia.
- [ ] `/constancia` responde el enlace de verificación de la última constancia (o avisa que no hay).
- [ ] Un chat NO vinculado recibe "vincúlate primero" y ningún dato.
- [ ] Un usuario vinculado que no es representante recibe el mensaje de rechazo.
- [ ] Un `callback_data` con un estudianteId que no es del representante es rechazado (no filtra datos).
- [ ] Un error en un comando no tumba el polling; responde un mensaje de error genérico.
- [ ] No se rompe la vinculación por código ni las notificaciones automáticas ya existentes.
