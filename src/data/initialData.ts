import { Member, DuePayment, QuotaPeriod, AppNotification, BackupLog, BankAccountDetails } from '../types';

export const INITIAL_BANK_DETAILS: BankAccountDetails = {
  bankName: "Banco Estado",
  accountType: "Cuenta Vista / Chequera Electrónica",
  accountNumber: "123456789",
  holderName: "Agrupación Cultural Carecueca Teatro",
  holderRut: "65.123.456-7",
  emailForReceipt: "tesoreria@carecuecateatro.cl"
};

export const INITIAL_MEMBERS: Member[] = [
  {
    id: "mem-1",
    name: "María José Fuentes",
    email: "mariajose@carecuecateatro.cl",
    phone: "+56 9 8765 4321",
    rut: "17.432.198-5",
    troupeRole: "Director/a",
    memberStatus: "Activo",
    userRole: "Admin",
    customQuota: 10000,
    joinDate: "2023-03-15",
    notes: "Directora general de obras de la temporada 2026."
  },
  {
    id: "mem-2",
    name: "Carlos Villagra Tapia",
    email: "carlos.v@carecuecateatro.cl",
    phone: "+56 9 7654 3210",
    rut: "16.890.123-1",
    troupeRole: "Gestor/a",
    memberStatus: "Activo",
    userRole: "Tesorero",
    customQuota: 10000,
    joinDate: "2023-04-01",
    notes: "Encargado de finanzas y rendición de cuentas."
  },
  {
    id: "mem-3",
    name: "Valentina Henríquez",
    email: "vale.henriquez@gmail.com",
    phone: "+56 9 6543 2109",
    rut: "18.123.456-k",
    troupeRole: "Actor/Actriz",
    memberStatus: "Activo",
    userRole: "Socio",
    customQuota: 10000,
    joinDate: "2024-01-10",
    notes: "Elenco principal 'La Cueca Trágica'."
  },
  {
    id: "mem-4",
    name: "Sebastián Parra Araya",
    email: "seba.parra@gmail.com",
    phone: "+56 9 5432 1098",
    rut: "19.567.890-2",
    troupeRole: "Actor/Actriz",
    memberStatus: "Moroso",
    userRole: "Socio",
    customQuota: 10000,
    joinDate: "2024-02-20",
    notes: "Pendiente de pago cuotas actuales."
  },
  {
    id: "mem-5",
    name: "Camila Donoso Vera",
    email: "camila.donoso@gmail.com",
    phone: "+56 9 4321 0987",
    rut: "18.987.654-3",
    troupeRole: "Músico",
    memberStatus: "Activo",
    userRole: "Socio",
    customQuota: 10000,
    joinDate: "2024-03-01",
    notes: "Acordeonista y compositora de banda sonora."
  },
  {
    id: "mem-6",
    name: "Rodrigo San Martín",
    email: "rodrigo.sanmartin@gmail.com",
    phone: "+56 9 3210 9876",
    rut: "15.654.321-9",
    troupeRole: "Técnico/a",
    memberStatus: "Exento",
    userRole: "Socio",
    customQuota: 0,
    joinDate: "2023-05-12",
    notes: "Exento por aportes técnicos de iluminación y sonido en sala."
  },
  {
    id: "mem-7",
    name: "Francisca Morales Castro",
    email: "fran.morales@gmail.com",
    phone: "+56 9 2109 8765",
    rut: "17.890.345-4",
    troupeRole: "Producción",
    memberStatus: "Activo",
    userRole: "Socio",
    customQuota: 10000,
    joinDate: "2024-05-01",
    notes: "Coordinación de giras y logística de vestuario."
  },
  {
    id: "mem-8",
    name: "Don Hernán Soto",
    email: "hernan.soto@teatrochile.cl",
    phone: "+56 9 1098 7654",
    rut: "10.234.567-8",
    troupeRole: "Dramaturgo/a",
    memberStatus: "Honorario",
    userRole: "Socio",
    customQuota: 0,
    joinDate: "2023-01-01",
    notes: "Socio fundador e inspirador de la agrupación."
  }
];

export const INITIAL_PERIODS: QuotaPeriod[] = [
  { id: "per-2026-07", year: 2026, month: 7, title: "Julio 2026", dueDate: "2026-07-10", baseAmount: 10000, status: "Cerrado", createdAt: "2026-07-01" },
  { id: "per-2026-08", year: 2026, month: 8, title: "Agosto 2026", dueDate: "2026-08-10", baseAmount: 10000, status: "Abierto", createdAt: "2026-08-01" },
];

