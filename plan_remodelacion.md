# Plan de Acción: EduTrack Insight v2.0 (Arquitectura Offline-First + Local AI)

Este documento detalla los pasos para migrar el sistema hacia **EduTrack Insight v2.0**, integrando **Gemma 4** como motor de inteligencia local para garantizar privacidad y funcionamiento 100% offline.

---

## 🛠️ 1. Remodelación del Stack Tecnológico

### Frontend (Adiciones)
*   **Dexie.js:** Base de datos local (IndexedDB) para persistencia instantánea.
*   **Workbox:** Gestión de Service Workers para PWA y carga offline.
*   **Gemma 4 (WASM/WebGPU):** Exploración de ejecución directa en navegador para modelos E2B.

### Backend (Adiciones y Ajustes)
*   **Ollama / Local Inference:** Servidor local para ejecutar **Gemma 4 (4B/31B)** sin depender de APIs externas.
*   **Endpoints de Sincronización:** `/api/sync` para reconciliación de datos IndexedDB -> MongoDB.
*   **Agentic AI Controller:** Rediseño del controlador para aprovechar las capacidades de *function calling* de Gemma 4.

---

## 📋 2. Fases de Ejecución Actualizadas

### Fase 1: Transición de Datos y Limpieza (Backend)
- [x] ~~Mantener y optimizar los modelos de diagnóstico vocacional existentes (`Test.js`, `Question.js`, `Result.js`).~~
- [x] ~~Crear nuevos modelos académicos: `Subject.js`, `Evaluation.js`, `Grade.js`.~~
- [x] ~~Implementar campos de auditoría (`lastModified`, `syncStatus`).~~

### Fase 2: Integración de Inteligencia Local (Gemma 4)
- [x] ~~Configurar **Ollama** en el entorno de desarrollo/servidor.~~
- [x] ~~Migrar `aiAsistent.controller.js` para conectar con el endpoint local de Gemma 4.~~
- [ ] **Prompt Engineering 2.0:** Ajustar instrucciones para lógica académica (riesgo, simulación) y modo agéntico.

### Fase 3: Motor Offline-First y Sincronización
- [x] ~~Configurar esquema de Dexie.js en el Frontend.~~
- [x] ~~Implementar la *Sincronización Silenciosa* con manejo de conflictos por timestamps.~~
- [ ] Habilitar PWA para que la interfaz cargue sin internet.

### Fase 4: Lógica Académica y Dashboards
- [ ] **Simulador Agéntico:** Integrar Gemma 4 con funciones de cálculo de notas.
- [x] ~~**Dashboard de Evolución:** Gráficos dinámicos con Recharts.~~
- [ ] **Alertas de Riesgo:** Algoritmo de detección de caídas de rendimiento.

### Fase 5: Validación y Exportación
- [ ] Pruebas de estrés: 100% offline con IA local respondiendo.
- [ ] Exportación de reportes académicos detallados (PDF/CSV).
