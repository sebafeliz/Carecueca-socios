import React, { useState } from 'react';
import { 
  Building2, 
  Copy, 
  Check, 
  UploadCloud, 
  CheckCircle2, 
  Sparkles,
  Receipt
} from 'lucide-react';
import { Member, DuePayment, BankAccountDetails } from '../types';
import { formatCLP } from '../lib/exportUtils';

interface MemberPortalViewProps {
  members: Member[];
  dues: DuePayment[];
  bankDetails: BankAccountDetails;
  onUpdateDue: (due: DuePayment) => void;
}

export const MemberPortalView: React.FC<MemberPortalViewProps> = ({
  members,
  dues,
  bankDetails,
  onUpdateDue
}) => {
  const [selectedMemberId, setSelectedMemberId] = useState<string>(members[2]?.id || members[0]?.id || '');
  const [copiedBank, setCopiedBank] = useState(false);

  // Voucher Submission State
  const [selectedDueForVoucher, setSelectedDueForVoucher] = useState<string>('');
  const [voucherNotes, setVoucherNotes] = useState('');
  const [voucherFileName, setVoucherFileName] = useState('');
  const [voucherSuccess, setVoucherSuccess] = useState(false);

  const activeMember = members.find((m) => m.id === selectedMemberId) || members[0];
  const myDues = dues.filter((d) => d.memberId === activeMember?.id);

  const pendingDues = myDues.filter((d) => d.status === 'Pendiente' || d.status === 'Atrasado');
  const paidDues = myDues.filter((d) => d.status === 'Pagado');

  // Copy Bank Details
  const handleCopyBankDetails = () => {
    const bankText = `${bankDetails.bankName}\n${bankDetails.accountType} N° ${bankDetails.accountNumber}\nTitular: ${bankDetails.holderName}\nRUT: ${bankDetails.holderRut}\nEmail: ${bankDetails.emailForReceipt}`;
    navigator.clipboard.writeText(bankText);
    setCopiedBank(true);
    setTimeout(() => setCopiedBank(false), 2000);
  };

  // Submit Voucher
  const handleSubmitVoucher = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDueForVoucher) return;

    const dueToUpdate = dues.find((d) => d.id === selectedDueForVoucher);
    if (!dueToUpdate) return;

    const updated: DuePayment = {
      ...dueToUpdate,
      status: 'Parcial',
      amountPaid: dueToUpdate.amountPaid > 0 ? dueToUpdate.amountPaid : dueToUpdate.amount,
      paidAt: new Date().toISOString().replace('T', ' ').substring(0, 16),
      paymentMethod: 'Transferencia Bancaria',
      receiptNumber: `SUBMITTED-${Date.now().toString().slice(-6)}`,
      notes: `[Comprobante enviado por socio]: ${voucherFileName || 'Comprobante adjunto'}. Notes: ${voucherNotes}`,
      updatedAt: new Date().toISOString()
    };

    onUpdateDue(updated);
    setVoucherSuccess(true);
    setVoucherFileName('');
    setVoucherNotes('');
    setTimeout(() => setVoucherSuccess(false), 3500);
  };

  return (
    <div className="space-y-5">
      
      {/* Top Bar: Selector de Socio */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center space-x-1.5 text-indigo-600 text-xs font-semibold uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Portal del Socio Carecueca</span>
          </div>
          <h2 className="text-base font-bold text-slate-900 mt-0.5">Mi Estado de Cuotas & Pagos</h2>
        </div>

        {/* Member Selector */}
        <div className="flex items-center space-x-2 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200 text-xs">
          <span className="text-slate-500 font-medium">Ver como:</span>
          <select
            value={selectedMemberId}
            onChange={(e) => setSelectedMemberId(e.target.value)}
            className="bg-transparent font-semibold text-slate-800 focus:outline-none cursor-pointer"
          >
            {members.map((m, idx) => (
              <option key={`${m.id}-${idx}`} value={m.id}>
                {m.name} ({m.troupeRole})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Member Summary Card */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        
        {/* Personal Profile Summary */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-slate-900 text-sm">{activeMember?.name}</h3>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
              {activeMember?.troupeRole}
            </span>
          </div>

          <div className="space-y-1 text-xs text-slate-600">
            <div>RUT: <strong className="text-slate-800">{activeMember?.rut}</strong></div>
            <div>Email: <strong className="text-slate-800">{activeMember?.email}</strong></div>
            <div>Cuota: <strong className="text-emerald-700">{formatCLP(activeMember?.customQuota || 10000)}/mes</strong></div>
          </div>

          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
            <span>Cuotas al Día: <strong className="text-emerald-700">{paidDues.length}</strong></span>
            <span>Pendientes: <strong className="text-rose-600">{pendingDues.length}</strong></span>
          </div>
        </div>

        {/* Official Bank Account Transfer Info */}
        <div className="md:col-span-2 bg-slate-900 text-slate-100 p-4 rounded-xl border border-slate-800 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-2 text-indigo-300 font-bold text-xs">
                <Building2 className="w-4 h-4 text-indigo-400" />
                <span>Datos Bancarios Oficiales para Transferencias</span>
              </div>

              <button
                onClick={handleCopyBankDetails}
                className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-500 text-white font-medium rounded-md text-[11px] flex items-center space-x-1"
              >
                {copiedBank ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedBank ? "¡Copiado!" : "Copiar Datos"}</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs my-2 bg-slate-800/80 p-2.5 rounded-lg border border-slate-700">
              <div>
                <span className="text-slate-400 block text-[10px]">Banco:</span>
                <span className="font-bold text-indigo-200">{bankDetails.bankName}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">Tipo de Cuenta:</span>
                <span className="font-bold text-slate-100">{bankDetails.accountType}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">Número de Cuenta:</span>
                <span className="font-mono font-bold text-indigo-300">{bankDetails.accountNumber}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">Titular:</span>
                <span className="font-bold text-slate-100">{bankDetails.holderName} ({bankDetails.holderRut})</span>
              </div>
            </div>
          </div>

          <p className="text-[10px] text-slate-400 italic">
            * Comprobante al correo: <strong className="text-indigo-300">{bankDetails.emailForReceipt}</strong>
          </p>
        </div>

      </div>

      {/* Upload Voucher Section & History */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        
        {/* Upload Voucher Form */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-3">
          <div className="flex items-center space-x-2">
            <UploadCloud className="w-4 h-4 text-indigo-600" />
            <h3 className="font-bold text-slate-900 text-xs">Adjuntar Comprobante</h3>
          </div>

          {voucherSuccess && (
            <div className="p-2 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg text-xs font-semibold flex items-center space-x-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span>¡Comprobante enviado a Tesorería!</span>
            </div>
          )}

          <form onSubmit={handleSubmitVoucher} className="space-y-2.5 text-xs">
            <div>
              <label className="block font-medium text-slate-700 mb-1">Mes a Pagar</label>
              <select
                required
                value={selectedDueForVoucher}
                onChange={(e) => setSelectedDueForVoucher(e.target.value)}
                className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg font-medium"
              >
                <option value="">-- Seleccionar periodo --</option>
                {myDues.map((d, idx) => (
                  <option key={`${d.id}-${idx}`} value={d.id}>
                    {d.periodTitle} ({formatCLP(d.amount - d.amountPaid)} - {d.status})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-medium text-slate-700 mb-1">Detalle / N° Comprobante</label>
              <input
                type="text"
                placeholder="Ej: Transferencia 98765432"
                value={voucherFileName}
                onChange={(e) => setVoucherFileName(e.target.value)}
                className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg font-medium"
              />
            </div>

            <div>
              <label className="block font-medium text-slate-700 mb-1">Notas</label>
              <textarea
                rows={2}
                placeholder="Mensaje opcional para Tesorería..."
                value={voucherNotes}
                onChange={(e) => setVoucherNotes(e.target.value)}
                className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg font-medium"
              />
            </div>

            <button
              type="submit"
              className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg text-xs shadow-sm transition-colors"
            >
              Notificar Pago
            </button>
          </form>
        </div>

        {/* My Dues History Table */}
        <div className="md:col-span-2 bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-3">
          <h3 className="font-bold text-slate-900 text-xs flex items-center space-x-2">
            <Receipt className="w-4 h-4 text-indigo-600" />
            <span>Mi Historial de Cuotas</span>
          </h3>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-2 px-3">Periodo</th>
                  <th className="py-2 px-3">Cuota</th>
                  <th className="py-2 px-3">Pagado</th>
                  <th className="py-2 px-3">Estado</th>
                  <th className="py-2 px-3">Fecha</th>
                  <th className="py-2 px-3">N° Comprobante</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-800 font-medium">
                {myDues.map((due, idx) => (
                  <tr key={`${due.id}-${idx}`} className="hover:bg-slate-50">
                    <td className="py-2 px-3 font-semibold text-slate-900">{due.periodTitle}</td>
                    <td className="py-2 px-3">{formatCLP(due.amount)}</td>
                    <td className="py-2 px-3 font-bold text-emerald-700">{formatCLP(due.amountPaid)}</td>
                    <td className="py-2 px-3">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold ${
                        due.status === 'Pagado' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                        due.status === 'Atrasado' ? 'bg-rose-50 text-rose-700 border border-rose-200' : 'bg-amber-50 text-amber-700 border border-amber-200'
                      }`}>
                        {due.status}
                      </span>
                    </td>
                    <td className="py-2 px-3 text-slate-500 text-[11px]">{due.paidAt ? due.paidAt.split(' ')[0] : '-'}</td>
                    <td className="py-2 px-3 text-slate-500 font-mono text-[10px]">{due.receiptNumber || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </div>

    </div>
  );
};
