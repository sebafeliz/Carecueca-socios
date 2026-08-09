import { Member, DuePayment, QuotaPeriod, AppNotification, BackupLog, BankAccountDetails } from '../types';

export const INITIAL_BANK_DETAILS: BankAccountDetails = {
  bankName: "Banco Estado",
  accountType: "Cuenta Vista / Chequera Electrónica",
  accountNumber: "123456789",
  holderName: "Agrupación Cultural Carecueca Teatro",
  holderRut: "65.123.456-7",
  emailForReceipt: "tesoreria@carecuecateatro.cl"
};

export const INITIAL_MEMBERS: Member[] = [];

export const INITIAL_PERIODS: QuotaPeriod[] = [
  { id: "per-2026-07", year: 2026, month: 7, title: "Julio 2026", dueDate: "2026-07-10", baseAmount: 10000, status: "Cerrado", createdAt: "2026-07-01" },
  { id: "per-2026-08", year: 2026, month: 8, title: "Agosto 2026", dueDate: "2026-08-10", baseAmount: 10000, status: "Abierto", createdAt: "2026-08-01" },
];

export const INITIAL_DUES: DuePayment[] = [];

export const INITIAL_NOTIFICATIONS: AppNotification[] = [];

export const INITIAL_BACKUPS: BackupLog[] = [];
