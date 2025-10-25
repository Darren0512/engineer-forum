// components/login-button.tsx
'use client';
import { useState } from 'react';
import { signInWithPopup } from 'firebase/auth';
import { auth, googleProvider } from '@/lib/firebase';
import { Button } from '@/components/ui';

export default function LoginButton() {
  const [busy, setBusy] = useState(false);
  const handleLogin = async () => {
    if (busy) return;
    setBusy(true);
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err: any) {
      // 對使用者友善的錯誤提示，可改為 toast
      console.error('[Google Sign-In] error:', err);
      alert('登入失敗：' + (err?.message || '請稍後再試'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Button onClick={handleLogin} disabled={busy}>
      {busy ? '登入中…' : '使用 Google 登入'}
    </Button>
  );
}
