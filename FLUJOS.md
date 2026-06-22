# 📘 EduTrack Insight — Guía de Flujos de Uso

Plataforma de **gestión académica** para Educación Media General (Venezuela, currículo MPPE)
con **orientación vocacional asistida por IA**. Esta guía explica, paso a paso, qué hace cada
tipo de usuario.

---

## 🔑 Acceso y credenciales de prueba

El inicio de sesión es **por cédula** (no por email). Entra en la pantalla de acceso (`/auth`).

| Rol | Cédula | Contraseña | Qué puede hacer |
|-----|--------|-----------|-----------------|
| 🛡️ **Super Admin** | `11111111` | `super123` | Panel global, gestión de usuarios, configuración, auditoría |
| 👩‍🏫 **Docente** | `40000000` | `docente123` | Secciones, materias, notas, preinformes, boletines, certificaciones |
| 👨‍🏫 **Docente 2** | `40000001` | `docente123` | (igual que docente) |
| 🎓 **Estudiante** | `22222222` | `estudiante123` | Ver notas, test vocacional, boletines, asistente IA |

> Al entrar, cada rol es llevado automáticamente a **su propio panel**. Nadie puede ver el
> panel de otro rol (las rutas están protegidas).

---

## 🎓 Flujo del ESTUDIANTE

1. **Inicia sesión** → llega a **Mi Panel Académico** (`/app/dashboard`).
2. En el panel ve:
   - Su **perfil vocacional** (área destacada) en el banner superior.
   - **KPIs**: materias activas, promedio general, materias en riesgo.
   - **Semáforo de riesgo** y **evolución del promedio** por lapso.
   - Tarjetas de sus **materias** (con su semáforo de color 🟢🟡🔴).
3. **Clic en una materia** → abre "Mis Materias" con esa materia desplegada,
   mostrando el detalle de notas por lapso.
4. **Mis Materias** (`/app/subjects`): tabla de materias × lapsos (1er/2do/3er) con la
   nota definitiva. Al expandir una materia ve el plan de evaluación (si el docente lo publicó).
5. **Boletines**: descarga su boletín en PDF por lapso — **solo cuando el docente lo publica**
   (los lapsos no publicados aparecen con candado 🔒).
6. **Test Vocacional** (`/app/test`): responde el test (una sola vez). Al terminar, la IA
   genera su análisis. Si ya lo hizo, ve una tarjeta que lo invita a revisar sus resultados.
7. **Resultados** (`/app/results/:id`): perfil vocacional + gráfico de áreas + **análisis con IA**
   (resumen, fortalezas, **carreras universitarias sugeridas** y próximos pasos). Puede
   **exportar a PDF** o **"Preguntarle a la IA"** (abre el asistente Gemma con su contexto).
8. **Asistente Gemma** 💬 (botón flotante, esquina inferior derecha): chat con IA que conoce
   sus materias, notas y perfil vocacional para darle consejos.

---

## 👩‍🏫 Flujo del DOCENTE

1. **Inicia sesión** → **Panel Docente** (`/app/docente`): KPIs reales de sus secciones
   (estudiantes, materias, calificaciones en riesgo), semáforo por lapso y lista de secciones
   con su promedio.
2. **Mis Secciones** (`/app/docente/secciones`):
   - **Crear sección**: elige el **año** (1ro a 5to) → las **materias del currículo oficial MPPE**
     se cargan automáticamente (puedes desmarcar las que no dictes) → eliges el nombre de la
     sección (ej. "A").
3. **Dentro de una sección** (`/app/docente/secciones/:id`), dos pestañas:
   - **Materias**: lista de materias; agregar/eliminar; cada una con su botón "Plan y Notas".
   - **Estudiantes**: asignar estudiantes de 3 formas:
     - **Buscar** estudiantes ya registrados y marcarlos.
     - **Crear nuevo** (nombre, apellido, cédula) — se crea e inscribe; su contraseña inicial
       es su cédula.
     - **Importar CSV**: pegar una lista `cédula,nombre,apellido` (copiada de Excel) → crea e
       inscribe a todos de golpe.
