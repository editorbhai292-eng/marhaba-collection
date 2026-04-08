/**
 * FIREBASE CONFIGURATION GUIDE
 * 
 * 1. Go to Firebase Console > Project Settings
 * 2. Scroll down to "Your apps" > "SDK setup and configuration"
 * 3. Select "Config" and copy the object values here.
 */

export const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT_ID.firebasestorage.app",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID",
  // If you are using a named database, add it here:
  firestoreDatabaseId: "(default)" 
};
