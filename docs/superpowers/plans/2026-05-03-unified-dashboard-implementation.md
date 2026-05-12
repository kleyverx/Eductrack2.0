# Plan de Implementación: Dashboard Unificado EduTrack Insight v2.0

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Transformar la interfaz actual en un Dashboard Unificado (Vocacional + Académico) con navegación por rutas, diseño "Quiet Academic" y persistencia local con Dexie.js.

**Architecture:** Aplicación de una sola página (SPA) con `react-router-dom`, una barra lateral persistente y una arquitectura offline-first. Los datos se consumen desde IndexedDB (vía Dexie) y se sincronizan en segundo plano.

**Tech Stack:** React 19, Tailwind CSS, Lucide-React, Dexie.js, Axios, React Router.

---

### Task 1: Estructura de Navegación (Sidebar + Router)

**Files:**
- Modify: `Frontend-Diagnostico-vocacional/src/App.js`
- Create: `Frontend-Diagnostico-vocacional/src/components/Sidebar.jsx`
- Create: `Frontend-Diagnostico-vocacional/src/layouts/MainLayout.jsx`

- [x] ~~**Step 1: Crear el componente Sidebar con Lucide Icons**~~
- [x] ~~**Step 2: Configurar MainLayout para envolver las rutas**~~
- [x] ~~**Step 3: Actualizar App.js con las nuevas rutas**~~

---

### Task 2: Dashboard Unificado v2 (Interfaz e Integración de Datos)

**Files:**
- Modify: `Frontend-Diagnostico-vocacional/src/pages/admin/DashboardPage.jsx`
- Create: `Frontend-Diagnostico-vocacional/src/components/SubjectCard.jsx`

- [x] ~~**Step 1: Crear el componente SubjectCard con Semáforo Académico**~~
- [x] ~~**Step 2: Rediseñar DashboardPage para consumir Dexie.js**~~

---

### Task 3: Integración del Asistente Local (Gemma 4 Chat)

**Files:**
- Modify: `Frontend-Diagnostico-vocacional/src/components/Chatbot.jsx`

- [x] ~~**Step 1: Actualizar Chatbot para usar la API del Backend (Ollama)**~~
- [x] ~~**Step 2: Aplicar diseño de botones y burbujas minimalistas**~~

---

### Task 4: Sincronización Automática (Segundo Plano)

**Files:**
- Create: `Frontend-Diagnostico-vocacional/src/hooks/useSync.js`

- [ ] **Step 1: Implementar lógica de escaneo de Dexie y envío a MongoDB**
