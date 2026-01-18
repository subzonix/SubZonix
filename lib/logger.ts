import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "./firebase";

export async function logAction(userId: string, action: string, description: string) {
    try {
        await addDoc(collection(db, "user_logs"), {
            userId,
            action,
            description,
            timestamp: Date.now(),
            createdAt: serverTimestamp()
        });
    } catch (error) {
        console.error("Failed to log action:", error);
    }
}
