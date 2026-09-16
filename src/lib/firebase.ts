import { initializeApp, getApps, getApp, FirebaseApp } from "firebase/app";
import { 
  getFirestore, 
  initializeFirestore,
  collection, 
  getDocs, 
  doc, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  onSnapshot, 
  query, 
  writeBatch,
  getDocFromServer,
  Firestore
} from "firebase/firestore";
import { getAuth } from "firebase/auth";
import config from "../../firebase-applet-config.json";
import { Member, DuePayment, AppNotification, BackupLog } from "../types";
import { INITIAL_MEMBERS, INITIAL_DUES, INITIAL_NOTIFICATIONS, INITIAL_BACKUPS, SAMPLE_MEMBER_IDS, SAMPLE_DUE_PREFIXES } from "../data/initialData";
import { 
  saveToMemberVault, 
  purgeSampleMembersFromVault,
  deduplicateMembersList,
  overwriteVaultWithDeduplicatedList,
  cleanNameForComparison,
  cleanRutForComparison
} from "./recoveryService";

// Initialize Firebase
const firebaseApp: FirebaseApp = !getApps().length ? initializeApp(config) : getApp();

// In preview/iframe and containerized environments, WebChannel stream connections
// can drop and trigger "FirebaseError: [code=unavailable]".
// Enabling experimentalForceLongPolling guarantees stable HTTP long-polling transport.
let firestoreInstance: Firestore;
try {
  firestoreInstance = initializeFirestore(
    firebaseApp,
    {
      experimentalForceLongPolling: true,
    },
    config.firestoreDatabaseId || undefined
  );
} catch {
  firestoreInstance = getFirestore(firebaseApp, config.firestoreDatabaseId || undefined);
}

export const db: Firestore = firestoreInstance;
export const auth = getAuth(firebaseApp);

// Test connection on boot as recommended for Cloud Firestore
export async function testFirestoreConnection(): Promise<boolean> {
  try {
    await getDocFromServer(doc(db, "test", "connection"));
    return true;
  } catch (error) {
    if (error instanceof Error && error.message.includes("the client is offline")) {
      console.warn("Firestore running in offline/cache mode. Reconnecting...");
    }
    return false;
  }
}
testFirestoreConnection();

export function isSampleRecord(item: any): boolean {
  if (!item || !item.id) return false;
  const idStr = String(item.id);
  if (SAMPLE_MEMBER_IDS.includes(idStr)) return true;
  if (SAMPLE_DUE_PREFIXES.some((prefix) => idStr.startsWith(prefix))) return true;
  if (idStr.startsWith("bak-")) return true;
  if (item.memberId && SAMPLE_MEMBER_IDS.includes(String(item.memberId))) return true;
  return false;
}

// Retry helper for cloud Firestore operations
async function retryFirestoreOp<T>(fn: () => Promise<T>, maxRetries = 3, delayMs = 300): Promise<T> {
  let lastError: any;
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err;
      if (attempt < maxRetries) {
        await new Promise((resolve) => setTimeout(resolve, delayMs * Math.pow(2, attempt - 1)));
      }
    }
  }
  throw lastError;
}

// Purge all demo/sample data from Firestore and local storage caches
export async function purgeAllSampleData() {
  try {
    // 1. Purge sample members from Firestore
    for (const memId of SAMPLE_MEMBER_IDS) {
      deleteDoc(doc(db, "members", memId)).catch(() => {});
    }

    // 2. Purge sample dues from Firestore
    const duesSnap = await getDocs(collection(db, "dues")).catch(() => null);
    if (duesSnap && !duesSnap.empty) {
      duesSnap.docs.forEach((d) => {
        const data = d.data();
        if (isSampleRecord({ id: d.id, ...data })) {
          deleteDoc(doc(db, "dues", d.id)).catch(() => {});
        }
      });
    }

    // 3. Purge sample backup logs from Firestore
    for (const bakId of ["bak-1", "bak-2", "bak-3"]) {
      deleteDoc(doc(db, "backup_logs", bakId)).catch(() => {});
    }

    // 4. Purge local storage caches
    purgeSampleMembersFromVault();

    ["members", "dues", "backup_logs"].forEach((colName) => {
      try {
        const raw = localStorage.getItem(`carecueca_${colName}`);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed)) {
            const cleaned = parsed.filter((item) => !isSampleRecord(item));
            localStorage.setItem(`carecueca_${colName}`, JSON.stringify(cleaned));
          }
        }
      } catch (e) {}
    });

    localStorage.setItem("carecueca_sample_data_purged", "true");
    console.log("All sample records purged from database and local storage.");
  } catch (error) {
    console.warn("Purge sample data encountered error:", error);
  }
}

