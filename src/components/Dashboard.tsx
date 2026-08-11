import React from 'react';
import { 
  Users, 
  AlertTriangle, 
  CheckCircle2, 
  DollarSign, 
  Calendar, 
  Send, 
  FileDown, 
  Sparkles,
  ArrowUpRight,
  CreditCard,
  Building2,
  Clock,
  ExternalLink,
  MessageCircle,
  TrendingUp
} from 'lucide-react';
import { Member, DuePayment, QuotaPeriod } from '../types';
import { formatCLP } from '../lib/exportUtils';
import { CarecuecaLogoIcon } from './CarecuecaLogo';

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
  generateCurrentMonthDues,
  navigateToTab
}) => {
  const currentPeriod = periods.find((p) => p.id === selectedPeriodId) || periods[periods.length - 1];
  const periodDues = dues.filter((d) => d.periodTitle === currentPeriod?.title || (d.year === currentPeriod?.year && d.month === currentPeriod?.month));

  // Financial calculations
  const totalProjected = periodDues.reduce((acc, d) => acc + d.amount, 0);
  const totalCollected = periodDues.reduce((acc, d) => acc + d.amountPaid, 0);
  const totalPending = Math.max(0, totalProjected - totalCollected);
  const collectionRate = totalProjected > 0 ? Math.round((totalCollected / totalProjected) * 100) : 0;

  const paidCount = periodDues.filter((d) => d.status === 'Pagado').length;
  const overdueCount = periodDues.filter((d) => d.status === 'Atrasado').length;
  const pendingCount = periodDues.filter((d) => d.status === 'Pendiente').length;
  const partialCount = periodDues.filter((d) => d.status === 'Parcial').length;
  const exemptCount = periodDues.filter((d) => d.status === 'Exento').length;

  // Overdue Members List for Critical Alert Banner
  const overdueDuesList = dues.filter((d) => d.status === 'Atrasado');

  // Payment Method Breakdown
  const methodCounts: { [key: string]: number } = {};
  periodDues.forEach((d) => {
    if (d.amountPaid > 0 && d.paymentMethod) {
      methodCounts[d.paymentMethod] = (methodCounts[d.paymentMethod] || 0) + d.amountPaid;
    }
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Pagado':
        return <span className="px-2.5 py-1 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold uppercase tracking-wider">Pagado</span>;
      case 'Parcial':
        return <span className="px-2.5 py-1 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-200 text-xs font-bold uppercase tracking-wider">Parcial</span>;
      case 'Atrasado':
        return <span className="px-2.5 py-1 rounded-md bg-rose-50 text-rose-700 border border-rose-200 text-xs font-bold uppercase tracking-wider">Atrasado</span>;
      case 'Exento':
        return <span className="px-2.5 py-1 rounded-md bg-slate-100 text-slate-600 border border-slate-200 text-xs font-bold uppercase tracking-wider">Exento</span>;
      default:
        return <span className="px-2.5 py-1 rounded-md bg-amber-50 text-amber-700 border border-amber-200 text-xs font-bold uppercase tracking-wider">Pendiente</span>;
    }
  };

  return (
    <div className="space-y-5">
      
      {/* Top Controls Header */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center space-x-3.5">
          <CarecuecaLogoIcon className="w-10 h-10 rounded-xl shadow-sm flex-shrink-0" />
          <div>
            <h1 className="text-lg font-bold text-slate-900">Resumen Financiero - {currentPeriod?.title}</h1>
            <p className="text-sm text-slate-500 mt-0.5">Carecueca Teatro • Sincronizado en tiempo real</p>
          </div>
        </div>

        {/* Period Selector & Quick Actions */}
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex items-center space-x-2 bg-slate-50 border border-slate-200 px-3.5 py-2 rounded-lg text-sm font-medium text-slate-700">
            <Calendar className="w-4 h-4 text-indigo-600" />
            <select
              value={selectedPeriodId}
              onChange={(e) => setSelectedPeriodId(e.target.value)}
              className="bg-transparent text-slate-800 font-bold focus:outline-none cursor-pointer text-sm"
            >
              {periods.map((p, idx) => (
                <option key={`${p.id}-${idx}`} value={p.id}>
                  {p.title} ({p.status})
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={openRemindersModal}
            className="flex items-center space-x-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg text-sm transition-colors shadow-sm"
          >
            <Send className="w-4 h-4" />
            <span>Recordatorios</span>
          </button>

          <button
            onClick={exportPdfForCurrentPeriod}
            className="flex items-center space-x-2 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg text-sm border border-slate-200"
          >
            <FileDown className="w-4 h-4" />
            <span>PDF {currentPeriod?.title}</span>
          </button>
        </div>
      </div>

      {/* Overdue Alert Banner if overdue members exist */}
      {overdueDuesList.length > 0 && (
        <div className="bg-amber-50/80 border border-amber-200/80 rounded-xl p-4 flex items-center justify-between text-sm text-amber-900">
          <div className="flex items-center space-x-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
            <div>
              <span className="font-bold text-sm">Aviso: Hay {overdueDuesList.length} cuota(s) morosa(s) pendiente(s).</span>
              <span className="text-amber-800 ml-1 font-medium hidden sm:inline text-sm">
                Socios: {Array.from(new Set(overdueDuesList.map(d => d.memberName))).join(', ')}.
              </span>
            </div>
          </div>
          <button
            onClick={openRemindersModal}
            className="shrink-0 px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-lg text-xs"
          >
            Cobrar Vía WhatsApp
          </button>
        </div>
      )}

      {/* KPI Stat Cards (Dense 4-Column Grid) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Recaudado Card */}
        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Recaudación Real</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-2.5">
            <div className="text-2xl font-bold text-slate-900">{formatCLP(totalCollected)}</div>
            <p className="text-xs text-slate-500 mt-1">
              Esperado: {formatCLP(totalProjected)}
            </p>
          </div>
        </div>

        {/* Cumplimiento Card */}
        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Cumplimiento</span>
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-2.5">
            <div className="text-2xl font-bold text-indigo-600">{collectionRate}%</div>
            <div className="w-full bg-slate-100 h-2 rounded-full mt-2 overflow-hidden">
              <div 
                className="bg-indigo-500 h-full transition-all duration-300" 
                style={{ width: `${Math.min(collectionRate, 100)}%` }}
              />
            </div>
          </div>
        </div>

        {/* Pendiente Card */}
        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Monto Pendiente</span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-2.5">
            <div className="text-2xl font-bold text-amber-600">{formatCLP(totalPending)}</div>
            <p className="text-xs text-slate-500 mt-1">
              {overdueCount} atrasados | {pendingCount} pendientes
            </p>
          </div>
        </div>

        {/* Socios Registrados Card */}
        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Socios Activos</span>
            <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-2.5 flex items-center justify-between">
            <div className="text-2xl font-bold text-slate-900">{members.length} Socios</div>
            <button
              onClick={() => navigateToTab('members')}
              className="text-xs font-bold text-indigo-600 hover:underline flex items-center space-x-0.5"
            >
              <span>Ver todos</span>
              <ArrowUpRight className="w-4 h-4" />
            </button>
          </div>
        </div>

      </div>

      {/* High Density Simplified Summary Modules */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        
        {/* Module 1: Tabular Historical Period Performance (Replaces Bar Chart) */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Histórico de Períodos de Cuotas</h3>
            <span className="text-xs text-slate-500 font-medium">Últimos {periods.length} meses</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead className="bg-slate-50 text-xs font-bold text-slate-500 uppercase border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3">Período</th>
                  <th className="px-4 py-3">Esperado</th>
                  <th className="px-4 py-3">Recaudado</th>
                  <th className="px-4 py-3">% Cumplimiento</th>
                  <th className="px-4 py-3 text-right">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {periods.map((p, idx) => {
                  const pDues = dues.filter((d) => d.periodTitle === p.title || (d.year === p.year && d.month === p.month));
                  const collected = pDues.reduce((sum, d) => sum + d.amountPaid, 0);
                  const expected = pDues.reduce((sum, d) => sum + d.amount, 0);
                  const rate = expected > 0 ? Math.round((collected / expected) * 100) : 0;
                  const isCurrent = p.id === selectedPeriodId;

                  return (
                    <tr 
                      key={`${p.id}-${idx}`} 
                      onClick={() => setSelectedPeriodId(p.id)}
                      className={`hover:bg-slate-50 cursor-pointer transition-colors ${isCurrent ? 'bg-indigo-50/40 font-semibold' : ''}`}
                    >
                      <td className="px-4 py-3 font-medium text-slate-900 flex items-center space-x-2">
                        {isCurrent && <span className="w-2 h-2 rounded-full bg-indigo-600" />}
                        <span>{p.title}</span>
                      </td>
                      <td className="px-4 py-3 text-slate-600 font-medium">{formatCLP(expected)}</td>
                      <td className="px-4 py-3 text-emerald-700 font-bold">{formatCLP(collected)}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center space-x-2">
                          <span className="w-9 text-xs font-bold">{rate}%</span>
                          <div className="w-20 bg-slate-100 h-1.5 rounded-full overflow-hidden">
                            <div className="bg-indigo-500 h-full" style={{ width: `${Math.min(rate, 100)}%` }} />
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className={`px-2.5 py-1 rounded-md text-xs font-bold ${
                          p.status === 'Abierto' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-slate-100 text-slate-600'
                        }`}>
                          {p.status}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Module 2: Status Breakdown & Payment Methods Summary (Replaces Pie Charts) */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 flex flex-col justify-between space-y-4">
          <div>
            <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3 pb-2 border-b border-slate-100">
              Desglose del Mes - {currentPeriod?.title}
            </h3>

            {/* Status counts with simple bars */}
            <div className="space-y-3 text-sm">
              <div className="flex justify-between items-center text-slate-700 font-medium">
                <span className="flex items-center space-x-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                  <span>Pagados ({paidCount})</span>
                </span>
                <span className="font-bold">{periodDues.length > 0 ? Math.round((paidCount / periodDues.length) * 100) : 0}%</span>
              </div>

              <div className="flex justify-between items-center text-slate-700 font-medium">
                <span className="flex items-center space-x-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                  <span>Pendientes ({pendingCount})</span>
                </span>
                <span className="font-bold">{periodDues.length > 0 ? Math.round((pendingCount / periodDues.length) * 100) : 0}%</span>
              </div>

              <div className="flex justify-between items-center text-slate-700 font-medium">
                <span className="flex items-center space-x-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                  <span>Atrasados / Morosos ({overdueCount})</span>
                </span>
                <span className="font-bold text-rose-600">{periodDues.length > 0 ? Math.round((overdueCount / periodDues.length) * 100) : 0}%</span>
              </div>

              <div className="flex justify-between items-center text-slate-700 font-medium">
                <span className="flex items-center space-x-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-slate-400" />
                  <span>Exentos ({exemptCount})</span>
                </span>
                <span className="font-bold">{periodDues.length > 0 ? Math.round((exemptCount / periodDues.length) * 100) : 0}%</span>
              </div>
            </div>
          </div>

          {/* Payment Methods */}
          <div className="pt-3 border-t border-slate-100">
            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Métodos de Pago Recibidos</h4>
            {Object.keys(methodCounts).length > 0 ? (
              <div className="space-y-2 text-sm text-slate-700">
                {Object.keys(methodCounts).map((method) => (
                  <div key={method} className="flex justify-between items-center">
                    <span>{method}</span>
                    <span className="font-bold text-slate-900">{formatCLP(methodCounts[method])}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-400 italic">Sin pagos ingresados para este mes.</p>
            )}
          </div>

          {/* Quick Action Button */}
          <button
            onClick={() => navigateToTab('dues')}
            className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg text-sm transition-colors shadow-sm"
          >
            Ir a Gestión de Cuotas & Pagos
          </button>
        </div>

      </div>

      {/* High-Density Detailed Table: Member Dues Status for Selected Period */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div>
            <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              Detalle de Socios - {currentPeriod?.title}
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">Registro rápido de pagos y cobro individual</p>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={exportExcelCurrentPeriod}
              className="px-3 py-1.5 text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg border border-slate-200"
            >
              Exportar Excel
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-50 text-xs font-bold text-slate-500 uppercase border-b border-slate-200">
              <tr>
                <th className="px-4 py-3">Socio</th>
                <th className="px-4 py-3">Monto Cuota</th>
                <th className="px-4 py-3">Estado</th>
                <th className="px-4 py-3">Método / Comprobante</th>
                <th className="px-4 py-3 text-right">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {periodDues.map((d, idx) => (
                <tr key={`${d.id}-${idx}`} className="hover:bg-slate-50/80 transition-colors">
                  <td className="px-4 py-3 font-semibold text-slate-900">
                    {d.memberName}
                  </td>
                  <td className="px-4 py-3 text-slate-800 font-semibold">
                    {formatCLP(d.amount)}
                  </td>
                  <td className="px-4 py-3">
                    {getStatusBadge(d.status)}
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-600">
                    {d.status === 'Pagado' || d.amountPaid > 0 ? (
                      <span className="text-slate-800 font-medium">
                        {d.paymentMethod || 'Transferencia'} ({d.paidAt ? d.paidAt.split(' ')[0] : 'Confirmado'})
                      </span>
                    ) : (
                      <span className="italic text-slate-400">Sin pago registrado</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right space-x-2.5">
                    {d.status !== 'Pagado' && d.status !== 'Exento' && (
                      <button
                        onClick={openRemindersModal}
                        className="text-indigo-600 font-bold text-xs hover:underline inline-flex items-center space-x-1"
                      >
                        <MessageCircle className="w-3.5 h-3.5" />
                        <span>COBRAR</span>
                      </button>
                    )}
                    <button
                      onClick={() => navigateToTab('dues')}
                      className="text-slate-600 font-bold text-xs hover:text-slate-900 hover:underline"
                    >
                      DETALLES
                    </button>
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
