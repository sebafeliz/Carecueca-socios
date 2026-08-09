export type MemberStatus = 'Activo' | 'Inactivo' | 'Moroso' | 'Exento' | 'Honorario';
export type UserRole = 'Admin' | 'Tesorero' | 'Socio';
export type TroupeRole = 'Actor/Actriz' | 'Director/a' | 'Músico' | 'Técnico/a' | 'Producción' | 'Dramaturgo/a' | 'Gestor/a';

export interface Member {
  id: string;
  name: string;
  email: string;
  phone: string;
  rut: string;
  troupeRole: TroupeRole;
  memberStatus: MemberStatus;
  userRole: UserRole;
  customQuota: number; // e.g. 10000 CLP
  joinDate: string; // ISO string or YYYY-MM-DD
  avatarUrl?: string;
  notes?: string;
  createdAt?: string;
}

export type PaymentStatus = 'Pagado' | 'Pendiente' | 'Atrasado' | 'Parcial' | 'Exento';
export type PaymentMethod = 'Transferencia Bancaria' | 'Efectivo' | 'MercadoPago' | 'Tarjeta Débito/Crédito' | 'Otro';

export interface DuePayment {
  id: string;
  memberId: string;
  memberName: string;
  year: number;
  month: number; // 1 to 12
  periodTitle: string; // e.g. "Agosto 2026"
  amount: number;
  amountPaid: number;
  status: PaymentStatus;
  dueDate: string; // YYYY-MM-DD
  paidAt?: string; // YYYY-MM-DD HH:mm
  paymentMethod?: PaymentMethod;
  receiptNumber?: string;
  notes?: string;
  updatedAt?: string;
}

export interface QuotaPeriod {
  id: string;
  year: number;
  month: number;
  title: string;
  dueDate: string;
  baseAmount: number;
  status: 'Abierto' | 'Cerrado';
  createdAt: string;
}

export type NotificationType = 'critical' | 'reminder' | 'payment' | 'system';

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  type: NotificationType;
  read: boolean;
  memberId?: string;
  createdAt: string;
}

export interface BackupLog {
  id: string;
  fileName: string;
  fileSize: string;
  type: 'PDF' | 'Excel/CSV' | 'Cloud Auto-Backup' | 'JSON Full Dump';
  status: 'Exitoso' | 'Pendiente' | 'Fallido';
  createdBy: string;
  cloudDestination?: string;
  createdAt: string;
}

export interface ActivityLog {
  id: string;
  user: string;
  action: string;
  details: string;
  timestamp: string;
}

export interface BankAccountDetails {
  bankName: string;
  accountType: string;
  accountNumber: string;
  holderName: string;
  holderRut: string;
  emailForReceipt: string;
}
