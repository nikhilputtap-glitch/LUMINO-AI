import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  GoogleAuthProvider, 
  signInWithPopup, 
  signInAnonymously,
  signOut, 
  onAuthStateChanged, 
  User as FirebaseUser 
} from 'firebase/auth';
import { auth } from './firebase';
import { FirebaseService } from './firebaseService';
import { personalDataStore } from './store/PersonalDataStore';

export interface User {
  uid: string;
  name: string | null;
  email: string | null;
  isAuthenticated: boolean;
  onboarded: boolean;
  isAnonymous?: boolean;
}

interface AuthContextType {
  user: User | null;
  login: (emailHint?: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  loginAsGuest: () => Promise<void>;
  logout: () => Promise<void>;
  completeOnboarding: () => void;
  getIdToken: () => Promise<string | null>;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const userData: User = {
          uid: firebaseUser.uid,
          name: firebaseUser.displayName || (firebaseUser.isAnonymous ? 'Guest Member' : 'Lumino Member'),
          email: firebaseUser.email,
          isAuthenticated: true,
          onboarded: true,
          isAnonymous: firebaseUser.isAnonymous
        };
        setUser(userData);
        
        // Initialize PersonalDataStore with real authenticated user UID
        personalDataStore.setActiveUser(firebaseUser.uid, userData.name || undefined, userData.email || undefined);
        
        // Sync user document to Firestore
        await FirebaseService.syncUserProfile(firebaseUser.uid, {
          id: firebaseUser.uid,
          name: userData.name || 'Lumino Member',
          theme: 'dark',
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'
        });
      } else {
        setUser(null);
      }
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const loginWithGoogle = async () => {
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
    } catch (e: any) {
      console.warn('Google sign in popup error, attempting guest sign in:', e);
      await loginAsGuest();
    }
  };

  const loginAsGuest = async () => {
    try {
      await signInAnonymously(auth);
    } catch (e) {
      console.error('Anonymous sign in error:', e);
    }
  };

  const login = async (emailHint?: string) => {
    await loginWithGoogle();
  };

  const logout = async () => {
    await signOut(auth);
  };

  const getIdToken = async (): Promise<string | null> => {
    if (!auth.currentUser) return null;
    return await auth.currentUser.getIdToken();
  };

  const completeOnboarding = () => setUser(prev => prev ? { ...prev, onboarded: true } : null);

  return (
    <AuthContext.Provider value={{ 
      user, 
      login, 
      loginWithGoogle, 
      loginAsGuest, 
      logout, 
      completeOnboarding, 
      getIdToken,
      loading 
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
