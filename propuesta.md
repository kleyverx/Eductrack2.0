EduTrack Insight v2.0
Sistema Inteligente Offline-First de Analítica Académica, Simulación y
Retroalimentación Educativa
📌 1. Visión General
EduTrack Insight es una plataforma web offline-first que transforma datos académicos en decisiones accionables,
integrando:
● analítica de rendimiento académico
● simulación de escenarios de notas
● detección temprana de riesgo académico
● monitoreo de retroalimentación docente
● recomendación de acciones para el estudiante
El sistema no solo muestra información, sino que interpreta el estado académico y su evolución.
🚨 2. Problema
En entornos educativos tradicionales:
● el estudiante no entiende su progreso real
● no puede anticipar si aprobará o no
● la retroalimentación es tardía o no medible
● los datos académicos están dispersos y no generan decisiones
❗ Problema central:
Falta un sistema unificado de observabilidad del aprendizaje, que permita entender, simular y actuar sobre el
rendimiento académico.
🎯 3. Objetivo General
Desarrollar un sistema de analítica educativa offline-first que permita modelar, simular y monitorear el desempeño
académico estudiantil y la calidad del proceso de evaluación mediante indicadores de riesgo, predicción
determinística y trazabilidad de retroalimentación.
🧩 4. Arquitectura Conceptual
El sistema se organiza en 4 capas:

1. Capa de datos → IndexedDB
2. Capa lógica académica → cálculos, simulación, riesgo
3. Capa analítica → métricas, tendencias, feedback
4. Capa de presentación → dashboards y visualización
   🚀 5. Épicas del Sistema
   📚 EPIC 1: Gestión Académica
   🎯 Objetivo
   Administrar estudiantes, docentes, materias y evaluaciones.
   ⚙️ Funcionalidades
   ● CRUD de usuarios
   ● CRUD de materias
   ● gestión de evaluaciones
   ● registro de notas
   📊 EPIC 2: Motor de Rendimiento Académico
   🎯 Objetivo
   Analizar el rendimiento del estudiante.
   ⚙️ Funcionalidades
   ● promedio general y por materia
   ● evolución temporal de notas
   ● rendimiento por evaluación
   ● detección de materias críticas
   ⚠️ EPIC 3: Índice de Riesgo Académico
   🎯 Objetivo
   Detectar estudiantes en riesgo.
   ⚙️ Funcionalidades
   ● cálculo de riesgo (bajo/medio/alto)
   ● análisis de tendencia
   ● evaluación de rendimiento reciente
   ● actualización dinámica del riesgo
   🔮 EPIC 4: Simulación Académica
   🎯 Objetivo
   Permitir escenarios futuros de desempeño.
   ⚙️ Funcionalidades
   ● simulación de nota futura
   ● cálculo de nota mínima para aprobar
   ● comparación de escenarios
   ● análisis de impacto por evaluación
   🧑‍🏫 EPIC 5: Observabilidad del Feedback Docente
   🎯 Objetivo
   Medir la calidad temporal del feedback.
   ⚙️ Funcionalidades
   ● registro de entrega de evaluaciones
   ● registro de corrección
   ● cálculo de tiempo de retroalimentación
   ● métricas por docente
   🚨 EPIC 6: Sistema de Alertas Inteligentes
   🎯 Objetivo
   Detectar patrones de riesgo automáticamente.
   ⚙️ Funcionalidades
   ● alertas por caída de rendimiento
   ● alertas por riesgo académico
   ● alertas por retraso de feedback
   ● detección de cambios bruscos
   📈 EPIC 7: Visualización y Dashboard
   🎯 Objetivo
   Visualizar información académica.
   ⚙️ Funcionalidades
   ● gráficos de rendimiento
   ● evolución temporal
   ● comparación entre materias
   ● visualización del riesgo
   💾 EPIC 8: Offline-First y Sincronización
   🎯 Objetivo
   Permitir uso sin conexión.
   ⚙️ Funcionalidades
   ● almacenamiento en IndexedDB
   ● funcionamiento offline completo
   ● sincronización cuando hay conexión
   ● manejo básico de conflictos
   📤 EPIC 9: Exportación de Reportes
   🎯 Objetivo
   Exportar información académica.
   ⚙️ Funcionalidades
   ● exportación de notas
   ● exportación de reportes
   ● exportación de métricas
   ● formatos CSV/PDF
   ⚙️ 6. Requisitos Funcionales
   ● RF-01: autenticación de usuarios
   ● RF-02: gestión de estudiantes y docentes
   ● RF-03: gestión de materias y evaluaciones
   ● RF-04: registro de notas
   ● RF-05: cálculo de promedios
   ● RF-06: visualización de rendimiento
   ● RF-07: cálculo de índice de riesgo
   ● RF-08: simulación de notas futuras
   ● RF-09: cálculo de nota necesaria para aprobar
   ● RF-10: alertas automáticas
   ● RF-11: métricas de feedback docente
   ● RF-12: funcionamiento offline
   ● RF-13: sincronización de datos
   ● RF-14: exportación de reportes
   ⚙️ 7. Requisitos No Funcionales
   ● RNF-01: respuesta menor a 300ms en operaciones locales
   ● RNF-02: funcionamiento 100% offline
   ● RNF-03: separación de roles (estudiante/docente)
   ● RNF-04: escalabilidad para múltiples cursos
   ● RNF-05: interfaz intuitiva y responsiva
   🧠 8. Innovación del Sistema
   EduTrack Insight introduce:
   ● analítica académica dinámica
   ● simulación de escenarios de aprendizaje
   ● índice de riesgo basado en comportamiento
   ● observabilidad del feedback docente
   ● sistema offline-first educativo real
   ● recomendaciones de acción académica
   📦 9. Alcance
   ✔️ Incluye:
   ● gestión académica completa
   ● dashboards interactivos
   ● simulador de notas
   ● índice de riesgo
   ● sistema de alertas
   ● métricas de feedback docente
   ● funcionamiento offline
   ❌ No incluye:
   ● machine learning avanzado
   ● IA generativa
   ● integración institucional externa
   ● apps móviles nativas
