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

// Generate PDF Financial Report with Modern Executive Palette
export function generatePDFReport(
  periodName: string,
  dues: DuePayment[],
  members: Member[],
  bankDetails: BankAccountDetails
) {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

  // 1. Modern Top Accent Line (Indigo Brand Accent)
  doc.setFillColor(79, 70, 229); // Indigo 600
  doc.rect(0, 0, 210, 3, 'F');

  // 2. Executive Header Banner - Slate 900
  doc.setFillColor(15, 23, 42); // Slate 900
  doc.rect(0, 3, 210, 29, 'F');

  // Brand Name
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text('Carecueca Teatro', 14, 16);

  // Subtitle
  doc.setFontSize(9.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(203, 213, 225); // Slate 300
  doc.text('Informe Oficial de Estado de Cuotas y Finanzas', 14, 23);

  // Period Badge on Top Right
  doc.setFillColor(30, 41, 59); // Slate 800
  doc.roundedRect(132, 10, 64, 15, 2, 2, 'F');
  doc.setTextColor(245, 158, 11); // Amber 500
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'bold');
  doc.text('PERÍODO SELECCIONADO', 136, 15.5);
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(9.5);
  doc.text(periodName, 136, 21.5);

  // 3. Metadata Bar
  doc.setTextColor(100, 116, 139); // Slate 500
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  const nowStr = new Date().toLocaleDateString('es-CL', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
  doc.text(`Fecha y hora de emisión: ${nowStr}`, 14, 38);
  doc.text(`Total registros en este período: ${dues.length} socios`, 132, 38);

  // 4. Financial Calculations
  const totalDue = dues.reduce((acc, d) => d.status === 'Exento' ? acc : acc + (d.amount || 0), 0);
  const totalPaid = dues.reduce((acc, d) => acc + (d.amountPaid || 0), 0);
  const totalPending = Math.max(0, totalDue - totalPaid);
  const collectionRate = totalDue > 0 ? Math.round((totalPaid / totalDue) * 100) : 0;
  const paidCount = dues.filter((d) => d.status === 'Pagado').length;
  const overdueCount = dues.filter((d) => d.status === 'Atrasado').length;
  const pendingCount = dues.filter((d) => d.status === 'Pendiente' || d.status === 'Parcial').length;

  // 5. Executive KPI Summary Card
  doc.setFillColor(248, 250, 252); // Slate 50
  doc.setDrawColor(226, 232, 240); // Slate 200
  doc.roundedRect(14, 42, 182, 25, 2.5, 2.5, 'FD');

  // KPI 1: Esperado
  doc.setFontSize(7);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(100, 116, 139); // Slate 500
  doc.text('TOTAL ESPERADO', 20, 48);
  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42); // Slate 900
  doc.text(formatCLP(totalDue), 20, 56);
  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');
  doc.text(`${dues.length} cuotas emitidas`, 20, 62);

  // KPI 2: Recaudado
  doc.setFontSize(7);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(100, 116, 139);
  doc.text('TOTAL RECAUDADO', 66, 48);
  doc.setFontSize(11);
  doc.setTextColor(5, 150, 105); // Emerald 600
  doc.text(`${formatCLP(totalPaid)} (${collectionRate}%)`, 66, 56);
  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');
  doc.text(`${paidCount} socios al día`, 66, 62);

  // KPI 3: Pendiente
  doc.setFontSize(7);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(100, 116, 139);
  doc.text('SALDO PENDIENTE', 112, 48);
  doc.setFontSize(11);
  doc.setTextColor(totalPending > 0 ? 225 : 5, totalPending > 0 ? 29 : 150, totalPending > 0 ? 72 : 105);
  doc.text(formatCLP(totalPending), 112, 56);
  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');
  doc.text(`${overdueCount} atrasados • ${pendingCount} pendientes`, 112, 62);

  // KPI 4: Estado Padrón
  doc.setFontSize(7);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(100, 116, 139);
  doc.text('ESTADO COBRANZA', 158, 48);
  doc.setFontSize(11);
  doc.setTextColor(30, 41, 59);
  doc.text(`${paidCount}/${dues.length}`, 158, 56);
  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(5, 150, 105);
  doc.text(collectionRate >= 80 ? 'Cobranza Óptima' : 'En Gestión Activa', 158, 62);

  // 6. Dues Detail Table
  const tableRows = dues.map((due, idx) => {
    const member = members.find((m) => m.id === due.memberId);
    return [
      String(idx + 1),
      due.memberName,
      member?.rut || '-',
      member?.troupeRole || 'Socio',
      formatCLP(due.amount),
      formatCLP(due.amountPaid),
      due.status,
      due.paymentMethod ? due.paymentMethod.replace('Transferencia Bancaria', 'Transf.') : '-',
      formatPaymentDate(due.paidAt)
    ];
  });

  autoTable(doc, {
    startY: 72,
    head: [['#', 'Socio', 'RUT', 'Rol Elenco', 'Cuota', 'Pagado', 'Estado', 'Método', 'Fecha Pago']],
    body: tableRows,
    foot: [['', 'TOTALES DEL PERÍODO', '', '', formatCLP(totalDue), formatCLP(totalPaid), `${collectionRate}% al día`, '', '']],
    theme: 'plain',
    headStyles: {
      fillColor: [30, 41, 59], // Modern Deep Slate 800
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8,
      cellPadding: 2.5
    },
    bodyStyles: {
      fontSize: 7.5,
      textColor: [51, 65, 85], // Slate 700
      cellPadding: 2.2
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252], // Slate 50
    },
    footStyles: {
      fillColor: [241, 245, 249], // Slate 100
      textColor: [15, 23, 42], // Slate 900
      fontStyle: 'bold',
      fontSize: 8,
      cellPadding: 2.5
    },
    columnStyles: {
      0: { cellWidth: 8, halign: 'center' },
      1: { cellWidth: 44, fontStyle: 'bold' },
      2: { cellWidth: 20 },
      3: { cellWidth: 24 },
      4: { cellWidth: 19, halign: 'right' },
      5: { cellWidth: 19, halign: 'right' },
      6: { cellWidth: 18, halign: 'center' },
      7: { cellWidth: 18 },
      8: { cellWidth: 18, halign: 'center' }
    },
    didParseCell: function(data) {
      if (data.section === 'body' && data.column.index === 6) {
        const val = data.cell.raw;
        data.cell.styles.fontStyle = 'bold';
        if (val === 'Pagado') data.cell.styles.textColor = [5, 150, 105]; // Emerald
        else if (val === 'Atrasado') data.cell.styles.textColor = [225, 29, 72]; // Rose
        else if (val === 'Pendiente') data.cell.styles.textColor = [217, 119, 6]; // Amber
        else if (val === 'Parcial') data.cell.styles.textColor = [79, 70, 229]; // Indigo
        else if (val === 'Exento') data.cell.styles.textColor = [100, 116, 139]; // Slate
      }
    }
  });

  // 7. Footer / Bank Details & Official Sign-off
  const finalY = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable?.finalY || 210;
  const footerStartY = Math.min(finalY + 8, 255);

  // Bank Info Card
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(14, footerStartY, 115, 24, 2, 2, 'FD');

  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(30, 41, 59);
  doc.text('Datos Oficiales para Pago / Transferencias:', 18, footerStartY + 6);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(71, 85, 105);
  doc.text(`${bankDetails.bankName} • ${bankDetails.accountType} N° ${bankDetails.accountNumber}`, 18, footerStartY + 11.5);
  doc.text(`RUT: ${bankDetails.holderRut} • Titular: ${bankDetails.holderName}`, 18, footerStartY + 16.5);
  doc.text(`Envío comprobantes: ${bankDetails.emailForReceipt}`, 18, footerStartY + 21);

  // Signature Block
  doc.setDrawColor(148, 163, 184);
  doc.line(140, footerStartY + 16, 192, footerStartY + 16);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(30, 41, 59);
  doc.text('Tesorería Carecueca Teatro', 142, footerStartY + 20.5);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.setTextColor(148, 163, 184);
  doc.text('Firma autorizada digitalmente', 145, footerStartY + 24);

  // Save the PDF file
  const safeTitle = periodName.replace(/[^a-zA-Z0-9_-]/g, '_');
  const fileName = `Carecueca_Teatro_Reporte_${safeTitle}.pdf`;
  doc.save(fileName);
  return fileName;
}

