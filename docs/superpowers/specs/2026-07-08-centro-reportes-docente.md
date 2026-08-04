# SPEC — Centro de Reportes del docente (Fase B del módulo de reportes)

**Fecha:** 2026-07-08
**Estado:** Aprobado para implementación
**Contexto:** EduTrack Insight (MERN). Segunda fase del módulo de reportes. Hoy los reportes del docente están dispersos en varias pantallas (preinforme en el detalle de sección, asistencia en su pestaña, certificación por estudiante, constancias en el detalle). Esta fase los reúne en una pantalla única de acceso.

---

## 1. Resumen

Una pantalla nueva **"Centro de Reportes"** (`/app/docente/reportes`) donde el docente elige una de sus secciones y ve, en un solo lugar, accesos directos a todos los reportes disponibles de esa sección. **No reimplementa** ningún reporte: enlaza/lanza los que ya existen. Cero backend nuevo.

Objetivo: que el docente no tenga que recordar en qué pantalla está cada reporte.

---

## 2. Alcance

- **Incluye:** una pantalla que lista las secciones del docente; al elegir una, muestra tarjetas con los reportes disponibles de esa sección, cada una enlazando/lanzando el reporte existente.
- **NO incluye:** ningún reporte nuevo, ni cambios de backend, ni tocar la lógica de los reportes existentes.

---

## 3. Reportes que agrupa (todos ya existen)

Por sección seleccionada, el centro ofrece:

| Reporte | Cómo se accede hoy | En el centro |
|---|---|---|
| **Preinforme** (por lapso, PDF/CSV) | `/app/docente/secciones/:id/preinforme` | Enlace a esa página |
| **Asistencia** (resumen + export PDF/CSV) | `/app/docente/secciones/:id/asistencia` (pestaña Resumen) | Enlace a esa página |
| **Boletines** (publicar/estado) | dentro del preinforme / detalle | Enlace al detalle de la sección |
| **Detalle de sección** (estudiantes, constancias, certificaciones) | `/app/docente/secciones/:id` | Enlace al detalle |

Cada tarjeta lleva a la página existente; el docente hace ahí la descarga como siempre. (Las constancias y certificaciones se emiten desde el detalle de la sección / por estudiante, así que el acceso es vía el detalle.)

---

## 4. UI

Pantalla nueva `pages/docente/ReportesPage.jsx`, estilo Quiet Academic + dark mode:
- **Header:** icono `FileText` en cuadro indigo, título "Centro de Reportes", subtítulo "Todos los reportes de tus secciones en un solo lugar".
- **Selector de sección:** al cargar, `listarSecciones(token)`. Muestra las secciones como chips/botones (`{anio}° {nombre} — {periodo}`); el activo con `bg-indigo-600 text-white`. Si el docente no tiene secciones, estado vacío ("Aún no tienes secciones. Créalas en Mis Secciones").
- **Tarjetas de reporte** (para la sección activa): una grilla de tarjetas, cada una con icono, título, breve descripción y un botón/enlace:
  - **Preinforme académico** → `Link` a `/app/docente/secciones/:id/preinforme` (icono `FileBarChart`).
  - **Reporte de asistencia** → `Link` a `/app/docente/secciones/:id/asistencia` (icono `CalendarCheck`).
  - **Constancias y certificaciones** → `Link` a `/app/docente/secciones/:id` (icono `Award`) — desde el detalle se emiten.
- Tarjetas con el estilo de tarjeta del proyecto (`bg-white dark:bg-slate-900 rounded-2xl border ...`, hover suave).

---

## 5. Ruteo y menú

- `App.js`: añadir la ruta dentro del bloque docente: `<Route path="docente/reportes" element={<ReportesPage />} />`.
- `Sidebar.jsx`: añadir al menú del docente una entrada `{ name: 'Reportes', path: '/app/docente/reportes', icon: FileText }` (tras "Mis Secciones").

---

## 6. Archivos afectados

| Archivo | Cambio |
|---|---|
| `Frontend/src/pages/docente/ReportesPage.jsx` | **nuevo** |
| `Frontend/src/App.js` | +ruta `docente/reportes` |
| `Frontend/src/components/Sidebar.jsx` | +entrada "Reportes" en el menú del docente |

Consume `listarSecciones` (de `api/academico.js`, ya existe). Sin backend, modelos ni dependencias nuevas.

---

## 7. Fuera de alcance (otras fases)

- Reporte institucional agregado (Fase C).
- Auditoría real (Fase D).
- Constructor genérico de reportes.

---

## 8. Criterios de aceptación

- [ ] El docente ve "Reportes" en su menú lateral y una pantalla en `/app/docente/reportes`.
- [ ] Puede elegir una de sus secciones y ver las tarjetas de reportes de esa sección.
- [ ] Cada tarjeta enlaza a la página correcta (preinforme, asistencia, detalle).
- [ ] Si no tiene secciones, se muestra un estado vacío claro.
- [ ] Build del frontend limpio (CI=true). Sin cambios de backend. No se rompe nada existente.
