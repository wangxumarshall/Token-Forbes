import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getAnalytics } from "firebase/analytics";

const firebaseConfig = {
  apiKey: "AIzaSyCfvv46ex-miU3uixDkXDsfJv9Fzup5sWM",
  authDomain: "gen-lang-client-0848724798.firebaseapp.com",
  projectId: "gen-lang-client-0848724798",
  storageBucket: "gen-lang-client-0848724798.firebasestorage.app",
  messagingSenderId: "401216041788",
  appId: "1:401216041788:web:724e1892982cfd440b2439"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();

// Initialize Analytics if supported in the environment
if (typeof window !== 'undefined') {
  getAnalytics(app);
}
