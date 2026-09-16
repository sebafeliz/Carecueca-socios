import { Member } from '../types';
import { SAMPLE_MEMBER_IDS } from '../data/initialData';

const VAULT_KEY = 'carecueca_members_vault';
const SNAPSHOTS_KEY = 'carecueca_members_snapshots';
const DELETED_KEY = 'carecueca_deleted_members_bin';
const DRAFT_KEY = 'carecueca_member_form_draft';

export interface RecoveredMemberItem {
  member: Member;
  source: string; // e.g. 'Bóveda de Seguridad', 'Caché Local', 'Papelera', 'Respaldo'
  foundDate?: string;
}

/**
 * Normalizes RUT for strict duplicate matching
 */
export function cleanRutForComparison(rut?: string): string {
  if (!rut) return '';
  return rut.replace(/[^0-9kK]/g, '').toUpperCase();
}

/**
 * Normalizes member name for duplicate matching
 */
export function cleanNameForComparison(name?: string): string {
  if (!name) return '';
  return name
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // remove accents (e.g. Bernardina vs bernardina)
    .replace(/\s+/g, ' ');
}

/**
 * Deduplicates a list of members keeping the most complete or most recently updated record
 */
export function deduplicateMembersList(members: Member[]): Member[] {
  const result: Member[] = [];
  const seenKeys = new Set<string>();

  for (const m of members) {
    if (!m || !m.name) continue;
    const nameKey = cleanNameForComparison(m.name);
    const rutKey = cleanRutForComparison(m.rut);

    // Primary unique keys
    const hasRut = rutKey.length >= 7;
    const key = hasRut ? `rut:${rutKey}` : `name:${nameKey}`;

    if (seenKeys.has(key)) {
      // If duplicate, see if this member has more complete info than existing
      const existingIdx = result.findIndex((existing) => {
        const eRut = cleanRutForComparison(existing.rut);
        const eName = cleanNameForComparison(existing.name);
        return (hasRut && eRut === rutKey) || (!hasRut && eName === nameKey);
      });
      if (existingIdx >= 0) {
        const existing = result[existingIdx];
        // Merge in any missing details (phone, email, notes)
        result[existingIdx] = {
          ...existing,
          email: existing.email || m.email || '',
          phone: existing.phone || m.phone || '',
          rut: existing.rut || m.rut || '',
          notes: existing.notes || m.notes || '',
        };
      }
      continue;
    }

    seenKeys.add(key);
    // Also mark name key if it has RUT so we don't duplicate by name later
    if (nameKey) seenKeys.add(`name:${nameKey}`);
    result.push(m);
  }

  return result;
}

/**
 * Validates whether an unknown object fits the basic shape of a Member
 */
export function isValidMemberObject(obj: any): obj is Member {
  return (
    obj &&
    typeof obj === 'object' &&
    typeof obj.name === 'string' &&
    obj.name.trim().length > 0 &&
    (typeof obj.rut === 'string' || typeof obj.email === 'string' || typeof obj.troupeRole === 'string')
  );
}

/**
 * Normalizes an object into a complete Member structure
 */
