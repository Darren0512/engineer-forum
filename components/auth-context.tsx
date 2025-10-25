
'use client';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { auth, provider, db } from '@/lib/firebase';
import { onAuthStateChanged, signInWithPopup, signOut, User } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import type { UserProfile } from '@/lib/types';

type Ctx = {
  user: User|null;
  profile: UserProfile|null;
  loading: boolean;
  login: ()=>Promise<void>;
  logout: ()=>Promise<void>;
  refreshProfile: ()=>Promise<void>;
};
const AuthCtx = createContext<Ctx>({
  user: null, profile: null, loading: true,
  login: async ()=>{}, logout: async ()=>{}, refreshProfile: async ()=>{},
});
export const useAuth = ()=>useContext(AuthCtx);

export function AuthProvider({ children }: { children: React.ReactNode }){
  const [user, setUser] = useState<User|null>(null);
  const [profile, setProfile] = useState<UserProfile|null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(()=>{
    const unsub = onAuthStateChanged(auth, async (u)=>{
      setUser(u);
      if (u) {
        const ref = doc(db, 'profiles', u.uid);
        const snap = await getDoc(ref);
        if (snap.exists()) setProfile(snap.data() as UserProfile);
      } else { setProfile(null); }
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const login = async ()=>{ await signInWithPopup(auth, provider); };
  const logout = async ()=>{ await signOut(auth); };
  const refreshProfile = async ()=>{
    if (!user) return;
    const ref = doc(db, 'profiles', user.uid);
    const snap = await getDoc(ref);
    if (snap.exists()) setProfile(snap.data() as UserProfile);
  };

  return <AuthCtx.Provider value={{ user, profile, loading, login, logout, refreshProfile }}>{children}</AuthCtx.Provider>;
}