// Backwards compatibility stub (never seeds sample data anymore)
export async function seedInitialDataIfNeeded() {
  await purgeAllSampleData();
}


// Helper to track intentionally deleted IDs so the smart merge doesn't resurrect them
function getDeletedIds(collectionName: string): Set<string> {
  try {
    const raw = localStorage.getItem(`carecueca_deleted_ids_${collectionName}`);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return new Set(parsed);
    }
  } catch (e) {}
  return new Set();
}

export function recordDeletedId(collectionName: string, id: string) {
  try {
    const ids = getDeletedIds(collectionName);
    ids.add(id);
    localStorage.setItem(`carecueca_deleted_ids_${collectionName}`, JSON.stringify(Array.from(ids)));
  } catch (e) {}
}

export function removeDeletedId(collectionName: string, id: string) {
  try {
    const ids = getDeletedIds(collectionName);
    ids.delete(id);
    localStorage.setItem(`carecueca_deleted_ids_${collectionName}`, JSON.stringify(Array.from(ids)));
  } catch (e) {}
}

// Resilient Subscribe helper for real-time Firestore sync with two-way merge
export function subscribeCollection<T extends { id: string }>(
  collectionName: string,
  initialFallback: T[],
  onUpdate: (data: T[]) => void
) {
  const loadLocalFallback = (): T[] => {
    try {
      const stored = localStorage.getItem(`carecueca_${collectionName}`);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) return parsed.filter((item) => !isSampleRecord(item)) as T[];
      }
    } catch (e) {
      console.warn(`Error reading localStorage for ${collectionName}:`, e);
    }
    return initialFallback.filter((item) => !isSampleRecord(item));
  };

  try {
    const colRef = collection(db, collectionName);
    const q = query(colRef);

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const localItems = loadLocalFallback();
        const deletedIds = getDeletedIds(collectionName);

        if (snapshot.empty) {
          // If Firestore collection is empty, preserve all non-sample local items!
          const nonDeletedLocal = localItems.filter(
            (item) => item && item.id && !deletedIds.has(item.id) && !isSampleRecord(item)
          );
          onUpdate(nonDeletedLocal);
          return;
        }

        // Firestore documents (auto-delete any stale sample docs from cloud)
        const firestoreItems: T[] = [];
        snapshot.docs.forEach((d) => {
          const itemData = { id: d.id, ...d.data() };
          if (isSampleRecord(itemData)) {
            deleteDoc(doc(db, collectionName, d.id)).catch(() => {});
          } else {
            firestoreItems.push(itemData as unknown as T);
          }
        });

        // Smart Two-Way Merge:
        // 1. Build map from Firestore items (excluding intentionally deleted IDs and sample records)
        const mergedMap = new Map<string, T>();
        firestoreItems.forEach((item) => {
          if (item && item.id && !deletedIds.has(item.id) && !isSampleRecord(item)) {
            mergedMap.set(item.id, item);
          }
        });

        // 2. CRITICAL: Merge in local items that are not yet in Firestore!
        // This ensures local additions or edits are NEVER wiped out by a snapshot
        localItems.forEach((localItem) => {
          if (!localItem || !localItem.id || deletedIds.has(localItem.id) || isSampleRecord(localItem)) return;

          if (!mergedMap.has(localItem.id)) {
            // Local item not present in cloud yet: KEEP IT and push to Firestore
            mergedMap.set(localItem.id, localItem);
            // Silently upload to Firestore so it is persistently stored in cloud
            const docRef = doc(db, collectionName, localItem.id);
            setDoc(docRef, cleanForFirestore(localItem)).catch((e) => {
              console.warn(`Background push to Firestore failed for ${collectionName}/${localItem.id}:`, e);
            });
          } else {
            // Exists in both: compare modification timestamp
            const remoteItem = mergedMap.get(localItem.id) as any;
            const localAny = localItem as any;
            const localTime = localAny.updatedAt || localAny.createdAt;
            const remoteTime = remoteItem?.updatedAt || remoteItem?.createdAt;

            if (localTime && (!remoteTime || localTime > remoteTime)) {
              mergedMap.set(localItem.id, localItem);
              const docRef = doc(db, collectionName, localItem.id);
              setDoc(docRef, cleanForFirestore(localItem)).catch(() => {});
            }
          }
        });

        const mergedList = Array.from(mergedMap.values()).filter((item) => !isSampleRecord(item));

        // Update local cache safely
        try {
          localStorage.setItem(`carecueca_${collectionName}`, JSON.stringify(mergedList));
        } catch (e) {}

        // If this is members, also update the permanent Safety Vault
        if (collectionName === "members") {
          saveToMemberVault(mergedList as unknown as Member[]);
        }

        onUpdate(mergedList);
      },
      (error) => {
        console.warn(`Firestore subscription error on ${collectionName}:`, error);
        onUpdate(loadLocalFallback());
      }
    );

    return unsubscribe;
  } catch (err) {
    console.warn(`Firestore init error on ${collectionName}:`, err);
    onUpdate(loadLocalFallback());
    return () => {};
  }
}

