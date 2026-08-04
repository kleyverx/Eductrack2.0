# Reporte de asistencia exportable — Plan de Implementación

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Permitir al docente descargar el resumen de asistencia de una sección en PDF (membrete RBV/MPPE) y CSV (Excel), reutilizando el resumen que ya se muestra en pantalla, sin ningún cambio de backend.

**Architecture:** Dos exportadores nuevos en `utils/academicoPDF.js` (mismo patrón que el preinforme: jsPDF + jspdf-autotable + helper `descargar` y `encabezado` ya existentes). En `AsistenciaPage.jsx`, la pestaña Resumen gana los botones PDF/CSV; la página carga los datos de la sección (nombre/año/período) con `getSeccion` para el membrete. Cero backend, cero dependencias nuevas.

**Tech Stack:** React 19 (CRA), jsPDF, jspdf-autotable, lucide-react. Solo frontend.

## Global Constraints

- **Sin suite de tests automatizada.** Verificación por `CI=true npx react-scripts build` (debe compilar limpio) + revisión visual de los archivos generados. La generación de PDF/CSV ocurre en el navegador (jsPDF), no se puede correr headless fácilmente; la verificación es build limpio + inspección del código de los exportadores.
- **Nunca commitear `.env`.** Verificar `git status --porcelain | grep -iE "\.env$"` vacío antes de cada commit.
- **Commits en español** (`feat:`/`fix:`). **NO añadir coautoría de Claude ni menciones a IA.** Rama `dev-work-kleyver`.
- **Estilo Quiet Academic:** botones `inline-flex items-center gap-1.5 text-sm font-semibold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/30 px-4 py-2 rounded-xl hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-colors` (mismo estilo que el resto). Iconos `FileDown` (PDF) y `FileText` (CSV) de lucide-react.
- **Cero backend nuevo:** no tocar controladores, rutas, modelos ni endpoints. El reporte usa el `resumen` de `GET /api/academico/secciones/:id/asistencia-resumen` que la página ya consume.
- **Niveles:** `good` → "Normal", `warning` → "Alerta", `danger` → "Riesgo" (🔴 riesgo se resalta en rojo en el PDF).

---

## File Structure

**Frontend (`Frontend-Diagnostico-vocacional/src/`):**
- `utils/academicoPDF.js` — modificar: +`exportAsistenciaPDF(resumen, seccion)`, +`exportAsistenciaCSV(resumen, seccion)`.
- `pages/docente/AsistenciaPage.jsx` — modificar: cargar datos de sección con `getSeccion`; añadir botones PDF/CSV en la pestaña Resumen.

Contexto ya verificado (no re-descubrir):
- `academicoPDF.js`: usa `import { jsPDF } from 'jspdf'; import autoTable from 'jspdf-autotable';`. Tiene `function encabezado(doc, titulo, subtitulo)` → devuelve la `Y` donde continuar. Tiene `function descargar(blob, nombre)`. `exportPreinformePDF` usa `autoTable(doc, { head, body, startY, styles, headStyles:{fillColor:[49,46,129]}, columnStyles, didParseCell })`, firmas con `doc.text('_____...', x, y)`, y `doc.save(nombre)`. El CSV usa `enc = v => \`"${String(v ?? '').replace(/"/g,'""')}"\``, junta filas con `;` y `\r\n`, y crea `new Blob(['\ufeff' + filasCsv], { type: 'text/csv;charset=utf-8' })` → `descargar(...)`. **Nota:** el BOM se escribe como `'\ufeff'` (carácter U+FEFF).
- `AsistenciaPage.jsx`: `const { id } = useParams();`, `const { token } = useContext(AuthContext);`. Estados: `tab` ('pase'|'resumen'), `resumen` (null=cargando, luego `{ umbral, estudiantes:[{_id,name,apellido,cedula,dias,ausencias,justificadas,pct,nivel}] }`). Tiene `nivelChip` y `nivelTexto` (mapas por nivel) definidos en el archivo. La pestaña Resumen (`tab === 'resumen'`) muestra "Umbral de riesgo: {resumen.umbral}%" y una tabla. Import actual de API: `import { getDia, guardarDia, getResumen } from '../../api/asistencia';`.
- `api/academico.js`: `export const getSeccion = (token, id) => request('GET', \`/secciones/${id}\`, token);` → devuelve `{ seccion: { _id, nombre, anio, periodo, estudiantes, ... }, materias, etiquetaAnio }`.

---

## Task 1: Exportadores de asistencia en `academicoPDF.js`

