# EduTrack Insight v2.0 🚀

**Plataforma Educativa Híbrida: Orientación Vocacional + Analítica Académica Offline-First con IA Local.**

EduTrack Insight v2.0 es una herramienta integral diseñada para estudiantes y docentes que fusiona el autodescubrimiento vocacional con el seguimiento preciso del rendimiento académico. Construida bajo una filosofía de privacidad y resiliencia, la plataforma funciona totalmente sin conexión a internet y utiliza inteligencia artificial local de vanguardia.

---

## ✨ Características Principales

### 🧠 Inteligencia Artificial Local (Gemma 4)
*   **Privacidad Total:** El asistente académico y vocacional corre localmente en tu hardware mediante **Ollama**. Nada sale a la nube.
*   **Análisis Contextual:** La IA analiza tus resultados del test vocacional y tus notas académicas para ofrecerte consejos personalizados y detectar riesgos de reprobar.
*   **Modo Agéntico:** Capacidad de razonamiento avanzado para simular escenarios de notas y sugerir planes de estudio.

### 📶 Arquitectura Offline-First
*   **Resiliencia:** Gracias a **Dexie.js (IndexedDB)**, puedes registrar materias y notas en el aula de clases sin necesidad de Wi-Fi.
*   **Sincronización Inteligente:** Uso de UUIDs y marcas de tiempo para sincronizar datos con el servidor central (MongoDB) de forma automática cuando recuperes la conexión.

### 🎯 Diagnóstico Vocacional Híbrido
*   **Test Profesional:** Evaluación de 80 ítems que identifica afinidades en 8 áreas de conocimiento.
*   **Visión 360°:** El Dashboard unificado muestra cómo tus notas actuales se alinean con tu vocación ideal.

### 🎨 Diseño "Quiet Academic"
*   **Dashboard Intuitivo:** Interfaz minimalista que elimina la carga cognitiva.
*   **Semáforo Académico:** Indicadores visuales instantáneos (Verde/Ámbar/Rojo) sobre el estado de tus materias.
*   **Iconografía Vectorial:** Uso de iconos limpios de **Lucide-React** para una apariencia profesional.

---

## 🛠️ Stack Tecnológico

*   **Frontend:** React 19, Tailwind CSS, React Router, Recharts, Dexie.js (IndexedDB).
*   **Backend:** Node.js, Express, MongoDB (Mongoose).
*   **IA:** Gemma 4 (Google DeepMind) ejecutado localmente vía Ollama.
*   **Herramientas:** Axios, UUID, Lucide-React.

---

## 🚀 Instalación y Configuración

### 1. Requisitos Previos
*   [Node.js](https://nodejs.org/) (v18+)
*   [MongoDB](https://www.mongodb.com/try/download/community) corriendo localmente o en la nube.
*   [Ollama](https://ollama.com/) instalado en el sistema.

### 2. Configuración de la IA Local
Descarga el modelo recomendado (Gemma 4 E2B para eficiencia o E4B para mayor inteligencia):
```bash
ollama run gemma4:e2b
```

### 3. Clonar y Configurar Backend
```bash
cd Backend-Diagnostico-vocacional
npm install
```
Crea un archivo `.env` basado en el ejemplo y configura tu `MONGO_URI` y los parámetros de Ollama.

### 4. Configurar Frontend
```bash
cd Frontend-Diagnostico-vocacional
npm install
```

### 5. Iniciar la Aplicación
*   **Backend:** `npm run dev`
*   **Frontend:** `npm start`

---

## 👥 Equipo y Contribuciones
Desarrollado con un enfoque multi-agente para asegurar un código limpio, escalable y profesional.

**Repositorio:** [https://github.com/kleyverx/Eductrack2.0.git](https://github.com/kleyverx/Eductrack2.0.git)