// Helper to clean undefined values before sending to Firestore
export function cleanForFirestore<T extends Record<string, any>>(obj: T): Record<string, any> {
  const cleaned: Record<string, any> = {};
  Object.keys(obj).forEach((key) => {
    const val = obj[key];
    if (val !== undefined) {
      cleaned[key] = val;
    }
  });
  return cleaned;
}

// Firestore Operations for Members with robust retries
export async function saveMemberToFirestore(member: Member): Promise<boolean> {
  try {
    await retryFirestoreOp(async () => {
      const docRef = doc(db, "members", member.id);
      await setDoc(docRef, cleanForFirestore(member));
    });
    // Remove from deleted tracker in case it was previously deleted
    removeDeletedId("members", member.id);
    // Also save to permanent Safety Vault
    saveToMemberVault([member]);
    return true;
  } catch (err) {
    console.error("Error saving member to Firestore:", err);
    // Still save to local vault so it's never lost
    saveToMemberVault([member]);
    return false;
  }
}

export async function deleteMemberFromFirestore(memberId: string): Promise<boolean> {
  try {
    recordDeletedId("members", memberId);
    await retryFirestoreOp(async () => {
      await deleteDoc(doc(db, "members", memberId));
    });
    return true;
  } catch (err) {
    console.error("Error deleting member from Firestore:", err);
    return false;
  }
}

// Firestore Operations for Dues Payments
export async function saveDueToFirestore(due: DuePayment): Promise<void> {
  try {
    const docRef = doc(db, "dues", due.id);
    await setDoc(docRef, cleanForFirestore(due));
  } catch (err) {
    console.error("Error saving due to Firestore:", err);
  }
}

export async function deleteDueFromFirestore(dueId: string): Promise<boolean> {
  try {
    recordDeletedId("dues", dueId);
    await retryFirestoreOp(async () => {
      await deleteDoc(doc(db, "dues", dueId));
    });
    return true;
  } catch (err) {
    console.error("Error deleting due from Firestore:", err);
    return false;
  }
}

