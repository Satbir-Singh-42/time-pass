import { initializeApp } from "firebase/app";
import { getAuth, signInWithEmailAndPassword, signOut, onAuthStateChanged, User } from "firebase/auth";
import { getFirestore, Firestore } from "firebase/firestore";

// Firebase configuration - reading from environment variables
const firebaseConfig = {
  apiKey: "AIzaSyBDFtPjQU-dqf7NivC-VpEfXjR6Z0VV2G4",
  authDomain: "ipl-auction-platform-123.firebaseapp.com",
  projectId: "ipl-auction-platform-123",
  storageBucket: "ipl-auction-platform-123.firebasestorage.app",
  messagingSenderId: "931100440871",
  appId: "1:931100440871:web:29795d0714d634e908d102"
};

// Check if Firebase credentials are available
const hasFirebaseCredentials = !!(
  firebaseConfig.apiKey &&
  firebaseConfig.projectId &&
  firebaseConfig.appId
);



// Initialize Firebase only if credentials are available
let app: any = null;
let auth: any = null;
let db: Firestore | null = null;

try {
  if (hasFirebaseCredentials) {
    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    db = getFirestore(app);
    console.log("Firebase initialized successfully");
  } else {
    console.warn("Firebase credentials not found - using fallback mode");
  }
} catch (error) {
  console.error("Firebase initialization failed:", error);
}

export { auth, db, hasFirebaseCredentials };

// Auth functions
export { signInWithEmailAndPassword, signOut, onAuthStateChanged };
export type { User };
