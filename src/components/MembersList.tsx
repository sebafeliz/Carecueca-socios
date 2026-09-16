import React, { useState, useEffect } from 'react';
import { 
  Users, 
  UserPlus, 
  ShieldCheck, 
  Phone, 
  Mail, 
  X, 
  Trash2, 
  Edit3, 
  Drama,
  CheckCircle2,
  AlertCircle,
  UserCheck,
  RotateCcw,
  Sparkles,
  AlertTriangle,
  RefreshCw,
  Clock
} from 'lucide-react';
import { Member, MemberStatus, UserRole, TroupeRole, DuePayment } from '../types';
import { formatCLP } from '../lib/exportUtils';
import { 
  saveFormDraft, 
  loadFormDraft, 
  clearFormDraft 
} from '../lib/recoveryService';

interface MembersListProps {
  members: Member[];
  dues?: DuePayment[];
  currentUserRole: UserRole;
  onSaveMember: (member: Member) => Promise<void> | void;
  onDeleteMember: (id: string, isErroneousEntry?: boolean) => Promise<void> | void;
  openRolesModal: () => void;
  openRecoveryModal: () => void;
  recoverableCount: number;
  onQuickRestoreAll?: () => Promise<void>;
}

// Utility to format Chilean RUT (e.g. 12345678k -> 12.345.678-K)
export function formatRUT(value: string): string {
  const clean = value.replace(/[^0-9kK]/g, '').toUpperCase();
  if (clean.length <= 1) return clean;
  const dv = clean.slice(-1);
  let body = clean.slice(0, -1);
  let formatted = '';
  while (body.length > 3) {
    formatted = '.' + body.slice(-3) + formatted;
    body = body.slice(0, -3);
  }
  return (body + formatted + '-' + dv).slice(0, 12);
}