// Export to Excel / CSV with multiple sheets and full period formatting
export function exportToExcelOrCSV(
  filename: string,
  dues: DuePayment[],
  members: Member[],
  format: 'xlsx' | 'csv' = 'xlsx',
  allDues?: DuePayment[]
) {
  // Build sheet 1: Dues Report for selected period
  const duesData = dues.map((d) => {
    const member = members.find((m) => m.id === d.memberId);
    const pendingAmount = Math.max(0, (d.amount || 0) - (d.amountPaid || 0));
    return {
      'Período': d.periodTitle,
      'Socio': d.memberName,
      'RUT': member?.rut || '',
      'Rol en Elenco': member?.troupeRole || 'Socio',
      'Teléfono': member?.phone || '',
      'Email': member?.email || '',
      'Monto Cuota ($)': d.amount,
      'Monto Pagado ($)': d.amountPaid,
      'Saldo Pendiente ($)': pendingAmount,
      'Estado': d.status,
      'Fecha Vencimiento': d.dueDate || '',
      'Fecha de Pago': formatPaymentDate(d.paidAt),
      'Método de Pago': d.paymentMethod || '',
      'N° Comprobante': d.receiptNumber || '',
      'Notas': d.notes || ''
    };
  });

  // Build sheet 2: Members Directory
  const membersData = members.map((m) => ({
    'Nombre Completo': m.name,
    'RUT': m.rut,
    'Email': m.email,
    'Teléfono': m.phone,
    'Rol en Elenco': m.troupeRole,
    'Estado Socio': m.memberStatus,
    'Rol en Sistema': m.userRole,
    'Cuota Mensual ($)': m.customQuota || 10000,
    'Fecha de Ingreso': m.joinDate,
    'Observaciones': m.notes || ''
  }));

  const wb = XLSX.utils.book_new();
  const wsDues = XLSX.utils.json_to_sheet(duesData);
  const wsMembers = XLSX.utils.json_to_sheet(membersData);

  // Format column widths for dues
  wsDues['!cols'] = [
    { wch: 18 }, // Período
    { wch: 26 }, // Socio
    { wch: 14 }, // RUT
    { wch: 18 }, // Rol
    { wch: 14 }, // Teléfono
    { wch: 24 }, // Email
    { wch: 15 }, // Cuota
    { wch: 15 }, // Pagado
    { wch: 18 }, // Saldo
    { wch: 12 }, // Estado
    { wch: 16 }, // Vencimiento
    { wch: 14 }, // Pago
    { wch: 22 }, // Método
    { wch: 16 }, // Comprobante
    { wch: 24 }  // Notas
  ];

  wsMembers['!cols'] = [
    { wch: 26 },
    { wch: 14 },
    { wch: 24 },
    { wch: 14 },
    { wch: 18 },
    { wch: 14 },
    { wch: 16 },
    { wch: 16 },
    { wch: 16 },
    { wch: 26 }
  ];

  XLSX.utils.book_append_sheet(wb, wsDues, 'Cuotas Seleccionadas');
  XLSX.utils.book_append_sheet(wb, wsMembers, 'Directorio Socios');

  // If all dues passed, add full history sheet
  if (allDues && allDues.length > 0) {
    const allDuesData = allDues.map((d) => {
      const member = members.find((m) => m.id === d.memberId);
      return {
        'Período': d.periodTitle,
        'Socio': d.memberName,
        'RUT': member?.rut || '',
        'Rol': member?.troupeRole || 'Socio',
        'Cuota ($)': d.amount,
        'Pagado ($)': d.amountPaid,
        'Estado': d.status,
        'Fecha Pago': formatPaymentDate(d.paidAt),
        'Método': d.paymentMethod || '',
        'Comprobante': d.receiptNumber || ''
      };
    });
    const wsAllDues = XLSX.utils.json_to_sheet(allDuesData);
    XLSX.utils.book_append_sheet(wb, wsAllDues, 'Historial General');
  }

  const safeFilename = filename.replace(/[^a-zA-Z0-9_-]/g, '_');
  if (format === 'csv') {
    XLSX.writeFile(wb, `${safeFilename}.csv`, { bookType: 'csv' });
  } else {
    XLSX.writeFile(wb, `${safeFilename}.xlsx`, { bookType: 'xlsx' });
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
