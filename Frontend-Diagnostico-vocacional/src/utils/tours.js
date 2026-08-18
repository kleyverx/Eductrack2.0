/**
 * Pasos del recorrido guiado (tour) por rol, para driver.js.
 *
 * Cada paso apunta a un elemento real del sidebar mediante su atributo
 * `data-tour`. El primer paso es una bienvenida común, luego un paso por cada
 * item del menú del rol, y al final los pasos comunes (tema, ayuda, logout).
 */

/** Paso de bienvenida, igual para todos los roles. */
const BIENVENIDA = {
  element: '[data-tour="logo"]',
  popover: {
    title: '¡Bienvenido a EduTrack! 👋',
    description:
      'Te damos un recorrido rápido por tu panel. Puedes reabrirlo cuando quieras con el botón de ayuda.',
  },
};

/** Pasos comunes finales, iguales para todos los roles. */
const COMUNES = [
  {
    element: '[data-tour="tema"]',
    popover: {
      title: 'Modo claro/oscuro',
      description: 'Cambia la apariencia de la app cuando quieras.',
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
      description: 'Sal de tu cuenta de forma segura desde aquí.',
    },
  },
];

/** Pasos del menú específicos de cada rol. */
const POR_ROL = {
  estudiante: [
    {
      element: '[data-tour="menu-/app/dashboard"]',
      popover: {
        title: 'Mi Panel',
        description:
          'Tu resumen académico: notas, semáforo de riesgo y tu perfil vocacional destacado.',
      },
    },
    {
      element: '[data-tour="menu-/app/subjects"]',
      popover: {
        title: 'Materias',
        description:
          'Tus materias con notas por lapso y la descarga de boletines cuando el docente los publica.',
      },
    },
    {
      element: '[data-tour="menu-/app/test"]',
      popover: {
        title: 'Test Vocacional',
        description:
          'Responde el test para descubrir tu afinidad de carrera, con un análisis hecho por IA.',
      },
    },
  ],
  docente: [
    {
      element: '[data-tour="menu-/app/docente"]',
      popover: {
        title: 'Panel Docente',
        description: 'Resumen de tus secciones, estudiantes y calificaciones en riesgo.',
      },
    },
    {
      element: '[data-tour="menu-/app/docente/secciones"]',
      popover: {
        title: 'Mis Secciones',
        description:
          'Crea y gestiona tus secciones: materias, planes de evaluación, notas y asistencia.',
      },
    },
    {
      element: '[data-tour="menu-/app/docente/reportes"]',
      popover: {
        title: 'Reportes',
        description:
          'Descarga preinformes, reportes de asistencia y constancias de tus secciones.',
      },
    },
  ],
  representante: [
    {
      element: '[data-tour="menu-/app/representante"]',
      popover: {
        title: 'Mis Representados',
        description:
          'Consulta notas, asistencia y perfil vocacional de tus representados, y conecta tu Telegram para recibir avisos.',
      },
    },
  ],
  superadmin: [
    {
      element: '[data-tour="menu-/app/admin"]',
      popover: {
        title: 'Panel Global',
        description: 'Estadísticas generales del plantel: usuarios, áreas vocacionales y más.',
      },
    },
    {
      element: '[data-tour="menu-/app/admin/reportes"]',
      popover: {
        title: 'Reporte Institucional',
        description: 'Resumen académico agregado del plantel, exportable a PDF.',
      },
    },
    {
      element: '[data-tour="menu-/app/admin/reportes-docentes"]',
      popover: {
        title: 'Reportes por Docente',
        description: 'Explora los reportes organizados por cada docente.',
      },
    },
    {
      element: '[data-tour="menu-/app/admin/usuarios"]',
      popover: {
        title: 'Usuarios',
        description: 'Crea y gestiona usuarios de cualquier rol y asigna representantes.',
      },
    },
    {
      element: '[data-tour="menu-/app/admin/config"]',
      popover: {
        title: 'Configuración',
        description:
          'Ajustes de la institución: umbrales del semáforo, umbral de inasistencia, etc.',
      },
    },
    {
      element: '[data-tour="menu-/app/admin/logs"]',
      popover: {
        title: 'Auditoría',
        description: 'Registro real de actividad del sistema; puedes descargarlo en PDF.',
      },
    },
  ],
};

/**
 * Devuelve los pasos del tour para un rol dado.
 * @param {string} role - estudiante | docente | representante | superadmin
 * @returns {Array<{element: string, popover: {title: string, description: string}}>}
 */
export function getTourSteps(role) {
  return [BIENVENIDA, ...(POR_ROL[role] || POR_ROL.estudiante), ...COMUNES];
}