export async function deleteDuesForMemberFromFirestore(memberId: string, knownDueIds?: string[]): Promise<boolean> {
  try {
    if (knownDueIds && knownDueIds.length > 0) {
      knownDueIds.forEach((id) => recordDeletedId("dues", id));
    }
    const duesSnap = await getDocs(collection(db, "dues")).catch(() => null);
    if (duesSnap && !duesSnap.empty) {
      const batch = writeBatch(db);
      let count = 0;
      duesSnap.docs.forEach((d) => {
        const data = d.data();
        if (data.memberId === memberId || d.id.includes(memberId)) {
          recordDeletedId("dues", d.id);
          batch.delete(doc(db, "dues", d.id));
          count++;
        }
      });
      if (count > 0) {
        await batch.commit();
      }
    }
    return true;
  } catch (err) {
    console.error("Error deleting member dues from Firestore:", err);
    return false;
  }
}

export async function batchSaveDuesToFirestore(dues: DuePayment[]): Promise<void> {
  try {
    const batch = writeBatch(db);
    dues.forEach((due) => {
      const ref = doc(db, "dues", due.id);
      batch.set(ref, cleanForFirestore(due));
    });
    await batch.commit();
  } catch (err) {
    console.error("Error batch saving dues to Firestore:", err);
  }
}

// Firestore Operations for Notifications
export async function addNotificationToFirestore(notification: Omit<AppNotification, "id">): Promise<string> {
  const newId = "notif-" + Date.now();
  const notifItem: AppNotification = { id: newId, ...notification };
  try {
    await setDoc(doc(db, "notifications", newId), notifItem);
  } catch (err) {
    console.error("Error adding notification to Firestore:", err);
  }
  return newId;
}

export async function updateNotificationInFirestore(id: string, data: Partial<AppNotification>): Promise<void> {
  try {
    await updateDoc(doc(db, "notifications", id), data);
  } catch (err) {
    console.error("Error updating notification in Firestore:", err);
  }
}

// Firestore Operations for Backups
export async function addBackupLogToFirestore(backup: BackupLog): Promise<void> {
  try {
    await setDoc(doc(db, "backup_logs", backup.id), backup);
  } catch (err) {
    console.error("Error adding backup log to Firestore:", err);
  }
}

/**
 * Completely wipes all records (dues, payments, notifications, backups, activity)
 * across Cloud Firestore and local storage, strictly PRESERVING members.
 */
export async function purgeEverythingExceptMembersFromFirestore(): Promise<boolean> {
  try {
    // 1. Purge all dues from Firestore
    const duesSnap = await getDocs(collection(db, "dues")).catch(() => null);
    if (duesSnap && !duesSnap.empty) {
      const batch = writeBatch(db);
      duesSnap.docs.forEach((d) => {
        batch.delete(doc(db, "dues", d.id));
      });
      await batch.commit();
    }

    // 2. Purge notifications from Firestore
    const notifsSnap = await getDocs(collection(db, "notifications")).catch(() => null);
    if (notifsSnap && !notifsSnap.empty) {
      const batch = writeBatch(db);
      notifsSnap.docs.forEach((d) => {
        batch.delete(doc(db, "notifications", d.id));
      });
      await batch.commit();
    }

    // 3. Purge backup logs from Firestore
    const backupsSnap = await getDocs(collection(db, "backup_logs")).catch(() => null);
    if (backupsSnap && !backupsSnap.empty) {
      const batch = writeBatch(db);
      backupsSnap.docs.forEach((d) => {
        batch.delete(doc(db, "backup_logs", d.id));
      });
      await batch.commit();
    }

    // 4. Reset local storage for everything EXCEPT members
    try {
      localStorage.setItem("carecueca_dues", JSON.stringify([]));
      localStorage.setItem("carecueca_notifications", JSON.stringify([]));
      localStorage.setItem("carecueca_backup_logs", JSON.stringify([]));
      localStorage.removeItem("carecueca_deleted_ids_dues");
      localStorage.removeItem("carecueca_deleted_ids_notifications");
      localStorage.removeItem("carecueca_deleted_ids_backup_logs");
    } catch (e) {
      console.warn("Error clearing local storage non-member caches:", e);
    }

    return true;
  } catch (err) {
    console.error("Error purging everything except members from Firestore:", err);
    return false;
  }
}

