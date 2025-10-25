'use client';
import React, { useEffect, useMemo, useState } from 'react';
import { addDoc, collection, onSnapshot, orderBy, query } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Button, Card, Textarea } from '@/components/ui';
import { useAuth } from '@/components/auth-context';

type CommentDoc = {
  id: string;
  uid: string;
  parentId?: string | null;
  content: string;
  createdAt: number;
  authorSnapshot?: {
    nick?: string;
    position?: string;
    industry?: string;
    y?: number;
    m?: number;
    salary10k?: number;
  };
};

export default function Comments({ postId }: { postId: string }) {
  const { user, profile } = useAuth();
  const [list, setList] = useState<CommentDoc[]>([]);
  const [content, setContent] = useState('');
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const canPost = !!user && !!profile && content.trim().length > 0 && !busy;

  useEffect(() => {
    const qy = query(collection(db, 'posts', postId, 'comments'), orderBy('createdAt', 'asc'));
    const unsub = onSnapshot(qy, (snap) => {
      const arr: CommentDoc[] = [];
      snap.forEach((d) => arr.push({ id: d.id, ...(d.data() as any) }));
      setList(arr);
    });
    return () => unsub();
  }, [postId]);

  const byParent = useMemo(() => {
    const map: Record<string, CommentDoc[]> = {};
    list.forEach((c) => {
      const key = c.parentId || 'root';
      map[key] = map[key] || [];
      map[key].push(c);
    });
    return map;
  }, [list]);

  const fmtAuthor = (a?: CommentDoc['authorSnapshot']) => {
    if (!a) return '匿名';
    const pos = a.position ? `${a.position} / ` : '';
    return `${a.nick ?? '匿名'}（${pos}${a.industry ?? '-'} / ${a.y ?? 0}年${a.m ?? 0}月 / ${a.salary10k ?? 0}萬/年）`;
  };

  const submit = async () => {
    if (!canPost) return;
    setBusy(true);
    try {
      await addDoc(collection(db, 'posts', postId, 'comments'), {
        uid: user!.uid,
        content: content.trim(),
        parentId: replyTo ?? null,
        authorSnapshot: {
          nick: profile?.nick,
          position: (profile as any)?.position,
          industry: profile?.industry,
          y: profile?.y, m: profile?.m,
          salary10k: profile?.salary10k,
        },
        createdAt: Date.now(),
      });
      setContent('');
      setReplyTo(null);
    } finally {
      setBusy(false);
    }
  };

  const renderThread = (parentId: string | null, depth = 0) => {
    const arr = byParent[parentId || 'root'] || [];
    return (
      <div className="vstack" style={{ marginLeft: depth * 16 }}>
        {arr.map((c, idx) => (
          <Card key={c.id}>
            <div className="small text-gray-600">#{idx + 1} · {fmtAuthor(c.authorSnapshot)} · {new Date(c.createdAt).toLocaleString()}</div>
            <div style={{ whiteSpace: 'pre-wrap' }}>{c.content}</div>
            {user && (
              <div className="hstack" style={{ marginTop: 6 }}>
                <Button variant="ghost" onClick={() => setReplyTo(c.id)}>回覆</Button>
              </div>
            )}
            {renderThread(c.id, depth + 1)}
          </Card>
        ))}
      </div>
    );
  };

  return (
    <div className="vstack" style={{ gap: 12 }}>
      <div className="title" style={{ fontSize: 18 }}>留言</div>
      {renderThread(null, 0)}

      <Card>
        {!user ? (
          <div className="small text-gray-600">請先登入才能留言</div>
        ) : !profile ? (
          <div className="small text-gray-600">請先建立個人資料才能留言</div>
        ) : (
          <>
            {replyTo && (
              <div className="small">
                回覆目標：<span className="pill">#{list.findIndex(x => x.id === replyTo) + 1}</span>
                <Button variant="ghost" onClick={() => setReplyTo(null)} className="ml-2">取消</Button>
              </div>
            )}
            <Textarea placeholder="寫點什麼…" value={content} onChange={e => setContent(e.target.value)} disabled={busy} />
            <div className="hstack" style={{ justifyContent: 'flex-end' }}>
              <Button className="primary" onClick={submit} disabled={!canPost}>{busy ? '送出中…' : '送出留言'}</Button>
            </div>
          </>
        )}
      </Card>
    </div>
  );
}
