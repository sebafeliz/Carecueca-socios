import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { Dashboard } from './components/Dashboard';
import { DuesManagement } from './components/DuesManagement';
import { MembersList } from './components/MembersList';
import { ReportsAndExport } from './components/ReportsAndExport';
import { MemberPortalView } from './components/MemberPortalView';
import { RemindersModal } from './components/RemindersModal';
import { NotificationsDrawer } from './components/NotificationsDrawer';
import { RolesAndPermissionsModal } from './components/RolesAndPermissionsModal';

import { 
  Member, 
  DuePayment, 
  QuotaPeriod, 
  AppNotification, 
  BackupLog, 
  UserRole 
} from './types';
import { 
  INITIAL_MEMBERS, 
  INITIAL_DUES, 
  INITIAL_PERIODS, 
  INITIAL_NOTIFICATIONS, 
  INITIAL_BACKUPS, 
  INITIAL_BANK_DETAILS 
} from './data/initialData';
import { 
  seedInitialDataIfNeeded, 
  subscribeCollection, 
  saveMemberToFirestore, 
  deleteMemberFromFirestore, 
  saveDueToFirestore, 
  batchSaveDuesToFirestore, 
  addNotificationToFirestore, 
  updateNotificationInFirestore, 
  addBackupLogToFirestore 
} from './lib/firebase';
import { 
  requestPushPermission, 
  sendBrowserPushNotification, 
  playAlertChime 
} from './lib/notificationService';
import { generatePDFReport, exportToExcelOrCSV } from './lib/exportUtils';

export function dedupeById<T extends { id: string }>(items: T[]): T[] {
  const map = new Map<string, T>();
  items.forEach((item) => {
    if (item && item.id) {
      map.set(item.id, item);
    }
  });
  return Array.from(map.values());
}

