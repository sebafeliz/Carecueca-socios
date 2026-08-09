import React from 'react';
import { 
  ShieldCheck, 
  X, 
  Check, 
  Lock
} from 'lucide-react';
import { UserRole } from '../types';

interface RolesAndPermissionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUserRole: UserRole;
  setCurrentUserRole: (role: UserRole) => void;
}

export const RolesAndPermissionsModal: React.FC<RolesAndPermissionsModalProps> = ({
  isOpen,
  onClose,
  currentUserRole,
  setCurrentUserRole
}) => {
  if (!isOpen) return null;

  const permissionsList = [
    { name: 'Ver Panel Financiero Resumido', admin: true, tesorero: true, socio: false },
    { name: 'Registrar y Editar Pagos de Cuotas', admin: true, tesorero: true, socio: false },
    { name: 'Crear Nuevos Periodos de Cuotas', admin: true, tesorero: true, socio: false },
    { name: 'Agregar y Editar Socios', admin: true, tesorero: false, socio: false },
    { name: 'Eliminar Socios y Datos', admin: true, tesorero: false, socio: false },
    { name: 'Enviar Recordatorios por WhatsApp / Push', admin: true, tesorero: true, socio: false },
    { name: 'Exportar Reportes PDF y Excel', admin: true, tesorero: true, socio: true },
    { name: 'Forzar Respaldo en la Nube', admin: true, tesorero: true, socio: false },
    { name: 'Ver Estado Personal y Adjuntar Comprobante', admin: true, tesorero: true, socio: true },
  ];

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl max-w-2xl w-full p-5 shadow-lg border border-slate-200 relative">
        
        <button
          onClick={onClose}
          className="absolute top-3 right-3 p-1 rounded-lg text-slate-400 hover:text-slate-700 bg-slate-100 hover:bg-slate-200"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-center space-x-3 mb-4">
          <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900">Matriz de Permisos</h3>
            <p className="text-xs text-slate-500">Carecueca Teatro (Admin, Tesorero, Socio)</p>
          </div>
        </div>

        {/* Current Active Role Selector */}
        <div className="bg-slate-900 text-slate-100 p-3 rounded-lg border border-slate-800 flex items-center justify-between mb-3 text-xs">
          <div>
            <span className="text-slate-400 block text-[10px] uppercase font-semibold">Rol Activo:</span>
            <span className="text-indigo-300 font-bold text-xs">{currentUserRole}</span>
          </div>

          <div className="flex items-center space-x-1">
            <span className="text-slate-400 text-[11px]">Cambiar a:</span>
            {(['Admin', 'Tesorero', 'Socio'] as UserRole[]).map((r) => (
              <button
                key={r}
                onClick={() => setCurrentUserRole(r)}
                className={`px-2.5 py-1 rounded font-semibold text-[11px] transition-colors ${
                  currentUserRole === r
                    ? 'bg-indigo-600 text-white'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                {r}
              </button>
            ))}
          </div>
        </div>

        {/* Matrix Table */}
        <div className="overflow-x-auto border border-slate-200 rounded-lg">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-2 px-3">Funcionalidad</th>
                <th className="py-2 px-2 text-center">Admin</th>
                <th className="py-2 px-2 text-center">Tesorero</th>
                <th className="py-2 px-2 text-center">Socio</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-800 font-medium">
              {permissionsList.map((p, idx) => (
                <tr key={idx} className="hover:bg-slate-50">
                  <td className="py-2 px-3 font-semibold text-slate-900">{p.name}</td>
                  <td className="py-2 px-2 text-center">
                    {p.admin ? <Check className="w-3.5 h-3.5 text-emerald-600 inline" /> : <Lock className="w-3.5 h-3.5 text-slate-300 inline" />}
                  </td>
                  <td className="py-2 px-2 text-center">
                    {p.tesorero ? <Check className="w-3.5 h-3.5 text-emerald-600 inline" /> : <Lock className="w-3.5 h-3.5 text-slate-300 inline" />}
                  </td>
                  <td className="py-2 px-2 text-center">
                    {p.socio ? <Check className="w-3.5 h-3.5 text-emerald-600 inline" /> : <Lock className="w-3.5 h-3.5 text-slate-300 inline" />}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="pt-3 flex items-center justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-900 hover:bg-slate-800 text-white font-medium rounded-lg text-xs"
          >
            Cerrar
          </button>
        </div>

      </div>
    </div>
  );
};