**Files:**
- Modify: `Frontend-Diagnostico-vocacional/src/utils/academicoPDF.js`

**Interfaces:**
- Consumes: `encabezado`, `descargar` (ya en el archivo), jsPDF, autoTable.
- Produces: `exportAsistenciaPDF(resumen, seccion)`, `exportAsistenciaCSV(resumen, seccion)`.
  - `resumen` = `{ umbral:number, estudiantes:[{name,apellido,cedula,dias,ausencias,justificadas,pct,nivel}] }`.
  - `seccion` = `{ nombre:string, anio:number, etiquetaAnio:string, periodo:string }`.

- [ ] **Step 1: Añadir los dos exportadores al final de `academicoPDF.js`**

Añadir al final del archivo (tras `exportCertificacionPDF`), respetando el estilo del módulo:
```js
/* ============================================================
 * Reporte de asistencia (resumen por estudiante de la sección)
 * ============================================================ */

const ASIS_ESTADO = { good: 'Normal', warning: 'Alerta', danger: 'Riesgo' };

/**
 * PDF del reporte de asistencia: tabla resumen por estudiante.
 * @param {object} resumen  { umbral, estudiantes: [...] } de asistencia-resumen
 * @param {object} seccion  { nombre, anio, etiquetaAnio, periodo }
 */
export function exportAsistenciaPDF(resumen, seccion) {
  const doc = new jsPDF(); // vertical
  const sub = `${seccion.etiquetaAnio} — Sección ${seccion.nombre} · Período ${seccion.periodo}`;
  const startY = encabezado(doc, 'REPORTE DE ASISTENCIA', sub);

  const ests = resumen.estudiantes || [];
  const head = [['N°', 'Apellidos y Nombres', 'C.I.', 'Días', 'Ausencias', 'Justif.', '% Inasist.', 'Estado']];
  const body = ests.map((e, i) => [
    i + 1,
    `${e.apellido || ''} ${e.name || ''}`.trim(),
    e.cedula ?? '',
    e.dias,
    e.ausencias,
    e.justificadas,
    e.dias > 0 ? `${e.pct}%` : '—',
    ASIS_ESTADO[e.nivel] || '—',
  ]);

  autoTable(doc, {
    head,
    body,
    startY,
    styles: { fontSize: 8, cellPadding: 1.8, halign: 'center' },
    headStyles: { fillColor: [49, 46, 129], fontSize: 8, halign: 'center' },
    columnStyles: { 1: { halign: 'left', cellWidth: 60 } },
    didParseCell(data) {
      // Resaltar en rojo el % y el estado de quienes están en riesgo (danger).
      if (data.section === 'body' && (data.column.index === 6 || data.column.index === 7)) {
        const est = ests[data.row.index];
        if (est && est.nivel === 'danger') data.cell.styles.textColor = [190, 18, 60];
      }
    },
  });

  const u = resumen.umbral;
  const alerta = Math.round(u * 0.6);
  let fy = doc.lastAutoTable.finalY + 8;
  doc.setFontSize(8);
  doc.setFont('helvetica', 'italic');
  doc.text(`Umbral de inasistencia: ${u}%. Estados: Normal < ${alerta}% · Alerta ≥ ${alerta}% · Riesgo ≥ ${u}%.`, 14, fy);

  fy = Math.max(fy + 24, 250);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text('_____________________________', 25, fy);
  doc.text('Firma del Docente', 42, fy + 5);
  doc.text('_____________________________', 125, fy);
  doc.text('Sello de la Institución', 135, fy + 5);

  doc.save(`Asistencia_${seccion.etiquetaAnio || seccion.anio}_${seccion.nombre}.pdf`);
}

/**
 * CSV del reporte de asistencia (separador ; — compatible con Excel en español).
 */
export function exportAsistenciaCSV(resumen, seccion) {
  const enc = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;
  const ests = resumen.estudiantes || [];
  const filasCsv = [
    [enc('Reporte de Asistencia'), enc(`${seccion.etiquetaAnio} Sección ${seccion.nombre}`), enc(seccion.periodo), enc(`Umbral ${resumen.umbral}%`)].join(';'),
    ['N°', 'Apellidos y Nombres', 'Cédula', 'Días', 'Ausencias', 'Justificadas', '% Inasistencia', 'Estado'].join(';'),
    ...ests.map((e, i) => [
      i + 1,
      enc(`${e.apellido || ''} ${e.name || ''}`.trim()),
      e.cedula ?? '',
      e.dias,
      e.ausencias,
      e.justificadas,
      e.dias > 0 ? e.pct : '',
      enc(ASIS_ESTADO[e.nivel] || ''),
    ].join(';')),
  ].join('\r\n');

  const blob = new Blob(['\ufeff' + filasCsv], { type: 'text/csv;charset=utf-8' });
  descargar(blob, `Asistencia_${seccion.etiquetaAnio || seccion.anio}_${seccion.nombre}.csv`);
}
```
(Verificar que `encabezado` y `descargar` existan en el archivo con esas firmas antes de usarlos; si el nombre difiere, ajustar. El módulo ya los define para el preinforme.)

