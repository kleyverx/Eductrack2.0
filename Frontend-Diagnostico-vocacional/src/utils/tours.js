/**
 * Pasos del recorrido guiado (tour) por rol, para driver.js.
 *
 * Es un tour MULTI-PÁGINA: cada paso puede indicar una `route`. El orquestador
 * (en Sidebar.jsx) navega a esa ruta, espera a que el elemento aparezca y luego
 * muestra el popover. Así el recorrido lleva al usuario página por página,
 * explicando cada pantalla de su rol.
 *
 * `element` apunta a un `data-tour` real: el header de cada página
 * (`page-<slug>`) o un elemento del sidebar (siempre visible).
 */

/** Paso de bienvenida, resalta el logo del sidebar. `route` = panel de inicio del rol. */
const bienvenida = (route) => ({
  route,
  element: '[data-tour="logo"]',
  popover: {
    title: '¡Bienvenido a EduTrack! 👋',
    description:
      'Te vamos a llevar página por página por tu panel, explicando cada sección. Pulsa "Siguiente" para comenzar; puedes repetir este recorrido cuando quieras con el botón de ayuda (?).',
  },
});

/** Pasos comunes finales (elementos del sidebar, siempre visibles: sin navegación). */
const COMUNES = [
  {
    element: '[data-tour="tema"]',
    popover: {
      title: 'Modo claro/oscuro',
      description: 'Cambia la apariencia de la app entre claro y oscuro cuando quieras.',
    },
  },
  {
    element: '[data-tour="ayuda"]',
    popover: {
      title: '¿Necesitas ayuda?',
      description: 'Pulsa aquí para repetir este recorrido en cualquier momento.',
    },
  },
  {
    element: '[data-tour="logout"]',
    popover: {
      title: 'Cerrar sesión',
      description: 'Sal de tu cuenta de forma segura desde aquí. ¡Listo, ya conoces tu panel!',
    },
  },
];

/** Pasos por rol: navegan a cada página del menú y explican la pantalla. */
const POR_ROL = {
  estudiante: [
    {
      route: '/app/dashboard',
      element: '[data-tour="page-panel-estudiante"]',
      popover: {
        title: '1. Mi Panel',
        description:
          'Tu resumen académico: el área vocacional que destacas, tus KPIs (materias, promedio y materias en riesgo), el semáforo de rendimiento y tus materias con su color 🟢🟡🔴.',
      },
    },
    {
      route: '/app/subjects',
      element: '[data-tour="page-materias"]',
      popover: {
        title: '2. Mis Materias',
        description:
          'Aquí ves tus materias con las notas de cada lapso y la definitiva. También descargas tus boletines en PDF cuando tu docente los publica.',
      },
    },
    {
      route: '/app/test',
      element: '[data-tour="page-test"]',
      popover: {
        title: '3. Test Vocacional',
        description:
          'Responde el test de 80 ítems una sola vez. Al terminar, la IA genera tu análisis vocacional con fortalezas y carreras sugeridas.',
      },
    },
  ],
  docente: [
    {
      route: '/app/docente',
      element: '[data-tour="page-panel-docente"]',
      popover: {
        title: '1. Panel Docente',
        description:
          'Tus indicadores: total de estudiantes, materias y calificaciones en riesgo, el semáforo por lapso y la lista de tus secciones con su promedio.',
      },
    },
    {
      route: '/app/docente/secciones',
      element: '[data-tour="page-secciones"]',
      popover: {
        title: '2. Mis Secciones',
        description:
          'Crea secciones (año + letra A–K), gestiona sus materias, inscribe estudiantes, carga notas y pasa lista. Se muestran agrupadas y ordenadas por año.',
      },
    },
    {
      route: '/app/docente/reportes',
      element: '[data-tour="page-reportes-docente"]',
      popover: {
        title: '3. Reportes',
        description:
          'Todos tus reportes en un solo lugar: elige una sección y accede al preinforme, al reporte de asistencia (PDF/CSV) y a las constancias.',
      },
    },
  ],
  representante: [
    {
      route: '/app/representante',
      element: '[data-tour="page-representante"]',
      popover: {
        title: 'Mis Representados',
        description:
          'Consulta (solo lectura) las notas por lapso, la asistencia con su semáforo y el perfil vocacional de tus representados. Aquí también conectas tu Telegram para recibir avisos automáticos.',
      },
    },
  ],
  superadmin: [
    {
      route: '/app/admin',
      element: '[data-tour="page-panel-admin"]',
      popover: {
        title: '1. Panel Global',
        description:
          'Estadísticas del plantel: totales de usuarios, distribución por género y edad, y las áreas vocacionales más frecuentes.',
      },
    },
    {
      route: '/app/admin/reportes',
      element: '[data-tour="page-reporte-institucional"]',
      popover: {
        title: '2. Reportes',
        description:
          'Dos pestañas sobre los mismos datos: «Institucional» (rendimiento y asistencia por sección, más áreas vocacionales) y «Por Docente» (elige un docente y descarga su reporte). Haz clic en cualquier sección para ver su preinforme, asistencia y emitir constancias/certificaciones. Todo exportable a PDF.',
      },
    },
    {
      route: '/app/admin/usuarios',
      element: '[data-tour="page-usuarios"]',
      popover: {
        title: '3. Usuarios',
        description:
          'Crea usuarios de cualquier rol, cambia roles o elimina cuentas, y asigna representantes a los estudiantes.',
      },
    },
    {
      route: '/app/admin/config',
      element: '[data-tour="page-config"]',
      popover: {
        title: '4. Configuración',
        description:
          'Ajusta la institución: nombre, escala de notas, umbrales del semáforo y el umbral de inasistencia que alimenta las alertas.',
      },
    },
    {
      route: '/app/admin/logs',
      element: '[data-tour="page-auditoria"]',
      popover: {
        title: '5. Auditoría',
        description:
          'El registro real de actividad: inicios de sesión, creación/eliminación de usuarios, cambios de configuración y constancias. Descargable en PDF.',
      },
    },
  ],
};

/** Ruta del panel de inicio de cada rol (para el paso de bienvenida). */
const INICIO_POR_ROL = {
  estudiante: '/app/dashboard',
  docente: '/app/docente',
  representante: '/app/representante',
  superadmin: '/app/admin',
};

/**
 * Devuelve los pasos del tour para un rol dado. Cada paso puede tener `route`
 * (a dónde navegar), `element` (selector data-tour) y `popover`.
 * @param {string} role - estudiante | docente | representante | superadmin
 */
export function getTourSteps(role) {
  const r = POR_ROL[role] ? role : 'estudiante';
  return [bienvenida(INICIO_POR_ROL[r]), ...POR_ROL[r], ...COMUNES];
}