export const INITIAL_DUES: DuePayment[] = [
  // Agosto 2026
  { id: "due-8-1", memberId: "mem-1", memberName: "María José Fuentes", year: 2026, month: 8, periodTitle: "Agosto 2026", amount: 10000, amountPaid: 10000, status: "Pagado", dueDate: "2026-08-10", paidAt: "2026-08-03 14:30", paymentMethod: "Transferencia Bancaria", receiptNumber: "REC-202608-01", notes: "Transferencia BancoEstado" },
  { id: "due-8-2", memberId: "mem-2", memberName: "Carlos Villagra Tapia", year: 2026, month: 8, periodTitle: "Agosto 2026", amount: 10000, amountPaid: 10000, status: "Pagado", dueDate: "2026-08-10", paidAt: "2026-08-05 10:15", paymentMethod: "Transferencia Bancaria", receiptNumber: "REC-202608-02", notes: "Pago mensual anticipado" },
  { id: "due-8-3", memberId: "mem-3", memberName: "Valentina Henríquez", year: 2026, month: 8, periodTitle: "Agosto 2026", amount: 10000, amountPaid: 10000, status: "Pagado", dueDate: "2026-08-10", paidAt: "2026-08-08 19:20", paymentMethod: "Efectivo", receiptNumber: "REC-202608-03", notes: "Entrega en ensayo" },
  { id: "due-8-4", memberId: "mem-4", memberName: "Sebastián Parra Araya", year: 2026, month: 8, periodTitle: "Agosto 2026", amount: 10000, amountPaid: 0, status: "Atrasado", dueDate: "2026-08-10", notes: "Pendiente de pago" },
  { id: "due-8-5", memberId: "mem-5", memberName: "Camila Donoso Vera", year: 2026, month: 8, periodTitle: "Agosto 2026", amount: 10000, amountPaid: 5000, status: "Parcial", dueDate: "2026-08-10", paidAt: "2026-08-07 11:00", paymentMethod: "MercadoPago", receiptNumber: "REC-202608-04", notes: "Abono parcial de 50%" },
  { id: "due-8-6", memberId: "mem-6", memberName: "Rodrigo San Martín", year: 2026, month: 8, periodTitle: "Agosto 2026", amount: 0, amountPaid: 0, status: "Exento", dueDate: "2026-08-10", notes: "Becado / Exento por trabajo técnico" },
  { id: "due-8-7", memberId: "mem-7", memberName: "Francisca Morales Castro", year: 2026, month: 8, periodTitle: "Agosto 2026", amount: 10000, amountPaid: 0, status: "Pendiente", dueDate: "2026-08-10", notes: "Aviso enviado por WhatsApp" },
  { id: "due-8-8", memberId: "mem-8", memberName: "Don Hernán Soto", year: 2026, month: 8, periodTitle: "Agosto 2026", amount: 0, amountPaid: 0, status: "Exento", dueDate: "2026-08-10", notes: "Socio Honorario" },

  // Julio 2026
  { id: "due-7-1", memberId: "mem-1", memberName: "María José Fuentes", year: 2026, month: 7, periodTitle: "Julio 2026", amount: 10000, amountPaid: 10000, status: "Pagado", dueDate: "2026-07-10", paidAt: "2026-07-02 09:00", paymentMethod: "Transferencia Bancaria", receiptNumber: "REC-202607-01" },
  { id: "due-7-2", memberId: "mem-2", memberName: "Carlos Villagra Tapia", year: 2026, month: 7, periodTitle: "Julio 2026", amount: 10000, amountPaid: 10000, status: "Pagado", dueDate: "2026-07-10", paidAt: "2026-07-04 12:00", paymentMethod: "Transferencia Bancaria", receiptNumber: "REC-202607-02" },
  { id: "due-7-3", memberId: "mem-3", memberName: "Valentina Henríquez", year: 2026, month: 7, periodTitle: "Julio 2026", amount: 10000, amountPaid: 10000, status: "Pagado", dueDate: "2026-07-10", paidAt: "2026-07-09 18:30", paymentMethod: "Transferencia Bancaria", receiptNumber: "REC-202607-03" },
  { id: "due-7-4", memberId: "mem-4", memberName: "Sebastián Parra Araya", year: 2026, month: 7, periodTitle: "Julio 2026", amount: 10000, amountPaid: 0, status: "Atrasado", dueDate: "2026-07-10", notes: "Impago" },
  { id: "due-7-5", memberId: "mem-5", memberName: "Camila Donoso Vera", year: 2026, month: 7, periodTitle: "Julio 2026", amount: 10000, amountPaid: 10000, status: "Pagado", dueDate: "2026-07-10", paidAt: "2026-07-10 16:00", paymentMethod: "Efectivo", receiptNumber: "REC-202607-04" },
  { id: "due-7-7", memberId: "mem-7", memberName: "Francisca Morales Castro", year: 2026, month: 7, periodTitle: "Julio 2026", amount: 10000, amountPaid: 10000, status: "Pagado", dueDate: "2026-07-10", paidAt: "2026-07-08 10:20", paymentMethod: "Transferencia Bancaria", receiptNumber: "REC-202607-05" }
];

export const INITIAL_NOTIFICATIONS: AppNotification[] = [];

export const INITIAL_BACKUPS: BackupLog[] = [];
