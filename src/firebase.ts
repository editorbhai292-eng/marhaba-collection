import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { initializeFirestore, doc, getDocFromServer } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { firebaseConfig } from './firebase-config';

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);

// Enable long polling to fix connection issues in restricted environments
export const db = initializeFirestore(app, {
  experimentalForceLongPolling: true,
  ignoreUndefinedProperties: true,
  host: 'firestore.googleapis.com',
}, firebaseConfig.firestoreDatabaseId || '(default)');

export const storage = getStorage(app);
storage.maxUploadRetryTime = 600000; // 10 minutes
storage.maxOperationRetryTime = 600000; // 10 minutes

// Connection test
async function testConnection() {
  try {
    console.log("Testing Firestore connection to database:", firebaseConfig.firestoreDatabaseId);
    console.log("Storage bucket configured as:", firebaseConfig.storageBucket);
    await getDocFromServer(doc(db, 'test', 'connection'));
    console.log("Firestore connection successful.");
  } catch (error: any) {
    console.error("Firestore connection test failed:", error.code, error.message);
    if (error.message?.includes('the client is offline') || error.code === 'unavailable') {
      console.error("Network issue detected. Firestore is operating in offline mode or blocked.");
    }
  }
}
testConnection();