- [ ] **Step 2: Verificar build (los exportadores compilan y no rompen el módulo)**

Run: `cd "Frontend-Diagnostico-vocacional" && CI=true npx react-scripts build 2>&1 | grep -E "Compiled|Failed|academicoPDF" | head -4`
Expected: `Compiled successfully.` (las funciones aún no se importan en ninguna página; solo confirma que el módulo sigue válido).

- [ ] **Step 3: Commit**

```bash
cd "c:/Users/Kley Marg/Desktop/Eductrack2.0" && git status --porcelain | grep -iE "\.env$" && echo "CUIDADO env" || echo "sin env real - ok"
git add Frontend-Diagnostico-vocacional/src/utils/academicoPDF.js
git commit -m "feat(reportes): exportadores PDF y CSV del reporte de asistencia"
```
Verificar: `git log -1 --format="%B" | grep -qi claude && echo "MAL" || echo "ok sin claude"`.

---

## Task 2: Botones PDF/CSV en la pestaña Resumen de `AsistenciaPage.jsx`

**Files:**
- Modify: `Frontend-Diagnostico-vocacional/src/pages/docente/AsistenciaPage.jsx`

**Interfaces:**
- Consumes: `exportAsistenciaPDF`, `exportAsistenciaCSV` (Task 1); `getSeccion` (de `api/academico`).
- Produces: botones de descarga en la pestaña Resumen.

- [ ] **Step 1: Importar los exportadores, `getSeccion` y los iconos**

En `AsistenciaPage.jsx`:
- Añadir a los imports: `import { getSeccion } from '../../api/academico';` y `import { exportAsistenciaPDF, exportAsistenciaCSV } from '../../utils/academicoPDF';`.
- En el bloque de iconos de lucide-react (donde ya se importan otros), añadir `FileDown` y `FileText` si no están presentes.

- [ ] **Step 2: Cargar los datos de la sección para el membrete**

Añadir un estado y su carga. Junto a los otros `useState`:
```jsx
  const [seccionInfo, setSeccionInfo] = useState(null); // { nombre, anio, etiquetaAnio, periodo }
```
Añadir un `useEffect` que cargue la sección una vez (para el encabezado del reporte):
```jsx
  useEffect(() => {
    if (!token || !id) return;
    getSeccion(token, id)
      .then((data) => setSeccionInfo({
        nombre: data.seccion.nombre,
        anio: data.seccion.anio,
        etiquetaAnio: data.etiquetaAnio,
        periodo: data.seccion.periodo,
      }))
      .catch(() => { /* sin datos de sección: los botones quedan deshabilitados */ });
  }, [token, id]);
```

- [ ] **Step 3: Añadir los botones sobre la tabla de resumen**

En la pestaña Resumen (`tab === 'resumen'`), dentro del bloque `resumen ? (...)`, JUSTO ANTES o junto al párrafo "Umbral de riesgo: ...", añadir una fila con los botones. Reemplazar el `<p>` del umbral por un contenedor flex que tenga el texto del umbral a la izquierda y los botones a la derecha:
```jsx
                <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    Umbral de riesgo: <span className="font-semibold text-slate-700 dark:text-slate-200">{resumen.umbral}%</span>
                  </p>
                  <div className="flex items-center gap-2">
                    {(() => {
                      const hayDatos = (resumen.estudiantes || []).some((e) => e.dias > 0);
                      const puede = hayDatos && seccionInfo;
                      return (
                        <>
                          <button
                            onClick={() => exportAsistenciaPDF(resumen, seccionInfo)}
                            disabled={!puede}
                            title={puede ? 'Descargar PDF' : 'Sin asistencia registrada'}
                            className="inline-flex items-center gap-1.5 text-sm font-semibold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/30 px-4 py-2 rounded-xl hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                          >
                            <FileDown className="w-4 h-4" /> PDF
                          </button>
                          <button
                            onClick={() => exportAsistenciaCSV(resumen, seccionInfo)}
                            disabled={!puede}
                            title={puede ? 'Descargar CSV (Excel)' : 'Sin asistencia registrada'}
                            className="inline-flex items-center gap-1.5 text-sm font-semibold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/30 px-4 py-2 rounded-xl hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                          >
                            <FileText className="w-4 h-4" /> CSV
                          </button>
                        </>
                      );
                    })()}
                  </div>
                </div>
```
(Eliminar el `<p>` original del umbral que estaba suelto, ya que queda integrado en este contenedor. No duplicarlo.)

