
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { AllPlannerData } from '@/lib/types';

const COLLECTION_NAME = 'plannerData';

export async function getPlannerData(userId: string): Promise<AllPlannerData | null> {
  try {
    const docRef = doc(db, COLLECTION_NAME, userId);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      return docSnap.data() as AllPlannerData;
    } else {
      console.log("No such document!");
      return null;
    }
  } catch (error) {
    console.error("Error getting document:", error);
    return null;
  }
}


export async function savePlannerData(userId: string, data: AllPlannerData): Promise<void> {
    if (!userId) {
        console.error("User is not authenticated. Cannot save data.");
        return;
    }
  try {
    const docRef = doc(db, COLLECTION_NAME, userId);
    await setDoc(docRef, { ...data, updatedAt: new Date() }, { merge: true });
  } catch (error) {
    console.error("Error saving document:", error);
  }
}
