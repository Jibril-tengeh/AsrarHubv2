import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db, auth } from '../firebase';

export async function logAdminActivity(actionType: string, collectionName: string, documentId: string, details: string) {
  try {
    const user = auth.currentUser;
    if (!user) return;
    
    await addDoc(collection(db, 'admin_activity_logs'), {
      adminId: user.uid,
      adminEmail: user.email || 'Admin',
      actionType,
      collectionName,
      documentId,
      details,
      timestamp: serverTimestamp()
    });
  } catch (error) {
    console.error("Failed to log admin activity:", error);
  }
}
