import { collection, query, where, getDocs, addDoc, updateDoc, doc, serverTimestamp, setDoc, deleteDoc } from "firebase/firestore";
import { db, auth } from "../firebase";

export interface FriendRequest {
  id: string;
  fromId: string;
  fromName: string;
  toId: string;
  status: "pending" | "accepted" | "rejected";
  timestamp: any;
}

export interface Friend {
  id: string;
  friendId: string;
  friendName: string;
  timestamp: any;
}

export async function sendFriendRequest(toUserId: string, toUserName: string) {
  const user = auth.currentUser;
  if (!user || user.uid === toUserId) return;

  // Check if request already exists
  const q1 = query(collection(db, "friend_requests"), where("fromId", "==", user.uid), where("toId", "==", toUserId));
  const snap1 = await getDocs(q1);
  if (!snap1.empty) throw new Error("Friend request already sent.");

  const q2 = query(collection(db, "friend_requests"), where("fromId", "==", toUserId), where("toId", "==", user.uid));
  const snap2 = await getDocs(q2);
  if (!snap2.empty) throw new Error("This user already sent you a friend request.");

  await addDoc(collection(db, "friend_requests"), {
    fromId: user.uid,
    fromName: user.displayName || user.email?.split("@")[0] || "Unknown",
    toId: toUserId,
    status: "pending",
    timestamp: serverTimestamp()
  });
}

export async function acceptFriendRequest(requestId: string, fromId: string, toId: string, fromName: string) {
  const user = auth.currentUser;
  if (!user || user.uid !== toId) return;

  const toName = user.displayName || user.email?.split("@")[0] || "Unknown";

  // Update request status
  await updateDoc(doc(db, "friend_requests", requestId), {
    status: "accepted",
    timestamp: serverTimestamp()
  });

  // Create friend link for 'to' user
  await setDoc(doc(db, "users", toId, "friends", fromId), {
    friendId: fromId,
    friendName: fromName,
    timestamp: serverTimestamp()
  });

  // Create friend link for 'from' user
  await setDoc(doc(db, "users", fromId, "friends", toId), {
    friendId: toId,
    friendName: toName,
    timestamp: serverTimestamp()
  });
}

export async function rejectFriendRequest(requestId: string) {
  const user = auth.currentUser;
  if (!user) return;
  await deleteDoc(doc(db, "friend_requests", requestId));
}

export async function removeFriend(friendId: string) {
  const user = auth.currentUser;
  if (!user) return;

  // Remove from current user
  await deleteDoc(doc(db, "users", user.uid, "friends", friendId));
  // Remove from friend
  await deleteDoc(doc(db, "users", friendId, "friends", user.uid));

  // Also remove the accepted request
  const q1 = query(collection(db, "friend_requests"), where("fromId", "==", user.uid), where("toId", "==", friendId));
  const snap1 = await getDocs(q1);
  snap1.forEach(async (d) => await deleteDoc(doc(db, "friend_requests", d.id)));

  const q2 = query(collection(db, "friend_requests"), where("fromId", "==", friendId), where("toId", "==", user.uid));
  const snap2 = await getDocs(q2);
  snap2.forEach(async (d) => await deleteDoc(doc(db, "friend_requests", d.id)));
}
