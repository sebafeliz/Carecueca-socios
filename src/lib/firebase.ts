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
    // Delete any existing sample members or dues if present
    const membersSnap = await getDocs(collection(db, "members"));
    const sampleDocsToDelete: string[] = [];
    membersSnap.forEach((docSnap) => {
      if (docSnap.id.startsWith("mem-")) {
        sampleDocsToDelete.push(docSnap.id);
      }
    });

    if (sampleDocsToDelete.length > 0) {
      const batch = writeBatch(db);
      sampleDocsToDelete.forEach((id) => {
        batch.delete(doc(db, "members", id));
      });

      const duesSnap = await getDocs(collection(db, "dues"));
      duesSnap.forEach((d) => {
        if (d.id.startsWith("due-")) {
          batch.delete(doc(db, "dues", d.id));
        }
      });

      const notifSnap = await getDocs(collection(db, "notifications"));
      notifSnap.forEach((n) => {
        if (n.id.startsWith("notif-")) {
          batch.delete(doc(db, "notifications", n.id));
        }
      });

      await batch.commit();
      console.log("Deleted sample members and related sample dues/notifications from Firestore.");
    }
  } catch (error) {
    console.warn("Firestore cleanup failed or operating offline:", error);
  }
}

// Subscribe helper for real-time Firestore sync with fallback
export function subscribeCollection<T extends { id: string }>(
  collectionName: string,
  initialFallback: T[],
  onUpdate: (data: T[]) => void
) {
  try {
    const colRef = collection(db, collectionName);
    const q = query(colRef);

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        if (snapshot.empty && initialFallback.length > 0) {
          onUpdate(initialFallback);
        } else {
          const items: T[] = snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as unknown as T));
          onUpdate(items);
        }
      },
      (error) => {
        console.warn(`Firestore subscription error on ${collectionName}:`, error);
        onUpdate(initialFallback);
      }
    );

    return unsubscribe;
  } catch (err) {
    console.warn(`Firestore init error on ${collectionName}:`, err);
    onUpdate(initialFallback);
    return () => {};
  }
}

// Firestore Operations for Members
export async function saveMemberToFirestore(member: Member): Promise<void> {
  try {
    const docRef = doc(db, "members", member.id);
    await setDoc(docRef, member, { merge: true });
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
    await setDoc(docRef, due, { merge: true });
  } catch (err) {
    console.error("Error saving due to Firestore:", err);
  }
}

export async function batchSaveDuesToFirestore(dues: DuePayment[]): Promise<void> {
  try {
    const batch = writeBatch(db);
    dues.forEach((due) => {
      const ref = doc(db, "dues", due.id);
      batch.set(ref, due, { merge: true });
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
