import { initializeApp } from "firebase/app";
import { getAuth, GithubAuthProvider, GoogleAuthProvider } from "firebase/auth";
import { getAnalytics, isSupported } from "firebase/analytics";

const fallbackFirebaseConfig = {
  apiKey: "AIzaSyCfvv46ex-miU3uixDkXDsfJv9Fzup5sWM",
  authDomain: "gen-lang-client-0848724798.firebaseapp.com",
  projectId: "gen-lang-client-0848724798",
  storageBucket: "gen-lang-client-0848724798.firebasestorage.app",
  messagingSenderId: "401216041788",
  appId: "1:401216041788:web:724e1892982cfd440b2439"
};

const envFirebaseConfig = {
  apiKey: (import.meta.env.VITE_FIREBASE_API_KEY as string | undefined)?.trim(),
  authDomain: (import.meta.env.VITE_FIREBASE_AUTH_DOMAIN as string | undefined)?.trim(),
  projectId: (import.meta.env.VITE_FIREBASE_PROJECT_ID as string | undefined)?.trim(),
  storageBucket: (import.meta.env.VITE_FIREBASE_STORAGE_BUCKET as string | undefined)?.trim(),
  messagingSenderId: (import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID as string | undefined)?.trim(),
  appId: (import.meta.env.VITE_FIREBASE_APP_ID as string | undefined)?.trim(),
};

const hasFullEnvOverride = Object.values(envFirebaseConfig).every(Boolean);

const firebaseConfig = hasFullEnvOverride
  ? envFirebaseConfig
  : fallbackFirebaseConfig;

export const firebaseProjectId = firebaseConfig.projectId;
export const firebaseAuthDomain = firebaseConfig.authDomain;

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
export const githubProvider = new GithubAuthProvider();

googleProvider.setCustomParameters({ prompt: 'select_account' });
githubProvider.addScope('read:user');
githubProvider.addScope('user:email');
githubProvider.setCustomParameters({ allow_signup: 'true' });

export type SignInProvider = 'google' | 'github';

export const authProviders = {
  google: {
    id: 'google' as const,
    label: 'Google',
    provider: googleProvider,
  },
  github: {
    id: 'github' as const,
    label: 'GitHub',
    provider: githubProvider,
  },
};

// Analytics is optional and can throw in unsupported browser contexts.
if (typeof window !== 'undefined') {
  void isSupported()
    .then((supported) => {
      if (supported) {
        getAnalytics(app);
      }
    })
    .catch((error) => {
      console.warn('Firebase Analytics initialization skipped:', error);
    });
}
