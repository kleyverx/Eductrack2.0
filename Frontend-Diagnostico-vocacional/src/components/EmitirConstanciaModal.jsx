import React, { useEffect, useState } from 'react';
import { FileText, FileBadge, Loader2, ShieldCheck, Smile } from 'lucide-react';
import Modal from './ui/Modal';
import { emitirConstancia } from '../api/constancias';
import { exportConstanciaPDF } from '../utils/constanciasPDF';

/**
 * Modal para emitir una constancia oficial (PDF con QR).
 * @param {{ open:boolean, onClose:Function, estudiante?:object, seccion?:object, token:string }} props
 */
const EmitirConstanciaModal = ({ open, onClose, estudiante, seccion, token }) => {
  const soloSeccion = !estudiante && !!seccion;
  const [tipo, setTipo] = useState(soloSeccion ? 'rendimiento' : 'estudios');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (open) {
      setTipo(soloSeccion ? 'rendimiento' : 'estudios');
      setError('');
      setLoading(false);
    }
  }, [open, soloSeccion]);

  const opciones = estudiante
    ? [
        { value: 'estudios', label: 'Constancia de estudios', icon: FileText },
        { value: 'con-representante', label: 'Estudios con representante', icon: FileText },
        { value: 'conducta', label: 'Buena conducta', icon: Smile },
      ]
    : [{ value: 'rendimiento', label: 'Constancia de rendimiento', icon: FileBadge }];

  const contexto = estudiante
    ? `${estudiante.name || ''} ${estudiante.apellido || ''}`.trim()
    : seccion
    ? `Sección ${seccion.nombre || ''}`
    : '';

  const emitir = async () => {
    setError('');
    setLoading(true);
    try {
      const resp = await emitirConstancia(
        { tipo, estudianteId: estudiante?._id, seccionId: seccion?._id },
        token
      );
      await exportConstanciaPDF(resp);
      onClose();
    } catch (err) {
      setError(err.message || 'Error al emitir la constancia.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Emitir constancia" icon={ShieldCheck}>
      <div className="space-y-4">
        {contexto && (
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Para <span className="font-semibold text-slate-800 dark:text-slate-100">{contexto}</span>
          </p>
        )}

        <div className="space-y-2">
          {opciones.map(({ value, label, icon: Icon }) => (
            <button
              key={value}
              type="button"
              onClick={() => setTipo(value)}
              disabled={soloSeccion}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold border transition-colors ${
                tipo === value
                  ? 'bg-indigo-50 dark:bg-indigo-900/30 border-indigo-300 dark:border-indigo-700 text-indigo-700 dark:text-indigo-300'
                  : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
              } disabled:opacity-100 disabled:cursor-default`}
            >
              <Icon className="w-4 h-4" />
              {label}
            </button>
          ))}
        </div>

        {error && <p className="text-xs text-rose-600 dark:text-rose-400">{error}</p>}

        <button
          type="button"
          onClick={emitir}
          disabled={loading}
          className="w-full px-4 py-2.5 text-sm font-semibold text-white bg-indigo-600 rounded-xl hover:bg-indigo-700 transition-colors disabled:opacity-60 inline-flex items-center justify-center gap-2"
        >
          {loading && <Loader2 className="w-4 h-4 animate-spin" />}
          Emitir constancia
        </button>

        <p className="text-[11px] text-slate-400 dark:text-slate-500 text-center">
          Se generará un PDF con código de control y QR de verificación pública.
        </p>
      </div>
    </Modal>
  );
};

export default EmitirConstanciaModal;
