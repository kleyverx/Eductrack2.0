EduTrack Insight v2.0
Plataforma de Gestión Académica Integral para Educación Básica y Media General (currículo MPPE)

📌 1. Visión General
EduTrack Insight es una plataforma web de gestión académica integral, 100% online (cliente-servidor),
para escuelas y liceos venezolanos de Educación Básica y Media General bajo el currículo del MPPE.
Unifica en un solo sistema la operación académica de la institución:
● gestión de secciones, materias, planes de evaluación y notas por lapso
● boletines y constancias oficiales con código QR de verificación
● control de asistencia con semáforo de riesgo
● vínculo con los representantes (consulta del avance y avisos por Telegram)
● orientación vocacional asistida por IA
● reportes institucionales y auditoría

El enfoque es la **gestión integral de la institución**: la orientación vocacional es un valor
agregado, no el centro del producto. El sistema no solo muestra información, sino que interpreta el
estado académico del estudiante y lo hace accesible a docentes, dirección y representantes.

🚨 2. Problema
En muchas instituciones de Educación Básica y Media General:
● la gestión de notas, asistencia y constancias vive en cuadernos, hojas de cálculo y formatos sueltos
● los representantes se enteran tarde del rendimiento o la inasistencia de sus hijos
● emitir un boletín o una constancia oficial es un proceso manual, lento y difícil de verificar
● no hay trazabilidad de quién hizo qué cambio (auditoría)
● el estudiante no recibe orientación estructurada sobre su vocación

❗ Problema central:
Falta una plataforma unificada que digitalice la gestión académica completa del plantel y mantenga
informados a docentes, dirección y representantes en tiempo real.

🎯 3. Objetivo General
Ofrecer a la institución una plataforma en línea que centralice la gestión académica —secciones,
evaluación por lapsos, notas, asistencia, boletines y constancias oficiales— con control de acceso por
rol, comunicación con los representantes y orientación vocacional asistida por IA, todo bajo el marco
curricular del MPPE.

🎯 3.1 Objetivos Específicos
● Digitalizar la carga de notas por lapso según el plan de evaluación de cada materia.
● Automatizar el cálculo de promedios y la emisión de boletines.
● Emitir constancias oficiales verificables mediante código QR.
● Controlar la asistencia con un semáforo de riesgo que anticipe la deserción.
● Notificar a los representantes por Telegram y darles consulta del avance de su representado.
● Proveer un diagnóstico vocacional con IA como apoyo a la orientación estudiantil.
● Registrar la actividad sensible del sistema (auditoría) para trazabilidad y control.

🧩 4. Pilares del Sistema
El producto se organiza en cinco pilares funcionales:

📚 PILAR 1: Gestión Académica Completa
🎯 Objetivo
Administrar la estructura académica del plantel y el ciclo de evaluación.
⚙️ Funcionalidades
● gestión de secciones, materias y su asignación a docentes
● planes de evaluación por materia y lapso (currículo MPPE, 3 lapsos)
● registro de notas por lapso y cálculo automático de promedios
● generación de boletines
● emisión de constancias oficiales con código QR de verificación

📉 PILAR 2: Control de Asistencia con Semáforo de Riesgo
🎯 Objetivo
Registrar la asistencia y anticipar el riesgo de deserción.
⚙️ Funcionalidades
● registro diario de asistencia por sección
● semáforo de riesgo según umbral de inasistencia
● detección temprana de estudiantes en riesgo
● indicadores por estudiante y por sección

👨‍👩‍👧 PILAR 3: Vínculo con los Representantes
🎯 Objetivo
Mantener informado al representante sobre el avance de su representado.
⚙️ Funcionalidades
● consulta del rendimiento y la asistencia desde el rol representante
● avisos automáticos por bot de Telegram
● comandos de Telegram para consultar información puntual

🧭 PILAR 4: Orientación Vocacional con IA
🎯 Objetivo
Apoyar la orientación del estudiante con un diagnóstico estructurado.
⚙️ Funcionalidades
● test vocacional y análisis estructurado generado por IA (OpenRouter)
● chat asistente para acompañar al estudiante
● resultados descargables en PDF

