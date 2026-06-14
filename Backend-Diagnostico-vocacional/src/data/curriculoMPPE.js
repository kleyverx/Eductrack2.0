/**
 * Plan de Estudio oficial de Educación Media General — MPPE (Venezuela).
 * Áreas de formación por año según el Proceso de Transformación Curricular.
 *
 * Fuente: Plan de Estudio EMG vigente (Gaceta Oficial / MPPE 2017).
 * Las horas semanales se incluyen como referencia informativa.
 */

const CURRICULO = {
  1: [
    { nombre: 'Castellano', horas: 4 },
    { nombre: 'Inglés y otras Lenguas Extranjeras', horas: 6 },
    { nombre: 'Matemáticas', horas: 4 },
    { nombre: 'Educación Física', horas: 6 },
    { nombre: 'Arte y Patrimonio', horas: 4 },
    { nombre: 'Ciencias Naturales', horas: 6 },
    { nombre: 'Geografía, Historia y Ciudadanía', horas: 6 },
    { nombre: 'Orientación y Convivencia', horas: 2 },
    { nombre: 'Grupos de Creación, Recreación y Producción', horas: 6 },
  ],
  2: [
    { nombre: 'Castellano', horas: 4 },
    { nombre: 'Inglés y otras Lenguas Extranjeras', horas: 6 },
    { nombre: 'Matemáticas', horas: 4 },
    { nombre: 'Educación Física', horas: 6 },
    { nombre: 'Arte y Patrimonio', horas: 4 },
    { nombre: 'Ciencias Naturales', horas: 6 },
    { nombre: 'Geografía, Historia y Ciudadanía', horas: 6 },
    { nombre: 'Orientación y Convivencia', horas: 2 },
    { nombre: 'Grupos de Creación, Recreación y Producción', horas: 6 },
  ],
  3: [
    { nombre: 'Castellano', horas: 4 },
    { nombre: 'Inglés y otras Lenguas Extranjeras', horas: 6 },
    { nombre: 'Matemáticas', horas: 4 },
    { nombre: 'Educación Física', horas: 6 },
    { nombre: 'Física', horas: 4 },
    { nombre: 'Química', horas: 4 },
    { nombre: 'Biología', horas: 4 },
    { nombre: 'Geografía, Historia y Ciudadanía', horas: 4 },
    { nombre: 'Orientación y Convivencia', horas: 2 },
    { nombre: 'Grupos de Creación, Recreación y Producción', horas: 6 },
  ],
  4: [
    { nombre: 'Castellano', horas: 4 },
    { nombre: 'Inglés y otras Lenguas Extranjeras', horas: 6 },
    { nombre: 'Matemáticas', horas: 4 },
    { nombre: 'Educación Física', horas: 6 },
    { nombre: 'Física', horas: 4 },
    { nombre: 'Química', horas: 4 },
    { nombre: 'Biología', horas: 4 },
    { nombre: 'Geografía, Historia y Ciudadanía', horas: 4 },
    { nombre: 'Formación para la Soberanía Nacional', horas: 2 },
    { nombre: 'Orientación y Convivencia', horas: 2 },
    { nombre: 'Grupos de Creación, Recreación y Producción', horas: 6 },
  ],
  5: [
    { nombre: 'Castellano', horas: 3 },
    { nombre: 'Inglés y otras Lenguas Extranjeras', horas: 4 },
    { nombre: 'Matemáticas', horas: 3 },
    { nombre: 'Educación Física', horas: 6 },
    { nombre: 'Física', horas: 4 },
    { nombre: 'Química', horas: 4 },
    { nombre: 'Biología', horas: 4 },
    { nombre: 'Ciencias de la Tierra', horas: 2 },
    { nombre: 'Geografía, Historia y Ciudadanía', horas: 6 },
    { nombre: 'Formación para la Soberanía Nacional', horas: 2 },
    { nombre: 'Orientación y Convivencia', horas: 2 },
    { nombre: 'Grupos de Creación, Recreación y Producción', horas: 6 },
  ],
};

/** Etiquetas legibles por año. */
const ANIO_LABEL = {
  1: '1er Año',
  2: '2do Año',
  3: '3er Año',
  4: '4to Año',
  5: '5to Año',
};

module.exports = { CURRICULO, ANIO_LABEL };
