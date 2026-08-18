# EduTrack — Diagramas de usuario y de flujos

> Diagramas de **casos de uso** (qué puede hacer cada rol) y de **flujos** de los procesos
> principales del sistema. Complementa a `ARQUITECTURA-Y-MODELO-DATOS.md` (modelo de datos) y a
> `FLUJOS.md` (guía paso a paso).
>
> Los diagramas están en **Mermaid**: se renderizan solos en GitHub y en VSCode (extensión
> Mermaid). Escala de notas 1–20; semáforo 🟢≥15 🟡≥11 🔴<11.

---

## 1. Actores del sistema

Cuatro roles, un único modelo `User` (distinguido por el campo `role`). Login **por cédula**.

```mermaid
flowchart TD
    LOGIN["Inicio de sesión por cédula"]
    LOGIN --> R{"¿Rol del usuario?"}
    R -->|estudiante| EST["🎓 Estudiante<br/>/app/dashboard"]
    R -->|docente| DOC["📚 Docente<br/>/app/docente"]
    R -->|representante| REP["👪 Representante<br/>/app/representante"]
    R -->|superadmin| ADM["🛡️ Super Admin<br/>/app/admin"]

    ADM -.->|crea y gestiona| DOC
    ADM -.->|crea y gestiona| EST
    ADM -.->|crea y vincula| REP
    DOC -.->|inscribe| EST
    REP -.->|representa a| EST
```

---

## 2. Diagrama de casos de uso (por rol)

### 2.1 🎓 Estudiante

```mermaid
flowchart LR
    EST(["🎓 Estudiante"])
    EST --> A["Ver panel académico (KPIs, semáforo)"]
    EST --> B["Ver notas por lapso y definitivas"]
    EST --> C["Descargar boletín en PDF (si el docente lo publicó)"]
    EST --> D["Responder el test vocacional (una vez)"]
    EST --> E["Ver resultados + análisis de IA"]
    EST --> F["Chatear con el asistente de IA"]
```

### 2.2 📚 Docente

```mermaid
flowchart LR
    DOC(["📚 Docente"])
    DOC --> S1["Crear y gestionar secciones"]
    DOC --> S2["Gestionar materias (currículo MPPE)"]
    DOC --> S3["Definir plan de evaluación por lapso"]
    DOC --> S4["Cargar notas (escala 1-20)"]
    DOC --> S5["Inscribir estudiantes (crear / buscar / CSV)"]
    DOC --> S6["Pasar lista (asistencia) y ver resumen"]
    DOC --> S7["Publicar boletines por lapso"]
    DOC --> S8["Generar preinforme (PDF / CSV)"]
    DOC --> S9["Emitir constancias (PDF con QR)"]
    DOC --> S10["Emitir certificación 1ro-4to (OPSU)"]
    DOC --> S11["Centro de Reportes (todo por sección)"]
    DOC --> S12["Editar conducta de sus estudiantes"]
```

### 2.3 👪 Representante

```mermaid
flowchart LR
    REP(["👪 Representante"])
    REP --> P1["Ver notas de sus representados (solo lectura)"]
    REP --> P2["Ver % de asistencia y semáforo"]
    REP --> P3["Ver perfil vocacional del representado"]
    REP --> P4["Vincular su Telegram (por código)"]
    REP --> P5["Recibir avisos automáticos por Telegram"]
    REP --> P6["Consultar por comandos del bot (/notas, /asistencia...)"]
```

### 2.4 🛡️ Super Admin

```mermaid
flowchart LR
    ADM(["🛡️ Super Admin"])
    ADM --> G1["Panel global de estadísticas"]
    ADM --> G2["Gestionar usuarios (crear / rol / eliminar)"]
    ADM --> G3["Asignar representante a un estudiante"]
    ADM --> G4["Reporte institucional (agregado + PDF)"]
    ADM --> G5["Configurar la institución (umbrales, IA)"]
    ADM --> G6["Ver auditoría (registro real de eventos)"]
    ADM --> G7["Emitir cualquier constancia"]
```

---

## 3. Flujos de procesos principales

### 3.1 Acceso y ruteo por rol

```mermaid
flowchart TD
    A["Usuario abre la app"] --> B["Pantalla /auth"]
    B --> C["Ingresa cédula + contraseña"]
    C --> D["POST /api/auth/login"]
    D --> E{"¿Credenciales válidas?"}
    E -->|No| F["Error: usuario o contraseña incorrectos"]
    F --> B
    E -->|Sí| G["Backend firma un JWT (rol incluido)"]
    G --> H["Se registra evento 'login' en auditoría"]
    H --> I{"Rol"}
    I -->|estudiante| J["Panel del estudiante"]
    I -->|docente| K["Panel del docente"]
    I -->|representante| L["Panel del representante"]
    I -->|superadmin| M["Panel del super admin"]
```

### 3.2 Flujo académico del docente (de la sección a la nota)

```mermaid
flowchart TD
    A["Docente crea una Sección (año + letra + período)"] --> B["Se generan las Materias del currículo MPPE"]
    B --> C["Inscribe estudiantes: buscar / crear / importar CSV"]
    C --> D["Define el Plan de Evaluación por lapso"]
    D --> E{"¿Las ponderaciones suman 100%?"}
    E -->|No| D
    E -->|Sí| F["Publica el plan (visible al estudiante)"]
    F --> G["Carga Notas por actividad (1-20)"]
    G --> H["El acumulado del lapso se calcula ponderando"]
    H --> I["Genera Preinforme (PDF / CSV)"]
    H --> J["Publica el Boletín del lapso"]
    J --> K["El estudiante ya puede descargar su boletín"]
```

