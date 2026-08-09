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
  UserCheck
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
  onCreatePeriod: (title: string, year: number, month: number, dueDate: string, baseAmount: number) => void;
  onSendWhatsAppReminder: (due: DuePayment) => void;
  bankDetails: any;
}

export const DuesManagement: React.FC<DuesManagementProps> = ({
  members,
  dues,
  periods,
  selectedPeriodId,
  setSelectedPeriodId,
  onUpdateDue,
  onCreatePeriod,
  onSendWhatsAppReminder,
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

  // Modal State for Creating New Period
  const [periodModalOpen, setPeriodModalOpen] = useState(false);
  const [newPeriodMonth, setNewPeriodMonth] = useState<number>(9);
  const [newPeriodYear, setNewPeriodYear] = useState<number>(2026);
  const [newPeriodDueDate, setNewPeriodDueDate] = useState<string>('2026-09-10');
  const [newPeriodBaseAmount, setNewPeriodBaseAmount] = useState<number>(10000);

  const currentPeriod = periods.find((p) => p.id === selectedPeriodId) || periods[periods.length - 1];

  // Filter dues
  const periodDues = dues.filter((d) => d.periodTitle === currentPeriod?.title || d.month === currentPeriod?.month);

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
    setAmountToPay(due.amount - due.amountPaid > 0 ? due.amount - due.amountPaid : due.amount);
    setPayMethod(due.paymentMethod || 'Transferencia Bancaria');
    setReceiptNo(due.receiptNumber || `REC-${due.year}${String(due.month).padStart(2, '0')}-${Math.floor(Math.random() * 89 + 10)}`);
    setPayNotes(due.notes || '');
    setPaymentModalOpen(true);
  };

  // Submit Payment
  const handleRegisterPaymentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDue) return;

    const newAmountPaid = (selectedDue.amountPaid || 0) + Number(amountToPay);
    let newStatus: PaymentStatus = 'Parcial';

    if (newAmountPaid >= selectedDue.amount) {
      newStatus = 'Pagado';
    } else if (newAmountPaid === 0) {
      newStatus = 'Pendiente';
    }

    const updated: DuePayment = {
      ...selectedDue,
      amountPaid: newAmountPaid,
      status: newStatus,
      paidAt: new Date().toISOString().replace('T', ' ').substring(0, 16),
      paymentMethod: payMethod,
      receiptNumber: receiptNo,
      notes: payNotes,
      updatedAt: new Date().toISOString()
    };

    onUpdateDue(updated);
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
        return <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200"><CheckCircle2 className="w-3 h-3 mr-1" /> Pagado</span>;
      case 'Atrasado':
        return <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200"><AlertCircle className="w-3 h-3 mr-1" /> Atrasado</span>;
      case 'Pendiente':
        return <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200"><Clock className="w-3 h-3 mr-1" /> Pendiente</span>;
      case 'Parcial':
        return <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200"><Wallet className="w-3 h-3 mr-1" /> Parcial</span>;
      case 'Exento':
        return <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200"><UserCheck className="w-3 h-3 mr-1" /> Exento</span>;
    }
  };

  return (
    <div className="space-y-5">
      
      {/* Header & Controls Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-bold text-slate-900 flex items-center space-x-2">
            <Wallet className="w-5 h-5 text-indigo-600" />
            <span>Gestión de Cuotas Mensuales</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Período: <strong className="text-slate-800">{currentPeriod?.title}</strong> | Vencimiento: {currentPeriod?.dueDate}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Period Dropdown */}
          <select
            value={selectedPeriodId}
            onChange={(e) => setSelectedPeriodId(e.target.value)}
            className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-800 cursor-pointer"
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
            className="flex items-center space-x-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg text-xs transition-colors shadow-sm"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Nuevo Mes de Cuotas</span>
          </button>
        </div>
      </div>

      {/* Filters & Search Bar */}
      <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
        
        {/* Search */}
        <div className="relative w-full sm:w-64">
          <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar socio..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
        </div>

        {/* Status Filter Chips */}
        <div className="flex flex-wrap items-center gap-1 w-full sm:w-auto">
          {['Todos', 'Pagado', 'Pendiente', 'Atrasado', 'Parcial', 'Exento'].map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                statusFilter === status
                  ? 'bg-slate-900 text-white font-semibold'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
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
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-2.5 px-4">Socio</th>
                <th className="py-2.5 px-4">Monto Cuota</th>
                <th className="py-2.5 px-4">Pagado</th>
                <th className="py-2.5 px-4">Estado</th>
                <th className="py-2.5 px-4">Método</th>
                <th className="py-2.5 px-4">Fecha Pago</th>
                <th className="py-2.5 px-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-800 font-medium">
              {filteredDues.length > 0 ? (
                filteredDues.map((due) => (
                  <tr key={due.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-2.5 px-4 font-semibold text-slate-900">
                      <div>{due.memberName}</div>
                      {due.notes && <div className="text-[10px] font-normal text-slate-400">{due.notes}</div>}
                    </td>
                    <td className="py-2.5 px-4 text-slate-700">{formatCLP(due.amount)}</td>
                    <td className="py-2.5 px-4 font-bold text-emerald-700">
                      {formatCLP(due.amountPaid)}
                    </td>
                    <td className="py-2.5 px-4">{getStatusBadge(due.status)}</td>
                    <td className="py-2.5 px-4 text-slate-600 text-[11px]">{due.paymentMethod || '-'}</td>
                    <td className="py-2.5 px-4 text-slate-500 text-[11px]">{due.paidAt ? due.paidAt.split(' ')[0] : '-'}</td>
                    <td className="py-2.5 px-4 text-right">
                      <div className="flex items-center justify-end space-x-1.5">
                        
                        {/* Register Payment Button */}
                        <button
                          onClick={() => openPaymentModal(due)}
                          className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md font-medium text-[11px] shadow-sm transition-colors"
                        >
                          {due.status === 'Pagado' ? 'Editar' : 'Registrar Pago'}
                        </button>

                        {/* WhatsApp Reminder Button */}
                        <button
                          onClick={() => onSendWhatsAppReminder(due)}
                          title="Enviar Cobro por WhatsApp"
                          className="p-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-md border border-emerald-200"
                        >
                          <Send className="w-3.5 h-3.5" />
                        </button>

                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-slate-400 text-xs">
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
            filteredDues.map((due) => (
              <div key={due.id} className="p-3.5 space-y-2">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-bold text-slate-900 text-xs">{due.memberName}</h3>
                    <p className="text-[11px] text-slate-500">{due.periodTitle} • Vence {due.dueDate}</p>
                  </div>
                  {getStatusBadge(due.status)}
                </div>

                <div className="flex items-center justify-between text-xs py-1.5 bg-slate-50 px-2.5 rounded-lg border border-slate-100">
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
                  <div className="text-[10px] text-slate-500 flex items-center space-x-1">
                    <Receipt className="w-3 h-3 text-slate-400" />
                    <span>N° Comprobante: {due.receiptNumber}</span>
                  </div>
                )}

                <div className="flex items-center justify-end space-x-2 pt-1">
                  <button
                    onClick={() => onSendWhatsAppReminder(due)}
                    className="flex-1 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-md text-xs flex items-center justify-center space-x-1"
                  >
                    <Send className="w-3.5 h-3.5 text-emerald-600" />
                    <span>WhatsApp</span>
                  </button>

                  <button
                    onClick={() => openPaymentModal(due)}
                    className="flex-1 py-1.5 bg-indigo-600 text-white font-medium rounded-md text-xs"
                  >
                    {due.status === 'Pagado' ? 'Editar Pago' : 'Registrar Pago'}
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-6 text-slate-400 text-xs">
              No hay cuotas registradas para este filtro.
            </div>
          )}
        </div>

      </div>

      {/* Modal: Registrar Pago de Cuota */}
      {paymentModalOpen && selectedDue && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-5 shadow-lg border border-slate-200 relative">
            <button
              onClick={() => setPaymentModalOpen(false)}
              className="absolute top-3 right-3 p-1 rounded-lg text-slate-400 hover:text-slate-700"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center space-x-3 mb-4">
              <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
                <DollarSign className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">Registrar Pago</h3>
                <p className="text-xs text-slate-500">{selectedDue.memberName} ({selectedDue.periodTitle})</p>
              </div>
            </div>

            <form onSubmit={handleRegisterPaymentSubmit} className="space-y-3 text-xs">
              
              <div>
                <label className="block font-medium text-slate-700 mb-1">Monto Ingresado ($ CLP)</label>
                <input
                  type="number"
                  required
                  min="0"
                  max="1000000"
                  value={amountToPay}
                  onChange={(e) => setAmountToPay(Number(e.target.value))}
                  className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-sm font-bold text-slate-900 focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">Método de Pago</label>
                <select
                  value={payMethod}
                  onChange={(e) => setPayMethod(e.target.value as PaymentMethod)}
                  className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg font-medium"
                >
                  <option value="Transferencia Bancaria">Transferencia Bancaria</option>
                  <option value="Efectivo">Efectivo</option>
                  <option value="MercadoPago">MercadoPago</option>
                  <option value="Tarjeta Débito/Crédito">Tarjeta Débito/Crédito</option>
                  <option value="Otro">Otro</option>
                </select>
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">N° Comprobante</label>
                <input
                  type="text"
                  placeholder="Ej: REC-00123"
                  value={receiptNo}
                  onChange={(e) => setReceiptNo(e.target.value)}
                  className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg font-medium"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">Notas</label>
                <textarea
                  rows={2}
                  placeholder="Observaciones de Tesorería..."
                  value={payNotes}
                  onChange={(e) => setPayNotes(e.target.value)}
                  className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg font-medium"
                />
              </div>

              <div className="pt-2 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setPaymentModalOpen(false)}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-medium"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold shadow-sm"
                >
                  Guardar Pago
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* Modal: Crear Nuevo Periodo */}
      {periodModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-5 shadow-lg border border-slate-200 relative">
            <button
              onClick={() => setPeriodModalOpen(false)}
              className="absolute top-3 right-3 p-1 rounded-lg text-slate-400 hover:text-slate-700"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center space-x-3 mb-4">
              <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
                <Calendar className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">Nuevo Mes de Cuotas</h3>
                <p className="text-xs text-slate-500">Genera cobros para todos los socios activos</p>
              </div>
            </div>

            <form onSubmit={handleCreatePeriodSubmit} className="space-y-3 text-xs">
              
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Mes</label>
                  <select
                    value={newPeriodMonth}
                    onChange={(e) => setNewPeriodMonth(Number(e.target.value))}
                    className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg font-medium"
                  >
                    {["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"].map((m, idx) => (
                      <option key={m} value={idx + 1}>{m}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-medium text-slate-700 mb-1">Año</label>
                  <input
                    type="number"
                    value={newPeriodYear}
                    onChange={(e) => setNewPeriodYear(Number(e.target.value))}
                    className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">Vencimiento</label>
                <input
                  type="date"
                  required
                  value={newPeriodDueDate}
                  onChange={(e) => setNewPeriodDueDate(e.target.value)}
                  className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg font-medium"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">Cuota Base ($ CLP)</label>
                <input
                  type="number"
                  required
                  value={newPeriodBaseAmount}
                  onChange={(e) => setNewPeriodBaseAmount(Number(e.target.value))}
                  className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg font-bold"
                />
              </div>

              <div className="pt-2 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setPeriodModalOpen(false)}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-medium"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold shadow-sm"
                >
                  Generar Cuotas
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
};