4. **Plan y Notas de una materia** (`/app/docente/materias/:id`):
   - **Plan de Evaluación** por lapso: agrega actividades (examen, taller, etc.) con su % —
     deben **sumar 100%**. Botón para hacerlo visible u oculto a los estudiantes.
   - **Carga de Notas**: cuadrícula estudiantes × actividades (escala 1–20). El **acumulado**
     del lapso se calcula solo, con color de semáforo.
5. **Preinforme** (`/app/docente/secciones/:id/preinforme`):
   - Matriz estudiantes × materias del lapso, con promedio por estudiante.
   - **Exportar PDF** (membretado MPPE) o **CSV** (Excel).
   - **Publicar boletín**: habilita que los estudiantes descarguen su boletín de ese lapso.
6. **Certificación de Calificaciones** (`/app/docente/certificacion/:estudianteId`):
   desde la pestaña Estudiantes → botón "Certificación". Genera el certificado **1ro a 4to año**
   (estándar OPSU) en PDF, con definitivas por materia, promedio por año y promedio general.

---

## 🛡️ Flujo del SUPER ADMIN

1. **Inicia sesión** → **Panel Global** (`/app/admin`): estadísticas de todo el sistema
   (usuarios, distribución por género/edad, áreas vocacionales más populares, crecimiento).
2. **Gestión de Usuarios** (`/app/admin/usuarios`):
   - Listar y buscar todos los usuarios.
   - **Crear usuario** de cualquier rol.
   - Cambiar el **rol** de un usuario o **eliminarlo**.
3. **Configuración** (`/app/admin/config`): ajustes de la institución (nombre, escala de notas,
   umbrales del semáforo, activar IA). *Nota: se guarda localmente en el navegador por ahora.*
4. **Auditoría** (`/app/admin/logs`): registro de actividad del sistema. *Nota: vista de ejemplo;
   el registro real requiere ampliación del backend.*

---

## 🤖 Asistente de IA (Gemma)

- Funciona vía **OpenRouter** (modelos gratuitos en la nube; no requiere instalar nada local).
- El estudiante lo abre con el botón flotante ✨ o desde "Pregúntale a la IA" en sus resultados.
- Conoce el contexto del estudiante (materias, notas, perfil vocacional) para dar consejos
  personalizados en español.
- Si un modelo gratuito está saturado, reintenta automáticamente con otros de respaldo.

---

## 🗺️ Mapa de pantallas (rutas)

```
/                                          Landing pública
/auth                                      Iniciar sesión / crear cuenta
/app                                       (redirige al panel según el rol)

ESTUDIANTE
  /app/dashboard                           Mi Panel Académico
  /app/subjects                            Mis Materias (notas por lapso, boletines)
  /app/test                                Test Vocacional
  /app/results/:id                         Resultados + análisis IA

DOCENTE
  /app/docente                             Panel Docente
  /app/docente/secciones                   Mis Secciones
  /app/docente/secciones/:id               Detalle de sección (materias / estudiantes)
  /app/docente/secciones/:id/preinforme    Preinforme + publicar boletín
  /app/docente/materias/:id                Plan de evaluación y carga de notas
  /app/docente/certificacion/:estudianteId Certificación 1ro–4to (PDF)

SUPER ADMIN
  /app/admin                               Panel Global (estadísticas)
  /app/admin/usuarios                      Gestión de usuarios
  /app/admin/config                        Configuración
  /app/admin/logs                          Auditoría
```

---

## 📐 Reglas académicas (estándar MPPE)

- **Año escolar**: 3 lapsos. **Escala de notas**: 1 a 20. **Mínima aprobatoria**: 10.
- **Nota del lapso** = suma ponderada de las actividades del plan de evaluación.
- **Nota definitiva** = promedio de los 3 lapsos.
- **Certificación universitaria (OPSU)**: usa el promedio de **1ro a 4to año**.
- **Semáforo académico**: 🟢 ≥15 sólida · 🟡 11–14 en observación · 🔴 <11 en riesgo.
