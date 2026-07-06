import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { GraduationCap, CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import { verificarConstancia } from '../../api/constancias';

/**
 * Página pública de verificación de constancias por código (sin sesión).
 */
const VerificarConstancia = () => {
  const { codigo } = useParams();
  const [data, setData] = useState(null); // null = cargando

  useEffect(() => {
    verificarConstancia(codigo)
      .then(setData)
      .catch(() => setData({ valida: false }));
  }, [codigo]);

  const Fila = ({ label, value }) => (
    <div className="flex items-start justify-between gap-4 py-2 border-b border-slate-100 dark:border-slate-800 last:border-0">
      <span className="text-xs font-medium text-slate-400 dark:text-slate-500 uppercase tracking-wide">{label}</span>
      <span className="text-sm font-semibold text-slate-800 dark:text-slate-100 text-right">{value}</span>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-6 transition-colors duration-300">
      <div className="w-full max-w-md">
        {/* Marca */}
        <div className="flex items-center justify-center gap-2 mb-6">
          <div className="w-10 h-10 bg-indigo-600 text-white rounded-xl flex items-center justify-center">
            <GraduationCap className="w-6 h-6" />
          </div>
          <span className="text-xl font-black text-slate-900 dark:text-white tracking-tight">EduTrack</span>
        </div>

        {data === null ? (
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 p-10 flex flex-col items-center gap-3 transition-colors duration-300">
            <Loader2 className="w-8 h-8 animate-spin text-slate-300 dark:text-slate-600" />
            <p className="text-sm text-slate-400 dark:text-slate-500">Verificando constancia…</p>
          </div>
        ) : data.valida ? (
          <div className="bg-white dark:bg-slate-900 rounded-2xl border-2 border-emerald-200 dark:border-emerald-800 p-6 transition-colors duration-300">
            <div className="flex flex-col items-center text-center mb-5">
              <CheckCircle2 className="w-14 h-14 text-emerald-500 dark:text-emerald-400 mb-2" />
              <h1 className="text-lg font-bold text-emerald-700 dark:text-emerald-400">Constancia válida</h1>
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                Documento emitido oficialmente por la institución.
              </p>
            </div>
            <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl px-4 py-2">
              <Fila label="Tipo" value={data.tipo} />
              <Fila label="Estudiante" value={data.estudiante} />
              <Fila label="Institución" value={data.institucion} />
              <Fila
                label="Fecha"
                value={data.fecha ? new Date(data.fecha).toLocaleDateString('es-VE') : '—'}
              />
              <Fila label="Código" value={codigo} />
            </div>
          </div>
        ) : (
          <div className="bg-white dark:bg-slate-900 rounded-2xl border-2 border-rose-200 dark:border-rose-800 p-6 transition-colors duration-300">
            <div className="flex flex-col items-center text-center">
              <XCircle className="w-14 h-14 text-rose-500 dark:text-rose-400 mb-2" />
              <h1 className="text-lg font-bold text-rose-700 dark:text-rose-400">Constancia no encontrada</h1>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">
                El código <span className="font-mono font-bold text-slate-700 dark:text-slate-200">{codigo}</span> no
                corresponde a ninguna constancia emitida.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default VerificarConstancia;
