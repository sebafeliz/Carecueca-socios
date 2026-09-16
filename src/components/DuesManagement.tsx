import React, { useState } from 'react';
import { 
  Wallet, 
  Search, 
  Plus, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  Send, 
  DollarSign, 
  X, 
  Calendar,
  Receipt,
  UserCheck,
  Trash2,
  RotateCcw,
  MessageSquare,
  Share2,
  Mail,
  Copy,
  Check,
  ExternalLink
} from 'lucide-react';
import { Member, DuePayment, QuotaPeriod, PaymentStatus, PaymentMethod } from '../types';
import { formatCLP } from '../lib/exportUtils';

interface DuesManagementProps {
  members: Member[];
  dues: DuePayment[];
  periods: QuotaPeriod[];
  selectedPeriodId: string;
  setSelectedPeriodId: (id: string) => void;
  onUpdateDue: (due: DuePayment) => void;
  onDeleteDue?: (dueId: string) => void;
  onCreatePeriod: (title: string, year: number, month: number, dueDate: string, baseAmount: number) => void;
  onSendWhatsAppReminder: (due: DuePayment) => void;
  bankDetails: any;
  onOpenWipeModal?: () => void;
}

export const DuesManagement: React.FC<DuesManagementProps> = ({
  members,
  dues,
  periods,
  selectedPeriodId,
  setSelectedPeriodId,
  onUpdateDue,
  onDeleteDue,
  onCreatePeriod,
  onSendWhatsAppReminder,
  onOpenWipeModal,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('Todos');

  // Modal State for Registering Payment
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [selectedDue, setSelectedDue] = useState<DuePayment | null>(null);
  const [amountToPay, setAmountToPay] = useState<number>(10000);
  const [payMethod, setPayMethod] = useState<PaymentMethod>('Transferencia Bancaria');
  const [receiptNo, setReceiptNo] = useState<string>('');
  const [payNotes, setPayNotes] = useState<string>('');

  // Modal State for Deleting Erroneous Payment Record or Due
  const [paymentToDelete, setPaymentToDelete] = useState<DuePayment | null>(null);
  const [dueToDelete, setDueToDelete] = useState<DuePayment | null>(null);

  // Modal State for Creating New Period
  const [periodModalOpen, setPeriodModalOpen] = useState(false);
  const [newPeriodMonth, setNewPeriodMonth] = useState<number>(9);
  const [newPeriodYear, setNewPeriodYear] = useState<number>(2026);
  const [newPeriodDueDate, setNewPeriodDueDate] = useState<string>('2026-09-10');
  const [newPeriodBaseAmount, setNewPeriodBaseAmount] = useState<number>(10000);

  // Modal State for Resetting Dues Payments
  const [resetModalOpen, setResetModalOpen] = useState(false);

  // Modal State for Payment Confirmation Message
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [confirmDue, setConfirmDue] = useState<DuePayment | null>(null);
  const [copiedSuccess, setCopiedSuccess] = useState(false);

  const currentPeriod = periods.find((p) => p.id === selectedPeriodId) || periods[periods.length - 1];

  // Helper to construct formatted payment confirmation message
  const getConfirmationText = (due: DuePayment) => {
    const dateStr = due.paidAt ? due.paidAt.split(' ')[0] : new Date().toISOString().split('T')[0];
    return `🎭 *Compañía Carecueca Teatro*
*Comprobante de Confirmación de Pago*

Hola *${due.memberName}*, te confirmamos la recepción de tu pago:

📌 *Período:* ${due.periodTitle}
💰 *Monto Registrado:* ${formatCLP(due.amountPaid)}
💳 *Método de Pago:* ${due.paymentMethod || 'Transferencia'}
🧾 *N° Comprobante:* ${due.receiptNumber || 'REC-CONFIRMED'}
📅 *Fecha:* ${dateStr}
📊 *Estado Cuota:* ${due.status}

¡Muchas gracias por tu compromiso y aporte a la compañía! 🎬
_Tesorería Carecueca Teatro_`;
  };

  const handleOpenConfirmModal = (due: DuePayment) => {
    setConfirmDue(due);
    setConfirmModalOpen(true);
    setCopiedSuccess(false);
  };

  const handleSendWhatsAppConfirmation = (due: DuePayment) => {
    const member = members.find((m) => m.id === due.memberId);
    const rawPhone = member?.phone || '';
    const cleanPhone = rawPhone.replace(/[^\d]/g, '');
    const formattedPhone = cleanPhone.length === 9 && cleanPhone.startsWith('9') ? `56${cleanPhone}` : cleanPhone;
    const msg = getConfirmationText(due);
    const url = `https://wa.me/${formattedPhone}?text=${encodeURIComponent(msg)}`;
    window.open(url, '_blank');
  };

  const handleSendEmailConfirmation = (due: DuePayment) => {
    const member = members.find((m) => m.id === due.memberId);
    const email = member?.email || '';
    const subject = `Confirmación de Pago - Cuota ${due.periodTitle} - Carecueca Teatro`;
    const msg = getConfirmationText(due);
    const url = `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(msg)}`;
    window.open(url, '_blank');
  };

  const handleCopyConfirmationText = (due: DuePayment) => {
    const msg = getConfirmationText(due);
    navigator.clipboard.writeText(msg);
    setCopiedSuccess(true);
    setTimeout(() => setCopiedSuccess(false), 2500);
  };

  // Filter dues
  const periodDues = dues.filter((d) => d.periodTitle === currentPeriod?.title || d.month === currentPeriod?.month);
  
  // Paid dues for current period summary
  const paidPeriodDues = periodDues.filter((d) => d.amountPaid > 0 || d.status === 'Pagado' || d.status === 'Parcial');

  // Reset a single payment
  const handleResetSingleDue = (due: DuePayment) => {
    const todayStr = new Date().toISOString().split('T')[0];
    const isOverdue = due.dueDate && due.dueDate < todayStr;
    const isExempt = due.status === 'Exento';

    const updated: DuePayment = {
      ...due,
      amountPaid: 0,
      status: isExempt ? 'Exento' : (isOverdue ? 'Atrasado' : 'Pendiente'),
      paidAt: undefined,
      paymentMethod: undefined,
      receiptNumber: undefined,
      notes: '',
      updatedAt: new Date().toISOString()
    };

    onUpdateDue(updated);
  };

  // Reset ALL paid dues in current period
  const handleResetAllPeriodPayments = () => {
    if (paidPeriodDues.length === 0) return;

    const todayStr = new Date().toISOString().split('T')[0];

    paidPeriodDues.forEach((due) => {
      const isOverdue = due.dueDate && due.dueDate < todayStr;
      const isExempt = due.status === 'Exento';

      const updated: DuePayment = {
        ...due,
        amountPaid: 0,
        status: isExempt ? 'Exento' : (isOverdue ? 'Atrasado' : 'Pendiente'),
        paidAt: undefined,
        paymentMethod: undefined,
        receiptNumber: undefined,
        notes: '',
        updatedAt: new Date().toISOString()
      };

      onUpdateDue(updated);
    });

    setResetModalOpen(false);
  };

  const filteredDues = periodDues.filter((d) => {
    const matchesSearch = 
      d.memberName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.notes?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'Todos' || d.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Open Payment Modal
  const openPaymentModal = (due: DuePayment) => {
    setSelectedDue(due);
    // When editing an existing payment (amountPaid > 0), load that exact paid amount into the form.
    // If amountPaid === 0, default to full quota amount for quick 1-click payment.
    setAmountToPay(due.amountPaid > 0 ? due.amountPaid : due.amount);
    setPayMethod(due.paymentMethod || 'Transferencia Bancaria');
    setReceiptNo(due.receiptNumber || `REC-${due.year}${String(due.month).padStart(2, '0')}-${Math.floor(Math.random() * 89 + 10)}`);
    setPayNotes(due.notes || '');
    setPaymentModalOpen(true);
  };

  // Submit Payment (Direct replacement of paid amount, no sum overflow)
  const handleRegisterPaymentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDue) return;

    const newAmountPaid = Number(amountToPay);
    let newStatus: PaymentStatus = 'Parcial';

    if (newAmountPaid >= selectedDue.amount) {
      newStatus = 'Pagado';
    } else if (newAmountPaid <= 0) {
      const todayStr = new Date().toISOString().split('T')[0];
      const isOverdue = selectedDue.dueDate && selectedDue.dueDate < todayStr;
      newStatus = selectedDue.status === 'Exento' ? 'Exento' : (isOverdue ? 'Atrasado' : 'Pendiente');
    }

    const updated: DuePayment = {
      ...selectedDue,
      amountPaid: Math.max(0, newAmountPaid),
      status: newStatus,
      paidAt: newAmountPaid > 0 
        ? (selectedDue.paidAt || new Date().toISOString().replace('T', ' ').substring(0, 16))
        : undefined,
      paymentMethod: newAmountPaid > 0 ? payMethod : undefined,
      receiptNumber: newAmountPaid > 0 ? receiptNo : undefined,
      notes: payNotes,
      updatedAt: new Date().toISOString()
    };

    onUpdateDue(updated);
    setPaymentModalOpen(false);

    if (newAmountPaid > 0) {
      setConfirmDue(updated);
      setConfirmModalOpen(true);
      setCopiedSuccess(false);
    }
  };

  // Trigger deletion confirmation modal for erroneous payment
  const handleDeletePayment = () => {
    if (!selectedDue) return;
    setPaymentToDelete(selectedDue);
  };

  // Confirmed Delete of Payment Record (Erroneous Entry)
  const confirmDeletePayment = (due: DuePayment) => {
    const todayStr = new Date().toISOString().split('T')[0];
    const isOverdue = due.dueDate && due.dueDate < todayStr;
    const isExempt = due.status === 'Exento';

    const updated: DuePayment = {
      ...due,
      amountPaid: 0,
      status: isExempt ? 'Exento' : (isOverdue ? 'Atrasado' : 'Pendiente'),
      paidAt: undefined,
      paymentMethod: undefined,
      receiptNumber: undefined,
      notes: '',
      updatedAt: new Date().toISOString()
    };

    onUpdateDue(updated);
    setPaymentToDelete(null);
    setPaymentModalOpen(false);
  };

  // Confirmed Delete of entire Due record for period
  const confirmDeleteDue = (due: DuePayment) => {
    if (onDeleteDue) {
      onDeleteDue(due.id);
    }
    setDueToDelete(null);
    setPaymentToDelete(null);
    setPaymentModalOpen(false);
  };

  // Handle New Period Submit
  const handleCreatePeriodSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const monthNames = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
    const title = `${monthNames[newPeriodMonth - 1]} ${newPeriodYear}`;
    onCreatePeriod(title, newPeriodYear, newPeriodMonth, newPeriodDueDate, newPeriodBaseAmount);
    setPeriodModalOpen(false);
  };

  // Badge Status Helper
  const getStatusBadge = (status: PaymentStatus) => {
    switch (status) {
      case 'Pagado':
        return <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200"><CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Pagado</span>;
      case 'Atrasado':
        return <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200"><AlertCircle className="w-3.5 h-3.5 mr-1" /> Atrasado</span>;
      case 'Pendiente':
        return <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200"><Clock className="w-3.5 h-3.5 mr-1" /> Pendiente</span>;
      case 'Parcial':
        return <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-200"><Wallet className="w-3.5 h-3.5 mr-1" /> Parcial</span>;
      case 'Exento':
        return <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold bg-slate-100 text-slate-600 border border-slate-200"><UserCheck className="w-3.5 h-3.5 mr-1" /> Exento</span>;
    }
  };

  return (
    <div className="space-y-5">
      
      {/* Header & Controls Bar */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 flex items-center space-x-2.5">
            <Wallet className="w-6 h-6 text-indigo-600" />
            <span>Gestión de Cuotas Mensuales</span>
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Período: <strong className="text-slate-800 font-bold">{currentPeriod?.title}</strong> | Vencimiento: {currentPeriod?.dueDate}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Period Dropdown */}
          <select
            value={selectedPeriodId}
            onChange={(e) => setSelectedPeriodId(e.target.value)}
            className="px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-semibold text-slate-800 cursor-pointer"
          >
            {periods.map((p, idx) => (
              <option key={`${p.id}-${idx}`} value={p.id}>
                {p.title} - Vence {p.dueDate}
              </option>
            ))}
          </select>

          {/* Create New Period Button */}
          <button
            onClick={() => setPeriodModalOpen(true)}
            className="flex items-center space-x-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg text-sm transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>+ Nuevo Mes de Cuotas</span>
          </button>

          {onOpenWipeModal && (
            <button
              onClick={onOpenWipeModal}
              className="flex items-center space-x-1.5 px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold rounded-lg text-xs transition-colors border border-rose-200 cursor-pointer"
              title="Reiniciar todo y eliminar pagos y cobros, conservando únicamente a los socios"
            >
              <Trash2 className="w-3.5 h-3.5 text-rose-600" />
              <span>Reiniciar Pagos y Cobros</span>
            </button>
          )}
        </div>
      </div>

      {/* Real-time Period Summary KPI Cards */}
      {(() => {
        const totalCollected = periodDues.reduce((sum, d) => sum + (d.amountPaid || 0), 0);
        const totalExpected = periodDues.reduce((sum, d) => d.status === 'Exento' ? sum : sum + (d.amount || 0), 0);
        const paidCount = periodDues.filter((d) => d.status === 'Pagado').length;
        const pendingCount = periodDues.filter((d) => d.status === 'Pendiente' || d.status === 'Atrasado' || d.status === 'Parcial').length;
        const pendingBalance = Math.max(0, totalExpected - totalCollected);
        const percentCollected = totalExpected > 0 ? Math.min(100, Math.round((totalCollected / totalExpected) * 100)) : 0;

        return (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block">Total Recaudado</span>
              <div className="flex items-baseline space-x-2 mt-1">
                <span className="text-lg md:text-xl font-extrabold text-emerald-700">{formatCLP(totalCollected)}</span>
                <span className="text-xs font-bold text-emerald-600">{percentCollected}%</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-1.5 mt-2 overflow-hidden">
                <div 
                  className="bg-emerald-500 h-1.5 rounded-full transition-all duration-300"
                  style={{ width: `${percentCollected}%` }}
                />
              </div>
            </div>

            <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block">Saldo Pendiente</span>
              <span className="text-lg md:text-xl font-extrabold text-amber-700 block mt-1">{formatCLP(pendingBalance)}</span>
              <span className="text-[11px] text-slate-400 mt-1 block">De {formatCLP(totalExpected)} proyectado</span>
            </div>

            <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block">Cuotas Pagadas</span>
              <div className="flex items-baseline space-x-1.5 mt-1">
                <span className="text-lg md:text-xl font-extrabold text-slate-900">{paidCount}</span>
                <span className="text-xs text-slate-500 font-medium">de {periodDues.length} socios</span>
              </div>
              <span className="text-[11px] text-emerald-600 font-semibold mt-1 block">
                {paidCount === periodDues.length && periodDues.length > 0 ? '¡100% al día!' : `${periodDues.length - paidCount} restantes`}
              </span>
            </div>

            <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block">Cuotas Pendientes / Moras</span>
              <span className={`text-lg md:text-xl font-extrabold block mt-1 ${pendingCount > 0 ? 'text-rose-600' : 'text-slate-700'}`}>
                {pendingCount}
              </span>
              <span className="text-[11px] text-slate-400 mt-1 block">Requieren seguimiento</span>
            </div>
          </div>
        );
      })()}

      {/* Filters & Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
        
        {/* Search */}
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar socio..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3.5 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
          />
        </div>

        {/* Status Filter Chips */}
        <div className="flex flex-wrap items-center gap-1.5 w-full sm:w-auto">
          {['Todos', 'Pagado', 'Pendiente', 'Atrasado', 'Parcial', 'Exento'].map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                statusFilter === status
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              {status}
            </button>
          ))}
        </div>

      </div>

      {/* Dues Table / Cards View */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        
        {/* Desktop Table View */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-xs">
              <tr>
                <th className="py-3 px-4">Socio</th>
                <th className="py-3 px-4">Monto Cuota</th>
                <th className="py-3 px-4">Pagado</th>
                <th className="py-3 px-4">Estado</th>
                <th className="py-3 px-4">Método</th>
                <th className="py-3 px-4">Fecha Pago</th>
                <th className="py-3 px-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-800 font-medium">
              {filteredDues.length > 0 ? (
                filteredDues.map((due, idx) => (
                  <tr key={`${due.id}-${idx}`} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4 font-bold text-slate-900 text-sm">
                      <div>{due.memberName}</div>
                      {due.notes && <div className="text-xs font-normal text-slate-500">{due.notes}</div>}
                    </td>
                    <td className="py-3 px-4 text-slate-800 font-semibold text-sm">{formatCLP(due.amount)}</td>
                    <td className="py-3 px-4 font-bold text-emerald-700 text-sm">
                      {formatCLP(due.amountPaid)}
                    </td>
                    <td className="py-3 px-4">{getStatusBadge(due.status)}</td>
                    <td className="py-3 px-4 text-slate-600 text-xs font-medium">{due.paymentMethod || '-'}</td>
                    <td className="py-3 px-4 text-slate-500 text-xs font-medium">{due.paidAt ? due.paidAt.split(' ')[0] : '-'}</td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end space-x-2">
                        
                        {/* Register / Edit Payment Button */}
                        <button
                          onClick={() => openPaymentModal(due)}
                          className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold text-xs shadow-xs transition-colors cursor-pointer"
                        >
                          {due.status === 'Pagado' ? 'Editar' : 'Registrar Pago'}
                        </button>

                        {/* Send Message Button: Confirmation if paid, Reminder if unpaid */}
                        {due.amountPaid > 0 || due.status === 'Pagado' || due.status === 'Parcial' ? (
                          <>
                            <button
                              onClick={() => handleOpenConfirmModal(due)}
                              title="Enviar Confirmación de Pago por WhatsApp / Correo"
                              className="p-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-lg border border-emerald-200 cursor-pointer transition-colors"
                            >
                              <MessageSquare className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => setPaymentToDelete(due)}
                              title="Eliminar registro de pago por ingreso erróneo"
                              className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-lg border border-rose-200 cursor-pointer transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              onClick={() => onSendWhatsAppReminder(due)}
                              title="Enviar Recordatorio/Cobro por WhatsApp"
                              className="p-1.5 bg-amber-50 hover:bg-amber-100 text-amber-700 rounded-lg border border-amber-200 cursor-pointer transition-colors"
                            >
                              <Send className="w-4 h-4" />
                            </button>
                            {onDeleteDue && (
                              <button
                                onClick={() => setDueToDelete(due)}
                                title="Eliminar cuota de este período por error"
                                className="p-1.5 hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded-lg transition-colors cursor-pointer"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </>
                        )}

                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="text-center py-10 text-slate-500 text-sm font-medium">
                    No se encontraron cuotas para los filtros seleccionados.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile Responsive Cards View */}
        <div className="md:hidden divide-y divide-slate-100">
          {filteredDues.length > 0 ? (
            filteredDues.map((due, idx) => (
              <div key={`${due.id}-${idx}`} className="p-4 space-y-2.5">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm">{due.memberName}</h3>
                    <p className="text-xs text-slate-500 mt-0.5">{due.periodTitle} • Vence {due.dueDate}</p>
                  </div>
                  {getStatusBadge(due.status)}
                </div>

                <div className="flex items-center justify-between text-sm py-2 bg-slate-50 px-3 rounded-xl border border-slate-100">
                  <div>
                    <span className="text-slate-500">Cuota: </span>
                    <span className="font-semibold">{formatCLP(due.amount)}</span>
                  </div>
                  <div>
                    <span className="text-slate-500">Pagado: </span>
                    <span className="font-bold text-emerald-700">{formatCLP(due.amountPaid)}</span>
                  </div>
                </div>

                {due.receiptNumber && (
                  <div className="text-xs text-slate-500 flex items-center space-x-1">
                    <Receipt className="w-3.5 h-3.5 text-slate-400" />
                    <span>N° Comprobante: {due.receiptNumber}</span>
                  </div>
                )}

                <div className="flex items-center justify-end space-x-2 pt-1">
                  {due.amountPaid > 0 || due.status === 'Pagado' || due.status === 'Parcial' ? (
                    <>
                      <button
                        onClick={() => handleOpenConfirmModal(due)}
                        className="flex-1 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 font-bold rounded-xl text-xs flex items-center justify-center space-x-1.5 transition-colors cursor-pointer"
                      >
                        <MessageSquare className="w-4 h-4" />
                        <span>Confirmación</span>
                      </button>
                      <button
                        onClick={() => setPaymentToDelete(due)}
                        title="Eliminar registro de pago por ingreso erróneo"
                        className="py-2 px-3 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-semibold rounded-xl text-xs flex items-center justify-center transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={() => onSendWhatsAppReminder(due)}
                        className="flex-1 py-2 bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 font-semibold rounded-xl text-xs flex items-center justify-center space-x-1.5 transition-colors cursor-pointer"
                      >
                        <Send className="w-4 h-4" />
                        <span>Recordatorio</span>
                      </button>
                      {onDeleteDue && (
                        <button
                          onClick={() => setDueToDelete(due)}
                          title="Eliminar cuota por error"
                          className="py-2 px-3 bg-slate-50 hover:bg-rose-50 text-slate-400 hover:text-rose-600 border border-slate-200 rounded-xl text-xs flex items-center justify-center transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </>
                  )}

                  <button
                    onClick={() => openPaymentModal(due)}
                    className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs shadow-xs transition-colors cursor-pointer"
                  >
                    {due.status === 'Pagado' ? 'Editar Pago' : 'Registrar Pago'}
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-8 text-slate-500 text-sm">
              No hay cuotas registradas para este filtro.
            </div>
          )}
        </div>

        {/* Listing Footer with Reset Button at Bottom-Left */}
        <div className="p-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <button
            onClick={() => setResetModalOpen(true)}
            className="px-3 py-1.5 bg-white hover:bg-rose-50 text-slate-700 hover:text-rose-700 border border-slate-200 hover:border-rose-200 rounded-lg text-xs font-bold flex items-center space-x-1.5 shadow-2xs transition-colors cursor-pointer"
            title="Reiniciar o revisar los pagos de cuotas del período"
          >
            <RotateCcw className="w-3.5 h-3.5 text-rose-600" />
            <span>Reinicio de Pagos</span>
          </button>

          <span className="text-xs text-slate-500 font-medium">
            Mostrando <strong className="text-slate-800 font-bold">{filteredDues.length}</strong> de {periodDues.length} cuotas
          </span>
        </div>

      </div>

      {/* Modal: Registrar Pago de Cuota */}
      {paymentModalOpen && selectedDue && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 relative">
            <button
              onClick={() => setPaymentModalOpen(false)}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center space-x-3 mb-4">
              <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl">
                <DollarSign className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  {selectedDue.amountPaid > 0 ? 'Editar Pago de Cuota' : 'Registrar Pago de Cuota'}
                </h3>
                <p className="text-sm text-slate-500 font-medium">{selectedDue.memberName} ({selectedDue.periodTitle})</p>
              </div>
            </div>

            {/* Quota context summary box */}
            <div className="mb-4 p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between text-xs font-medium text-slate-700">
              <div>
                <span className="text-slate-500 block text-[10px] uppercase font-bold">Monto Total Cuota</span>
                <span className="text-sm font-bold text-slate-900">{formatCLP(selectedDue.amount)}</span>
              </div>
              <div className="text-right">
                <span className="text-slate-500 block text-[10px] uppercase font-bold">Estado Actual</span>
                <span className={`text-xs font-bold ${selectedDue.status === 'Pagado' ? 'text-emerald-600' : 'text-amber-600'}`}>
                  {selectedDue.status} {selectedDue.amountPaid > 0 ? `(${formatCLP(selectedDue.amountPaid)})` : ''}
                </span>
              </div>
            </div>

            <form onSubmit={handleRegisterPaymentSubmit} className="space-y-4 text-sm">
              
              <div>
                <label className="block font-semibold text-slate-800 mb-1">Monto Pagado ($ CLP)</label>
                <input
                  type="number"
                  required
                  min="0"
                  max="1000000"
                  value={amountToPay}
                  onChange={(e) => setAmountToPay(Number(e.target.value))}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-base font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <p className="text-[11px] text-slate-500 mt-1">Ingresa el total acumulado que el socio ha pagado para esta cuota.</p>
              </div>

              <div>
                <label className="block font-semibold text-slate-800 mb-1">Método de Pago</label>
                <select
                  value={payMethod}
                  onChange={(e) => setPayMethod(e.target.value as PaymentMethod)}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                >
                  <option value="Transferencia Bancaria">Transferencia Bancaria</option>
                  <option value="Efectivo">Efectivo</option>
                  <option value="MercadoPago">MercadoPago</option>
                  <option value="Tarjeta Débito/Crédito">Tarjeta Débito/Crédito</option>
                  <option value="Otro">Otro</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-800 mb-1">N° Comprobante</label>
                <input
                  type="text"
                  placeholder="Ej: REC-00123"
                  value={receiptNo}
                  onChange={(e) => setReceiptNo(e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-800 mb-1">Notas / Observaciones</label>
                <textarea
                  rows={2}
                  placeholder="Observaciones de Tesorería..."
                  value={payNotes}
                  onChange={(e) => setPayNotes(e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="pt-3 flex items-center justify-between border-t border-slate-100 mt-4">
                {selectedDue.amountPaid > 0 || selectedDue.status === 'Pagado' || selectedDue.status === 'Parcial' ? (
                  <button
                    type="button"
                    onClick={handleDeletePayment}
                    className="px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl font-bold text-xs flex items-center space-x-1.5 transition-colors cursor-pointer"
                    title="Eliminar este pago y reestablecer cuota a pendiente"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>Eliminar pago por error</span>
                  </button>
                ) : <div />}

                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={() => setPaymentModalOpen(false)}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-semibold text-xs transition-colors cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-xs shadow-xs transition-colors cursor-pointer"
                  >
                    Guardar
                  </button>
                </div>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* Modal: Crear Nuevo Periodo */}
      {periodModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 relative">
            <button
              onClick={() => setPeriodModalOpen(false)}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center space-x-3 mb-5">
              <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl">
                <Calendar className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Nuevo Mes de Cuotas</h3>
                <p className="text-sm text-slate-500 font-medium">Genera cobros para todos los socios activos</p>
              </div>
            </div>

            <form onSubmit={handleCreatePeriodSubmit} className="space-y-4 text-sm">
              
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-800 mb-1">Mes</label>
                  <select
                    value={newPeriodMonth}
                    onChange={(e) => setNewPeriodMonth(Number(e.target.value))}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                  >
                    {["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"].map((m, idx) => (
                      <option key={m} value={idx + 1}>{m}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-800 mb-1">Año</label>
                  <input
                    type="number"
                    value={newPeriodYear}
                    onChange={(e) => setNewPeriodYear(Number(e.target.value))}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-800 mb-1">Vencimiento</label>
                <input
                  type="date"
                  required
                  value={newPeriodDueDate}
                  onChange={(e) => setNewPeriodDueDate(e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-800 mb-1">Cuota Base ($ CLP)</label>
                <input
                  type="number"
                  required
                  value={newPeriodBaseAmount}
                  onChange={(e) => setNewPeriodBaseAmount(Number(e.target.value))}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="pt-3 flex items-center justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setPeriodModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-semibold text-sm transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-sm shadow-sm transition-colors"
                >
                  Generar Cuotas
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* Modal: Reinicio de Pagos y Recuadro de Cuotas Pagadas por Socio */}
      {resetModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 relative max-h-[90vh] flex flex-col">
            <button
              onClick={() => setResetModalOpen(false)}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center space-x-3 mb-4">
              <div className="p-2.5 bg-rose-50 text-rose-600 rounded-xl">
                <RotateCcw className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Reinicio de Pagos de Cuotas</h3>
                <p className="text-xs text-slate-500 font-medium">Período actual: <strong className="text-slate-800">{currentPeriod?.title}</strong></p>
              </div>
            </div>

            {/* Recuadro con las cuotas pagadas de cada socio */}
            <div className="mb-4 flex-1 overflow-hidden flex flex-col">
              <div className="flex items-center justify-between mb-2 px-1">
                <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Cuotas Pagadas por Socio ({paidPeriodDues.length})
                </span>
                <span className="text-xs font-bold text-emerald-700">
                  Total: {formatCLP(paidPeriodDues.reduce((acc, d) => acc + d.amountPaid, 0))}
                </span>
              </div>

              <div className="bg-slate-50 rounded-xl border border-slate-200 p-3 overflow-y-auto space-y-2 max-h-60">
                {paidPeriodDues.length > 0 ? (
                  paidPeriodDues.map((due) => (
                    <div 
                      key={due.id} 
                      className="bg-white p-3 rounded-xl border border-slate-200 flex items-center justify-between text-xs shadow-2xs hover:border-slate-300 transition-colors"
                    >
                      <div>
                        <span className="font-bold text-slate-900 block text-sm">{due.memberName}</span>
                        <span className="text-[11px] text-slate-500">
                          {due.paymentMethod || 'Transferencia'} • {due.paidAt ? due.paidAt.split(' ')[0] : 'Fecha no reg.'}
                        </span>
                      </div>

                      <div className="flex items-center space-x-2">
                        <div className="text-right">
                          <span className="font-bold text-emerald-700 block text-sm">{formatCLP(due.amountPaid)}</span>
                          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${due.status === 'Pagado' ? 'bg-emerald-50 text-emerald-700' : 'bg-indigo-50 text-indigo-700'}`}>
                            {due.status}
                          </span>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleOpenConfirmModal(due)}
                          className="px-2 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-lg transition-colors cursor-pointer text-xs font-semibold flex items-center space-x-1"
                          title="Enviar confirmación de pago a este socio"
                        >
                          <MessageSquare className="w-3.5 h-3.5" />
                          <span>Mensaje</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleResetSingleDue(due)}
                          className="px-2 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-lg border border-rose-200 transition-colors cursor-pointer text-xs font-semibold flex items-center space-x-1"
                          title="Reiniciar pago de este socio a $0"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                          <span>Reiniciar</span>
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-xs text-slate-500 font-medium">
                    No hay cuotas pagadas registradas para el período <strong>{currentPeriod?.title}</strong>.
                  </div>
                )}
              </div>
            </div>

            <div className="text-xs text-slate-600 mb-4 bg-amber-50 border border-amber-200 p-3 rounded-xl text-amber-800 flex items-start space-x-2">
              <span className="text-sm">⚠️</span>
              <span>
                <strong>Nota:</strong> Al presionar <strong>"Reiniciar Todos los Pagos"</strong>, se borrarán todos los pagos ingresados para <strong>{currentPeriod?.title}</strong> y volverán a estado pendiente.
              </span>
            </div>

            <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 mt-auto">
              <button
                type="button"
                onClick={() => setResetModalOpen(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-semibold text-xs transition-colors cursor-pointer"
              >
                Cerrar
              </button>

              <div className="flex items-center space-x-2">
                {onOpenWipeModal && (
                  <button
                    type="button"
                    onClick={() => {
                      setResetModalOpen(false);
                      onOpenWipeModal();
                    }}
                    className="px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl font-bold text-xs transition-colors cursor-pointer flex items-center space-x-1.5"
                    title="Borra todos los registros y pagos de cuotas conservando el padrón de socios"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                    <span>Borrar Todo Excepto Socios</span>
                  </button>
                )}

                {paidPeriodDues.length > 0 && (
                  <button
                    type="button"
                    onClick={handleResetAllPeriodPayments}
                    className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold text-xs shadow-xs transition-colors cursor-pointer flex items-center space-x-1.5"
                  >
                    <RotateCcw className="w-4 h-4" />
                    <span>Reiniciar Todos los Pagos</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Enviar Confirmación de Pago por WhatsApp / Email / Copiar */}
      {confirmModalOpen && confirmDue && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 relative animate-in fade-in zoom-in-95 duration-150">
            <button
              onClick={() => setConfirmModalOpen(false)}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center space-x-3 mb-4">
              <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
                <MessageSquare className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Confirmación de Pago</h3>
                <p className="text-xs text-slate-500 font-medium">{confirmDue.memberName} • {confirmDue.periodTitle}</p>
              </div>
            </div>

            <div className="mb-2 flex items-center justify-between text-xs font-semibold text-slate-700">
              <span>Vista Previa del Mensaje:</span>
              <span className="text-slate-400 font-normal">Formato listo para enviar</span>
            </div>

            {/* Message Box */}
            <div className="mb-5 bg-slate-50 border border-slate-200 p-3.5 rounded-xl text-xs font-mono text-slate-800 whitespace-pre-line leading-relaxed relative max-h-56 overflow-y-auto">
              {getConfirmationText(confirmDue)}
            </div>

            {/* Direct Send Buttons */}
            <div className="space-y-2.5">
              <button
                type="button"
                onClick={() => handleSendWhatsAppConfirmation(confirmDue)}
                className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs flex items-center justify-center space-x-2 shadow-xs transition-colors cursor-pointer"
              >
                <Send className="w-4 h-4" />
                <span>Enviar Confirmación por WhatsApp</span>
              </button>

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => handleSendEmailConfirmation(confirmDue)}
                  className="py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-xl font-semibold text-xs flex items-center justify-center space-x-1.5 transition-colors cursor-pointer"
                >
                  <Mail className="w-4 h-4" />
                  <span>Enviar por Correo</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleCopyConfirmationText(confirmDue)}
                  className="py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 rounded-xl font-semibold text-xs flex items-center justify-center space-x-1.5 transition-colors cursor-pointer"
                >
                  {copiedSuccess ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                  <span>{copiedSuccess ? '¡Copiado!' : 'Copiar Texto'}</span>
                </button>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
              <span className="text-[11px] text-slate-400">Notificación individual a socio</span>
              <button
                type="button"
                onClick={() => setConfirmModalOpen(false)}
                className="px-4 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-semibold text-xs transition-colors cursor-pointer"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Confirmación para Eliminar Registro de Pago por Ingreso Erróneo */}
      {paymentToDelete && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center space-x-3 text-rose-600">
              <div className="p-2.5 bg-rose-50 rounded-xl">
                <AlertCircle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Eliminar Registro de Pago</h3>
                <p className="text-xs text-slate-500">Carecueca Teatro • Por ingreso erróneo</p>
              </div>
            </div>

            <div className="bg-rose-50/50 border border-rose-200 rounded-xl p-3.5 space-y-2 text-xs">
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-bold text-slate-900 text-sm">{paymentToDelete.memberName}</p>
                  <p className="text-slate-600 mt-0.5">Período: <strong>{paymentToDelete.periodTitle}</strong></p>
                </div>
                <span className="font-bold text-rose-700 bg-rose-100 px-2 py-0.5 rounded text-xs">
                  {formatCLP(paymentToDelete.amountPaid)}
                </span>
              </div>
              <div className="pt-2 border-t border-rose-200/60 grid grid-cols-2 gap-1 text-[11px] text-slate-600">
                <div>Método: <strong>{paymentToDelete.paymentMethod || 'No especificado'}</strong></div>
                <div>Fecha: <strong>{paymentToDelete.paidAt ? paymentToDelete.paidAt.split(' ')[0] : 'No reg.'}</strong></div>
                {paymentToDelete.receiptNumber && (
                  <div className="col-span-2">Comprobante: <strong>{paymentToDelete.receiptNumber}</strong></div>
                )}
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              ¿Confirmas que este pago fue registrado por error? Al anularlo, el monto pagado volverá a <strong>$0</strong>, el comprobante se descartará y la cuota volverá a estado <strong>Pendiente</strong> (o <strong>Atrasado</strong>). Las métricas del período se actualizarán inmediatamente.
            </p>

            <div className="pt-2 flex items-center justify-between">
              {onDeleteDue ? (
                <button
                  type="button"
                  onClick={() => confirmDeleteDue(paymentToDelete)}
                  className="text-[11px] font-semibold text-rose-700 hover:text-rose-900 underline cursor-pointer"
                  title="Eliminar cuota completa del período si el socio no correspondía"
                >
                  Eliminar cuota completa
                </button>
              ) : <div />}

              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => setPaymentToDelete(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-semibold text-xs transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={() => confirmDeletePayment(paymentToDelete)}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold text-xs shadow-xs transition-colors cursor-pointer flex items-center space-x-1.5"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Eliminar Pago Erróneo</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Confirmación para Eliminar Cuota de Período por Ingreso Erróneo */}
      {dueToDelete && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center space-x-3 text-rose-600">
              <div className="p-2.5 bg-rose-50 rounded-xl">
                <Trash2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Eliminar Cuota del Período</h3>
                <p className="text-xs text-slate-500">Carecueca Teatro • Por ingreso erróneo</p>
              </div>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 text-xs space-y-1">
              <p className="font-bold text-slate-900 text-sm">{dueToDelete.memberName}</p>
              <p className="text-slate-600">Período: <strong>{dueToDelete.periodTitle}</strong></p>
              <p className="text-slate-600">Monto Cuota: <strong>{formatCLP(dueToDelete.amount)}</strong></p>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              ¿Estás seguro de quitar este registro de cuota para {dueToDelete.memberName}? Esta opción se utiliza si la cuota fue generada o asignada por equivocación para este período.
            </p>

            <div className="pt-2 flex items-center justify-end space-x-2">
              <button
                type="button"
                onClick={() => setDueToDelete(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-semibold text-xs transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => confirmDeleteDue(dueToDelete)}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold text-xs shadow-xs transition-colors cursor-pointer flex items-center space-x-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Eliminar Cuota</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
