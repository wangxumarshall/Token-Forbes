import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  User,
  browserLocalPersistence,
  getRedirectResult,
  onAuthStateChanged,
  setPersistence,
  signInWithRedirect,
  signOut,
} from 'firebase/auth';
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

  function handleAuthError(err: any, provider?: SignInProvider) {
    const providerConfig = provider ? authProviders[provider] : null;
    const providerLabel = providerConfig?.label || 'Selected provider';

    console.error('Failed to sign in', err);

    if (err?.code === 'auth/unauthorized-domain') {
      if (typeof window !== 'undefined' && shouldRedirectToCanonicalHost(window.location.hostname)) {
        window.location.replace(buildCanonicalUrl(window.location));
        return;
      }

      const domainsToShow =
        typeof window !== 'undefined'
          ? Array.from(new Set([window.location.hostname, 'token-forbes.vercel.app']))
          : ['token-forbes.vercel.app'];
      setError(
        `This build is using Firebase project ${firebaseProjectId} (${firebaseAuthDomain}). Add ${domainsToShow.join(' and ')} to Authorized Domains in that same Firebase project, and enable ${providerLabel} sign-in there.`,
      );
      return;
    }

    if (err?.code === 'auth/operation-not-allowed') {
      setError(`${providerLabel} sign-in is not enabled in Firebase Console.`);
      return;
    }

    if (err?.code === 'auth/account-exists-with-different-credential') {
      setError('This email is already linked to another provider. Try the other login option first.');
      return;
    }

    if (err?.code === 'auth/network-request-failed') {
      setError('Login failed because the network request did not complete. Please retry on the canonical domain.');
      return;
    }

    if (err?.code === 'auth/web-storage-unsupported') {
      setError('This browser is blocking the storage Firebase Auth needs. Please allow cookies/storage and try again.');
      return;
    }

    if (err?.code === 'auth/popup-closed-by-user') {
      setError('Login was closed before completing.');
      return;
    }

    if (err?.message) {
      setError(err.message);
      return;
    }

    setError('Failed to sign in. Please try again.');
  }

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
      await signInWithRedirect(auth, providerConfig.provider);
    } catch (err: any) {
      handleAuthError(err, provider);
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
    void setPersistence(auth, browserLocalPersistence).catch((err) => {
      console.warn('Failed to set auth persistence:', err);
    });
  }, []);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setLoading(false);
    }, 5000);

    void getRedirectResult(auth).catch((err) => {
      handleAuthError(err);
      setIsLoggingIn(false);
      setActiveProvider(null);
    });

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      window.clearTimeout(timeoutId);
      setCurrentUser(user);
      setIsLoggingIn(false);
      setActiveProvider(null);
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
