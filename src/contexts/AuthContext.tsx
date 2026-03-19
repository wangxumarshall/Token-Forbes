import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, signInWithPopup, signInWithRedirect, signOut, onAuthStateChanged } from 'firebase/auth';
import { auth, authProviders, firebaseAuthDomain, firebaseProjectId, type SignInProvider } from '../firebase';
import { buildCanonicalUrl, redirectToCanonicalHost, shouldRedirectToCanonicalHost } from '../utils/canonical';

interface AuthContextType {
  currentUser: User | null;
  login: (provider?: SignInProvider) => Promise<void>;
  logout: () => Promise<void>;
  loading: boolean;
  error: string | null;
  isLoggingIn: boolean;
  activeProvider: SignInProvider | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [activeProvider, setActiveProvider] = useState<SignInProvider | null>(null);

  async function login(provider: SignInProvider = 'google') {
    if (isLoggingIn) return;
    if (typeof window !== 'undefined' && shouldRedirectToCanonicalHost(window.location.hostname)) {
      redirectToCanonicalHost();
      return;
    }

    const providerConfig = authProviders[provider];
    try {
      setIsLoggingIn(true);
      setActiveProvider(provider);
      setError(null);
      await signInWithPopup(auth, providerConfig.provider);
    } catch (err: any) {
      console.error("Failed to sign in", err);
      if (err.code === 'auth/cancelled-popup-request') {
        // Ignore, the user clicked again or closed it
      } else if (err.code === 'auth/popup-blocked') {
        await signInWithRedirect(auth, providerConfig.provider);
        return;
      } else if (err.code === 'auth/popup-closed-by-user') {
        setError('Sign-in popup was closed before completing.');
      } else if (err.code === 'auth/unauthorized-domain') {
        if (typeof window !== 'undefined' && shouldRedirectToCanonicalHost(window.location.hostname)) {
          window.location.replace(buildCanonicalUrl(window.location));
          return;
        }

        const domainsToShow = Array.from(new Set([window.location.hostname, 'token-forbes.vercel.app']));
        setError(
          `This build is using Firebase project ${firebaseProjectId} (${firebaseAuthDomain}). Add ${domainsToShow.join(' and ')} to Authorized Domains in that same Firebase project, and enable ${providerConfig.label} sign-in there.`,
        );
      } else if (err.code === 'auth/operation-not-allowed') {
        setError(`${providerConfig.label} Sign-In is not enabled in Firebase Console.`);
      } else if (err.code === 'auth/account-exists-with-different-credential') {
        setError(`This email is already linked to another provider. Try signing in with a different method first.`);
      } else {
        setError(err.message || 'Failed to sign in. Please try again.');
      }
    } finally {
      setIsLoggingIn(false);
      setActiveProvider(null);
    }
  }

  async function logout() {
    try {
      await signOut(auth);
    } catch (err) {
      console.error("Failed to sign out", err);
    }
  }

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setLoading(false);
    }, 5000);

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      window.clearTimeout(timeoutId);
      setCurrentUser(user);
      setLoading(false);
    });

    return () => {
      window.clearTimeout(timeoutId);
      unsubscribe();
    };
  }, []);

  const value = {
    currentUser,
    login,
    logout,
    loading,
    error,
    isLoggingIn,
    activeProvider,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}
