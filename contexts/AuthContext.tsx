'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import {
  User as FirebaseUser,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup,
  sendPasswordResetEmail,
  UserCredential,
} from 'firebase/auth';
import { auth } from '@/lib/firebase/firebase';
import { createUserProfile } from '@/lib/firestore/users';

interface AuthContextType {
  currentUser: FirebaseUser | null;
  loading: boolean;
  isAdmin: boolean;
  signUp: (email: string, password: string, displayName: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<UserCredential>;
  signInWithGoogle: () => Promise<UserCredential>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  getAuthToken: () => Promise<string | null>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  // Sign up with email and password
  async function signUp(email: string, password: string, displayName: string): Promise<void> {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);

    // Create user profile in Firestore
    await createUserProfile(userCredential.user.uid, email, displayName);
  }

  // Sign in with email and password
  async function signIn(email: string, password: string): Promise<UserCredential> {
    return await signInWithEmailAndPassword(auth, email, password);
  }

  // Sign in with Google
  async function signInWithGoogle(): Promise<UserCredential> {
    const provider = new GoogleAuthProvider();
    const userCredential = await signInWithPopup(auth, provider);

    // Check if this is a new user and create profile if needed
    const user = userCredential.user;
    if (userCredential.user.metadata.creationTime === userCredential.user.metadata.lastSignInTime) {
      await createUserProfile(
        user.uid,
        user.email || '',
        user.displayName || 'Anonymous'
      );
    }

    return userCredential;
  }

  // Sign out
  async function signOut(): Promise<void> {
    return await firebaseSignOut(auth);
  }

  // Reset password
  async function resetPassword(email: string): Promise<void> {
    return await sendPasswordResetEmail(auth, email);
  }

  // Listen for auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) {
        try {
          const tokenResult = await user.getIdTokenResult();
          setIsAdmin(!!tokenResult.claims.admin);
        } catch (e) {
          console.error("Error fetching claims", e);
          setIsAdmin(false);
        }
      } else {
        setIsAdmin(false);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const value: AuthContextType = {
    currentUser,
    loading,
    isAdmin,
    signUp,
    signIn,
    signInWithGoogle,
    signOut,
    resetPassword,
    getAuthToken: async () => currentUser ? await currentUser.getIdToken() : null,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