/**
 * Scans all members across Firestore and local storage, detects duplicates
 * (e.g. by normalized name like 'bernardina' or RUT), preserves the best record,
 * and deletes the surplus duplicate records from Firestore and local storage.
 */
export async function deduplicateMembersInFirestoreAndLocal(
  currentActiveMembers?: Member[]
): Promise<{ cleanedMembers: Member[]; removedCount: number }> {
  try {
    // 1. Fetch all members currently in Firestore
    const membersSnap = await getDocs(collection(db, "members")).catch(() => null);
    const firestoreMembers: Member[] = [];
    if (membersSnap && !membersSnap.empty) {
      membersSnap.docs.forEach((d) => {
        const item = { id: d.id, ...d.data() } as Member;
        if (item && item.id && !isSampleRecord(item)) {
          firestoreMembers.push(item);
        }
      });
    }

    // 2. Gather from local storage and vault
    let localMembers: Member[] = [];
    try {
      const stored = localStorage.getItem("carecueca_members");
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) localMembers = parsed;
      }
    } catch (e) {}

    let vaultMembers: Member[] = [];
    try {
      const stored = localStorage.getItem("carecueca_members_vault");
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) vaultMembers = parsed;
      }
    } catch (e) {}

    // Combine all sources
    const allMembersPool = [
      ...(currentActiveMembers || []),
      ...firestoreMembers,
      ...localMembers,
      ...vaultMembers
    ].filter((m) => m && m.name && !isSampleRecord(m));

    // 3. Find unique keeper records vs duplicate records to delete
    const keepers: Member[] = [];
    const duplicateIdsToDelete = new Set<string>();
    const seenMap = new Map<string, Member>();

    for (const member of allMembersPool) {
      if (!member || !member.id) continue;

      const normName = cleanNameForComparison(member.name);
      const cleanRut = cleanRutForComparison(member.rut);
      const primaryKey = cleanRut && cleanRut.length >= 7 ? `rut:${cleanRut}` : `name:${normName}`;

      if (seenMap.has(primaryKey)) {
        const existing = seenMap.get(primaryKey)!;
        if (existing.id !== member.id) {
          duplicateIdsToDelete.add(member.id);
          // Merge in any useful information if existing was missing it
          if (!existing.rut && member.rut) existing.rut = member.rut;
          if (!existing.email && member.email) existing.email = member.email;
          if (!existing.phone && member.phone) existing.phone = member.phone;
          if (!existing.notes && member.notes) existing.notes = member.notes;
        }
      } else {
        seenMap.set(primaryKey, member);
        if (normName) seenMap.set(`name:${normName}`, member);
        keepers.push(member);
      }
    }

    // 4. Delete surplus duplicate documents from Firestore
    if (duplicateIdsToDelete.size > 0) {
      const batch = writeBatch(db);
      let batchCount = 0;
      duplicateIdsToDelete.forEach((dupId) => {
        recordDeletedId("members", dupId);
        batch.delete(doc(db, "members", dupId));
        batchCount++;
      });
      if (batchCount > 0) {
        await batch.commit().catch((e) => console.warn("Firestore batch delete duplicates error:", e));
      }
    }

    // 5. Ensure all keeper records are saved in Firestore and update local storage & vault
    for (const keeper of keepers) {
      removeDeletedId("members", keeper.id);
      const docRef = doc(db, "members", keeper.id);
      setDoc(docRef, cleanForFirestore(keeper)).catch(() => {});
    }

    // 6. Overwrite local caches and vault with deduplicated list
    try {
      localStorage.setItem("carecueca_members", JSON.stringify(keepers));
      overwriteVaultWithDeduplicatedList(keepers);
    } catch (e) {}

    return {
      cleanedMembers: keepers,
      removedCount: duplicateIdsToDelete.size
    };
  } catch (err) {
    console.error("Error in deduplicateMembersInFirestoreAndLocal:", err);
    return { cleanedMembers: currentActiveMembers || [], removedCount: 0 };
  }
}

