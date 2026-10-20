import React, { useState } from 'react';
import { 
  Users, 
  UserPlus, 
  Phone, 
  Mail, 
  X, 
  Trash2, 
  Edit3, 
  CheckCircle2,
  AlertCircle,
  UserCheck,
  RotateCcw,
  RefreshCw,
  Clock,
  Search,
  MoreVertical,
  ChevronDown
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
  onDeduplicateMembers?: () => Promise<void>;
  isDeduplicating?: boolean;
}

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
  openRecoveryModal,
  recoverableCount,
  onQuickRestoreAll,
  onDeduplicateMembers,
  isDeduplicating = false
}) => {
  // Modal State
  const [memberModalOpen, setMemberModalOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<Member | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('Todos');
  const [showToolsMenu, setShowToolsMenu] = useState(false);

  // Expandable member names: keep other details hidden until clicking on the name
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  const handleToggleExpand = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

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
    if (!name.trim()) return;

    setIsSubmitting(true);
    const memberToSave: Member = {
      id: editingMember ? editingMember.id : `mem-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      name: name.trim(),
      email: email.trim(),
      phone: phone.trim(),
      rut: rut.trim(),
      troupeRole,
      memberStatus,
      userRole,
      customQuota: Number(customQuota) || 10000,
      notes: notes.trim(),
      joinDate: editingMember?.joinDate || new Date().toISOString().split('T')[0],
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

  // Filtered members by search query and status
  const filteredMembers = members.filter((m) => {
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch = !q || 
      m.name.toLowerCase().includes(q) || 
      m.rut.toLowerCase().includes(q) ||
      m.troupeRole.toLowerCase().includes(q) ||
      m.phone.includes(q);
    const matchesStatus = statusFilter === 'Todos' || m.memberStatus === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: MemberStatus) => {
    switch (status) {
      case 'Activo':
        return <span className="text-emerald-700 font-semibold text-xs inline-flex items-center"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1.5" />Activo</span>;
      case 'Moroso':
        return <span className="text-rose-600 font-semibold text-xs inline-flex items-center"><span className="w-1.5 h-1.5 rounded-full bg-rose-500 mr-1.5" />Moroso</span>;
      case 'Exento':
        return <span className="text-indigo-600 font-semibold text-xs inline-flex items-center"><span className="w-1.5 h-1.5 rounded-full bg-indigo-500 mr-1.5" />Exento</span>;
      case 'Honorario':
        return <span className="text-amber-700 font-semibold text-xs inline-flex items-center"><span className="w-1.5 h-1.5 rounded-full bg-amber-500 mr-1.5" />Honorario</span>;
      case 'Inactivo':
        return <span className="text-slate-400 font-medium text-xs inline-flex items-center"><span className="w-1.5 h-1.5 rounded-full bg-slate-300 mr-1.5" />Inactivo</span>;
    }
  };

  return (
    <div className="space-y-4">
      {/* Quiet Recovery Notice (only if recoverable items exist) */}
      {recoverableCount > 0 && (
        <div className="bg-amber-50/70 border border-amber-200/80 rounded-xl px-4 py-2.5 flex items-center justify-between text-xs text-amber-900">
          <div className="flex items-center space-x-2">
            <RotateCcw className="w-4 h-4 text-amber-600 shrink-0" />
            <span>Hay <strong>{recoverableCount}</strong> socio(s) en papelera/bóveda recuperables.</span>
          </div>
          <div className="flex items-center space-x-2">
            {onQuickRestoreAll && (
              <button
                onClick={onQuickRestoreAll}
                className="font-bold text-emerald-700 hover:text-emerald-800 underline cursor-pointer"
              >
                Restaurar todos
              </button>
            )}
            <button
              onClick={openRecoveryModal}
              className="text-slate-600 hover:text-slate-900 underline cursor-pointer"
            >
              Ver detalles
            </button>
          </div>
        </div>
      )}

      {/* Main Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-1">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <span>Padrón de Socios</span>
            <span className="text-xs font-semibold px-2 py-0.5 bg-slate-100 text-slate-600 rounded-md tabular-nums">
              {members.length}
            </span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">Integrantes oficiales de Carecueca Teatro</p>
        </div>

        <div className="flex items-center gap-2">
          {/* Deduplicate Button */}
          {onDeduplicateMembers && (
            <button
              onClick={onDeduplicateMembers}
              disabled={isDeduplicating}
              className="px-3 py-2 text-xs font-medium text-slate-600 hover:text-slate-900 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg transition-colors cursor-pointer flex items-center space-x-1.5 disabled:opacity-50"
              title="Detectar y eliminar socios duplicados automáticamente"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isDeduplicating ? 'animate-spin text-amber-600' : 'text-slate-400'}`} />
              <span className="hidden md:inline">{isDeduplicating ? 'Depurando...' : 'Depurar Duplicados'}</span>
            </button>
          )}

          {/* Add Member CTA */}
          <button
            onClick={openAddModal}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-lg text-xs transition-colors cursor-pointer flex items-center space-x-1.5 shadow-xs"
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>Nuevo Socio</span>
          </button>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="bg-white p-3 rounded-xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
        <div className="relative w-full sm:w-72">
          <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar por nombre, RUT o rol..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-400 focus:bg-white"
          />
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center gap-1 overflow-x-auto text-xs">
          {['Todos', 'Activo', 'Moroso', 'Exento'].map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-2.5 py-1 rounded-md font-medium transition-colors cursor-pointer whitespace-nowrap ${
                statusFilter === status
                  ? 'bg-slate-900 text-white'
                  : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      {/* Clean Minimalist Member Names List */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="p-3 bg-slate-50/70 border-b border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <span>Nombre del Socio <span className="text-[11px] text-slate-400 font-normal">(haz clic para desplegar u ocultar datos)</span></span>
          <span className="tabular-nums font-semibold text-slate-700">{filteredMembers.length} {filteredMembers.length === 1 ? 'socio' : 'socios'}</span>
        </div>

        <div className="divide-y divide-slate-100">
          {filteredMembers.length > 0 ? (
            filteredMembers.map((member) => {
              const isExpanded = expandedIds.has(member.id);
              return (
                <div key={member.id} className="transition-colors">
                  {/* Name Only Row */}
                  <button
                    type="button"
                    onClick={() => handleToggleExpand(member.id)}
                    className={`w-full text-left px-4 py-3.5 flex items-center justify-between hover:bg-slate-50 transition-colors cursor-pointer select-none ${
                      isExpanded ? 'bg-slate-50/80' : 'bg-white'
                    }`}
                  >
                    <span className="font-semibold text-slate-900 text-sm tracking-tight">{member.name}</span>
                    <div className="flex items-center space-x-2 text-slate-400">
                      <span className="text-[11px] font-medium hidden sm:inline">
                        {isExpanded ? 'Ocultar datos' : 'Ver datos'}
                      </span>
                      <ChevronDown
                        className={`w-4 h-4 transition-transform duration-200 ${
                          isExpanded ? 'rotate-180 text-slate-700' : 'text-slate-400'
                        }`}
                      />
                    </div>
                  </button>

                  {/* Expanded Details - Only Shown When Clicking the Name */}
                  {isExpanded && (
                    <div className="px-4 pb-4 pt-2 bg-slate-50/50 border-t border-slate-100 animate-in fade-in duration-150">
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5 text-xs mb-3.5">
                        
                        <div className="bg-white p-2.5 rounded-lg border border-slate-200/80">
                          <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">RUT</span>
                          <span className="font-mono font-medium text-slate-800">{member.rut || 'No registrado'}</span>
                        </div>

                        <div className="bg-white p-2.5 rounded-lg border border-slate-200/80">
                          <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">Rol en Obra</span>
                          <span className="font-medium text-slate-800">{member.troupeRole || 'Actor/Actriz'}</span>
                        </div>

                        <div className="bg-white p-2.5 rounded-lg border border-slate-200/80">
                          <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">Estado del Socio</span>
                          <div>{getStatusBadge(member.memberStatus)}</div>
                        </div>

                        <div className="bg-white p-2.5 rounded-lg border border-slate-200/80">
                          <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">Teléfono / WhatsApp</span>
                          {member.phone ? (
                            <a
                              href={`https://wa.me/${member.phone.replace(/[^\d+]/g, '')}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-emerald-700 hover:text-emerald-800 font-medium inline-flex items-center space-x-1"
                            >
                              <Phone className="w-3 h-3 text-emerald-600 shrink-0" />
                              <span>{member.phone}</span>
                            </a>
                          ) : (
                            <span className="text-slate-400">Sin teléfono</span>
                          )}
                        </div>

                        <div className="bg-white p-2.5 rounded-lg border border-slate-200/80">
                          <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">Correo Electrónico</span>
                          {member.email ? (
                            <a
                              href={`mailto:${member.email}`}
                              className="text-slate-700 hover:text-indigo-600 truncate block font-medium flex items-center space-x-1"
                            >
                              <Mail className="w-3 h-3 text-slate-400 shrink-0" />
                              <span className="truncate">{member.email}</span>
                            </a>
                          ) : (
                            <span className="text-slate-400">Sin correo</span>
                          )}
                        </div>

                        <div className="bg-white p-2.5 rounded-lg border border-slate-200/80">
                          <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">Cuota Mensual</span>
                          <span className="font-bold text-slate-900 tabular-nums">{formatCLP(member.customQuota)}</span>
                        </div>

                        {member.userRole && member.userRole !== 'Socio' && (
                          <div className="bg-white p-2.5 rounded-lg border border-slate-200/80">
                            <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">Rol de Sistema</span>
                            <span className="font-semibold text-indigo-700">{member.userRole}</span>
                          </div>
                        )}

                        {member.joinDate && (
                          <div className="bg-white p-2.5 rounded-lg border border-slate-200/80">
                            <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">Fecha de Ingreso</span>
                            <span className="text-slate-700">{member.joinDate}</span>
                          </div>
                        )}

                        {member.notes && (
                          <div className="bg-white p-2.5 rounded-lg border border-slate-200/80 sm:col-span-2 md:col-span-3">
                            <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">Notas</span>
                            <p className="text-slate-600">{member.notes}</p>
                          </div>
                        )}

                      </div>

                      {/* Actions: Edit & Delete */}
                      <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-200/70">
                        <button
                          type="button"
                          onClick={() => openEditModal(member)}
                          className="px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-lg font-semibold text-xs flex items-center space-x-1.5 transition-colors cursor-pointer"
                        >
                          <Edit3 className="w-3.5 h-3.5 text-slate-500" />
                          <span>Editar Socio</span>
                        </button>

                        {currentUserRole === 'Admin' && (
                          <button
                            type="button"
                            onClick={() => setMemberToDelete(member)}
                            className="px-3 py-1.5 bg-white hover:bg-rose-50 text-rose-600 border border-rose-200 rounded-lg font-semibold text-xs flex items-center space-x-1.5 transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Eliminar</span>
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          ) : (
            <div className="text-center py-12 text-slate-400 text-xs">
              No se encontraron socios con los filtros actuales.
            </div>
          )}
        </div>
      </div>

      {/* Modal: New / Edit Member */}
      {memberModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200 relative animate-in fade-in zoom-in-95">
            <button
              onClick={() => setMemberModalOpen(false)}
              className="absolute top-4 right-4 p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
            >
              <X className="w-4 h-4" />
            </button>

            <h3 className="text-base font-bold text-slate-900 mb-4">
              {editingMember ? 'Editar Socio' : 'Nuevo Socio'}
            </h3>

            {/* Draft Notice */}
            {hasDraft && !editingMember && (
              <div className="mb-3 bg-amber-50 border border-amber-200 p-2.5 rounded-lg flex items-center justify-between text-xs text-amber-900">
                <span>Borrador no guardado disponible.</span>
                <div className="space-x-2">
                  <button type="button" onClick={applyDraft} className="font-bold underline">Restaurar</button>
                  <button type="button" onClick={() => { clearFormDraft(); setHasDraft(false); }} className="text-slate-400">Descartar</button>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Nombre Completo *</label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Valentina Henríquez"
                  value={name}
                  onChange={(e) => { setName(e.target.value); handleFieldChange('name', e.target.value); }}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-400 focus:bg-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">RUT *</label>
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
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-mono text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-400 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Rol en Compañía</label>
                  <select
                    value={troupeRole}
                    onChange={(e) => {
                      const r = e.target.value as TroupeRole;
                      setTroupeRole(r);
                      handleFieldChange('troupeRole', r);
                    }}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-400 focus:bg-white cursor-pointer"
                  >
                    <option value="Actor/Actriz">Actor/Actriz</option>
                    <option value="Director/a">Director/a</option>
                    <option value="Músico">Músico</option>
                    <option value="Técnico">Técnico</option>
                    <option value="Producción">Producción</option>
                    <option value="Dramaturgo/a">Dramaturgo/a</option>
                    <option value="Diseñador/a">Diseñador/a</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Teléfono WhatsApp</label>
                  <input
                    type="tel"
                    placeholder="+56 9 1234 5678"
                    value={phone}
                    onChange={(e) => { setPhone(e.target.value); handleFieldChange('phone', e.target.value); }}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-400 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Cuota Mensual ($CLP)</label>
                  <input
                    type="number"
                    step="1000"
                    min="0"
                    value={customQuota}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      setCustomQuota(val);
                      handleFieldChange('customQuota', val);
                    }}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-mono text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-400 focus:bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Correo Electrónico (Opcional)</label>
                <input
                  type="email"
                  placeholder="ejemplo@correo.cl"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); handleFieldChange('email', e.target.value); }}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-400 focus:bg-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Estado</label>
                  <select
                    value={memberStatus}
                    onChange={(e) => {
                      const s = e.target.value as MemberStatus;
                      setMemberStatus(s);
                      handleFieldChange('memberStatus', s);
                    }}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-400 focus:bg-white cursor-pointer"
                  >
                    <option value="Activo">Activo</option>
                    <option value="Moroso">Moroso</option>
                    <option value="Exento">Exento</option>
                    <option value="Honorario">Honorario</option>
                    <option value="Inactivo">Inactivo</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Nota o Observación</label>
                  <input
                    type="text"
                    placeholder="Ej: Ensaya los martes"
                    value={notes}
                    onChange={(e) => { setNotes(e.target.value); handleFieldChange('notes', e.target.value); }}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-400 focus:bg-white"
                  />
                </div>
              </div>

              <div className="pt-3 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setMemberModalOpen(false)}
                  className="px-3 py-2 text-slate-600 hover:bg-slate-100 rounded-lg font-medium transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg font-semibold transition-colors cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? 'Guardando...' : (editingMember ? 'Actualizar Socio' : 'Guardar Socio')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {memberToDelete && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 shadow-xl border border-slate-200">
            <h3 className="text-sm font-bold text-slate-900 mb-2">¿Eliminar socio?</h3>
            <p className="text-xs text-slate-600 mb-4">
              Se eliminará a <strong>{memberToDelete.name}</strong> del padrón activo. Podrás restaurarlo en cualquier momento desde la Bóveda de Recuperación.
            </p>
            <div className="flex items-center justify-end space-x-2">
              <button
                type="button"
                onClick={() => setMemberToDelete(null)}
                className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg font-medium cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => handleConfirmDelete(true)}
                disabled={isDeleting}
                className="px-3.5 py-1.5 text-xs bg-rose-600 hover:bg-rose-700 text-white font-semibold rounded-lg cursor-pointer disabled:opacity-50"
              >
                {isDeleting ? 'Eliminando...' : 'Eliminar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
