# SPEC — Reporte de asistencia exportable (Fase A del módulo de reportes)

**Fecha:** 2026-07-08
**Estado:** Aprobado para implementación
**Contexto:** EduTrack Insight (MERN). Primera fase del módulo de reportes. Hoy la asistencia se ve en pantalla (`AsistenciaPage`, pestaña Resumen) pero **no se puede exportar**. Esta fase añade la exportación a PDF y CSV del resumen de asistencia por sección.

---

## 1. Resumen

Permitir al docente **descargar** el resumen de inasistencia de una sección en **PDF** (membrete oficial RBV/MPPE, para imprimir/archivar) y **CSV** (Excel, para procesar). Es una fase deliberadamente pequeña: **cero backend nuevo**, reutiliza el endpoint y los cálculos existentes; casi todo es frontend siguiendo el patrón ya establecido en `academicoPDF.js`.

Decisiones acordadas:
- **Nivel:** resumen por estudiante (una fila por estudiante), NO detalle día por día.
- **Formatos:** PDF + CSV.
- **Alcance temporal:** todo lo registrado (reutiliza `asistencia-resumen`; sin selector de rango).
- **Ubicación:** botones en la pestaña **Resumen** de `AsistenciaPage`.

---

## 2. Datos (sin backend nuevo)

El endpoint existente `GET /api/academico/secciones/:id/asistencia-resumen` (rol docente) ya devuelve:
```json
{
  "umbral": 25,
  "estudiantes": [
    { "_id": "...", "name": "...", "apellido": "...", "cedula": 12345678,
      "dias": 10, "ausencias": 3, "justificadas": 1, "pct": 30, "nivel": "danger" }
  ]
}
```
`AsistenciaPage` ya consume esto en la pestaña Resumen (estado `resumen`). Los exportadores reciben ese objeto tal cual + los datos de la sección (año/nombre/período) que la página ya tiene. **No se añade ni modifica ningún endpoint, controlador ni modelo.**

Niveles: `good` (🟢 Normal), `warning` (🟡 Alerta), `danger` (🔴 Riesgo).

---

## 3. Exportadores (nuevos en `utils/academicoPDF.js`)

Siguen el mismo molde que `exportPreinformePDF`/`exportPreinformeCSV` (mismos imports jsPDF + autoTable, helper `encabezado` y `descargar` ya existentes en el archivo).

### 3.1 `exportAsistenciaPDF(resumen, seccion)`
- `resumen` = respuesta de `asistencia-resumen` (`{ umbral, estudiantes: [...] }`).
- `seccion` = `{ nombre, anio, etiquetaAnio, periodo }` (datos que la página ya tiene).
- PDF vertical (`new jsPDF()`), membrete con `encabezado(doc, 'REPORTE DE ASISTENCIA', sub)` donde `sub = ${etiquetaAnio} — Sección ${nombre} · Período ${periodo}`.
- Tabla con `autoTable`:
  - Head: `['N°', 'Apellidos y Nombres', 'C.I.', 'Días', 'Ausencias', 'Justif.', '% Inasist.', 'Estado']`.
  - Body: por estudiante `[i+1, "${apellido} ${name}", cedula, dias, ausencias, justificadas, dias>0 ? pct+'%' : '—', ESTADO_LABEL[nivel]]` donde `ESTADO_LABEL = { good:'Normal', warning:'Alerta', danger:'Riesgo' }`.
  - `headStyles.fillColor = [49, 46, 129]` (indigo, como el preinforme). `styles.fontSize` ~8, `halign:'center'`; columna 1 (nombre) `halign:'left'`.
  - `didParseCell`: si `data.section==='body'` y la fila corresponde a nivel `danger`, colorear la celda de `% Inasist.` y `Estado` en rojo `[190,18,60]`. (Determinar el nivel por el índice de fila contra `resumen.estudiantes`.)
- Tras la tabla: nota al pie `Umbral de inasistencia: ${umbral}%. Estados: Normal < ${Math.round(umbral*0.6)}% · Alerta ≥ ${Math.round(umbral*0.6)}% · Riesgo ≥ ${umbral}%.` (fuente pequeña, itálica), y firmas: "Firma del Docente" y "Sello de la Institución" (igual que el preinforme).
- `doc.save(`Asistencia_${etiquetaAnio}_${nombre}.pdf`)`. (Si `etiquetaAnio` trae caracteres raros, usar `anio` como respaldo en el nombre del archivo.)

### 3.2 `exportAsistenciaCSV(resumen, seccion)`
- Mismas columnas que el PDF. Separador `;` con BOM (`'﻿'`) para Excel en español, idéntico al CSV del preinforme.
- Encabezado de contexto en la primera línea (título + sección + período), luego la fila de columnas, luego una fila por estudiante.
- `descargar(blob, `Asistencia_${etiquetaAnio}_${nombre}.csv`)`.

---

## 4. UI — botones en la pestaña Resumen (`AsistenciaPage.jsx`)

- En la pestaña **Resumen**, sobre la tabla de resumen ya existente, añadir dos botones: **"PDF"** y **"CSV"** (mismo estilo Quiet Academic que los del preinforme: `inline-flex ... bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 ...`, iconos `FileDown` / `FileText` de lucide-react).
- Al pulsar, llaman `exportAsistenciaPDF(resumen, seccion)` / `exportAsistenciaCSV(resumen, seccion)` con el `resumen` ya cargado y los datos de la sección.
- Los botones se **deshabilitan** si el resumen está vacío o ningún estudiante tiene `dias > 0` (nada que exportar), con tooltip "Sin asistencia registrada".
- `AsistenciaPage` debe tener a mano los datos de la sección (`nombre`, `anio`, `etiquetaAnio`, `periodo`). Si hoy no los carga, obtenerlos del detalle de la sección (`getSeccion`) o incluirlos; el plan resolverá de dónde tomarlos sin backend nuevo (probablemente ya vienen al cargar la página o se piden a `getSeccion`).

---

## 5. Archivos afectados

| Archivo | Cambio |
|---|---|
| `Frontend/src/utils/academicoPDF.js` | +`exportAsistenciaPDF`, +`exportAsistenciaCSV` |
| `Frontend/src/pages/docente/AsistenciaPage.jsx` | +botones PDF/CSV en la pestaña Resumen; asegurar datos de sección disponibles |

Sin cambios de backend, modelos, rutas ni dependencias.

---

## 6. Fuera de alcance (fases futuras del módulo de reportes)

- Detalle día por día (matriz estudiantes × fechas).
- Selector de rango de fechas o por lapso.
- Centro de Reportes del docente (agrupar todos los reportes en una pantalla).
- Reportes institucionales agregados (Super Admin).
- Módulo genérico de reportes + auditoría real.

---

## 7. Criterios de aceptación

- [ ] En la pestaña Resumen de asistencia aparecen los botones PDF y CSV.
- [ ] El PDF sale con membrete RBV/MPPE, la tabla resumen (N°, nombre, C.I., días, ausencias, justificadas, % inasistencia, estado), el umbral al pie y las firmas.
- [ ] Los estudiantes en riesgo (`danger`) aparecen resaltados en rojo en el PDF.
- [ ] El CSV abre correctamente en Excel (acentos OK por el BOM) con las mismas columnas.
- [ ] Si no hay asistencia registrada, los botones están deshabilitados.
- [ ] Build del frontend limpio (CI=true). No se rompe nada del resto de la app. Sin cambios de backend.
