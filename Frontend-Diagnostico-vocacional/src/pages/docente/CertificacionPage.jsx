import React, { useContext, useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import { getCertificacion } from '../../api/academico';
import { exportCertificacionPDF } from '../../utils/academicoPDF';
import { getScoreStyles } from '../../utils/academic';
import {
  ArrowLeft,
  Award,
  FileDown,
  Loader2,
  Info,
} from 'lucide-react';

/**
 * Certificación de Calificaciones (1ro a 4to año — estándar OPSU).
 * Vista previa + exportación en PDF con formato oficial.
 */
const CertificacionPage = () => {
  const { estudianteId } = useParams();
  const { token } = useContext(AuthContext);
  const [cert, setCert] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!token) return;
    getCertificacion(token, estudianteId)
      .then(setCert)
      .catch((err) => setError(err.message));
  }, [token, estudianteId]);

  const NotaCell = ({ valor }) => {
    if (valor === null || valor === undefined) return <span className="text-slate-300 dark:text-slate-600">—</span>;
    const s = getScoreStyles(valor);
    return <span className={`font-bold ${s.text}`}>{valor}</span>;
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-6 transition-colors duration-300">
      <div className="max-w-3xl mx-auto">
        <button
          onClick={() => window.history.back()}
          className="inline-flex items-center gap-1.5 text-sm text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 mb-4 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Volver
        </button>

        <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-600 dark:bg-indigo-500 rounded-lg text-white">
              <Award className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Certificación de Calificaciones</h1>
              {cert && (
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  {cert.estudiante.apellido || ''} {cert.estudiante.name} · C.I. {cert.estudiante.cedula}
                </p>
              )}
            </div>
          </div>
          {cert && cert.anios.length > 0 && (
            <button
              onClick={() => exportCertificacionPDF(cert)}
              className="inline-flex items-center gap-2 bg-indigo-600 text-white text-sm font-semibold px-4 py-2.5 rounded-xl hover:bg-indigo-700 transition-colors shadow-sm"
            >
              <FileDown className="w-4 h-4" /> Exportar PDF oficial
            </button>
          )}
        </div>

        {error && <p className="text-rose-600 dark:text-rose-400 text-sm mb-4">{error}</p>}

        {!cert && !error ? (
          <div className="flex justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-slate-300 dark:text-slate-600" />
          </div>
        ) : cert && cert.anios.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 p-12 text-center">
            <Award className="w-10 h-10 text-slate-200 dark:text-slate-700 mx-auto mb-3" />
            <p className="text-slate-600 dark:text-slate-300 font-semibold mb-1">Sin calificaciones registradas</p>
            <p className="text-slate-400 dark:text-slate-500 text-sm">
              El estudiante no tiene secciones de 1ro a 4to año con notas cargadas.
            </p>
          </div>
        ) : cert && (
          <>
            {/* Aviso de certificación parcial */}
            {cert.aniosCargados < 4 && (
              <div className="flex items-start gap-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-900/40 rounded-2xl p-4 mb-6">
                <Info className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-amber-700 dark:text-amber-300">
                  Certificación parcial: hay {cert.aniosCargados} de 4 años con calificaciones.
                  La certificación completa para la OPSU requiere las notas de 1ro a 4to año.
                </p>
              </div>
            )}

            {/* Tablas por año */}
            {cert.anios.map((anio) => (
              <div key={anio.anio} className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm dark:shadow-none border border-slate-100 dark:border-slate-800 overflow-hidden mb-5">
                <div className="px-5 py-3 bg-indigo-600 dark:bg-indigo-700 flex items-center justify-between">
                  <h3 className="text-sm font-bold text-white">
                    {anio.etiquetaAnio} — Sección {anio.seccion} · {anio.periodo}
                  </h3>
                  {anio.promedioAnio !== null && (
                    <span className="text-xs font-black text-white bg-white/20 px-2.5 py-1 rounded-full">
                      Promedio: {anio.promedioAnio}
                    </span>
                  )}
                </div>
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40">
                      <th className="text-left font-semibold text-slate-500 dark:text-slate-400 px-4 py-2">Área de Formación</th>
                      <th className="text-center font-semibold text-slate-500 dark:text-slate-400 px-2 py-2">1er L</th>
                      <th className="text-center font-semibold text-slate-500 dark:text-slate-400 px-2 py-2">2do L</th>
                      <th className="text-center font-semibold text-slate-500 dark:text-slate-400 px-2 py-2">3er L</th>
                      <th className="text-center font-bold text-slate-600 dark:text-slate-300 px-3 py-2">Definitiva</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50 dark:divide-slate-800/60">
                    {anio.materias.map((m, i) => (
                      <tr key={i}>
                        <td className="px-4 py-2 text-slate-700 dark:text-slate-200">{m.nombre}</td>
                        <td className="px-2 py-2 text-center"><NotaCell valor={m.lapsos[1]} /></td>
                        <td className="px-2 py-2 text-center"><NotaCell valor={m.lapsos[2]} /></td>
                        <td className="px-2 py-2 text-center"><NotaCell valor={m.lapsos[3]} /></td>
                        <td className="px-3 py-2 text-center">
                          {m.definitiva !== null ? (
                            <span className={`font-black ${getScoreStyles(m.definitiva).text}`}>
                              {m.definitiva}{!m.completa && <span className="text-amber-500" title="Año en curso — lapsos incompletos"> *</span>}
                            </span>
                          ) : (
                            <span className="text-slate-300 dark:text-slate-600">—</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ))}

            {/* Promedio general */}
            {cert.promedioGeneral !== null && (
              <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm dark:shadow-none border border-slate-100 dark:border-slate-800 p-5 flex items-center justify-between">
                <span className="font-bold text-slate-700 dark:text-slate-200">PROMEDIO GENERAL (1ro a 4to)</span>
                <span className={`text-2xl font-black px-3 py-1 rounded-xl ${getScoreStyles(cert.promedioGeneral).bg} ${getScoreStyles(cert.promedioGeneral).text}`}>
                  {cert.promedioGeneral}
                </span>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default CertificacionPage;
