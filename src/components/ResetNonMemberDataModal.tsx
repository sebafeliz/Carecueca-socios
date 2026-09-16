import React, { useState } from 'react';
import { Trash2, AlertTriangle, X, Check, Users, ShieldAlert, Loader2 } from 'lucide-react';

interface ResetNonMemberDataModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  membersCount: number;
  duesCount: number;
}

export const ResetNonMemberDataModal: React.FC<ResetNonMemberDataModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  membersCount,
  duesCount
}) => {
  const [confirmWord, setConfirmWord] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  if (!isOpen) return null;

  const handleExecute = async () => {
    if (confirmWord.trim().toLowerCase() !== 'reiniciar') return;
    try {
      setIsProcessing(true);
      await onConfirm();
    } finally {
      setIsProcessing(false);
      setConfirmWord('');
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 relative animate-in fade-in zoom-in-95 duration-150">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          disabled={isProcessing}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header Badge & Title */}
        <div className="flex items-center space-x-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
            <Trash2 className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900">
              Reiniciar Todo Excepto Socios
            </h3>
            <p className="text-xs text-slate-500">
              Limpieza total de pagos y cuotas
            </p>
          </div>
        </div>

        {/* Warning card */}
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-3.5 mb-4 text-xs text-amber-900 space-y-2">
          <div className="flex items-center space-x-2 font-bold text-amber-800">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
            <span>¿Qué sucederá con la información?</span>
          </div>
          <ul className="list-disc list-inside space-y-1 text-slate-700 ml-1">
            <li>
              Se eliminarán <strong className="text-rose-700">{duesCount} cuotas y registros de pagos y cobros</strong> (de Firestore y memoria local).
            </li>
            <li>
              Se limpiarán todas las alertas, notificaciones y registros de respaldo.
            </li>
            <li>
              <strong className="text-emerald-700 underline font-bold">SOLO SE DEJA EL REGISTRO DE SOCIOS:</strong> Se conservan los <strong>{membersCount} socios</strong> y se depuran automáticamente todos los socios repetidos (como Bernardina).
            </li>
          </ul>
        </div>

        {/* Confirmation Input */}
        <div className="mb-5">
          <label className="block text-xs font-medium text-slate-700 mb-1.5">
            Escribe <strong className="text-rose-600 font-bold">reiniciar</strong> para confirmar:
          </label>
          <input
            type="text"
            value={confirmWord}
            onChange={(e) => setConfirmWord(e.target.value)}
            placeholder="reiniciar"
            disabled={isProcessing}
            className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold focus:outline-hidden focus:ring-2 focus:ring-rose-500 focus:bg-white"
          />
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            disabled={isProcessing}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-semibold text-xs transition-colors cursor-pointer"
          >
            Cancelar
          </button>

          <button
            type="button"
            onClick={handleExecute}
            disabled={confirmWord.trim().toLowerCase() !== 'reiniciar' || isProcessing}
            className={`px-4 py-2 rounded-xl font-bold text-xs flex items-center space-x-1.5 transition-all shadow-xs cursor-pointer ${
              confirmWord.trim().toLowerCase() === 'reiniciar' && !isProcessing
                ? 'bg-rose-600 hover:bg-rose-700 text-white'
                : 'bg-slate-200 text-slate-400 cursor-not-allowed'
            }`}
          >
            {isProcessing ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Borrando registros...</span>
              </>
            ) : (
              <>
                <Trash2 className="w-4 h-4" />
                <span>Confirmar y Borrar</span>
              </>
            )}
          </button>
        </div>

      </div>
    </div>
  );
};