export const MembersList: React.FC<MembersListProps> = ({
  members,
  dues = [],
  currentUserRole,
  onSaveMember,
  onDeleteMember,
  openRolesModal,
  openRecoveryModal,
  recoverableCount,
  onQuickRestoreAll
}) => {
  // Modal State
  const [memberModalOpen, setMemberModalOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<Member | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Deletion Confirmation Dialog State
  const [memberToDelete, setMemberToDelete] = useState<Member | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Form Fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [rut, setRut] = useState('');
  const [troupeRole, setTroupeRole] = useState<TroupeRole>('Actor/Actriz');
  const [memberStatus, setMemberStatus] = useState<MemberStatus>('Activo');
  const [userRole, setUserRole] = useState<UserRole>('Socio');
  const [customQuota, setCustomQuota] = useState<number>(10000);
  const [notes, setNotes] = useState('');
  const [hasDraft, setHasDraft] = useState(false);

  // Check for saved form draft when opening add form
  const checkDraftOnOpen = () => {
    const draft = loadFormDraft();
    if (draft && draft.name) {
      setHasDraft(true);
    } else {
      setHasDraft(false);
    }
  };

  const applyDraft = () => {
    const draft = loadFormDraft();
    if (draft) {
      if (draft.name) setName(draft.name);
      if (draft.email) setEmail(draft.email);
      if (draft.phone) setPhone(draft.phone);
      if (draft.rut) setRut(draft.rut);
      if (draft.troupeRole) setTroupeRole(draft.troupeRole);
      if (draft.memberStatus) setMemberStatus(draft.memberStatus);
      if (draft.userRole) setUserRole(draft.userRole);
      if (typeof draft.customQuota === 'number') setCustomQuota(draft.customQuota);
      if (draft.notes) setNotes(draft.notes);
      setHasDraft(false);
    }
  };

  const openAddModal = () => {
    setEditingMember(null);
    setName('');
    setEmail('');
    setPhone('+56 9 ');
    setRut('');
    setTroupeRole('Actor/Actriz');
    setMemberStatus('Activo');
    setUserRole('Socio');
    setCustomQuota(10000);
    setNotes('');
    checkDraftOnOpen();
    setMemberModalOpen(true);
  };

  const openEditModal = (member: Member) => {
    setEditingMember(member);
    setName(member.name);
    setEmail(member.email);
    setPhone(member.phone);
    setRut(member.rut);
    setTroupeRole(member.troupeRole);
    setMemberStatus(member.memberStatus);
    setUserRole(member.userRole);
    setCustomQuota(member.customQuota);
    setNotes(member.notes || '');
    setHasDraft(false);
    setMemberModalOpen(true);
  };

  // Auto-save draft when adding a new member
  const handleFieldChange = (field: string, val: any) => {
    if (!editingMember) {
      saveFormDraft({
        name: field === 'name' ? val : name,
        email: field === 'email' ? val : email,
        phone: field === 'phone' ? val : phone,
        rut: field === 'rut' ? val : rut,
        troupeRole: field === 'troupeRole' ? val : troupeRole,
        memberStatus: field === 'memberStatus' ? val : memberStatus,
        userRole: field === 'userRole' ? val : userRole,
        customQuota: field === 'customQuota' ? val : customQuota,
        notes: field === 'notes' ? val : notes
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const memberToSave: Member = {
      id: editingMember ? editingMember.id : 'mem-' + Date.now(),
      name: name.trim(),
      email: email.trim(),
      phone: phone.trim(),
      rut: rut.trim(),
      troupeRole,
      memberStatus,
      userRole,
      customQuota: Number(customQuota),
      joinDate: editingMember ? editingMember.joinDate : new Date().toISOString().split('T')[0],
      notes: notes.trim(),
      createdAt: editingMember?.createdAt || new Date().toISOString()
    };

    try {
      await onSaveMember(memberToSave);
      clearFormDraft();
      setMemberModalOpen(false);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmDelete = async (isErroneousEntry = true) => {
    if (!memberToDelete) return;
    setIsDeleting(true);
    try {
      await onDeleteMember(memberToDelete.id, isErroneousEntry);
      setMemberToDelete(null);
    } catch (err) {
      console.error(err);
    } finally {
      setIsDeleting(false);
    }
  };

  // Filter members (direct list)
  const filteredMembers = members;

  const getStatusBadge = (status: MemberStatus) => {
    switch (status) {
      case 'Activo':
        return <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200"><CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Activo</span>;
      case 'Moroso':
        return <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200"><AlertCircle className="w-3.5 h-3.5 mr-1" /> Moroso</span>;
      case 'Exento':
        return <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-200"><UserCheck className="w-3.5 h-3.5 mr-1" /> Exento</span>;
      case 'Honorario':
        return <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">Honorario</span>;
      case 'Inactivo':
        return <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold bg-slate-100 text-slate-600 border border-slate-200">Inactivo</span>;
    }
  };

  return (
    <div className="space-y-5">

      {/* RECOVERY ALERT BANNER (Shown if previously entered members are found) */}
      {recoverableCount > 0 && (
        <div className="bg-gradient-to-r from-amber-500/10 via-emerald-500/10 to-indigo-500/10 border-2 border-amber-300 rounded-2xl p-4 md:p-5 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-3 animate-in fade-in">
          <div className="flex items-start space-x-3.5">
            <div className="p-2.5 bg-amber-100 text-amber-800 rounded-xl shrink-0 mt-0.5">
              <RotateCcw className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-sm md:text-base flex items-center gap-2">
                <span>¡Se encontraron {recoverableCount} socio(s) ingresados anteriormente!</span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                  Rescatados en Memoria
                </span>
              </h3>
              <p className="text-xs text-slate-600 mt-1 max-w-2xl">
                Detectamos registros previos en la bóveda de seguridad y memoria de tu navegador que no están en la lista actual. Puedes restaurarlos inmediatamente con 1 clic para que queden asegurados en Firestore.
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2.5 shrink-0 self-end md:self-center">
            {onQuickRestoreAll && (
              <button
                onClick={onQuickRestoreAll}
                className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs flex items-center space-x-1.5 shadow-sm transition-all"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Restaurar todos ahora</span>
              </button>
            )}
            <button
              onClick={openRecoveryModal}
              className="px-3 py-2 bg-white hover:bg-slate-50 text-slate-800 font-semibold rounded-xl text-xs border border-slate-300 shadow-2xs transition-colors"
            >
              Revisar detalles
            </button>
          </div>
        </div>
      )}
      
      {/* Top Controls Header */}
      <div className="bg-white p-4 md:p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <h2 className="text-lg font-bold text-slate-900 flex items-center space-x-2.5">
              <Users className="w-6 h-6 text-indigo-600" />
              <span>Directorio de Socios • Carecueca Teatro</span>
            </h2>
            <span className="hidden sm:inline-flex items-center text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
              <ShieldCheck className="w-3 h-3 mr-1" />
              Persistencia Robusta Activa
            </span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={openRecoveryModal}
            className="flex items-center space-x-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg text-xs transition-colors border border-slate-200"
            title="Ver historial de respaldos y recuperar socios anteriores"
          >
            <RotateCcw className="w-3.5 h-3.5 text-indigo-600" />
            <span>Recuperación & Bóveda</span>
            {recoverableCount > 0 && (
              <span className="ml-1 px-1.5 py-0.5 rounded-full bg-amber-500 text-white text-[10px] font-bold animate-pulse">
                {recoverableCount}
              </span>
            )}
          </button>

          <button
            onClick={openAddModal}
            className="flex items-center space-x-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg text-xs transition-colors shadow-sm"
          >
            <UserPlus className="w-4 h-4" />
            <span>+ Agregar Socio</span>
          </button>
        </div>
      </div>

      {/* Members Grid Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredMembers.length > 0 ? (
          filteredMembers.map((member, idx) => (
            <div
              key={`${member.id}-${idx}`}
              className="bg-white rounded-xl p-4 md:p-5 border border-slate-200 shadow-sm flex flex-col justify-between hover:border-indigo-200 transition-colors"
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="font-bold text-slate-900 text-base">{member.name}</h3>
                    <p className="text-xs text-slate-500 font-mono mt-0.5">RUT: {member.rut || 'Sin RUT'}</p>
                  </div>
                  {getStatusBadge(member.memberStatus)}
                </div>

                <div className="mt-4 space-y-2 text-sm">
                  <div className="flex items-center text-slate-800 font-medium">
                    <Drama className="w-4 h-4 text-indigo-600 mr-2.5 shrink-0" />
                    <span>Rol: <strong className="text-slate-900 font-bold">{member.troupeRole}</strong></span>
                  </div>

                  <div className="flex items-center text-slate-600">
                    <Mail className="w-4 h-4 text-slate-400 mr-2.5 shrink-0" />
                    <span className="truncate">{member.email || 'Sin correo'}</span>
                  </div>

                  <div className="flex items-center text-slate-600">
                    <Phone className="w-4 h-4 text-slate-400 mr-2.5 shrink-0" />
                    <span>{member.phone || 'Sin teléfono'}</span>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-sm">
                  <span className="text-slate-600 font-medium">Cuota Personal:</span>
                  <span className="font-bold text-slate-900 bg-slate-100 px-2.5 py-1 rounded-md border border-slate-200 text-sm">
                    {formatCLP(member.customQuota)}
                  </span>
                </div>

                {member.notes && (
                  <p className="text-xs text-slate-600 italic mt-3 bg-slate-50 p-2 rounded-md border border-slate-100">
                    "{member.notes}"
                  </p>
                )}
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                <span className="text-slate-500 font-medium">Rol App: <strong className="text-slate-800">{member.userRole}</strong></span>

                <div className="flex items-center space-x-1.5">
                  <button
                    onClick={() => openEditModal(member)}
                    className="p-1.5 hover:bg-slate-100 text-slate-700 rounded-lg transition-colors"
                    title="Editar Socio"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>

                  {currentUserRole === 'Admin' && (
                    <button
                      onClick={() => setMemberToDelete(member)}
                      className="p-1.5 hover:bg-rose-50 text-rose-600 rounded-lg transition-colors"
                      title="Eliminar Socio (Se guarda en papelera)"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>

            </div>
          ))
        ) : (
          <div className="col-span-full text-center py-12 bg-white rounded-xl border border-slate-200 p-6 flex flex-col items-center justify-center space-y-3">
            <div className="p-3 bg-indigo-50 text-indigo-600 rounded-full">
              <UserPlus className="w-6 h-6" />
            </div>
            <p className="text-slate-700 font-semibold text-sm">No hay socios que coincidan con la búsqueda.</p>
            <div className="flex items-center space-x-3">
              <button
                onClick={openAddModal}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg text-xs transition-colors shadow-sm"
              >
                + Agregar socio
              </button>
              {recoverableCount > 0 && (
                <button
                  onClick={openRecoveryModal}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-xs transition-colors shadow-sm flex items-center space-x-1"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Recuperar ({recoverableCount})</span>
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Modal: Add or Edit Member */}
      {memberModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 relative">
            <button
              onClick={() => setMemberModalOpen(false)}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center space-x-3 mb-4">
              <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl">
                <Users className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  {editingMember ? 'Editar Socio' : 'Nuevo Socio'}
                </h3>
                <p className="text-xs text-slate-500">Agrupación Carecueca Teatro • Guardado Seguro</p>
              </div>
            </div>

            {/* DRAFT RESTORATION NOTICE */}
            {hasDraft && !editingMember && (
              <div className="mb-4 bg-amber-50 border border-amber-200 p-3 rounded-xl flex items-center justify-between text-xs text-amber-900">
                <div className="flex items-center space-x-2">
                  <Clock className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>Se detectó un borrador previo no guardado.</span>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={applyDraft}
                    className="font-bold text-indigo-600 hover:underline"
                  >
                    Restaurar borrador
                  </button>
                  <button
                    type="button"
                    onClick={() => { clearFormDraft(); setHasDraft(false); }}
                    className="text-slate-400 hover:text-slate-600"
                  >
                    Descartar
                  </button>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4 text-sm">
              
              <div>
                <label className="block font-semibold text-slate-800 mb-1">Nombre Completo *</label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Valentina Henríquez"
                  value={name}
                  onChange={(e) => { setName(e.target.value); handleFieldChange('name', e.target.value); }}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-800 mb-1">RUT *</label>
                  <input
                    type="text"
                    required
                    placeholder="18.123.456-K"
                    value={rut}
                    onChange={(e) => {
                      const formatted = formatRUT(e.target.value);
                      setRut(formatted);
                      handleFieldChange('rut', formatted);
                    }}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-800 mb-1">Teléfono</label>
                  <input
                    type="text"
                    placeholder="+56 9 1234 5678"
                    value={phone}
                    onChange={(e) => { setPhone(e.target.value); handleFieldChange('phone', e.target.value); }}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-800 mb-1">Correo Electrónico *</label>
                <input
                  type="email"
                  required
                  placeholder="socio@carecuecateatro.cl"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); handleFieldChange('email', e.target.value); }}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-800 mb-1">Rol en Elenco</label>
                  <select
                    value={troupeRole}
                    onChange={(e) => { setTroupeRole(e.target.value as TroupeRole); handleFieldChange('troupeRole', e.target.value); }}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                  >
                    <option value="Actor/Actriz">Actor / Actriz</option>
                    <option value="Director/a">Director / a</option>
                    <option value="Músico">Músico</option>
                    <option value="Técnico/a">Técnico / a</option>
                    <option value="Producción">Producción</option>
                    <option value="Dramaturgo/a">Dramaturgo / a</option>
                    <option value="Gestor/a">Gestor / a</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-800 mb-1">Estado de Socio</label>
                  <select
                    value={memberStatus}
                    onChange={(e) => { setMemberStatus(e.target.value as MemberStatus); handleFieldChange('memberStatus', e.target.value); }}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                  >
                    <option value="Activo">Activo</option>
                    <option value="Moroso">Moroso</option>
                    <option value="Exento">Exento (Beca)</option>
                    <option value="Honorario">Honorario</option>
                    <option value="Inactivo">Inactivo</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-800 mb-1">Rol en Sistema</label>
                  <select
                    value={userRole}
                    onChange={(e) => { setUserRole(e.target.value as UserRole); handleFieldChange('userRole', e.target.value); }}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                  >
                    <option value="Socio">Socio</option>
                    <option value="Tesorero">Tesorero</option>
                    <option value="Admin">Administrador</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-800 mb-1">Cuota Base ($ CLP)</label>
                  <input
                    type="number"
                    value={customQuota}
                    onChange={(e) => { setCustomQuota(Number(e.target.value)); handleFieldChange('customQuota', Number(e.target.value)); }}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-800 mb-1">Observaciones / Notas</label>
                <input
                  type="text"
                  placeholder="Ej: Elenco obra La Cueca Trágica..."
                  value={notes}
                  onChange={(e) => { setNotes(e.target.value); handleFieldChange('notes', e.target.value); }}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="pt-3 flex items-center justify-between">
                <span className="text-[11px] text-slate-500 flex items-center">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 mr-1" />
                  Auto-guardado en Nube y Bóveda
                </span>

                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={() => setMemberModalOpen(false)}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-semibold text-xs transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl font-bold text-xs shadow-sm transition-colors flex items-center space-x-1.5"
                  >
                    {isSubmitting ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>Guardando...</span>
                      </>
                    ) : (
                      <span>{editingMember ? 'Actualizar Socio' : 'Guardar Socio'}</span>
                    )}
                  </button>
                </div>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* CONFIRMATION MODAL FOR DELETING MEMBER */}
      {memberToDelete && (() => {
        const memberDues = dues.filter((d) => d.memberId === memberToDelete.id);
        const memberDuesCount = memberDues.length;
        const memberPaidCount = memberDues.filter((d) => d.amountPaid > 0 || d.status === 'Pagado').length;
        const totalPaidCLP = memberDues.reduce((sum, d) => sum + (d.amountPaid || 0), 0);

        return (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4">
              <div className="flex items-center space-x-3 text-rose-600">
                <div className="p-2.5 bg-rose-50 rounded-xl">
                  <AlertTriangle className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Eliminar Socio del Directorio</h3>
                  <p className="text-xs text-slate-500">Carecueca Teatro • Opciones de Eliminación</p>
                </div>
              </div>

              {/* Member Summary */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-2">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-bold text-slate-900 text-sm">{memberToDelete.name}</p>
                    <p className="text-xs text-slate-500 font-mono mt-0.5">RUT: {memberToDelete.rut || 'Sin RUT'} • {memberToDelete.troupeRole}</p>
                  </div>
                  <span className="text-xs bg-slate-200 text-slate-700 px-2 py-0.5 rounded-md font-semibold">
                    {memberToDelete.memberStatus}
                  </span>
                </div>

                {memberDuesCount > 0 ? (
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-2.5 text-xs text-amber-900 flex items-center justify-between">
                    <span>
                      Registros de cuotas: <strong>{memberDuesCount} período(s)</strong> ({memberPaidCount} pagado/parcial)
                    </span>
                    {totalPaidCLP > 0 && (
                      <span className="font-bold text-emerald-800 bg-emerald-100/70 px-2 py-0.5 rounded">
                        Total pagado: {formatCLP(totalPaidCLP)}
                      </span>
                    )}
                  </div>
                ) : (
                  <p className="text-xs text-slate-500 italic">No registra cuotas asociadas en períodos actuales.</p>
                )}
              </div>

              <p className="text-xs text-slate-600">
                Elige el modo de eliminación adecuado según la situación:
              </p>

              {/* Option 1: Ingreso Erróneo (Definitive removal of member and all dues/payments) */}
              <div className="border-2 border-rose-300 bg-rose-50/50 rounded-xl p-4 transition-all hover:bg-rose-50/80 space-y-2.5">
                <div className="flex items-start space-x-2.5">
                  <div className="p-2 bg-rose-100 text-rose-700 rounded-lg shrink-0 mt-0.5">
                    <Trash2 className="w-4 h-4" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold text-rose-950">1. Eliminar por ingreso erróneo (Eliminación Total)</h4>
                      <span className="text-[10px] bg-rose-200 text-rose-800 font-bold px-1.5 py-0.5 rounded">Recomendado</span>
                    </div>
                    <p className="text-[11px] text-rose-900/85 mt-1 leading-relaxed">
                      Elimina definitivamente al socio y <strong>todos sus registros de pago y cuotas</strong> de la base de datos Firestore y del sistema. No dejará cobros huérfanos ni volverá a aparecer en la papelera o bóveda de seguridad.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  disabled={isDeleting}
                  onClick={() => handleConfirmDelete(true)}
                  className="w-full py-2.5 px-4 bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-xs transition-colors flex items-center justify-center space-x-2 cursor-pointer"
                >
                  {isDeleting ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Eliminando socio y registros de pago...</span>
                    </>
                  ) : (
                    <>
                      <Trash2 className="w-4 h-4" />
                      <span>Eliminar socio y sus pagos por ingreso erróneo</span>
                    </>
                  )}
                </button>
              </div>

              {/* Option 2: Mover a Papelera / Archivar */}
              <div className="border border-slate-200 bg-slate-50/70 rounded-xl p-3.5 space-y-2">
                <div className="flex items-start space-x-2.5">
                  <div className="p-1.5 bg-slate-200 text-slate-700 rounded-lg shrink-0 mt-0.5">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <div className="flex-1">
                    <h4 className="text-xs font-bold text-slate-800">2. Mover a Papelera de Seguridad</h4>
                    <p className="text-[11px] text-slate-600 mt-0.5 leading-relaxed">
                      Archiva al socio en la papelera temporal (por si es un retiro temporal) y permite restaurarlo más adelante desde Bóveda de Seguridad.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  disabled={isDeleting}
                  onClick={() => handleConfirmDelete(false)}
                  className="w-full py-2 px-3 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-xl text-xs font-semibold transition-colors flex items-center justify-center space-x-1.5 cursor-pointer"
                >
                  <span>Mover a Papelera (Conservar en Bóveda)</span>
                </button>
              </div>

              <div className="flex items-center justify-end pt-1">
                <button
                  type="button"
                  onClick={() => setMemberToDelete(null)}
                  disabled={isDeleting}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-semibold text-xs transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        );
      })()}

    </div>
  );
};
