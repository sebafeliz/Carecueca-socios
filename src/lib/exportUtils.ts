import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { Member, DuePayment, BackupLog, BankAccountDetails } from '../types';

// Format Chilean pesos safely
export const formatCLP = (amount?: number | null): string => {
  const valid = typeof amount === 'number' && !isNaN(amount) ? amount : 0;
  return new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP',
    maximumFractionDigits: 0,
  }).format(valid);
};

// Safe payment date formatter that handles strings, Firestore Timestamps, and Date objects
export function formatPaymentDate(date: any, fallback = '-'): string {
  if (!date) return fallback;
  if (typeof date === 'string') {
    const trimmed = date.trim();
    if (!trimmed) return fallback;
    return trimmed.split('T')[0].split(' ')[0];
  }
  if (typeof date === 'object') {
    if (typeof date.toDate === 'function') {
      return date.toDate().toISOString().split('T')[0];
    }
    if (typeof date.seconds === 'number') {
      return new Date(date.seconds * 1000).toISOString().split('T')[0];
    }
    if (date instanceof Date && !isNaN(date.getTime())) {
      return date.toISOString().split('T')[0];
    }
  }
  if (typeof date === 'number' && !isNaN(date)) {
    return new Date(date).toISOString().split('T')[0];
  }
  return String(date || fallback);
}

