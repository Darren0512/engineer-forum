
'use client';
import React, { useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from './auth-context';
import { collection, deleteDoc, doc, getDocs, orderBy, query, updateDoc, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Notification } from '@/lib/types';

export default function Header() {
  const router = useRouter();
  const pathname = usePathname();
  const { user, login, logout, profile } = useAuth();
  const [notiOpen, setNotiOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const unread = useMemo(()=>notifications.filter(n=>!n.read).length,[notifications]);
  const go = (path:string)=>{ if (pathname!==path) router.push(path); };

  useEffect(()=>{
    if (!user) { setNotifications([]); return; }
    (async ()=>{
      const q = query(collection(db, 'notifications'), where('uid','==',user.uid), orderBy('createdAt','desc'));
      const snaps = await getDocs(q);
      const list: Notification[] = [];
      snaps.forEach(s=> list.push({ id: s.id, ...(s.data() as any) }));
      setNotifications(list);
    })();
  }, [user]);

  const markAllRead = async ()=>{
    const toUpdate = notifications.filter(n=>!n.read);
    await Promise.all(toUpdate.map(n=> updateDoc(doc(db,'notifications',n.id), { read: true })));
    setNotifications(prev=> prev.map(n=> ({...n, read:true})));
  };
  const clearAll = async ()=>{
    await Promise.all(notifications.map(n=> deleteDoc(doc(db,'notifications',n.id))));
    setNotifications([]);
  };

  return (
    <div className="header">
      <div className="container">
        <div className="flex items-center justify-between">
          <div className="hstack">
            <div className="title" onClick={()=>go('/')} style={{cursor:'pointer'}}>工程師資訊分享平台</div>
            <nav className="nav">
              <Button variant={pathname==='/' ? 'primary' : 'ghost'} onClick={()=>go('/')}>文章列表</Button>
              <Button variant={pathname==='/create' ? 'primary' : 'ghost'} onClick={()=>go('/create')} disabled={!user || !profile}>發表文章</Button>
              <Button variant={pathname==='/my-posts' ? 'primary' : 'ghost'} onClick={()=>go('/my-posts')} disabled={!user}>我的文章</Button>
            </nav>
          </div>
          <div className="hstack">
            <div style={{position:'relative'}}>
              <Button variant="outline" onClick={()=>setNotiOpen(v=>!v)}>🔔</Button>
              {unread>0 && <span className="badge-num">{unread}</span>}
              {notiOpen && (
                <div style={{position:'absolute', right:0, marginTop:8, width:320}} className="card">
                  <div className="flex items-center justify-between">
                    <div className="subtitle">通知</div>
                    <div className="hstack">
                      <a className="link small" onClick={clearAll}>清除全部</a>
                      <a className="small" onClick={markAllRead}>標示已讀</a>
                    </div>
                  </div>
                  <div className="hr" />
                  {notifications.length===0 && <div className="small">沒有新通知</div>}
                  {notifications.map(n=>(
                    <div key={n.id} className="hstack" style={{alignItems:'flex-start',cursor:'pointer'}} onClick={()=>{ router.push('/posts/'+n.postId); setNotiOpen(false); }}>
                      {!n.read && <span className="red-dot" />}
                      <div>
                        <div style={{fontSize:14}}>{n.text}</div>
                        <div className="small">前往文章 →</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            {!user ? (
              <Button onClick={login}>使用 Google 登入</Button>
            ) : (
              <>
                <Button variant="outline" onClick={()=>router.push('/profile')}>建立個人資料</Button>
                <Button variant="danger" onClick={logout}>登出</Button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