export default function App() {
  const [activeTab, setActiveTab] = useState<string>('members');
  const [currentUserRole, setCurrentUserRole] = useState<UserRole>('Admin');

  // Firestore collections state with initial fallback and local storage persistence
  const [members, setMembers] = useState<Member[]>(() => {
    try {
      const saved = localStorage.getItem('carecueca_members');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return dedupeById(parsed);
      }
    } catch (e) {}
    return dedupeById(INITIAL_MEMBERS);
  });

  const [dues, setDues] = useState<DuePayment[]>(() => {
    try {
      const saved = localStorage.getItem('carecueca_dues');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return dedupeById(parsed);
      }
    } catch (e) {}
    return dedupeById(INITIAL_DUES);
  });

  const [periods, setPeriods] = useState<QuotaPeriod[]>(() => {
    try {
      const saved = localStorage.getItem('carecueca_periods');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return dedupeById(parsed);
      }
    } catch (e) {}
    return dedupeById(INITIAL_PERIODS);
  });

  const [notifications, setNotifications] = useState<AppNotification[]>(() => {
    try {
      const saved = localStorage.getItem('carecueca_notifications');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return dedupeById(parsed);
      }
    } catch (e) {}
    return dedupeById(INITIAL_NOTIFICATIONS);
  });

  const [backupLogs, setBackupLogs] = useState<BackupLog[]>(() => {
    try {
      const saved = localStorage.getItem('carecueca_backup_logs');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return dedupeById(parsed);
      }
    } catch (e) {}
    return dedupeById(INITIAL_BACKUPS);
  });

  const [selectedPeriodId, setSelectedPeriodId] = useState<string>(INITIAL_PERIODS[INITIAL_PERIODS.length - 1]?.id || 'per-2026-08');
  const [pushEnabled, setPushEnabled] = useState<boolean>(false);

  // Modals visibility
  const [remindersModalOpen, setRemindersModalOpen] = useState(false);
  const [notificationsDrawerOpen, setNotificationsDrawerOpen] = useState(false);
  const [rolesModalOpen, setRolesModalOpen] = useState(false);

  // Toast feedback state
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // 1. Initial Firestore setup & Real-time listeners
  useEffect(() => {
    seedInitialDataIfNeeded();

    const unsubMembers = subscribeCollection<Member>('members', INITIAL_MEMBERS, (data) => setMembers(data));
    const unsubDues = subscribeCollection<DuePayment>('dues', INITIAL_DUES, (data) => setDues(data));
    const unsubNotifs = subscribeCollection<AppNotification>('notifications', INITIAL_NOTIFICATIONS, (data) => setNotifications(data));
    const unsubBackups = subscribeCollection<BackupLog>('backup_logs', INITIAL_BACKUPS, (data) => setBackupLogs(data));

    return () => {
      unsubMembers();
      unsubDues();
      unsubNotifs();
      unsubBackups();
    };
  }, []);

  // Toggle Push Notifications Permission
  const handleTogglePushNotifications = async () => {
    if (!pushEnabled) {
      const granted = await requestPushPermission();
      if (granted) {
        setPushEnabled(true);
        showToast("¡Notificaciones Push activadas en tu navegador!");
        sendBrowserPushNotification("Carecueca Teatro - Notificaciones Activas", {
          body: "Recibirás alertas de morosidad y confirmaciones de pago."
        });
      } else {
        showToast("Permiso de notificaciones denegado o no disponible.");
      }
    } else {
      setPushEnabled(false);
      showToast("Notificaciones Push desactivadas.");
    }
  };

  // Member CRUD Actions
  const handleSaveMember = async (memberToSave: Member) => {
    const isNew = !members.some((m) => m.id === memberToSave.id);

    setMembers((prev) => {
      const exists = prev.some((m) => m.id === memberToSave.id);
      const next = exists ? prev.map((m) => (m.id === memberToSave.id ? memberToSave : m)) : [...prev, memberToSave];
      try { localStorage.setItem('carecueca_members', JSON.stringify(next)); } catch (e) {}
      return next;
    });

    // Auto-generate dues for existing open periods if this is a newly registered member
    if (isNew && memberToSave.memberStatus !== 'Inactivo') {
      const generatedDues: DuePayment[] = periods.map((p) => {
        const dueId = `due-${p.year}${p.month}-${memberToSave.id}`;
        const isExempt = memberToSave.memberStatus === 'Exento' || memberToSave.memberStatus === 'Honorario' || memberToSave.customQuota === 0;
        const amountToCharge = isExempt ? 0 : (memberToSave.customQuota > 0 ? memberToSave.customQuota : p.baseAmount);
        
        return {
          id: dueId,
          memberId: memberToSave.id,
          memberName: memberToSave.name,
          year: p.year,
          month: p.month,
          periodTitle: p.title,
          amount: amountToCharge,
          amountPaid: 0,
          status: isExempt ? 'Exento' : 'Pendiente',
          dueDate: p.dueDate,
          notes: isExempt ? `Exento (${memberToSave.memberStatus})` : ''
        };
      });

      if (generatedDues.length > 0) {
        setDues((prev) => {
          const next = dedupeById([...prev, ...generatedDues]);
          try { localStorage.setItem('carecueca_dues', JSON.stringify(next)); } catch (e) {}
          return next;
        });
        try { await batchSaveDuesToFirestore(generatedDues); } catch (e) {}
      }
    }

    try {
      await saveMemberToFirestore(memberToSave);
    } catch (err) {
      console.warn("Firestore member save failed:", err);
    }
    showToast(`Socio ${memberToSave.name} guardado con éxito.`);
  };

  const handleDeleteMember = async (memberId: string) => {
    setMembers((prev) => {
      const next = prev.filter((m) => m.id !== memberId);
      try { localStorage.setItem('carecueca_members', JSON.stringify(next)); } catch (e) {}
      return next;
    });
    setDues((prev) => {
      const next = prev.filter((d) => d.memberId !== memberId);
      try { localStorage.setItem('carecueca_dues', JSON.stringify(next)); } catch (e) {}
      return next;
    });
    try {
      await deleteMemberFromFirestore(memberId);
    } catch (err) {
      console.warn("Firestore member delete failed:", err);
    }
    showToast("Socio eliminado del sistema.");
  };

  // Due Update Action
  const handleUpdateDue = async (updatedDue: DuePayment) => {
    setDues((prev) => {
      const next = prev.map((d) => (d.id === updatedDue.id ? updatedDue : d));
      try { localStorage.setItem('carecueca_dues', JSON.stringify(next)); } catch (e) {}
      return next;
    });
    try {
      await saveDueToFirestore(updatedDue);
    } catch (err) {
      console.warn("Firestore due update failed:", err);
    }

    if (updatedDue.status === 'Pagado') {
      const notifMsg = `Confirmación de pago recibida para ${updatedDue.memberName} en el periodo ${updatedDue.periodTitle}.`;
      try {
        await addNotificationToFirestore({
          title: "✅ Pago Registrado",
          message: notifMsg,
          type: "payment",
          read: false,
          memberId: updatedDue.memberId,
          createdAt: new Date().toISOString().replace('T', ' ').substring(0, 16)
        });
      } catch (e) {}

      if (pushEnabled) {
        sendBrowserPushNotification("✅ Nuevo Pago Confirmado", {
          body: `${updatedDue.memberName} pagó su cuota de ${updatedDue.periodTitle}.`
        });
      } else {
        playAlertChime('success');
      }
      showToast("✅ Pago registrado con éxito.");
    } else if (updatedDue.amountPaid === 0) {
      showToast("🗑️ Pago eliminado. La cuota volvió a quedar pendiente.");
    } else {
      showToast("Estado de cuota actualizado correctamente.");
    }
  };

  // Create New Period & Batch Generate Dues
  const handleCreatePeriod = async (title: string, year: number, month: number, dueDate: string, baseAmount: number) => {
    const periodId = `per-${year}-${String(month).padStart(2, '0')}`;
    const newPeriod: QuotaPeriod = {
      id: periodId,
      year,
      month,
      title,
      dueDate,
      baseAmount,
      status: 'Abierto',
      createdAt: new Date().toISOString()
    };

    setPeriods((prev) => {
      const exists = prev.some((p) => p.id === periodId);
      const next = exists ? prev.map((p) => (p.id === periodId ? newPeriod : p)) : [...prev, newPeriod];
      try { localStorage.setItem('carecueca_periods', JSON.stringify(next)); } catch (e) {}
      return next;
    });
    setSelectedPeriodId(periodId);

    // Create dues for active members
    const newDuesList: DuePayment[] = members
      .filter((m) => m.memberStatus !== 'Inactivo')
      .map((m) => {
        const isExempt = m.memberStatus === 'Exento' || m.memberStatus === 'Honorario' || m.customQuota === 0;
        const amountToCharge = isExempt ? 0 : (m.customQuota > 0 ? m.customQuota : baseAmount);

        return {
          id: `due-${year}${month}-${m.id}`,
          memberId: m.id,
          memberName: m.name,
          year,
          month,
          periodTitle: title,
          amount: amountToCharge,
          amountPaid: 0,
          status: isExempt ? 'Exento' : 'Pendiente',
          dueDate,
          notes: isExempt ? `Exento (${m.memberStatus})` : ''
        };
      });

    setDues((prev) => {
      const next = dedupeById([...prev, ...newDuesList]);
      try { localStorage.setItem('carecueca_dues', JSON.stringify(next)); } catch (e) {}
      return next;
    });

    try {
      await batchSaveDuesToFirestore(newDuesList);
    } catch (err) {
      console.warn("Firestore batch save failed:", err);
    }

    showToast(`Periodo ${title} creado y cuotas generadas para ${newDuesList.length} socios.`);
  };

  // Send WhatsApp Reminder Link
  const handleSendWhatsAppReminder = (due: DuePayment) => {
    const member = members.find((m) => m.id === due.memberId);
    if (!member) return;

    const pending = due.amount - due.amountPaid;
    const msg = `Hola *${due.memberName}*! Te recordamos la cuota de *${due.periodTitle}* en Carecueca Teatro por un monto de *${pending.toLocaleString('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 })}*. BancoEstado Cuenta Vista N° 123456789. ¡Gracias!`;
    const cleanPhone = member.phone.replace(/[^\d+]/g, '');
    window.open(`https://wa.me/${cleanPhone}?text=${encodeURIComponent(msg)}`, '_blank');
  };

  // Trigger Real-time Push Alert
  const handleTriggerRealtimePushAlert = async (title: string, message: string) => {
    await addNotificationToFirestore({
      title,
      message,
      type: 'critical',
      read: false,
      createdAt: new Date().toISOString().replace('T', ' ').substring(0, 16)
    });

    if (pushEnabled) {
      sendBrowserPushNotification(title, { body: message });
    } else {
      playAlertChime('critical');
    }

    showToast("⚠️ Alerta Push emitida en tiempo real.");
  };

  // Add Backup Log
  const handleAddBackupLog = async (log: BackupLog) => {
    setBackupLogs((prev) => [log, ...prev]);
    await addBackupLogToFirestore(log);
    showToast("Copia de seguridad en la nube guardada exitosamente.");
  };

  // Mark all notifications as read
  const handleMarkAllNotifsRead = async () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    notifications.forEach((n) => {
      if (!n.read) updateNotificationInFirestore(n.id, { read: true });
    });
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans flex flex-col selection:bg-indigo-600 selection:text-white">
      
      {/* Header Bar */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        currentUserRole={currentUserRole}
        setCurrentUserRole={setCurrentUserRole}
        unreadCount={unreadCount}
        openNotifications={() => setNotificationsDrawerOpen(true)}
        pushEnabled={pushEnabled}
        togglePushNotifications={handleTogglePushNotifications}
      />

      {/* Toast Floating Feedback */}
      {toastMessage && (
        <div className="fixed bottom-4 right-4 z-50 bg-slate-900 text-white border border-slate-700 px-3.5 py-2.5 rounded-lg shadow-lg text-xs font-medium flex items-center space-x-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Main View Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-5">
        
        {activeTab === 'dashboard' && (
          <Dashboard
            members={members}
            dues={dues}
            periods={periods}
            selectedPeriodId={selectedPeriodId}
            setSelectedPeriodId={setSelectedPeriodId}
            openRemindersModal={() => setRemindersModalOpen(true)}
            exportPdfForCurrentPeriod={() => {
              const currentPeriod = periods.find((p) => p.id === selectedPeriodId);
              const periodDues = dues.filter((d) => d.periodTitle === currentPeriod?.title);
              generatePDFReport(currentPeriod?.title || 'Agosto 2026', periodDues, members, INITIAL_BANK_DETAILS);
            }}
            exportExcelCurrentPeriod={() => {
              const currentPeriod = periods.find((p) => p.id === selectedPeriodId);
              exportToExcelOrCSV(`Carecueca_Teatro_Cuotas_${currentPeriod?.title}`, dues, members, 'xlsx');
            }}
            generateCurrentMonthDues={() => {
              const currentPeriod = periods.find((p) => p.id === selectedPeriodId);
              handleCreatePeriod(`Septiembre 2026`, 2026, 9, '2026-09-10', 10000);
            }}
            navigateToTab={setActiveTab}
          />
        )}

        {activeTab === 'dues' && (
          <DuesManagement
            members={members}
            dues={dues}
            periods={periods}
            selectedPeriodId={selectedPeriodId}
            setSelectedPeriodId={setSelectedPeriodId}
            onUpdateDue={handleUpdateDue}
            onCreatePeriod={handleCreatePeriod}
            onSendWhatsAppReminder={handleSendWhatsAppReminder}
            bankDetails={INITIAL_BANK_DETAILS}
          />
        )}

        {activeTab === 'members' && (
          <MembersList
            members={members}
            currentUserRole={currentUserRole}
            onSaveMember={handleSaveMember}
            onDeleteMember={handleDeleteMember}
            openRolesModal={() => setRolesModalOpen(true)}
          />
        )}

        {activeTab === 'reports' && (
          <ReportsAndExport
            members={members}
            dues={dues}
            periods={periods}
            selectedPeriodId={selectedPeriodId}
            setSelectedPeriodId={setSelectedPeriodId}
            bankDetails={INITIAL_BANK_DETAILS}
            backupLogs={backupLogs}
            onAddBackupLog={handleAddBackupLog}
            userEmail="sebafeliz@gmail.com"
          />
        )}

        {activeTab === 'portal' && (
          <MemberPortalView
            members={members}
            dues={dues}
            bankDetails={INITIAL_BANK_DETAILS}
            onUpdateDue={handleUpdateDue}
          />
        )}

      </main>

      {/* Modals & Drawers */}
      <RemindersModal
        isOpen={remindersModalOpen}
        onClose={() => setRemindersModalOpen(false)}
        dues={dues}
        members={members}
        bankDetails={INITIAL_BANK_DETAILS}
        onTriggerRealtimePushAlert={handleTriggerRealtimePushAlert}
      />

      <NotificationsDrawer
        isOpen={notificationsDrawerOpen}
        onClose={() => setNotificationsDrawerOpen(false)}
        notifications={notifications}
        onMarkAllAsRead={handleMarkAllNotifsRead}
        onClearNotifications={() => setNotifications([])}
        onGenerateTestAlert={() => handleTriggerRealtimePushAlert("⚠️ Alerta: Morosidad de Ensayo", "Se ha detectado 1 cuota pendiente atrasada.")}
        pushEnabled={pushEnabled}
        togglePushNotifications={handleTogglePushNotifications}
      />

      <RolesAndPermissionsModal
        isOpen={rolesModalOpen}
        onClose={() => setRolesModalOpen(false)}
        currentUserRole={currentUserRole}
        setCurrentUserRole={setCurrentUserRole}
      />

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 text-slate-500 py-4 text-xs mt-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center space-x-2 font-medium">
            <span className="font-bold text-slate-800">Carecueca Teatro</span>
            <span>•</span>
            <span>Sistema de Cuotas Mensuales</span>
          </div>
          <div className="text-slate-400 text-[11px]">
            Sincronizado con Firestore
          </div>
        </div>
      </footer>

    </div>
  );
}