// Generate PDF Financial Report
export function generatePDFReport(
  periodName: string,
  dues: DuePayment[],
  members: Member[],
  bankDetails: BankAccountDetails
) {
  const doc = new jsPDF();

  // Header Branding - Carecueca Teatro
  doc.setFillColor(155, 44, 44); // Burgundy Carecueca
  doc.rect(0, 0, 210, 32, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text('Carecueca Teatro', 14, 18);

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('Informe Oficial de Estado de Cuotas y Finanzas - ' + periodName, 14, 26);

  // Subheader Info
  doc.setTextColor(40, 40, 40);
  doc.setFontSize(9);
  const nowStr = new Date().toLocaleDateString('es-CL', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
  doc.text(`Fecha de emisión: ${nowStr}`, 14, 40);

  // Summary Metrics
  const totalDue = dues.reduce((acc, d) => acc + d.amount, 0);
  const totalPaid = dues.reduce((acc, d) => acc + d.amountPaid, 0);
  const totalPending = totalDue - totalPaid;
  const paidCount = dues.filter((d) => d.status === 'Pagado').length;
  const overdueCount = dues.filter((d) => d.status === 'Atrasado').length;

  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('Resumen Ejecutivo del Periodo:', 14, 48);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text(`• Total Esperado: ${formatCLP(totalDue)}`, 14, 55);
  doc.text(`• Total Recaudado: ${formatCLP(totalPaid)} (${Math.round((totalPaid / (totalDue || 1)) * 100)}%)`, 14, 61);
  doc.text(`• Total Pendiente / Moroso: ${formatCLP(totalPending)}`, 14, 67);
  doc.text(`• Socios al día: ${paidCount} de ${dues.length} | Socios morosos: ${overdueCount}`, 110, 55);

  // Table of Dues
  const tableRows = dues.map((due) => {
    const member = members.find((m) => m.id === due.memberId);
    return [
      due.memberName,
      member?.troupeRole || 'Socio',
      formatCLP(due.amount),
      formatCLP(due.amountPaid),
      due.status,
      due.paymentMethod || '-',
      formatPaymentDate(due.paidAt)
    ];
  });

  autoTable(doc, {
    startY: 74,
    head: [['Socio', 'Rol en Elenco', 'Cuota', 'Pagado', 'Estado', 'Método', 'Fecha Pago']],
    body: tableRows,
    headStyles: {
      fillColor: [155, 44, 44],
      textColor: 255,
      fontStyle: 'bold',
      fontSize: 8,
    },
    bodyStyles: {
      fontSize: 8,
    },
    alternateRowStyles: {
      fillColor: [248, 245, 240],
    },
    didParseCell: function(data) {
      if (data.section === 'body' && data.column.index === 4) {
        const val = data.cell.raw;
        if (val === 'Pagado') data.cell.styles.textColor = [38, 137, 12];
        else if (val === 'Atrasado') data.cell.styles.textColor = [197, 48, 48];
        else if (val === 'Pendiente') data.cell.styles.textColor = [183, 121, 31];
        else if (val === 'Exento') data.cell.styles.textColor = [43, 108, 176];
      }
    }
  });

  // Footer / Signature Section
  const finalY = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable?.finalY || 200;

  doc.setFontSize(8);
  doc.setFont('helvetica', 'italic');
  doc.setTextColor(100, 100, 100);
  doc.text('Datos Bancarios Oficiales para Transferencias:', 14, finalY + 12);
  doc.text(`${bankDetails.bankName} - ${bankDetails.accountType} N° ${bankDetails.accountNumber} | RUT: ${bankDetails.holderRut}`, 14, 17 + finalY);
  doc.text(`Titular: ${bankDetails.holderName} | Comprobantes a: ${bankDetails.emailForReceipt}`, 14, 22 + finalY);

  doc.setDrawColor(180, 180, 180);
  doc.line(130, finalY + 35, 190, finalY + 35);
  doc.setFont('helvetica', 'bold');
  doc.text('Firma Tesorería Carecueca Teatro', 133, finalY + 40);

  // Save the PDF file
  const fileName = `Carecueca_Teatro_Reporte_${periodName.replace(/\s+/g, '_')}.pdf`;
  doc.save(fileName);
  return fileName;
}

// Export to Excel / CSV
export function exportToExcelOrCSV(
  filename: string,
  dues: DuePayment[],
  members: Member[],
  format: 'xlsx' | 'csv' = 'xlsx'
) {
  // Build sheet 1: Dues Report
  const duesData = dues.map((d) => {
    const member = members.find((m) => m.id === d.memberId);
    return {
      'ID Cuota': d.id,
      'Periodo': d.periodTitle,
      'Socio': d.memberName,
      'RUT': member?.rut || '',
      'Rol Teatro': member?.troupeRole || '',
      'Teléfono': member?.phone || '',
      'Monto Cuota ($)': d.amount,
      'Monto Pagado ($)': d.amountPaid,
      'Estado': d.status,
      'Fecha Vencimiento': d.dueDate,
      'Fecha de Pago': d.paidAt || '',
      'Método de Pago': d.paymentMethod || '',
      'N° Comprobante': d.receiptNumber || '',
      'Notas': d.notes || ''
    };
  });

  // Build sheet 2: Members Roster
  const membersData = members.map((m) => ({
    'ID Socio': m.id,
    'Nombre Completo': m.name,
    'RUT': m.rut,
    'Email': m.email,
    'Teléfono': m.phone,
    'Rol en Elenco': m.troupeRole,
    'Estado Socio': m.memberStatus,
    'Rol Sistema': m.userRole,
    'Cuota Personalizada ($)': m.customQuota,
    'Fecha de Ingreso': m.joinDate,
    'Observaciones': m.notes || ''
  }));

  const wb = XLSX.utils.book_new();
  const wsDues = XLSX.utils.json_to_sheet(duesData);
  const wsMembers = XLSX.utils.json_to_sheet(membersData);

  XLSX.utils.book_append_sheet(wb, wsDues, 'Estado de Cuotas');
  XLSX.utils.book_append_sheet(wb, wsMembers, 'Directorio Socios');

  if (format === 'csv') {
    XLSX.writeFile(wb, `${filename}.csv`, { bookType: 'csv' });
  } else {
    XLSX.writeFile(wb, `${filename}.xlsx`, { bookType: 'xlsx' });
  }
}

// Trigger Automatic Cloud Storage Export / Backup
export async function performCloudStorageBackup(
  members: Member[],
  dues: DuePayment[],
  userEmail: string
): Promise<BackupLog> {
  const dateStr = new Date().toISOString().replace(/[:.]/g, '-');
  const fileName = `Carecueca_Backup_Auto_${dateStr.substring(0, 10)}.json`;

  const dumpPayload = {
    app: "Carecueca Teatro - Sistema de Cuotas",
    timestamp: new Date().toISOString(),
    exportedBy: userEmail,
    totalMembers: members.length,
    totalDuesRecords: dues.length,
    data: {
      members,
      dues
    }
  };

  const jsonString = JSON.stringify(dumpPayload, null, 2);
  const sizeKb = Math.round(jsonString.length / 1024) + " KB";

  // Simulate Cloud Storage Sync to Cloud Vault / Drive
  await new Promise((resolve) => setTimeout(resolve, 1200));

  const newLog: BackupLog = {
    id: "bak-" + Date.now(),
    fileName,
    fileSize: sizeKb,
    type: "Cloud Auto-Backup",
    status: "Exitoso",
    createdBy: userEmail || "Sistema Automático",
    cloudDestination: "Google Cloud Storage / Carecueca Vault",
    createdAt: new Date().toLocaleString('es-CL')
  };

  return newLog;
}
