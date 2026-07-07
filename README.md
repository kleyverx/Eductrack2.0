# EduTrack Insight v2.0 🎓

**Plataforma de gestión académica y orientación vocacional para Educación Media General
venezolana (currículo MPPE), con análisis por IA.**

EduTrack Insight reúne, en una sola herramienta, el seguimiento del rendimiento académico
(secciones, notas por lapso, boletines, constancias) y el autodescubrimiento vocacional
asistido por inteligencia artificial. Está pensada para estudiantes, docentes, representantes
e instituciones, con paneles separados y protegidos por rol.

---

## ✨ Características principales

### 👥 Cuatro roles con paneles propios
* **Estudiante** — ve sus notas por lapso, boletines en PDF y su test vocacional.
* **Docente** — gestiona secciones, materias, planes de evaluación, carga de notas,
  preinformes, asistencia, boletines, certificaciones y constancias.
* **Representante** — consulta (solo lectura) las notas, asistencia y perfil vocacional de
  sus representados, y recibe avisos por Telegram.
* **Super Admin** — panel global de estadísticas, gestión de usuarios y configuración de la
  institución.

### 📚 Gestión académica (estándar MPPE)
* Currículo oficial (1ro a 5to año) con materias por año.
* Notas en escala 1–20, 3 lapsos, con acumulados y definitivas calculados automáticamente.
* Boletines publicables por lapso y **certificación de calificaciones 1ro–4to** (estándar OPSU).
* **Control de asistencia** con pase de lista por sección/día y semáforo de inasistencia
  (umbral configurable).
* **Constancias oficiales en PDF** (estudios, conducta, rendimiento, con representante) con
  código de control, **código QR** y página pública de verificación.

### 🔔 Bot de Telegram (opcional, gratuito)
* **Avisos automáticos** al representante: inasistencia, riesgo por umbral, boletín publicado
  y constancia emitida.
* **Comandos de consulta:** `/asistencia`, `/notas` (resumen con semáforo), `/misdatos`,
  `/constancia`, `/ayuda`. Vinculación por código desde el panel; seguridad por cuenta de
  Telegram vinculada.

### 🧠 Diagnóstico vocacional con IA
* Test de 80 ítems que identifica afinidades por áreas de conocimiento.
* Análisis estructurado por IA (perfil, fortalezas, carreras sugeridas, próximos pasos) y
  asistente conversacional con el contexto del estudiante.
* La IA se sirve vía **OpenRouter** (modelos en la nube), sin necesidad de GPU local.

### 🎨 Diseño "Quiet Academic"
* Interfaz minimalista con **modo claro/oscuro**.
* **Semáforo académico** (🟢 sólido / 🟡 en observación / 🔴 en riesgo) e iconografía
  **Lucide-React**.

---

## 🛠️ Stack tecnológico

* **Frontend:** React 19 (Create React App), Tailwind CSS, React Router, Recharts,
  jsPDF + jspdf-autotable, `qrcode`, Lucide-React.
* **Backend:** Node.js + Express 5, MongoDB (Mongoose 8), JWT + bcrypt, helmet,
  express-rate-limit, axios.
* **IA:** OpenRouter (API compatible con OpenAI; modelos gratuitos con cadena de respaldo).
* **Notificaciones:** Telegram Bot API (gratuita).
* **Despliegue:** Frontend en Vercel, Backend en Render, base de datos en MongoDB Atlas.

---

## 🚀 Instalación y configuración

### 1. Requisitos
* [Node.js](https://nodejs.org/) v18+
* Una base de datos MongoDB (local o [Atlas](https://www.mongodb.com/atlas))
* (Opcional) Una API key de [OpenRouter](https://openrouter.ai/) para la IA
* (Opcional) Un bot de Telegram creado con [@BotFather](https://t.me/BotFather) para los avisos

### 2. Backend
```bash
cd Backend-Diagnostico-vocacional
npm install
```
Crea un archivo `.env` basado en `.env.template` y configura al menos `MONGO_URI` y
`JWT_SECRET`. Para la IA, añade `OPENROUTER_API_KEY`. Para el bot, añade
`TELEGRAM_BOT_TOKEN` y `TELEGRAM_BOT_USERNAME` (si no los pones, la app funciona igual y
simplemente no envía avisos de Telegram).

### 3. Frontend
```bash
cd Frontend-Diagnostico-vocacional
npm install
```
Configura `REACT_APP_API_URL` (por ejemplo `http://localhost:5000/api` en local).

### 4. Datos de prueba (opcional)
```bash
cd Backend-Diagnostico-vocacional
node seed.js
```
Puebla la base con usuarios, secciones y notas de demo.

### 5. Iniciar
* **Backend:** `npm run dev` (nodemon) — puerto 5000
* **Frontend:** `npm start` — puerto 3000

Credenciales de prueba (login por cédula): superadmin `11111111`/`super123`,
docente `40000000`/`docente123`, estudiante `22222222`/`estudiante123`,
representante `50000010`/`50000010`.

---

## 📖 Documentación

* **[FLUJOS.md](FLUJOS.md)** — guía de uso paso a paso por cada rol.
* `docs/superpowers/` — especificaciones y planes de implementación de cada fase.

---

**Repositorio:** [https://github.com/kleyverx/Eductrack2.0.git](https://github.com/kleyverx/Eductrack2.0.git)
