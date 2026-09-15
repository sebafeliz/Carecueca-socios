import React, { useState } from 'react';
import { 
  ShieldCheck, 
  RefreshCw, 
  RotateCcw, 
  Check, 
  AlertTriangle, 
  X, 
  HardDrive, 
  UserPlus, 
  Download, 
  Upload,
  Sparkles,
  Info
} from 'lucide-react';
import { Member } from '../types';
import { 
  RecoveredMemberItem, 
  getRecycleBinMembers, 
  removeMemberFromRecycleBin 
} from '../lib/recoveryService';

interface DataRecoveryModalProps {
  isOpen: boolean;
  onClose: () => void;
  recoverableItems: RecoveredMemberItem[];
  onRestoreMember: (member: Member) => Promise<void>;
  onRestoreAll: (members: Member[]) => Promise<void>;
  onRefreshScan: () => void;
  activeCount: number;
}

export const DataRecoveryModal: React.FC<DataRecoveryModalProps> = ({
  isOpen,
  onClose,
  recoverableItems,
  onRestoreMember,
  onRestoreAll,
  onRefreshScan,
  activeCount
}) => {
  const [restoringId, setRestoringId] = useState<string | null>(null);
  const [restoredIds, setRestoredIds] = useState<Set<string>>(new Set());
  const [activeTab, setActiveTab] = useState<'found' | 'bin' | 'import'>('found');
  const [jsonInput, setJsonInput] = useState('');
  const [importStatus, setImportStatus] = useState<string | null>(null);

  if (!isOpen) return null;

  const recycleBinItems = getRecycleBinMembers();

  const handleSingleRestore = async (item: RecoveredMemberItem) => {
    setRestoringId(item.member.id);
    try {
      await onRestoreMember(item.member);
      setRestoredIds((prev) => new Set(prev).add(item.member.id));
      removeMemberFromRecycleBin(item.member.id);
    } catch (e) {
      console.error(e);
    } finally {
      setRestoringId(null);
    }
  };

  const handleRestoreAllClick = async () => {
    const toRestore = recoverableItems
      .filter((i) => !restoredIds.has(i.member.id))
      .map((i) => i.member);
    if (toRestore.length === 0) return;

    setRestoringId('ALL');
    try {
      await onRestoreAll(toRestore);
      const newSet = new Set(restoredIds);
      toRestore.forEach((m) => newSet.add(m.id));
      setRestoredIds(newSet);
    } catch (e) {
      console.error(e);
    } finally {
      setRestoringId(null);
    }
  };

  const handleRestoreFromBin = async (member: Member) => {
    setRestoringId(member.id);
    try {
      await onRestoreMember(member);
      removeMemberFromRecycleBin(member.id);
      onRefreshScan();
    } catch (e) {
      console.error(e);
    } finally {
      setRestoringId(null);
    }
  };

  const handleImportJson = async () => {
    if (!jsonInput.trim()) return;
    try {
      const parsed = JSON.parse(jsonInput);
      let candidates: any[] = [];
      if (Array.isArray(parsed)) {
        candidates = parsed;
      } else if (parsed.members && Array.isArray(parsed.members)) {
        candidates = parsed.members;
      } else if (parsed.data && Array.isArray(parsed.data.members)) {
        candidates = parsed.data.members;
      } else if (typeof parsed === 'object') {
        candidates = [parsed];
      }

      const validMembers: Member[] = candidates
        .filter((c) => c && typeof c === 'object' && c.name)
        .map((c) => ({
          id: c.id || 'mem-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
          name: c.name,
          email: c.email || '',
          phone: c.phone || '',
          rut: c.rut || '',
          troupeRole: c.troupeRole || 'Actor/Actriz',
          memberStatus: c.memberStatus || 'Activo',
          userRole: c.userRole || 'Socio',
          customQuota: typeof c.customQuota === 'number' ? c.customQuota : 10000,
          joinDate: c.joinDate || new Date().toISOString().split('T')[0],
          notes: c.notes || 'Importado desde Respaldo',
          createdAt: c.createdAt || new Date().toISOString()
        }));

      if (validMembers.length === 0) {
        setImportStatus('No se encontraron registros válidos de socios en el JSON.');
        return;
      }

      await onRestoreAll(validMembers);
      setImportStatus(`¡Éxito! Se restauraron ${validMembers.length} socios.`);
      setJsonInput('');
      onRefreshScan();
    } catch (err: any) {
      setImportStatus(`Error al procesar JSON: ${err.message}`);
    }
  };

  const pendingRecoverable = recoverableItems.filter((i) => !restoredIds.has(i.member.id));

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden">
        
        {/* Header */}
        <div className="p-5 border-b border-slate-200 flex items-start justify-between bg-slate-50">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-emerald-100 text-emerald-700 rounded-xl">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <span>Centro de Recuperación y Respaldo de Socios</span>
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                  Protección Anti-Pérdida Activa
                </span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Recupera socios anteriores guardados en la memoria del navegador, caché local o bóveda de seguridad.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-200 bg-white px-5 pt-3 space-x-4 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('found')}
            className={`pb-2.5 border-b-2 transition-colors flex items-center space-x-1.5 ${
              activeTab === 'found'
                ? 'border-indigo-600 text-indigo-600 font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <span>Socios Detectados para Recuperar</span>
            {pendingRecoverable.length > 0 && (
              <span className="px-1.5 py-0.5 rounded-full bg-indigo-100 text-indigo-700 text-[10px] font-bold">
                {pendingRecoverable.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('bin')}
            className={`pb-2.5 border-b-2 transition-colors flex items-center space-x-1.5 ${
              activeTab === 'bin'
                ? 'border-indigo-600 text-indigo-600 font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <span>Papelera / Eliminados Recientes</span>
            {recycleBinItems.length > 0 && (
              <span className="px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-700 text-[10px] font-bold">
                {recycleBinItems.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('import')}
            className={`pb-2.5 border-b-2 transition-colors flex items-center space-x-1.5 ${
              activeTab === 'import'
                ? 'border-indigo-600 text-indigo-600 font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <span>Restaurar desde JSON / Copia Externa</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 overflow-y-auto flex-1 space-y-4">

          {/* TAB 1: FOUND RECOVERABLE ITEMS */}
          {activeTab === 'found' && (
            <div className="space-y-3">
              <div className="bg-indigo-50/70 border border-indigo-100 rounded-xl p-3.5 flex items-start justify-between gap-3 text-xs text-indigo-900">
                <div className="flex items-start space-x-2.5">
                  <Info className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold">¿Cómo funciona la recuperación?</span>
                    <p className="text-indigo-700 mt-0.5">
                      El sistema rastrea automáticamente la bóveda de seguridad local y copias históricas.
                      Si ingresaste socios que desaparecieron tras un cambio o recarga, aparecerán aquí para restaurarlos a la base activa y sincronizarlos a Firestore con 1 clic.
                    </p>
                  </div>
                </div>
                <button
                  onClick={onRefreshScan}
                  className="px-2.5 py-1 bg-white hover:bg-indigo-100 text-indigo-700 font-semibold rounded-lg border border-indigo-200 text-xs shrink-0 flex items-center space-x-1 transition-colors"
                >
                  <RefreshCw className="w-3 h-3" />
                  <span>Escanear ahora</span>
                </button>
              </div>

              {pendingRecoverable.length > 0 ? (
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-700">
                      {pendingRecoverable.length} socio(s) recuperable(s) encontrados
                    </span>
                    <button
                      onClick={handleRestoreAllClick}
                      disabled={restoringId !== null}
                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold rounded-lg text-xs flex items-center space-x-1.5 shadow-xs transition-colors"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Restaurar todos a la lista</span>
                    </button>
                  </div>

                  <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden bg-white">
                    {pendingRecoverable.map((item) => {
                      const isRestoring = restoringId === item.member.id;
                      const isDone = restoredIds.has(item.member.id);

                      return (
                        <div
                          key={item.member.id}
                          className="p-3.5 flex items-center justify-between hover:bg-slate-50 transition-colors"
                        >
                          <div className="min-w-0 pr-3">
                            <div className="flex items-center space-x-2">
                              <h4 className="text-sm font-bold text-slate-900 truncate">
                                {item.member.name}
                              </h4>
                              <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                                {item.member.troupeRole}
                              </span>
                              <span className="text-[10px] font-medium px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-100">
                                {item.source}
                              </span>
                            </div>
                            <div className="flex items-center space-x-3 text-xs text-slate-500 mt-1">
                              {item.member.rut && <span>RUT: <strong className="text-slate-700 font-mono">{item.member.rut}</strong></span>}
                              {item.member.email && <span className="truncate">{item.member.email}</span>}
                              {item.member.phone && <span>{item.member.phone}</span>}
                            </div>
                            {item.member.notes && (
                              <p className="text-[11px] text-slate-500 italic mt-0.5 truncate">
                                "{item.member.notes}"
                              </p>
                            )}
                          </div>

                          <div className="shrink-0">
                            {isDone ? (
                              <span className="inline-flex items-center space-x-1 px-3 py-1.5 bg-emerald-50 text-emerald-700 font-bold rounded-lg text-xs border border-emerald-200">
                                <Check className="w-3.5 h-3.5" />
                                <span>Restaurado</span>
                              </span>
                            ) : (
                              <button
                                onClick={() => handleSingleRestore(item)}
                                disabled={isRestoring}
                                className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold rounded-lg text-xs flex items-center space-x-1 transition-colors shadow-xs"
                              >
                                {isRestoring ? (
                                  <>
                                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                                    <span>Guardando...</span>
                                  </>
                                ) : (
                                  <>
                                    <RotateCcw className="w-3.5 h-3.5" />
                                    <span>Restaurar</span>
                                  </>
                                )}
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 bg-slate-50 rounded-xl border border-slate-200 p-6 flex flex-col items-center justify-center space-y-2">
                  <div className="p-3 bg-emerald-50 text-emerald-600 rounded-full">
                    <ShieldCheck className="w-6 h-6" />
                  </div>
                  <h4 className="font-bold text-sm text-slate-800">
                    No hay socios pendientes por recuperar
                  </h4>
                  <p className="text-xs text-slate-500 max-w-md">
                    Todos los socios conocidos ({activeCount}) están actualmente activos y protegidos tanto en la nube Firestore como en la bóveda local.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: RECYCLE BIN */}
          {activeTab === 'bin' && (
            <div className="space-y-3">
              <div className="bg-amber-50/80 border border-amber-200 rounded-xl p-3 text-xs text-amber-900">
                <span className="font-bold">Papelera de Socios:</span> Los socios que hayan sido eliminados se preservan aquí. Puedes revertir cualquier eliminación accidental en cualquier momento.
              </div>

              {recycleBinItems.length > 0 ? (
                <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden bg-white">
                  {recycleBinItems.map((m) => (
                    <div key={m.id} className="p-3.5 flex items-center justify-between hover:bg-slate-50">
                      <div>
                        <div className="flex items-center space-x-2">
                          <h4 className="text-sm font-bold text-slate-900">{m.name}</h4>
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                            {m.troupeRole}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 font-mono mt-0.5">RUT: {m.rut}</p>
                      </div>

                      <button
                        onClick={() => handleRestoreFromBin(m)}
                        disabled={restoringId === m.id}
                        className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-xs flex items-center space-x-1"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>Reincorporar</span>
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 bg-slate-50 rounded-xl border border-slate-200 p-6 text-xs text-slate-500">
                  La papelera está vacía. No hay socios eliminados recientemente.
                </div>
              )}
            </div>
          )}

          {/* TAB 3: IMPORT JSON */}
          {activeTab === 'import' && (
            <div className="space-y-3">
              <p className="text-xs text-slate-600">
                Pega a continuación un archivo o arreglo JSON de respaldo (por ejemplo generado desde el Centro de Reportes o una exportación anterior):
              </p>

              <textarea
                value={jsonInput}
                onChange={(e) => setJsonInput(e.target.value)}
                placeholder='[{"id":"mem-10","name":"Juan Soto","rut":"12.345.678-9","troupeRole":"Actor/Actriz"}]'
                rows={5}
                className="w-full p-3 font-mono text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />

              {importStatus && (
                <div className={`p-2.5 rounded-lg text-xs font-semibold ${
                  importStatus.startsWith('¡Éxito!') ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-rose-50 text-rose-700 border border-rose-200'
                }`}>
                  {importStatus}
                </div>
              )}

              <div className="flex justify-end">
                <button
                  onClick={handleImportJson}
                  disabled={!jsonInput.trim()}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold rounded-xl text-xs flex items-center space-x-1.5 shadow-sm transition-colors"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>Procesar e Importar Socios</span>
                </button>
              </div>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between text-xs text-slate-500">
          <div className="flex items-center space-x-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block animate-pulse" />
            <span className="font-medium text-slate-700">Sincronización bidireccional activa: Bóveda Local + Nube Firestore</span>
          </div>

          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold rounded-lg text-xs transition-colors"
          >
            Cerrar
          </button>
        </div>

      </div>
    </div>
  );
};
