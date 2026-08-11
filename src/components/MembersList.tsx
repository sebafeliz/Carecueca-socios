import React, { useState } from 'react';
import { 
  Users, 
  Search, 
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
  UserCheck
} from 'lucide-react';
import { Member, MemberStatus, UserRole, TroupeRole } from '../types';
import { formatCLP } from '../lib/exportUtils';

interface MembersListProps {
  members: Member[];
  currentUserRole: UserRole;
  onSaveMember: (member: Member) => void;
  onDeleteMember: (id: string) => void;
  openRolesModal: () => void;
}

export const MembersList: React.FC<MembersListProps> = ({
  members,
  currentUserRole,
  onSaveMember,
  onDeleteMember,
  openRolesModal
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('Todos');
  const [statusFilter, setStatusFilter] = useState<string>('Todos');

  // Modal State
  const [memberModalOpen, setMemberModalOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<Member | null>(null);

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
    setMemberModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const memberToSave: Member = {
      id: editingMember ? editingMember.id : 'mem-' + Date.now(),
      name,
      email,
      phone,
      rut,
      troupeRole,
      memberStatus,
      userRole,
      customQuota: Number(customQuota),
      joinDate: editingMember ? editingMember.joinDate : new Date().toISOString().split('T')[0],
      notes,
      createdAt: editingMember?.createdAt || new Date().toISOString()
    };

    onSaveMember(memberToSave);
    setMemberModalOpen(false);
  };

  // Filter members
  const filteredMembers = members.filter((m) => {
    const matchesSearch = 
      m.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.rut.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.email.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesRole = roleFilter === 'Todos' || m.troupeRole === roleFilter;
    const matchesStatus = statusFilter === 'Todos' || m.memberStatus === statusFilter;

    return matchesSearch && matchesRole && matchesStatus;
  });

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
      
      {/* Top Controls Header */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 flex items-center space-x-2.5">
            <Users className="w-6 h-6 text-indigo-600" />
            <span>Directorio de Socios • Carecueca Teatro</span>
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Gestión de elenco, permisos de usuario y cuotas mensuales
          </p>
        </div>

        <div className="flex items-center space-x-2.5">
          <button
            onClick={openAddModal}
            className="flex items-center space-x-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg text-sm transition-colors shadow-sm"
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
                    <p className="text-xs text-slate-500 font-mono mt-0.5">RUT: {member.rut}</p>
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
                    <span className="truncate">{member.email}</span>
                  </div>

                  <div className="flex items-center text-slate-600">
                    <Phone className="w-4 h-4 text-slate-400 mr-2.5 shrink-0" />
                    <span>{member.phone}</span>
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
                      onClick={() => onDeleteMember(member.id)}
                      className="p-1.5 hover:bg-rose-50 text-rose-600 rounded-lg transition-colors"
                      title="Eliminar Socio"
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
            <p className="text-slate-700 font-semibold text-sm">No hay socios registrados en el sistema.</p>
            <button
              onClick={openAddModal}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg text-sm transition-colors shadow-sm"
            >
              + Agregar socio
            </button>
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

            <div className="flex items-center space-x-3 mb-5">
              <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl">
                <Users className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  {editingMember ? 'Editar Socio' : 'Nuevo Socio'}
                </h3>
                <p className="text-sm text-slate-500">Agrupación Carecueca Teatro</p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 text-sm">
              
              <div>
                <label className="block font-semibold text-slate-800 mb-1">Nombre Completo *</label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Valentina Henríquez"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
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
                    onChange={(e) => setRut(e.target.value)}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-800 mb-1">Teléfono</label>
                  <input
                    type="text"
                    placeholder="+56 9 1234 5678"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
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
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-800 mb-1">Rol en Elenco</label>
                  <select
                    value={troupeRole}
                    onChange={(e) => setTroupeRole(e.target.value as TroupeRole)}
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
                    onChange={(e) => setMemberStatus(e.target.value as MemberStatus)}
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
                    onChange={(e) => setUserRole(e.target.value as UserRole)}
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
                    onChange={(e) => setCustomQuota(Number(e.target.value))}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="pt-3 flex items-center justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setMemberModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-semibold text-sm transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-sm shadow-sm transition-colors"
                >
                  Guardar
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
};
