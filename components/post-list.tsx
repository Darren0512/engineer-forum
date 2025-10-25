
'use client';
import React, { useEffect, useMemo, useState } from 'react';
import { Card, Button, Input, Select } from '@/components/ui';
import { collection, getDocs, limit, orderBy, query } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Post } from '@/lib/types';
import Link from 'next/link';

const INDUSTRY_OPTIONS = ["IC 設計","晶圓代工","半導體設備","筆電/系統","模組廠","封測","電子代工(OEM/ODM)","面板","記憶體","通訊網通","伺服器/資料中心","雲端/SaaS","AI/ML","資安","電商","遊戲","軟體接案/SI","其他"] as const;

const fmtAuthor = (a:any)=> {
  if (!a) return '作者資訊缺失';
  const pos = a.position ? `${a.position} / ` : '';
  return `${a.nick}（${pos}${a.industry} / ${a.y}年${a.m}月 / ${a.salary10k}萬/年）`;
};

export default function PostList() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [industry, setIndustry] = useState<string>('all');
  const [keyword, setKeyword] = useState('');

  useEffect(()=>{
    (async ()=>{
      const q = query(collection(db, 'posts'), orderBy('createdAt','desc'), limit(50));
      const snaps = await getDocs(q);
      const list: Post[] = [];
      snaps.forEach(s=> list.push({ id: s.id, ...(s.data() as any) }));
      setPosts(list);
    })();
  }, []);

  const filtered = posts
    .filter(p => !p.deleted)
    .filter(p => (industry==='all' || p.industry===industry) && (keyword==='' || p.title.includes(keyword) || p.content.includes(keyword)) );

  const popular = useMemo(()=>{
    const since = Date.now() - 24*60*60*1000;
    return posts
      .filter(p => !p.deleted)
      .filter(p => p.createdAt >= since)
      .map(p => ({...p, score: (p.commentsCount||0) + (p.likesCount||0)}))
      .sort((a,b)=> b.score - a.score)
      .slice(0,5);
  }, [posts]);

  return (
    <div className="grid">
      <div className="sidebar">
        <Card>
          <div className="title" style={{fontSize:16}}>🔥 熱門文章（24 小時）</div>
          {popular.length===0 && <div className="small">暫無</div>}
          {popular.map((p,i)=>(
            <div key={p.id} className="vstack" style={{marginTop:8}} title={fmtAuthor(p.authorSnapshot)}>
              <Link href={`/posts/${p.id}`} className="link">{i+1}. {p.title}</Link>
              <div className="small">互動：{(p.commentsCount||0)+(p.likesCount||0)} · 👍 {p.likesCount||0}</div>
            </div>
          ))}
        </Card>
      </div>
      <div>
        <Card>
          <div className="hstack">
            <Input placeholder="關鍵字" value={keyword} onChange={e=>setKeyword(e.target.value)} />
            <Select value={industry} onChange={e=>setIndustry(e.target.value)}>
              <option value="all">全部產業</option>
              {INDUSTRY_OPTIONS.map(it => <option value={it} key={it}>{it}</option>)}
            </Select>
            <Button>🔍</Button>
          </div>
        </Card>
        {filtered.length===0 && (
          <Card><div className="small">目前沒有文章，請點「發表文章」開始分享。</div></Card>
        )}
        {filtered.map(p=>(
          <Card key={p.id}>
            <div className="vstack" title={fmtAuthor(p.authorSnapshot)}>
              <div className="hstack" style={{justifyContent:'space-between', alignItems:'baseline'}}>
                <Link href={`/posts/${p.id}`} className="title">{p.title}</Link>
                <div className="small" title="按讚數">👍 {p.likesCount||0}</div>
              </div>
              <div className="small">作者：{fmtAuthor(p.authorSnapshot)}</div>
              <div>{p.content.slice(0,200)}{p.content.length>200?'...':''}</div>
              <div className="hstack">
                <Link href={`/posts/${p.id}`} className="link">查看全文（{p.commentsCount||0}）</Link>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
