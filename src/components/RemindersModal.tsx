import React, { useState } from 'react';
import { 
  Send, 
  MessageSquare, 
  BellRing, 
  X, 
  Copy, 
  Check
} from 'lucide-react';
import { Member, DuePayment, BankAccountDetails } from '../types';
import { formatCLP } from '../lib/exportUtils';

interface RemindersModalProps {
  isOpen: boolean;
  onClose: () => void;
  dues: DuePayment[];
  members: Member[];
  bankDetails: BankAccountDetails;
  onTriggerRealtimePushAlert: (title: string, message: string) => void;
}

export const RemindersModal: React.FC<RemindersModalProps> = ({
  isOpen,
  onClose,
  dues,
  members,
  bankDetails,
  onTriggerRealtimePushAlert
}) => {
  const [selectedDueId, setSelectedDueId] = useState<string>(dues.find(d => d.status === 'Atrasado' || d.status === 'Pendiente')?.id || dues[0]?.id || '');
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const pendingDues = dues.filter((d) => d.status === 'Pendiente' || d.status === 'Atrasado' || d.status === 'Parcial');
  const selectedDue = dues.find((d) => d.id === selectedDueId) || pendingDues[0] || dues[0];
  const selectedMember = members.find((m) => m.id === selectedDue?.memberId);

  // Generate WhatsApp Message Body
  const generateWhatsAppText = () => {
    if (!selectedDue) return '';
    const pendingAmount = selectedDue.amount - selectedDue.amountPaid;

    return `🎭 *Carecueca Teatro - Recordatorio de Cuota Mensual* 🎭

Hola *${selectedDue.memberName}*! 👋
Te saludamos de Tesorería. Te recordamos que la cuota correspondiente a *${selectedDue.periodTitle}* (Monto: *${formatCLP(pendingAmount)}*) se encuentra pendiente de pago.

📌 *Datos de Transferencia Bancaria:*
• *Banco:* ${bankDetails.bankName}
• *Tipo Cuenta:* ${bankDetails.accountType}
• *Número:* ${bankDetails.accountNumber}
• *Titular:* ${bankDetails.holderName}
• *RUT:* ${bankDetails.holderRut}
• *Enviar comprobante a:* ${bankDetails.emailForReceipt}

Agradecemos enormemente tu aporte para mantener nuestras actividades teatrales al día. ¡Muchas gracias! 👏`;
  };

  const whatsappMessage = generateWhatsAppText();

  // Send via WhatsApp
  const handleOpenWhatsApp = () => {
    if (!selectedMember) return;
    const cleanPhone = selectedMember.phone.replace(/[^\d+]/g, '');
    const encoded = encodeURIComponent(whatsappMessage);
    window.open(`https://wa.me/${cleanPhone}?text=${encoded}`, '_blank');
  };

  // Copy Message to Clipboard
  const handleCopyMessage = () => {
    navigator.clipboard.writeText(whatsappMessage);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Trigger Push Notification for Selected Member
  const handleTriggerPush = () => {
    if (!selectedDue) return;
    onTriggerRealtimePushAlert(
      `⚠️ Recordatorio de Cuota: ${selectedDue.periodTitle}`,
      `Estimado/a ${selectedDue.memberName}, recuerda poner al día tu cuota de ${formatCLP(selectedDue.amount - selectedDue.amountPaid)}.`
    );
  };

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl max-w-2xl w-full p-5 shadow-lg border border-slate-200 relative">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 p-1 rounded-lg text-slate-400 hover:text-slate-700 bg-slate-100 hover:bg-slate-200"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center space-x-3 mb-4">
          <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
            <Send className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900">Recordatorios de Pago</h3>
            <p className="text-xs text-slate-500">Envío de cobro por WhatsApp y Alertas Push</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          
          {/* Member Selection Column */}
          <div className="md:col-span-1 bg-slate-50 p-2.5 rounded-lg border border-slate-200 space-y-1.5 max-h-72 overflow-y-auto text-xs">
            <span className="font-bold text-slate-500 block text-[10px] uppercase tracking-wider mb-1">
              Pendientes ({pendingDues.length})
            </span>
            {pendingDues.map((d) => (
              <button
                key={d.id}
                onClick={() => setSelectedDueId(d.id)}
                className={`w-full text-left p-2 rounded-md border transition-colors ${
                  selectedDueId === d.id
                    ? 'bg-indigo-50 border-indigo-300 text-indigo-950 font-bold'
                    : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
                }`}
              >
                <div className="truncate text-xs font-semibold">{d.memberName}</div>
                <div className="flex items-center justify-between text-[10px] text-slate-500 mt-0.5">
                  <span>{d.periodTitle}</span>
                  <span className="font-bold text-rose-600">{formatCLP(d.amount - d.amountPaid)}</span>
                </div>
              </button>
            ))}
          </div>

          {/* Message Preview Column */}
          <div className="md:col-span-2 space-y-3 text-xs">
            
            {selectedDue ? (
              <>
                <div className="bg-slate-900 text-slate-100 p-2.5 rounded-lg border border-slate-800 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-indigo-300">Socio Seleccionado:</span>
                    <h4 className="font-bold text-xs">{selectedDue.memberName} ({selectedMember?.phone || 'Sin Teléfono'})</h4>
                  </div>
                  <span className="px-2 py-0.5 bg-rose-900/80 text-rose-200 border border-rose-700 rounded text-[10px] font-bold">
                    Pendiente: {formatCLP(selectedDue.amount - selectedDue.amountPaid)}
                  </span>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="font-medium text-slate-700">Mensaje:</label>
                    <button
                      onClick={handleCopyMessage}
                      className="text-indigo-600 font-bold text-[11px] hover:underline flex items-center space-x-1"
                    >
                      {copied ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                      <span>{copied ? "¡Copiado!" : "Copiar"}</span>
                    </button>
                  </div>

                  <textarea
                    readOnly
                    rows={6}
                    value={whatsappMessage}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg font-mono text-[11px] text-slate-800"
                  />
                </div>

                {/* Actions Bar */}
                <div className="grid grid-cols-2 gap-2 pt-1">
                  <button
                    onClick={handleOpenWhatsApp}
                    className="py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-lg text-xs flex items-center justify-center space-x-1.5 shadow-sm"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span>WhatsApp</span>
                  </button>

                  <button
                    onClick={handleTriggerPush}
                    className="py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg text-xs flex items-center justify-center space-x-1.5 shadow-sm"
                  >
                    <BellRing className="w-3.5 h-3.5" />
                    <span>Alerta Push</span>
                  </button>
                </div>
              </>
            ) : (
              <div className="text-center py-10 text-slate-400">
                No hay cuotas pendientes.
              </div>
            )}

          </div>

        </div>

      </div>
    </div>
  );
};
