
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore, enablePersistence } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyB6rDC1SCymOfz4_CA87L604HV7x-rpnAw",
  authDomain: "finfriend-planner.firebaseapp.com",
  projectId: "finfriend-planner",
  storageBucket: "finfriend-planner.firebasestorage.app",
  messagingSenderId: "682706458300",
  appId: "1:682706458300:web:380d354c994cf82e21a2b9"
};


// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);
const db = getFirestore(app);

try {
    enablePersistence(db);
} catch (err: any) {
    if (err.code == 'failed-precondition') {
        // Multiple tabs open, persistence can only be enabled
        // in one tab at a time.
        console.warn('Firestore persistence failed: multiple tabs open.');
    } else if (err.code == 'unimplemented') {
        // The current browser does not support all of the
        // features required to enable persistence
         console.warn('Firestore persistence not available in this browser.');
    }
}


export { app, auth, db };
