'use client';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { auth, provider, db } from '@/lib/firebase';
import { onAuthStateChanged, signInWithPopup, signOut, User } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';

export type UserProfile = {
  uid: string;
  nick: string;
  position?: string;
  industry?: string;
  y?: number;
  m?: number;
  salary10k?: number;
  updatedAt?: number;
};

type Ctx = {
  user: User | null;
  profile: UserProfile | null;
  login: () => Promise<void>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
};

const Ctx = createContext<Ctx>({
  user: null,
  profile: null,
  login: async () => {},
  logout: async () => {},
  refreshProfile: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      if (u) {
        const ref = doc(db, 'profiles', u.uid);
        const snap = await getDoc(ref);
        setProfile(snap.exists() ? (snap.data() as UserProfile) : null);
      } else {
        setProfile(null);
      }
    });
    return () => unsub();
  }, []);

  const login = async () => {
    await signInWithPopup(auth, provider);
  };
  const logout = async () => {
    await signOut(auth);
  };
  const refreshProfile = async () => {
    if (!user) return;
    const ref = doc(db, 'profiles', user.uid);
    const snap = await getDoc(ref);
    setProfile(snap.exists() ? (snap.data() as UserProfile) : null);
  };

  return <Ctx.Provider value={{ user, profile, login, logout, refreshProfile }}>{children}</Ctx.Provider>;
}

export const useAuth = () => useContext(Ctx);