- [ ] **Step 4: Verificar build**

Run: `cd "Frontend-Diagnostico-vocacional" && CI=true npx react-scripts build 2>&1 | grep -E "Compiled|Failed|AsistenciaPage" | head -4`
Expected: `Compiled successfully.` sin warnings en `AsistenciaPage`. Con CI=true los warnings de ESLint (imports sin usar, deps de hooks, variables) rompen el build; si falla, correr el build SIN grep para ver el error completo, corregir y reintentar.

- [ ] **Step 5: Commit**

```bash
cd "c:/Users/Kley Marg/Desktop/Eductrack2.0" && git status --porcelain | grep -iE "\.env$" && echo "CUIDADO env" || echo "sin env real - ok"
git add Frontend-Diagnostico-vocacional/src/pages/docente/AsistenciaPage.jsx
git commit -m "feat(reportes): botones PDF/CSV del reporte de asistencia en la pestaña Resumen"
```
Verificar: `git log -1 --format="%B" | grep -qi claude && echo "MAL" || echo "ok sin claude"`.

---

## Task 3: Verificación integral + docs

**Files:**
- Modify: `FLUJOS.md`

- [ ] **Step 1: Build final del frontend**

Run: `cd "Frontend-Diagnostico-vocacional" && CI=true npx react-scripts build 2>&1 | grep -E "Compiled|Failed" | head -2`
Expected: `Compiled successfully.`

- [ ] **Step 2: Verificación manual (documentada, requiere navegador)**

Documentar para el usuario (no ejecutable por el agente): entrar como docente (`40000000`/`docente123`), abrir una sección con asistencia registrada → pestaña Asistencia → pestaña Resumen → pulsar **PDF** (debe descargar un PDF membretado con la tabla resumen, los de riesgo en rojo, umbral y firmas) y **CSV** (debe abrir en Excel con acentos correctos). Con una sección sin asistencia, los botones aparecen deshabilitados.

- [ ] **Step 3: Actualizar `FLUJOS.md`**

En el flujo del Docente, en el punto de **Control de Asistencia**, añadir que desde la pestaña **Resumen** puede **descargar el reporte de asistencia en PDF (membretado) o CSV (Excel)**.

- [ ] **Step 4: Commit y push**

```bash
cd "c:/Users/Kley Marg/Desktop/Eductrack2.0" && git status --porcelain | grep -iE "\.env$" && echo "CUIDADO env" || echo "sin env real - ok"
git add FLUJOS.md
git commit -m "docs(flujos): descarga del reporte de asistencia (PDF/CSV) desde la pestaña Resumen"
git push origin dev-work-kleyver
```

---

## Self-Review (cobertura del spec)

- §2 datos sin backend nuevo (reutiliza `resumen`) → Task 2 (usa `resumen` de la página + `getSeccion` para el membrete). ✅
- §3.1 `exportAsistenciaPDF` (membrete, tabla, columnas, riesgo en rojo, umbral, firmas) → Task 1. ✅
- §3.2 `exportAsistenciaCSV` (mismas columnas, BOM, ;) → Task 1. ✅
- §4 botones en pestaña Resumen + deshabilitar sin datos + datos de sección → Task 2. ✅
- §5 archivos (academicoPDF.js, AsistenciaPage.jsx) → Task 1, 2. ✅
- §7 criterios de aceptación → Task 3. ✅

**Consistencia de tipos:** `exportAsistenciaPDF(resumen, seccion)` y `exportAsistenciaCSV(resumen, seccion)` (Task 1) se llaman con `(resumen, seccionInfo)` donde `seccionInfo = { nombre, anio, etiquetaAnio, periodo }` (Task 2) — coincide con lo que los exportadores consumen. `ASIS_ESTADO` mapea los niveles `good/warning/danger` iguales a los del backend.

**Nota de método:** sin tests automatizados; la generación de PDF/CSV es en el navegador (no headless), así que la verificación es build CRA limpio + inspección del código + prueba manual del usuario (Task 3 Step 2). Consistente con las fases anteriores del proyecto.
