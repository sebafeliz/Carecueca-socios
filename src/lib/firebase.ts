import { initializeApp, getApps, getApp } from "firebase/app";
import { 
  getFirestore, 
  collection, 
  getDocs, 
  doc, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  onSnapshot, 
  query, 
  orderBy, 
  addDoc,
  writeBatch
} from "firebase/firestore";
import { getAuth } from "firebase/auth";
import config from "../../firebase-applet-config.json";
import { Member, DuePayment, AppNotification, BackupLog } from "../types";
import { INITIAL_MEMBERS, INITIAL_DUES, INITIAL_NOTIFICATIONS, INITIAL_BACKUPS } from "../data/initialData";

// Initialize Firebase
const firebaseApp = !getApps().length ? initializeApp(config) : getApp();
export const db = getFirestore(firebaseApp, config.firestoreDatabaseId || undefined);
export const auth = getAuth(firebaseApp);

// Seed initial data to Firestore if collections are empty
export async function seedInitialDataIfNeeded() {
  try {
    const membersSnap = await getDocs(collection(db, "members"));
    if (membersSnap.empty && INITIAL_MEMBERS.length > 0) {
      const batch = writeBatch(db);
      INITIAL_MEMBERS.forEach((member) => {
        const ref = doc(db, "members", member.id);
        batch.set(ref, member);
      });
      await batch.commit();
      console.log("Initial data seeded into Firestore.");
    }
  } catch (error) {
    console.warn("Firestore seed check skipped or operating offline:", error);
  }
}

// Subscribe helper for real-time Firestore sync with fallback & local storage mirror
export function subscribeCollection<T extends { id: string }>(
  collectionName: string,
  initialFallback: T[],
  onUpdate: (data: T[]) => void
) {
  const loadLocalFallback = () => {
    try {
      const stored = localStorage.getItem(`carecueca_${collectionName}`);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) return parsed as T[];
      }
    } catch (e) {
      console.warn(`Error reading localStorage for ${collectionName}:`, e);
    }
    return initialFallback;
  };

  try {
    const colRef = collection(db, collectionName);
    const q = query(colRef);

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        if (snapshot.empty) {
          const fallback = loadLocalFallback();
          onUpdate(fallback);
        } else {
          const rawItems: T[] = snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as unknown as T));
          const map = new Map<string, T>();
          rawItems.forEach((item) => {
            if (item && item.id) {
              map.set(item.id, item);
            }
          });
          const items = Array.from(map.values());
          try {
            localStorage.setItem(`carecueca_${collectionName}`, JSON.stringify(items));
          } catch (e) {}
          onUpdate(items);
        }
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
function cleanForFirestore<T extends Record<string, any>>(obj: T): Record<string, any> {
  const cleaned: Record<string, any> = {};
  Object.keys(obj).forEach((key) => {
    const val = obj[key];
    if (val !== undefined) {
      cleaned[key] = val;
    }
  });
  return cleaned;
}

// Firestore Operations for Members
export async function saveMemberToFirestore(member: Member): Promise<void> {
  try {
    const docRef = doc(db, "members", member.id);
    await setDoc(docRef, cleanForFirestore(member));
  } catch (err) {
    console.error("Error saving member to Firestore:", err);
  }
}

export async function deleteMemberFromFirestore(memberId: string): Promise<void> {
  try {
    await deleteDoc(doc(db, "members", memberId));
  } catch (err) {
    console.error("Error deleting member from Firestore:", err);
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
