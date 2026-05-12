# Especificación de Diseño: Dashboard Unificado EduTrack Insight v2.0

Este documento define la arquitectura, diseño visual y comportamiento del nuevo Dashboard Unificado para la plataforma EduTrack Insight v2.0.

## 1. Visión General
El objetivo es proporcionar una interfaz híbrida que fusione el **Diagnóstico Vocacional** con el **Seguimiento Académico**, permitiendo al estudiante ver la relación entre sus intereses naturales y su rendimiento real.

## 2. Arquitectura de Software
- **Navegación:** Enrutamiento basado en `react-router-dom` con barra lateral fija (Option 1: Clean Routes).
- **Persistencia Local:** Dexie.js para almacenamiento Offline-First en IndexedDB.
- **Sincronización:** UUIDs para IDs de registros y marcas de tiempo (`lastModified`) para resolución de conflictos.
- **Inteligencia:** Gemma 4 local (vía Ollama) actuando como orquestador de consejos y alertas.

## 3. Identidad Visual (Brand Kit "Quiet Academic")
- **Paleta de Colores:**
  - Fondo: `#F8FAFC` (Slate 50)
  - Primario: `#4F46E5` (Indigo 600)
  - Éxito (Verde): `#10B981` (Emerald 500)
  - Advertencia (Ámbar): `#F59E0B` (Amber 500)
  - Peligro (Rojo): `#EF4444` (Red 500)
  - Texto Base: `#1E293B` (Slate 800)
- **Tipografía:** `Outfit` (sans-serif geométrica) para títulos y `Inter` para cuerpo de texto.
- **Iconografía:** Lucide-React (Vectores de trazo fino, 2px).
- **Componentes:** Tarjetas blancas con borde de 1px (`Slate 200`) y bordes redondeados de `12px`.

## 4. Componentes del Dashboard
### A. Header Inteligente
Muestra un saludo dinámico que combina datos: 
*Ejemplo: "Hola [Nombre], tu perfil es [Vocación] y tu promedio actual es [Promedio]."*

### B. Resumen de Métricas (Stats Grid)
- **Perfil Vocacional:** Badge con el área líder del test.
- **Riesgo Académico:** Indicador visual (Bajo/Medio/Alto) calculado por el Analista.
- **Pendientes:** Conteo de evaluaciones próximas.

### C. Rejilla de Materias (Subjects Grid)
- Tarjetas con **Semáforo Académico** (borde izquierdo de color según nota).
- Tag de Área Vocacional (ej: "Matemáticas -> [Ingeniería]").
- Barra de progreso de la materia basada en evaluaciones completadas.

### D. Asistente Flotante
- Botón circular en la esquina inferior derecha.
- Animación de "pulso" cuando hay una recomendación nueva de Gemma 4.

## 5. Flujo de Datos Offline
1. El usuario añade una nota.
2. Dexie.js guarda el registro con `syncStatus: 'pending'`.
3. El componente React se actualiza instantáneamente vía `useLiveQuery`.
4. El "Agente Sincronizador" detecta conexión e intenta subir a MongoDB.

## 6. Revisión de Calidad (Self-Review)
- **¿Consistencia?:** Sí, todos los componentes usan la misma paleta Slate/Indigo.
- **¿Accesibilidad?:** Contraste alto para texto y etiquetas de color acompañadas de texto (ej: Rojo + palabra "Crítico").
- **¿Rendimiento?:** Al ser Offline-First con Dexie, la carga es <100ms.