export function normalizeMember(obj: any, sourceHint = 'Recuperado'): Member {
  const id = obj.id || `mem-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
  return {
    id,
    name: obj.name || 'Socio Sin Nombre',
    email: obj.email || '',
    phone: obj.phone || '',
    rut: obj.rut || '',
    troupeRole: obj.troupeRole || 'Actor/Actriz',
    memberStatus: obj.memberStatus || 'Activo',
    userRole: obj.userRole || 'Socio',
    customQuota: typeof obj.customQuota === 'number' ? obj.customQuota : 10000,
    joinDate: obj.joinDate || new Date().toISOString().split('T')[0],
    notes: obj.notes || (sourceHint ? `[${sourceHint}]` : ''),
    createdAt: obj.createdAt || new Date().toISOString()
  };
}

/**
 * Deep-scans localStorage, sessionStorage, and persistent archives
 * for any previously entered member that is missing from the active list.
 */
export function scanForRecoverableMembers(currentMembers: Member[]): RecoveredMemberItem[] {
  const currentIds = new Set(currentMembers.map((m) => m.id));
  const currentRuts = new Set(currentMembers.map((m) => m.rut?.trim().toLowerCase()).filter(Boolean));
  const currentNames = new Set(currentMembers.map((m) => m.name.trim().toLowerCase()));

  const foundMap = new Map<string, RecoveredMemberItem>();

  const checkAndAdd = (item: any, sourceName: string) => {
    if (!isValidMemberObject(item)) return;
    if (item.id && SAMPLE_MEMBER_IDS.includes(item.id)) return;

    const norm = normalizeMember(item, sourceName);
    if (norm.id && SAMPLE_MEMBER_IDS.includes(norm.id)) return;

    const rutKey = norm.rut.trim().toLowerCase();
    const nameKey = norm.name.trim().toLowerCase();

    // Check if already in active roster
    const existsById = currentIds.has(norm.id);
    const existsByRut = rutKey && currentRuts.has(rutKey);
    const existsByName = currentNames.has(nameKey);

    if (!existsById && !existsByRut && !existsByName) {
      const key = norm.rut ? `rut:${norm.rut}` : `id:${norm.id}`;
      if (!foundMap.has(key)) {
        foundMap.set(key, {
          member: norm,
          source: sourceName,
          foundDate: norm.createdAt || new Date().toISOString()
        });
      }
    }
  };

  try {
    // 1. Check Safety Vault
    const vaultRaw = localStorage.getItem(VAULT_KEY);
    if (vaultRaw) {
      try {
        const parsed = JSON.parse(vaultRaw);
        if (Array.isArray(parsed)) {
          parsed.forEach((m) => checkAndAdd(m, 'Bóveda de Seguridad'));
        }
      } catch (e) {}
    }

    // 2. Check Deleted / Recycle Bin
    const deletedRaw = localStorage.getItem(DELETED_KEY);
    if (deletedRaw) {
      try {
        const parsed = JSON.parse(deletedRaw);
        if (Array.isArray(parsed)) {
          parsed.forEach((m) => checkAndAdd(m, 'Papelera / Eliminados Recientes'));
        }
      } catch (e) {}
    }

    // 3. Check Snapshots
    const snapRaw = localStorage.getItem(SNAPSHOTS_KEY);
    if (snapRaw) {
      try {
        const parsed = JSON.parse(snapRaw);
        if (Array.isArray(parsed)) {
          parsed.forEach((snap: any) => {
            if (snap && Array.isArray(snap.members)) {
              snap.members.forEach((m: any) => checkAndAdd(m, `Respaldo Histórico (${snap.timestamp || 'Auto'})`));
            }
          });
        }
      } catch (e) {}
    }

    // 4. Exhaustive Search over all localStorage keys
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!key) continue;
      if (key === VAULT_KEY || key === SNAPSHOTS_KEY || key === DELETED_KEY) continue;

      try {
        const val = localStorage.getItem(key);
        if (!val || val.length < 10) continue;

        if (val.startsWith('{') || val.startsWith('[')) {
          const parsed = JSON.parse(val);
          if (Array.isArray(parsed)) {
            parsed.forEach((candidate) => checkAndAdd(candidate, `Almacenamiento Local [${key}]`));
          } else if (typeof parsed === 'object') {
            if (isValidMemberObject(parsed)) {
              checkAndAdd(parsed, `Registro Local [${key}]`);
            } else if (Array.isArray(parsed.members)) {
              parsed.members.forEach((candidate: any) => checkAndAdd(candidate, `Copia de Seguridad [${key}]`));
            }
          }
        }
      } catch (e) {}
    }

    // 5. Check sessionStorage
    for (let i = 0; i < sessionStorage.length; i++) {
      const key = sessionStorage.key(i);
      if (!key) continue;
      try {
        const val = sessionStorage.getItem(key);
        if (!val) continue;
        if (val.startsWith('{') || val.startsWith('[')) {
          const parsed = JSON.parse(val);
          if (Array.isArray(parsed)) {
            parsed.forEach((candidate) => checkAndAdd(candidate, `Sesión Temporal [${key}]`));
          }
        }
      } catch (e) {}
    }
  } catch (err) {
    console.warn('Error during recovery scan:', err);
  }

  return Array.from(foundMap.values());
}

/**
 * Saves members to the permanent vault.
 * This vault is merged with new/updated members and automatically deduplicated.
 */
export function saveToMemberVault(members: Member[]) {
  try {
    let existingVault: Member[] = [];
    const stored = localStorage.getItem(VAULT_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) existingVault = parsed;
      } catch (e) {}
    }

    const map = new Map<string, Member>();
    existingVault.forEach((m) => {
      if (m && m.id && !SAMPLE_MEMBER_IDS.includes(m.id)) map.set(m.id, m);
    });

    members.forEach((m) => {
      if (m && m.id && !SAMPLE_MEMBER_IDS.includes(m.id)) map.set(m.id, m);
    });

    const combined = Array.from(map.values());
    const updated = deduplicateMembersList(combined);
    localStorage.setItem(VAULT_KEY, JSON.stringify(updated));

    // Also record a snapshot (keep last 10 snapshots)
    try {
      let snapshots: Array<{ timestamp: string; members: Member[] }> = [];
      const snapRaw = localStorage.getItem(SNAPSHOTS_KEY);
      if (snapRaw) {
        snapshots = JSON.parse(snapRaw);
        if (!Array.isArray(snapshots)) snapshots = [];
      }
      const cleanMembers = deduplicateMembersList(members.filter((m) => m && m.id && !SAMPLE_MEMBER_IDS.includes(m.id)));
      snapshots.unshift({
        timestamp: new Date().toLocaleString('es-CL'),
        members: [...cleanMembers]
      });
      if (snapshots.length > 10) snapshots = snapshots.slice(0, 10);
      localStorage.setItem(SNAPSHOTS_KEY, JSON.stringify(snapshots));
    } catch (e) {}
  } catch (err) {
    console.warn('Error saving to member vault:', err);
  }
}

/**
 * Explicitly replaces vault content with a deduplicated and cleaned list of members
 */
export function overwriteVaultWithDeduplicatedList(cleanedMembers: Member[]) {
  try {
    const deduped = deduplicateMembersList(cleanedMembers.filter((m) => m && m.id && !SAMPLE_MEMBER_IDS.includes(m.id)));
    localStorage.setItem(VAULT_KEY, JSON.stringify(deduped));
    
    // Also clean snapshots
    const snapRaw = localStorage.getItem(SNAPSHOTS_KEY);
    if (snapRaw) {
      try {
        const parsed = JSON.parse(snapRaw);
        if (Array.isArray(parsed)) {
          const cleanedSnapshots = parsed.map((s: any) => ({
            ...s,
            members: Array.isArray(s.members) ? deduplicateMembersList(s.members) : []
          })).filter((s: any) => s.members && s.members.length > 0);
          localStorage.setItem(SNAPSHOTS_KEY, JSON.stringify(cleanedSnapshots));
        }
      } catch (e) {}
    }
  } catch (e) {
    console.warn('Error overwriting vault:', e);
  }
}

/**
 * Deduplicates all vaults, snapshots, and localStorage member caches
 */
export function deduplicateVaultAndSnapshots(): Member[] {
  try {
    let allFound: Member[] = [];
    
    // Vault
    const vaultRaw = localStorage.getItem(VAULT_KEY);
    if (vaultRaw) {
      const parsed = JSON.parse(vaultRaw);
      if (Array.isArray(parsed)) allFound.push(...parsed);
    }
    
    // Local cache
    const localRaw = localStorage.getItem('carecueca_members');
    if (localRaw) {
      const parsed = JSON.parse(localRaw);
      if (Array.isArray(parsed)) allFound.push(...parsed);
    }
    
    const deduped = deduplicateMembersList(allFound.filter((m) => m && m.id && !SAMPLE_MEMBER_IDS.includes(m.id)));
    overwriteVaultWithDeduplicatedList(deduped);
    localStorage.setItem('carecueca_members', JSON.stringify(deduped));
    return deduped;
  } catch (e) {
    console.warn('Error during vault deduplication:', e);
    return [];
  }
}

/**
 * Purges all sample demo members from local vaults, snapshots, and bins
 */
export function purgeSampleMembersFromVault() {
  try {
    // 1. Vault
    const vaultRaw = localStorage.getItem(VAULT_KEY);
    if (vaultRaw) {
      const parsed = JSON.parse(vaultRaw);
      if (Array.isArray(parsed)) {
        const cleaned = parsed.filter((m) => m && m.id && !SAMPLE_MEMBER_IDS.includes(m.id));
        localStorage.setItem(VAULT_KEY, JSON.stringify(cleaned));
      }
    }

    // 2. Deleted Bin
    const binRaw = localStorage.getItem(DELETED_KEY);
    if (binRaw) {
      const parsed = JSON.parse(binRaw);
      if (Array.isArray(parsed)) {
        const cleaned = parsed.filter((m) => m && m.id && !SAMPLE_MEMBER_IDS.includes(m.id));
        localStorage.setItem(DELETED_KEY, JSON.stringify(cleaned));
      }
    }

    // 3. Snapshots
    const snapRaw = localStorage.getItem(SNAPSHOTS_KEY);
    if (snapRaw) {
      const parsed = JSON.parse(snapRaw);
      if (Array.isArray(parsed)) {
        const cleaned = parsed.map((s: any) => ({
          ...s,
          members: Array.isArray(s.members) ? s.members.filter((m: any) => m && m.id && !SAMPLE_MEMBER_IDS.includes(m.id)) : []
        })).filter((s: any) => s.members.length > 0);
        localStorage.setItem(SNAPSHOTS_KEY, JSON.stringify(cleaned));
      }
    }
  } catch (e) {
    console.warn('Error purging sample data from vault:', e);
  }
}


/**
 * Permanently purges an erroneously entered member from all vaults, snapshots, and bins
 * so that the recovery system will never attempt to restore them.
 */
export function permanentlyPurgeMember(memberId: string) {
  try {
    // 1. Purge from Vault
    const vaultRaw = localStorage.getItem(VAULT_KEY);
    if (vaultRaw) {
      try {
        const parsed = JSON.parse(vaultRaw);
        if (Array.isArray(parsed)) {
          const cleaned = parsed.filter((m) => m && m.id !== memberId);
          localStorage.setItem(VAULT_KEY, JSON.stringify(cleaned));
        }
      } catch (e) {}
    }

    // 2. Purge from Recycle Bin
    const binRaw = localStorage.getItem(DELETED_KEY);
    if (binRaw) {
      try {
        const parsed = JSON.parse(binRaw);
        if (Array.isArray(parsed)) {
          const cleaned = parsed.filter((m) => m && m.id !== memberId);
          localStorage.setItem(DELETED_KEY, JSON.stringify(cleaned));
        }
      } catch (e) {}
    }

    // 3. Purge from Snapshots
    const snapRaw = localStorage.getItem(SNAPSHOTS_KEY);
    if (snapRaw) {
      try {
        const parsed = JSON.parse(snapRaw);
        if (Array.isArray(parsed)) {
          const cleaned = parsed.map((s: any) => ({
            ...s,
            members: Array.isArray(s.members) ? s.members.filter((m: any) => m && m.id !== memberId) : []
          })).filter((s: any) => s.members && s.members.length > 0);
          localStorage.setItem(SNAPSHOTS_KEY, JSON.stringify(cleaned));
        }
      } catch (e) {}
    }

    // 4. Also scan any other storage entries referencing this memberId
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!key) continue;
      if (key.includes(memberId)) {
        localStorage.removeItem(key);
      }
    }
  } catch (err) {
    console.warn('Error purging member from vault:', err);
  }
}

/**
 * Records a member in the Deleted / Recycle Bin
 */
export function recordDeletedMember(member: Member) {
  try {
    let bin: Member[] = [];
    const stored = localStorage.getItem(DELETED_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) bin = parsed;
      } catch (e) {}
    }
    const filtered = bin.filter((m) => m.id !== member.id);
    filtered.unshift(member);
    if (filtered.length > 20) filtered.splice(20);
    localStorage.setItem(DELETED_KEY, JSON.stringify(filtered));
  } catch (e) {}
}

/**
 * Get all members in the recycle bin
 */
export function getRecycleBinMembers(): Member[] {
  try {
    const stored = localStorage.getItem(DELETED_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (e) {}
  return [];
}

/**
 * Removes a member from the recycle bin upon restoration
 */
export function removeMemberFromRecycleBin(memberId: string) {
  try {
    const bin = getRecycleBinMembers().filter((m) => m.id !== memberId);
    localStorage.setItem(DELETED_KEY, JSON.stringify(bin));
  } catch (e) {}
}

/**
 * Draft helpers for member registration form
 */
export function saveFormDraft(draft: Partial<Member>) {
  try {
    localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
  } catch (e) {}
}

export function loadFormDraft(): Partial<Member> | null {
  try {
    const raw = localStorage.getItem(DRAFT_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {}
  return null;
}

export function clearFormDraft() {
  try {
    localStorage.removeItem(DRAFT_KEY);
  } catch (e) {}
}
