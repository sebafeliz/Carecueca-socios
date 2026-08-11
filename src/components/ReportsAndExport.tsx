import React, { useState } from 'react';
import { 
  FileText, 
  FileDown, 
  FileSpreadsheet, 
  CloudCheck, 
  RefreshCw, 
  CheckCircle2, 
  HardDrive,
  Download
} from 'lucide-react';
import { Member, DuePayment, QuotaPeriod, BackupLog, BankAccountDetails } from '../types';
import { generatePDFReport, exportToExcelOrCSV, performCloudStorageBackup } from '../lib/exportUtils';

interface ReportsAndExportProps {
  members: Member[];
  dues: DuePayment[];
  periods: QuotaPeriod[];
  selectedPeriodId: string;
  setSelectedPeriodId: (id: string) => void;
  bankDetails: BankAccountDetails;
  backupLogs: BackupLog[];
  onAddBackupLog: (log: BackupLog) => void;
  userEmail: string;
}

export const ReportsAndExport: React.FC<ReportsAndExportProps> = ({
  members,
  dues,
  periods,
  selectedPeriodId,
  setSelectedPeriodId,
  bankDetails,
  backupLogs,
  onAddBackupLog,
  userEmail
}) => {
  const [backingUp, setBackingUp] = useState(false);
  const [autoSyncEnabled, setAutoSyncEnabled] = useState(true);

  const currentPeriod = periods.find((p) => p.id === selectedPeriodId) || periods[periods.length - 1];
  const periodDues = dues.filter((d) => d.periodTitle === currentPeriod?.title || d.month === currentPeriod?.month);

  // Generate PDF
  const handleGeneratePDF = () => {
    generatePDFReport(currentPeriod?.title || 'Agosto 2026', periodDues, members, bankDetails);
  };

  // Generate Excel
  const handleExportExcel = () => {
    exportToExcelOrCSV(`Carecueca_Teatro_Cuotas_${currentPeriod?.title.replace(/\s+/g, '_')}`, dues, members, 'xlsx');
  };

  // Generate CSV
  const handleExportCSV = () => {
    exportToExcelOrCSV(`Carecueca_Teatro_Cuotas_${currentPeriod?.title.replace(/\s+/g, '_')}`, dues, members, 'csv');
  };

  // Manual Trigger Cloud Storage Backup
  const handleSyncCloudStorage = async () => {
    setBackingUp(true);
    try {
      const newLog = await performCloudStorageBackup(members, dues, userEmail);
      onAddBackupLog(newLog);
    } catch (err) {
      console.error("Cloud backup error:", err);
    } finally {
      setBackingUp(false);
    }
  };

  return (
    <div className="space-y-5">
      
      {/* Header Banner */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-bold text-slate-900 flex items-center space-x-2">
            <FileText className="w-5 h-5 text-indigo-600" />
            <span>Centro de Reportes, Planillas & Respaldo Nube</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Descarga de informes PDF oficiales, hojas de cálculo Excel/CSV y respaldo automatizado
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <select
            value={selectedPeriodId}
            onChange={(e) => setSelectedPeriodId(e.target.value)}
            className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-800 cursor-pointer"
          >
            {periods.map((p, idx) => (
              <option key={`${p.id}-${idx}`} value={p.id}>{p.title}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Export Options Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        
        {/* PDF Official Report Card */}
        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm flex flex-col justify-between hover:border-slate-300 transition-colors">
          <div>
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center mb-2.5">
              <FileDown className="w-4 h-4" />
            </div>
            <h3 className="font-bold text-slate-900 text-sm">Informe PDF Oficial</h3>
            <p className="text-xs text-slate-500 mt-1">
              Documento imprimible con membrete de Carecueca Teatro, desglose por socio y firmas de tesorería.
            </p>
            <div className="mt-2 text-[11px] text-slate-600 space-y-1 bg-slate-50 p-2 rounded-lg border border-slate-100">
              <div>• Formato estándar A4 para asambleas</div>
              <div>• Incluye datos bancarios oficiales</div>
            </div>
          </div>

          <button
            onClick={handleGeneratePDF}
            className="mt-4 w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg text-xs flex items-center justify-center space-x-1.5 shadow-sm transition-colors"
          >
            <FileDown className="w-3.5 h-3.5" />
            <span>Descargar PDF</span>
          </button>
        </div>

        {/* Excel & CSV Planilla Card */}
        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm flex flex-col justify-between hover:border-slate-300 transition-colors">
          <div>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center mb-2.5">
              <FileSpreadsheet className="w-4 h-4" />
            </div>
            <h3 className="font-bold text-slate-900 text-sm">Planilla Excel / CSV</h3>
            <p className="text-xs text-slate-500 mt-1">
              Exportación tabular de la base de datos de cuotas, métodos de pago, comprobantes y socios.
            </p>
            <div className="mt-2 text-[11px] text-slate-600 space-y-1 bg-slate-50 p-2 rounded-lg border border-slate-100">
              <div>• Hoja 1: Historial de Pagos</div>
              <div>• Hoja 2: Directorio de Socios</div>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-2">
            <button
              onClick={handleExportExcel}
              className="py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-lg text-xs flex items-center justify-center space-x-1 shadow-sm"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Excel (.xlsx)</span>
            </button>

            <button
              onClick={handleExportCSV}
              className="py-2 bg-slate-800 hover:bg-slate-900 text-white font-medium rounded-lg text-xs flex items-center justify-center space-x-1 shadow-sm"
            >
              <Download className="w-3.5 h-3.5" />
              <span>CSV (.csv)</span>
            </button>
          </div>
        </div>

        {/* Cloud Backup & Storage Sync Card */}
        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center">
                <CloudCheck className="w-4 h-4 text-emerald-600" />
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                Sincronizado
              </span>
            </div>

            <h3 className="font-bold text-slate-900 text-sm">Respaldo en la Nube</h3>
            <p className="text-xs text-slate-500 mt-1">
              Copia de respaldo en tiempo real sincronizada en Firestore y Vault.
            </p>

            <div className="mt-2 p-2 bg-slate-50 rounded-lg border border-slate-100 space-y-1.5 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-600">Auto-sincronización:</span>
                <button
                  onClick={() => setAutoSyncEnabled(!autoSyncEnabled)}
                  className={`w-8 h-4 flex items-center rounded-full p-0.5 transition-colors ${
                    autoSyncEnabled ? 'bg-emerald-600' : 'bg-slate-300'
                  }`}
                >
                  <div className={`w-3 h-3 bg-white rounded-full transition-transform ${autoSyncEnabled ? 'translate-x-4' : ''}`} />
                </button>
              </div>
              <p className="text-[10px] text-slate-400">
                Última copia: {backupLogs[0]?.createdAt || 'Hoy'}
              </p>
            </div>
          </div>

          <button
            onClick={handleSyncCloudStorage}
            disabled={backingUp}
            className="mt-4 w-full py-2 bg-slate-800 hover:bg-slate-900 disabled:opacity-50 text-white font-medium rounded-lg text-xs flex items-center justify-center space-x-1.5 shadow-sm transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${backingUp ? 'animate-spin' : ''}`} />
            <span>{backingUp ? 'Sincronizando...' : 'Forzar Respaldo Nube'}</span>
          </button>
        </div>

      </div>

      {/* Cloud Backup History Log Table */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-bold text-slate-900 text-sm flex items-center space-x-2">
              <HardDrive className="w-4 h-4 text-indigo-600" />
              <span>Historial de Respaldos en Nube</span>
            </h3>
            <p className="text-xs text-slate-500">Registro de respaldos guardados automáticamente</p>
          </div>
          <span className="text-xs font-medium text-slate-500">{backupLogs.length} Archivos</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-2 px-3">Archivo</th>
                <th className="py-2 px-3">Tipo</th>
                <th className="py-2 px-3">Tamaño</th>
                <th className="py-2 px-3">Destino Nube</th>
                <th className="py-2 px-3">Usuario</th>
                <th className="py-2 px-3">Fecha</th>
                <th className="py-2 px-3 text-right">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-800 font-medium">
              {backupLogs.map((log, idx) => (
                <tr key={`${log.id}-${idx}`} className="hover:bg-slate-50">
                  <td className="py-2 px-3 font-semibold text-slate-900 flex items-center space-x-2">
                    <FileText className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                    <span className="truncate max-w-xs">{log.fileName}</span>
                  </td>
                  <td className="py-2 px-3 text-slate-600">{log.type}</td>
                  <td className="py-2 px-3 text-slate-500">{log.fileSize}</td>
                  <td className="py-2 px-3 text-slate-500 font-mono text-[10px]">{log.cloudDestination || 'Google Drive / Carecueca'}</td>
                  <td className="py-2 px-3 text-slate-600">{log.createdBy}</td>
                  <td className="py-2 px-3 text-slate-500">{log.createdAt}</td>
                  <td className="py-2 px-3 text-right">
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      <CheckCircle2 className="w-3 h-3 mr-1" /> {log.status}
                    </span>
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