### 3.3 Diagnóstico vocacional con IA

```mermaid
flowchart TD
    A["Estudiante abre el Test Vocacional"] --> B["Responde 80 ítems"]
    B --> C["Se guarda TestAnswer"]
    C --> D["Se calcula el puntaje por área (TestResult.results)"]
    D --> E["Backend llama a OpenRouter (Gemma 4 + fallbacks)"]
    E --> F{"¿Modelo disponible?"}
    F -->|429 saturado| G["Reintenta con el siguiente modelo de respaldo"]
    G --> F
    F -->|OK| H["IA devuelve análisis: resumen, fortalezas, carreras, pasos"]
    H --> I["Se guarda en TestResult.analisis"]
    I --> J["El estudiante ve resultados + puede exportar PDF"]
    J --> K["Opcional: chatea con el asistente de IA"]
```

### 3.4 Asistencia + notificación automática por Telegram

```mermaid
sequenceDiagram
    actor D as Docente
    participant API as Backend (API)
    participant DB as MongoDB
    participant TG as Telegram Bot API
    actor R as Representante

    D->>API: PUT /secciones/:id/asistencia/:fecha (pase de lista)
    API->>DB: Guarda Asistencia (registros por estudiante)
    API-->>D: 200 OK (respuesta inmediata)
    Note over API: En segundo plano (no bloquea)
    API->>DB: Busca representantes con Telegram vinculado
    API->>TG: Envía aviso a cada ausente / en riesgo
    TG-->>R: "Su representado fue reportado ausente hoy"
```

### 3.5 Vinculación del representante con el bot de Telegram

```mermaid
flowchart TD
    A["Representante entra a su panel"] --> B["Toca 'Conectar Telegram'"]
    B --> C["El sistema muestra un código único (ej. TG5ZB7)"]
    C --> D["Abre el bot @edutrack2bot y envía el código"]
    D --> E["El bot (polling) recibe el mensaje"]
    E --> F{"¿El código existe en algún usuario?"}
    F -->|No| G["Bot: 'No reconozco ese código'"]
    F -->|Sí| H["Guarda telegramChatId en el usuario"]
    H --> I["Bot: '✅ Vinculado. Recibirás avisos'"]
    I --> J["Desde ahora recibe notificaciones y puede usar comandos"]
```

### 3.6 Constancia oficial + verificación pública

```mermaid
flowchart TD
    A["Docente/Admin emite una constancia"] --> B["Backend genera código único EDT-2026-000001-XXXXXXXX"]
    B --> C["Se guarda la Constancia (con snapshot de datos)"]
    C --> D["Frontend arma el PDF con jsPDF"]
    D --> E["Incluye membrete RBV/MPPE + código de control + QR"]
    E --> F["El QR apunta a /verificar/:codigo"]
    F --> G["Cualquiera escanea el QR (sin login)"]
    G --> H["GET /api/constancias/verificar/:codigo"]
    H --> I{"¿El código existe?"}
    I -->|Sí| J["✅ Constancia válida (datos mínimos)"]
    I -->|No| K["❌ Constancia no encontrada"]
```

### 3.7 Consulta del representante (solo lectura)

```mermaid
flowchart TD
    A["Representante inicia sesión"] --> B["Panel: Mis Representados"]
    B --> C{"¿Tiene varios representados?"}
    C -->|Sí| D["Selecciona uno con el selector"]
    C -->|No| E["Se muestra el único directamente"]
    D --> F["Carga detalle del representado"]
    E --> F
    F --> G["Notas por lapso + definitivas (solo lectura)"]
    F --> H["Tarjeta de asistencia con semáforo"]
    F --> I["Área vocacional destacada (si hizo el test)"]
```

### 3.8 Reporte institucional (Super Admin)

```mermaid
flowchart TD
    A["Super Admin abre 'Reportes'"] --> B["GET /api/admin/reporte-institucional"]
    B --> C["Backend agrega en bloque (sin N+1)"]
    C --> D["Totales: estudiantes, docentes, secciones, género"]
    C --> E["Por sección: promedio, aprobados/aplazados, inasistencia, riesgo"]
    C --> F["Áreas vocacionales más frecuentes"]
    D --> G["Página con KPIs + tabla + bloque vocacional"]
    E --> G
    F --> G
    G --> H["Botón: Descargar PDF membretado"]
```

---

## 4. Mapa de módulos por rol (resumen)

```mermaid
flowchart LR
    subgraph EST["🎓 Estudiante"]
        e1["Notas"]
        e2["Boletines"]
        e3["Test vocacional + IA"]
    end
    subgraph DOC["📚 Docente"]
        d1["Secciones y materias"]
        d2["Notas y planes"]
        d3["Asistencia"]
        d4["Constancias y certificaciones"]
        d5["Reportes"]
    end
    subgraph REP["👪 Representante"]
        r1["Consulta de representados"]
        r2["Telegram (avisos + comandos)"]
    end
    subgraph ADM["🛡️ Super Admin"]
        a1["Usuarios"]
        a2["Reporte institucional"]
        a3["Configuración"]
        a4["Auditoría"]
    end
```

---

*Fuentes: `FLUJOS.md`, `ARQUITECTURA-Y-MODELO-DATOS.md` y el código de
`Backend-Diagnostico-vocacional/src/` y `Frontend-Diagnostico-vocacional/src/`.*
