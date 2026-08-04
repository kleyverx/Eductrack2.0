# Eductrack2.0 — guía para trabajar en este repo

Sistema académico venezolano (Educación Media General, currículo MPPE) con diagnóstico
vocacional por IA. **Eductrack es un producto propio e independiente** (sin relación con NQLN,
Pictorys ni Grupo Oxford).

## Contexto de negocio y arquitectura (Cerebro)

Este proyecto está documentado en el **Cerebro**, un wiki de todos los proyectos del escritorio
(bóveda de Obsidian). Para contexto de negocio, arquitectura resumida, vacíos de información y
mejoras sugeridas, lee su página:

- `C:/Users/Kley Marg/Documents/Obsidian Vault/Cerebro/proyectos/eductrack.md`
- Panorama general: `C:/Users/Kley Marg/Documents/Obsidian Vault/Cerebro/index.md` y
  `C:/Users/Kley Marg/Documents/Obsidian Vault/Cerebro/conexiones/mapa-general.md`

El Cerebro se mantiene desde su propia bóveda, no desde este repo. Tras cambios relevantes aquí,
abre Claude Code en la bóveda y pide: "re-analiza eductrack".

## Estructura del repo

- `Backend-Diagnostico-vocacional/` — API REST **Express 5 + Mongoose 8** (MongoDB Atlas).
  Auth **JWT + bcrypt**, login **por cédula** (no email). IA vía **OpenRouter** (nube, no Ollama).
  Bot de **Telegram** opcional (`services/telegram.service.js`). Seed en `seed.js`.
- `Frontend-Diagnostico-vocacional/` — SPA **React 19 (CRA)** + Tailwind + Recharts. PDFs con
  **jsPDF** en el cliente. Estilo **"Quiet Academic"** (slate/indigo, dark mode).
- `docs/superpowers/specs/` y `docs/superpowers/plans/` — SPECs y planes de cada fase
  (patrón brainstorming → spec → plan → construcción). Consúltalos antes de tocar una feature.

## Documentación de uso

- `README.md` — visión general, stack, instalación, credenciales de prueba.
- `FLUJOS.md` — guía paso a paso de qué hace cada rol (estudiante, docente, representante,
  super admin). **Actualízalo cuando cambie un flujo de usuario.**

## Convenciones al trabajar aquí

- **Sin suite de tests automatizada.** Verificación: backend con scripts `node -e` E2E contra el
  local (puerto 5000, nodemon); frontend con `CI=true npx react-scripts build` (los warnings de
  ESLint rompen el build).
- **Nunca commitear `.env`** (contiene MONGO_URI, JWT_SECRET, OPENROUTER_API_KEY, tokens de
  Telegram). Está en `.gitignore`.
- **Commits en español** (`feat:`/`fix:`/`docs:`). **No añadir coautoría de Claude ni menciones
  a IA** en commits, PRs ni descripciones.
- Escala de notas **1–20**, aprobatoria 10, 3 lapsos. Semáforo: 🟢≥15 🟡≥11 🔴<11.
- **Despliegue:** Frontend en Vercel, Backend en Render, DB en MongoDB Atlas. El bot de Telegram
  requiere `TELEGRAM_BOT_TOKEN` y `TELEGRAM_BOT_USERNAME` en las variables de Render.
