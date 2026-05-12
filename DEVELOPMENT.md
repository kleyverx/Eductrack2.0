# Guía de Desarrollo y Despliegue - EduTrack Insight v2.0

Este documento contiene las instrucciones técnicas para mantener, probar y desplegar el proyecto.

## 🏗️ Arquitectura de la Solución
El sistema funciona bajo un modelo **Híbrido y Offline-First**:
1.  **Frontend (React):** Gestiona la interfaz y una base de datos local (**Dexie.js**). Los datos se guardan instantáneamente en el navegador.
2.  **Backend (Node/Express):** Actúa como puente de sincronización y orquestador de la IA.
3.  **IA (Gemma 4):** Se ejecuta localmente mediante **Ollama** para garantizar privacidad y funcionamiento sin internet.

## 🚀 Estrategia de Despliegue (Sin VPS)
Para producción, utilizaremos servicios "Serverless" gratuitos:

### 1. Base de Datos (Compartida)
- **Servicio:** [MongoDB Atlas](https://www.mongodb.com/cloud/atlas).
- **Acción:** Crear un cluster gratuito y poner la URL de conexión en el `.env` (Variable: `MONGO_URI`).
- **Nota:** Asegurarse de habilitar el acceso desde cualquier IP (`0.0.0.0/0`) en el panel de Atlas para que Render pueda conectar.

### 2. Backend (API)
- **Servicio:** [Render](https://render.com) o [Railway](https://railway.app).
- **Conexión:** Vincular con la rama `main` de GitHub.
- **Variable Crítica:** La IA local (Ollama) no estará disponible en Render. Para demos, el frontend debe apuntar a un backend que corra localmente o usar un túnel (Ngrok).

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
