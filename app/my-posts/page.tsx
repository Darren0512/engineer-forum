
'use client';
import React, { useEffect, useState } from 'react';
import Header from '@/components/header';
import { AuthProvider, useAuth } from '@/components/auth-context';
import { Button, Card } from '@/components/ui';
import { collection, deleteDoc, doc, getDocs, orderBy, query, updateDoc, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Post } from '@/lib/types';
import Link from 'next/link';

function MyPostsInner(){
  const { user } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [lockId, setLockId] = useState<string | null>(null);

  useEffect(()=>{
    if (!user) return;
    (async ()=>{
      const q = query(collection(db,'posts'), where('authorUid','==',user.uid), orderBy('createdAt','desc'));
      const snaps = await getDocs(q);
      const list:Post[] = []; snaps.forEach(s=> list.push({ id:s.id, ...(s.data() as any) }));
      setPosts(list.filter(p=>!p.deleted));
    })();
  }, [user]);

  if (!user) return <div className="container"><Card>請先登入</Card></div>;

  const fmtAuthor = (a:any)=> {
    if (!a) return '';
    const pos = a.position ? `${a.position} / ` : '';
    return `${a.nick}（${pos}${a.industry} / ${a.y}年${a.m}月 / ${a.salary10k}萬/年）`;
  };

  return (
    <div className="container">
      <div className="subtitle">共 {posts.length} 篇</div>
      {posts.map(p=>(
        <Card key={p.id}>
          <div className="vstack" title={fmtAuthor(p.authorSnapshot)}>
            <div className="title"><Link href={`/posts/${p.id}`}>{p.title}</Link></div>
            <div className="small">作者：{fmtAuthor(p.authorSnapshot)}</div>
            <div className="small">發佈於 {new Date(p.createdAt).toLocaleString()} · 👍 {p.likesCount||0}</div>
            <div className="hstack">
              <Button variant="ghost" onClick={async ()=>{
                if (lockId) return;
                setLockId(p.id);
                try{
                  const t = prompt('編輯標題', p.title);
                  if (t!==null) {
                    await updateDoc(doc(db,'posts',p.id), { title:t, editedAt: Date.now() });
                    setPosts(prev=> prev.map(x=> x.id===p.id ? ({...x, title:t, editedAt: Date.now()}) : x));
                  }
                } finally {
                  setLockId(null);
                }
              }} disabled={lockId===p.id}>編輯</Button>
              <Button variant="danger" onClick={async ()=>{
                if (lockId) return;
                if (!confirm('確定刪除此文章？此動作無法復原')) return;
                setLockId(p.id);
                try{
                  await deleteDoc(doc(db,'posts',p.id));
                  setPosts(prev=> prev.filter(x=> x.id!==p.id));
                } finally {
                  setLockId(null);
                }
              }} disabled={lockId===p.id}>{lockId===p.id?'刪除中…':'刪除'}</Button>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}

export default function Page(){
  return (
    <AuthProvider>
      <Header />
      <MyPostsInner />
    </AuthProvider>
  );
}
