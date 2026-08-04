# SPEC — Reporte institucional del Super Admin (Fase C del módulo de reportes)

**Fecha:** 2026-07-08
**Estado:** Aprobado para implementación
**Contexto:** EduTrack Insight (MERN). Tercera fase del módulo de reportes. El Super Admin tiene hoy un panel de estadísticas de usuarios/vocacional, pero **no un reporte académico agregado del plantel**. Esta fase añade un reporte institucional con 4 bloques de métricas y su exportación a PDF.

---

## 1. Resumen

Un reporte institucional para el Super Admin que agrega, a nivel de todo el plantel:
1. **Rendimiento por año/sección** — promedio general y aprobados/aplazados.
2. **Asistencia global** — % de inasistencia promedio por sección y estudiantes en riesgo.
3. **Matrícula** — estudiantes por año/sección, total y distribución por género.
4. **Vocacional** — áreas vocacionales más frecuentes.

Se sirve desde un endpoint nuevo `GET /api/admin/reporte-institucional` (superadmin), se muestra en una página nueva `/app/admin/reportes`, y se puede exportar a PDF membretado. Reutiliza los cálculos existentes (`calcularLapsosBulk`, `resumenInasistencia`, `getConfig`).

---

## 2. Backend — endpoint de agregación

Nuevo controlador `controllers/reporteInstitucional.controller.js` + ruta en `dashboard.routes.js` (o una ruta nueva), `GET /api/admin/reporte-institucional` con `auth(['superadmin'])`.

Devuelve un objeto:
```json
{
  "generadoEn": "2026-07-08T...",
  "totales": { "estudiantes": 0, "docentes": 0, "secciones": 0, "hombres": 0, "mujeres": 0 },
  "porSeccion": [
    { "seccion": "1° A", "anio": 1, "periodo": "2025-2026", "docente": "González",
      "estudiantes": 6, "promedio": 14, "aprobados": 5, "aplazados": 1,
      "inasistenciaPromedio": 12, "enRiesgo": 1 }
  ],
  "vocacional": [ { "area": "Ingeniería...", "cantidad": 4 } ]
}
```

### 2.1 Cálculo (en bloque, sin N+1)
- **Totales:** `User.countDocuments` por rol y sexo (como el dashboard actual).
- **Por sección:** para cada `Seccion` (con su docente poblado), obtener sus materias y estudiantes; usar `calcularLapsosBulk(materiaIds, [1,2,3], estudianteIds)` (1-2 consultas por sección) para computar la **definitiva por estudiante** (promedio de las definitivas de sus materias, si tiene las 3 lapsos; si no, con lo cargado). `promedio` = media de esos promedios de estudiante. `aprobados` = estudiantes con promedio ≥ 10; `aplazados` = con promedio < 10 (y con al menos una nota). `inasistenciaPromedio` y `enRiesgo` desde `resumenInasistencia(seccion._id, umbral)` (umbral de `getConfig`): media de `pct` y conteo de `nivel === 'danger'`.
- **Vocacional:** reutilizar la agregación de `TestResult` que ya existe en `dashboard.controller` (top áreas por `$objectToArray` de `results`). Se puede extraer a un helper o replicar.
- Rendimiento aceptable: el plantel de demo es pequeño (pocas secciones); iterar secciones con `calcularLapsosBulk` por sección es suficiente. Documentar que a gran escala convendría un pipeline de agregación, pero fuera de alcance ahora.

---

## 3. Frontend — página del reporte

Página nueva `pages/admin/ReporteInstitucionalPage.jsx` (`/app/admin/reportes`), estilo Quiet Academic + dark mode:
- **Header:** icono `BarChart3` indigo, título "Reporte Institucional", subtítulo "Resumen académico del plantel", y botón **"Descargar PDF"**.
- **KPIs (totales):** tarjetas con estudiantes, docentes, secciones, y distribución H/M.
- **Tabla "Rendimiento y asistencia por sección":** columnas Sección · Docente · Estudiantes · Promedio · Aprobados · Aplazados · % Inasist. · En riesgo. Colorear promedio con semáforo académico (`getScoreStyles`) y % inasistencia por nivel.
- **Bloque vocacional:** lista/gráfica de las áreas más frecuentes (reusar Recharts si ya se usa; o una lista simple con barras). Puede ser una lista con conteo si se quiere simple.
- Loader mientras carga; estado de error si el endpoint falla.

### 3.1 Exportación PDF
Nuevo exportador en `utils/reportesPDF.js` (o añadir a `academicoPDF.js`): `exportReporteInstitucionalPDF(data)` — membrete RBV/MPPE con `encabezado`, título "REPORTE INSTITUCIONAL", los totales como texto, la tabla por sección con `autoTable`, y las áreas vocacionales. Firmas del Director. `doc.save('Reporte_Institucional.pdf')`.

---

## 4. Ruteo y menú

- `App.js`: ruta `<Route path="admin/reportes" element={<ReporteInstitucionalPage />} />` en el bloque superadmin.
- `Sidebar.jsx`: entrada `{ name: 'Reportes', path: '/app/admin/reportes', icon: BarChart3 }` en el menú del superadmin (tras "Panel Global").
- `api/reporteInstitucional.js` (nuevo): `getReporteInstitucional(token)`.

---

## 5. Archivos afectados

**Backend:**
| Archivo | Cambio |
|---|---|
| `controllers/reporteInstitucional.controller.js` | **nuevo** |
| `routes/dashboard.routes.js` | +ruta `GET /reporte-institucional` (o archivo de ruta nuevo montado en app.js) |

**Frontend:**
| Archivo | Cambio |
|---|---|
| `api/reporteInstitucional.js` | **nuevo** |
| `pages/admin/ReporteInstitucionalPage.jsx` | **nuevo** |
| `utils/reportesPDF.js` | **nuevo** (o exportador en academicoPDF.js) |
| `App.js` | +ruta admin/reportes |
| `components/Sidebar.jsx` | +entrada "Reportes" superadmin |

Sin modelos ni dependencias nuevas (reutiliza calcularLapsosBulk, resumenInasistencia, jsPDF).

---

## 6. Fuera de alcance

- Filtros por período/año (el reporte es del estado actual con el período activo).
- Exportación CSV del institucional (solo PDF esta fase; se puede añadir luego).
- Auditoría (Fase D).
- Gráficas avanzadas / drill-down por estudiante.

---

## 7. Criterios de aceptación

- [ ] `GET /api/admin/reporte-institucional` (superadmin) devuelve totales, por-sección y vocacional; un no-superadmin recibe 403.
- [ ] La página `/app/admin/reportes` muestra los KPIs, la tabla por sección (con semáforos) y el bloque vocacional.
- [ ] "Descargar PDF" genera el reporte membretado con la tabla y las áreas.
- [ ] El cálculo por sección no hace N+1 desmedido (usa calcularLapsosBulk por sección).
- [ ] Build del frontend limpio + endpoint verificado E2E. No se rompe nada existente.