📊 PILAR 5: Reportes y Auditoría
🎯 Objetivo
Dar visibilidad institucional y trazabilidad.
⚙️ Funcionalidades
● reportes académicos y de asistencia (PDF/CSV)
● reportes por centro docente e institucionales
● registro de auditoría de eventos sensibles (login, cambios de usuarios, configuración, constancias)

⚙️ 5. Requisitos Funcionales
● RF-01: autenticación de usuarios por cédula (JWT + bcrypt)
● RF-02: control de acceso por rol (estudiante / docente / representante / super admin)
● RF-03: gestión de secciones, materias y asignación docente
● RF-04: planes de evaluación por materia y lapso
● RF-05: registro de notas por lapso y cálculo de promedios
● RF-06: generación de boletines
● RF-07: emisión de constancias oficiales con QR de verificación
● RF-08: control de asistencia con semáforo de riesgo
● RF-09: consulta del representante y avisos por Telegram
● RF-10: test y análisis vocacional con IA (OpenRouter)
● RF-11: reportes académicos y de asistencia (PDF/CSV)
● RF-12: registro de auditoría de eventos sensibles

⚙️ 6. Requisitos No Funcionales
● RNF-01: arquitectura cliente-servidor en línea, desplegada en la nube
● RNF-02: separación de roles y control de acceso
● RNF-03: escalabilidad para múltiples secciones y materias
● RNF-04: interfaz intuitiva y responsiva (estilo "Quiet Academic", modo claro/oscuro)
● RNF-05: protección de datos personales y trazabilidad mediante auditoría

🏗️ 7. Arquitectura Técnica
El sistema es una plataforma cliente-servidor 100% online:

● **Frontend:** React 19 (SPA con Create React App), desplegado en **Vercel**. Visualizaciones con
  Recharts y generación de PDFs en el navegador con jsPDF.
● **Backend:** Node + Express 5 + Mongoose 8, desplegado en **Render**. API REST con autenticación
  JWT + bcrypt (login por cédula) y lógica académica según el currículo MPPE.
● **Base de datos:** **MongoDB Atlas** (en la nube).
● **IA:** **OpenRouter** (modelos Gemma 4 free + respaldos). Sin GPU ni instalación local; se usa para
  el análisis vocacional estructurado y el chat asistente.
● **Notificaciones:** bot de **Telegram** para avisos a los representantes y comandos.

Flujo general: React SPA (Vercel) ↔ API Express/Mongoose (Render) ↔ MongoDB Atlas, con OpenRouter para
la IA y Telegram para las notificaciones.

👥 8. Roles y Público Objetivo
El decisor es la **dirección del plantel**; el producto está pensado para la institución completa.
Roles del sistema:
● **Estudiante:** consulta sus notas, asistencia y boletín; realiza el test vocacional.
● **Docente:** carga notas y asistencia, gestiona sus secciones y materias, emite reportes.
● **Representante:** consulta el avance de su representado y recibe avisos por Telegram.
● **Super Admin (dirección/administración):** administra usuarios, secciones, configuración,
  constancias, reportes institucionales y auditoría.

📏 9. Reglas del Dominio (MPPE)
● Escala de notas 1–20; nota aprobatoria: 10.
● Tres lapsos por año escolar.
● Semáforo de rendimiento: 🟢 ≥ 15, 🟡 ≥ 11, 🔴 < 11.

📦 10. Alcance
✔️ Incluye:
● gestión académica completa (secciones, materias, planes, notas por lapso)
● boletines y constancias oficiales con QR
● control de asistencia con semáforo de riesgo
● vínculo con representantes (consulta + avisos por Telegram)
● orientación vocacional con IA (OpenRouter)
● reportes y auditoría
❌ No incluye:
● machine learning entrenado a la medida
● integraciones con sistemas externos del Estado
● apps móviles nativas
