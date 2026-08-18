# Guía de Desarrollo y Despliegue - EduTrack v2.0

Este documento contiene las instrucciones técnicas para mantener, probar y desplegar el proyecto.

## 🏗️ Arquitectura de la Solución
El sistema es una plataforma **cliente-servidor 100% online**:
1.  **Frontend (React 19, SPA):** Interfaz de usuario construida con Create React App. Consume la API por HTTP (JWT) y genera PDFs en el navegador con jsPDF.
2.  **Backend (Node/Express 5 + Mongoose 8):** API REST que orquesta la lógica académica, la autenticación (JWT + bcrypt, login por cédula) y las integraciones. Los datos persisten en **MongoDB Atlas**.
3.  **IA (Gemma 4 vía OpenRouter):** El análisis vocacional y el chat asistente se resuelven en la nube a través de OpenRouter. No requiere GPU ni instalación local: solo la variable `OPENROUTER_API_KEY`.
4.  **Notificaciones (Telegram):** Bot opcional que envía avisos a los representantes y atiende comandos.

## 🚀 Estrategia de Despliegue (Sin VPS)
Para producción, utilizaremos servicios "Serverless" gratuitos:

### 1. Base de Datos (Compartida)
- **Servicio:** [MongoDB Atlas](https://www.mongodb.com/cloud/atlas).
- **Acción:** Crear un cluster gratuito y poner la URL de conexión en el `.env` (Variable: `MONGO_URI`).
- **Nota:** Asegurarse de habilitar el acceso desde cualquier IP (`0.0.0.0/0`) en el panel de Atlas para que Render pueda conectar.

### 2. Backend (API)
- **Servicio:** [Render](https://render.com) o [Railway](https://railway.app).
- **Conexión:** Vincular con la rama `main` de GitHub.
- **Variables Críticas:** `MONGO_URI` (Atlas), `JWT_SECRET` y `OPENROUTER_API_KEY` (la IA corre en la nube vía OpenRouter, no hace falta ningún servicio local). Opcional: `TELEGRAM_BOT_TOKEN` y `TELEGRAM_BOT_USERNAME` para el bot de avisos.

### 3. Frontend (Web)
- **Servicio:** [Vercel](https://vercel.com).
- **Conexión:** Vincular con la rama `main`. Se despliega automáticamente al detectar cambios.

## 🛠️ Entorno de Pruebas
1. Los desarrolladores trabajan en ramas `feat/nombre-tarea`.
2. Los cambios se mezclan en la rama `dev` para pruebas de integración.
3. Se recomienda usar la base de datos local para desarrollo diario para no ensuciar la de producción.

## 📝 Reglas de Código
- **Comentarios:** Usar JSDoc para funciones críticas.
- **Variables:** Nombres descriptivos en español o inglés (mantener consistencia).
- **Commits:** Seguir el formato `feat: ...`, `fix: ...` o `docs: ...`.
