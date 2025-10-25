'use client';
import React, { useEffect, useState } from 'react';
import { doc, onSnapshot, setDoc, deleteDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Button } from '@/components/ui';
import { useAuth } from '@/components/auth-context';

type Props = { postId: string };

export default function LikeButton({ postId }: Props) {
  const { user } = useAuth();
  const [liked, setLiked] = useState<boolean>(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!user) { setLiked(false); return; }
    const ref = doc(db, 'posts', postId, 'likes', user.uid);
    const unsub = onSnapshot(ref, (s) => setLiked(s.exists()));
    return () => unsub();
  }, [user?.uid, postId]);

  const toggle = async () => {
    if (!user || busy) return;
    setBusy(true);
    try {
      const ref = doc(db, 'posts', postId, 'likes', user.uid);
      if (liked) {
        await deleteDoc(ref);
      } else {
        await setDoc(ref, { createdAt: Date.now() });
      }
    } finally {
      setBusy(false);
    }
  };

  if (!user) {
    return (
      <span title="請先登入再按讚">
        <Button variant="outline" disabled aria-label="請先登入再按讚">👍 按讚</Button>
      </span>
    );
  }

  const label = liked ? '已按讚，點擊取消' : '按讚';

  return (
    <span title={label}>
      <Button onClick={toggle} disabled={busy} aria-pressed={liked} aria-label={label}>
        {liked ? '👍 已讚' : '👍 按讚'}
      </Button>
    </span>
  );
}
