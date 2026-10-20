import React from 'react';
import { 
  FileDown, 
  FileSpreadsheet,
  MessageCircle
} from 'lucide-react';
import { Member, DuePayment, QuotaPeriod } from '../types';
import { formatCLP, formatPaymentDate } from '../lib/exportUtils';

interface DashboardProps {
  members: Member[];
  dues: DuePayment[];
  periods: QuotaPeriod[];
  selectedPeriodId: string;
  setSelectedPeriodId: (id: string) => void;
  openRemindersModal: () => void;
  exportPdfForCurrentPeriod: () => void;
  exportExcelCurrentPeriod: () => void;
  generateCurrentMonthDues: () => void;
  navigateToTab: (tab: string) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  members,
  dues,
  periods,
  selectedPeriodId,
  setSelectedPeriodId,
  openRemindersModal,
  exportPdfForCurrentPeriod,
  exportExcelCurrentPeriod,
  navigateToTab
}) => {
  const currentPeriod = periods.find((p) => p.id === selectedPeriodId) || periods[periods.length - 1];
  const periodDues = dues.filter((d) => d.periodTitle === currentPeriod?.title || (d.year === currentPeriod?.year && d.month === currentPeriod?.month));

  // All-time calculations
  const allTimeProjected = dues.reduce((acc, d) => acc + (d.amount || 0), 0);
  const allTimeCollected = dues.reduce((acc, d) => acc + (d.amountPaid || 0), 0);

  // Financial calculations for current selected period
  const totalProjected = periodDues.reduce((acc, d) => acc + d.amount, 0);
  const totalCollected = periodDues.reduce((acc, d) => acc + d.amountPaid, 0);
  const totalPending = Math.max(0, totalProjected - totalCollected);
  const collectionRate = totalProjected > 0 ? Math.round((totalCollected / totalProjected) * 100) : 0;

  const paidCount = periodDues.filter((d) => d.status === 'Pagado').length;
  const overdueCount = periodDues.filter((d) => d.status === 'Atrasado').length;
  const pendingCount = periodDues.filter((d) => d.status === 'Pendiente').length;

  const overdueDuesList = dues.filter((d) => d.status === 'Atrasado');

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Pagado':
        return <span className="text-emerald-700 font-semibold text-xs inline-flex items-center"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1.5" />Pagado</span>;
      case 'Atrasado':
        return <span className="text-rose-600 font-semibold text-xs inline-flex items-center"><span className="w-1.5 h-1.5 rounded-full bg-rose-500 mr-1.5" />Atrasado</span>;
      case 'Parcial':
        return <span className="text-indigo-600 font-semibold text-xs inline-flex items-center"><span className="w-1.5 h-1.5 rounded-full bg-indigo-500 mr-1.5" />Parcial</span>;
      case 'Exento':
        return <span className="text-slate-400 font-medium text-xs inline-flex items-center"><span className="w-1.5 h-1.5 rounded-full bg-slate-300 mr-1.5" />Exento</span>;
      default:
        return <span className="text-amber-700 font-semibold text-xs inline-flex items-center"><span className="w-1.5 h-1.5 rounded-full bg-amber-500 mr-1.5" />Pendiente</span>;
    }
  };

  return (
    <div className="space-y-4">
      {/* Top Header & Export Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-1">
        <div className="flex items-center gap-3">
          <div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">Resumen Financiero</h1>
            <p className="text-xs text-slate-500 mt-0.5">Métricas de recaudación de Carecueca Teatro</p>
          </div>
          <div className="ml-2">
            <select
              value={selectedPeriodId}
              onChange={(e) => setSelectedPeriodId(e.target.value)}
              className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-800 cursor-pointer shadow-xs focus:outline-none focus:ring-1 focus:ring-slate-400"
            >
              {periods.map((p, idx) => (
                <option key={`${p.id}-${idx}`} value={p.id}>
                  {p.title}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Minimalist Action Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={exportPdfForCurrentPeriod}
            className="px-3 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-lg text-xs font-medium transition-colors cursor-pointer flex items-center space-x-1.5 shadow-xs"
            title="Descargar informe PDF oficial"
          >
            <FileDown className="w-3.5 h-3.5 text-slate-500" />
            <span>PDF</span>
          </button>

          <button
            onClick={exportExcelCurrentPeriod}
            className="px-3 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-lg text-xs font-medium transition-colors cursor-pointer flex items-center space-x-1.5 shadow-xs"
            title="Exportar planilla Excel"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-slate-500" />
            <span>Excel</span>
          </button>
        </div>
      </div>

      {/* Overdue Alert Strip (Quiet, clean) */}
      {overdueDuesList.length > 0 && (
        <div className="bg-amber-50/70 border border-amber-200/80 rounded-xl px-4 py-2.5 flex items-center justify-between text-xs text-amber-900">
          <span>Hay <strong>{overdueDuesList.length}</strong> cuota(s) morosa(s) en seguimiento.</span>
          <button
            onClick={openRemindersModal}
            className="font-bold text-amber-800 hover:text-amber-950 underline cursor-pointer"
          >
            Cobrar vía WhatsApp
          </button>
        </div>
      )}

      {/* 3-Card Minimalist KPI Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-xs">
          <span className="text-[11px] font-medium text-slate-500 block">Recaudado Mes ({currentPeriod?.title})</span>
          <div className="flex items-baseline space-x-2 mt-0.5">
            <span className="text-lg font-bold text-slate-900 tabular-nums">{formatCLP(totalCollected)}</span>
            <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">
              {collectionRate}%
            </span>
          </div>
          <span className="text-[11px] text-slate-400 block mt-1">Total histórico: {formatCLP(allTimeCollected)}</span>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-xs">
          <span className="text-[11px] font-medium text-slate-500 block">Saldo Pendiente</span>
          <span className="text-lg font-bold text-amber-800 tabular-nums block mt-0.5">{formatCLP(totalPending)}</span>
          <span className="text-[11px] text-slate-400 block mt-1">{overdueCount} atrasados · {pendingCount} pendientes</span>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-xs">
          <span className="text-[11px] font-medium text-slate-500 block">Socios al Día</span>
          <div className="flex items-baseline space-x-1.5 mt-0.5">
            <span className="text-lg font-bold text-slate-900 tabular-nums">{paidCount}</span>
            <span className="text-xs text-slate-400">de {periodDues.length} socios</span>
          </div>
          <span className="text-[11px] text-slate-400 block mt-1">{members.length} integrantes en total</span>
        </div>
      </div>

      {/* Main Table: Member Dues Detail */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <h2 className="text-xs font-semibold text-slate-800">Detalle de Socios — {currentPeriod?.title}</h2>
          <button
            onClick={() => navigateToTab('dues')}
            className="text-xs font-semibold text-slate-600 hover:text-slate-900 underline cursor-pointer"
          >
            Ver módulo completo de cuotas →
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-100 text-slate-500 font-semibold bg-slate-50/30">
                <th className="py-2.5 px-4">Socio</th>
                <th className="py-2.5 px-4">Cuota</th>
                <th className="py-2.5 px-4">Estado</th>
                <th className="py-2.5 px-4">Método / Comprobante</th>
                <th className="py-2.5 px-4 text-right">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {periodDues.map((d) => (
                <tr key={d.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-2.5 px-4 font-semibold text-slate-900">{d.memberName}</td>
                  <td className="py-2.5 px-4 font-semibold text-slate-800 tabular-nums">{formatCLP(d.amount)}</td>
                  <td className="py-2.5 px-4">{getStatusBadge(d.status)}</td>
                  <td className="py-2.5 px-4 text-slate-500 text-[11px]">
                    {d.status === 'Pagado' || d.amountPaid > 0 ? (
                      <span>{d.paymentMethod || 'Transferencia'} ({formatPaymentDate(d.paidAt, 'Confirmado')})</span>
                    ) : (
                      <span className="text-slate-300">—</span>
                    )}
                  </td>
                  <td className="py-2.5 px-4 text-right">
                    {d.status !== 'Pagado' && d.status !== 'Exento' ? (
                      <button
                        onClick={openRemindersModal}
                        className="text-slate-700 hover:text-slate-900 font-medium inline-flex items-center space-x-1 cursor-pointer"
                      >
                        <MessageCircle className="w-3.5 h-3.5 text-amber-600" />
                        <span>Cobrar</span>
                      </button>
                    ) : (
                      <span className="text-slate-300 text-[11px]">Al día</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
