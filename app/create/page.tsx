
'use client';
import React, { useEffect, useState } from 'react';
import Header from '@/components/header';
import { AuthProvider, useAuth } from '@/components/auth-context';
import { Button, Card, Input, Select, Textarea } from '@/components/ui';
import { addDoc, collection } from 'firebase/firestore';
import { db } from '@/lib/firebase';

const INDUSTRY_OPTIONS = ["IC 設計","晶圓代工","半導體設備","筆電/系統","模組廠","封測","電子代工(OEM/ODM)","面板","記憶體","通訊網通","伺服器/資料中心","雲端/SaaS","AI/ML","資安","電商","遊戲","軟體接案/SI","其他"] as const;

function CreateInner(){
  const { user, profile } = useAuth();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [industry, setIndustry] = useState<string>(INDUSTRY_OPTIONS[0]);

  const [tenureMode, setTenureMode] = useState<'none'|'range'>('none');
  const [minY, setMinY] = useState('0');
  const [minM, setMinM] = useState('0');
  const [maxY, setMaxY] = useState('40');
  const [maxM, setMaxM] = useState('11');

  const [salMode, setSalMode] = useState<'none'|'range'>('none');
  const [minS, setMinS] = useState('0');
  const [maxS, setMaxS] = useState('500');

  const [showConsent, setShowConsent] = useState(false);
  const [isPosting, setIsPosting] = useState(false);
  const [error, setError] = useState<string>('');

  const titleOk = title.trim().length > 4;
  const contentOk = content.trim().length > 4;

  const tMin = Number(minY)*12 + Number(minM);
  const tMax = Number(maxY)*12 + Number(maxM);
  const tenureErr = tenureMode==='range' && (
    Number(minY) < 0 || Number(minM) < 0 || Number(maxY) < 0 || Number(maxM) < 0 ||
    Number(minM) > 11 || Number(maxM) > 11 ||
    tMin > tMax
  ) ? '請確認年資範圍：月需為 0–11，且下限不得大於上限' : '';

  const salaryErr = salMode==='range' && (
    Number(minS) < 0 || Number(maxS) < 0 || Number(minS) > Number(maxS)
  ) ? '請確認年薪範圍：不得為負數，且下限不得大於上限' : '';

  useEffect(()=>{
    const last = Number(localStorage.getItem('lastPostTs') || '0');
    if (Date.now() - last < 2500) {
      setIsPosting(true);
      const h = setTimeout(()=> setIsPosting(false), 2500 - (Date.now() - last));
      return ()=> clearTimeout(h);
    }
  }, []);

  if (!user || !profile) {
    return <div className="container"><Card>請先登入並建立個人資料</Card></div>;
  }

  const canSubmit = titleOk && contentOk && !tenureErr && !salaryErr && !isPosting;

  const submit = async ()=>{
    if (isPosting) return;
    setIsPosting(true);
    setError('');
    try{
      const now = Date.now();
      const last = Number(localStorage.getItem('lastPostTs') || '0');
      if (now - last < 2500) return; // cooldown
      localStorage.setItem('lastPostTs', String(now));

      const rules = {
        tenureMin: { y:Number(minY), m:Number(minM), noLimit: tenureMode==='none' },
        tenureMax: { y:Number(maxY), m:Number(maxM), noLimit: tenureMode==='none' },
        salaryMin: { v:Number(minS), noLimit: salMode==='none' },
        salaryMax: { v:Number(maxS), noLimit: salMode==='none' },
      };
      const docRef = await addDoc(collection(db, 'posts'), {
        title, content, industry,
        authorUid: user.uid,
        authorSnapshot: { 
          nick: profile.nick, 
          position: (profile as any).position,
          industry: profile.industry, 
          y: profile.y, 
          m: profile.m, 
          salary10k: profile.salary10k 
        },
        rules,
        likesCount: 0,
        commentsCount: 0,
        createdAt: Date.now()
      });
      window.location.href = `/posts/${docRef.id}`;
    }catch(e:any){
      console.error(e);
      setError(e?.message || '發文失敗，請稍後再試');
      setIsPosting(false);
    }
  };

  return (
    <div className="container">
      <Card>
        <div className="title">發表文章</div>
        <Input placeholder="標題（至少 5 個字）" value={title} onChange={e=>setTitle(e.target.value)} disabled={isPosting} />
        {!titleOk && <div className="small" style={{color:'#b91c1c'}}>標題至少 5 個字</div>}
        <Textarea placeholder="內容（至少 5 個字）" value={content} onChange={e=>setContent(e.target.value)} disabled={isPosting} />
        {!contentOk && <div className="small" style={{color:'#b91c1c'}}>內容至少 5 個字</div>}
        <Select value={industry} onChange={e=>setIndustry(e.target.value)} disabled={isPosting}>
          <option value="all">全部產業</option>
          {INDUSTRY_OPTIONS.map(it => <option value={it} key={it}>{it}</option>)}
        </Select>

        <div className="hr" />

        <div className="subtitle">留言者年資</div>
        <div className="hstack">
          <Button variant={tenureMode==='none'?'primary':'ghost'} onClick={()=>setTenureMode('none')} disabled={isPosting}>不限</Button>
          <Button variant={tenureMode==='range'?'primary':'ghost'} onClick={()=>setTenureMode('range')} disabled={isPosting}>範圍</Button>
        </div>
        {tenureMode==='range' && (
          <div className="card" style={{padding:12, opacity: isPosting? 0.7: 1}}>
            <div className="small" style={{marginBottom:8}}>設定留言者年資（下限 / 上限）</div>
            <div className="hstack">
              <div className="vstack" style={{flex:1}}>
                <div className="small">下限</div>
                <div className="hstack">
                  <Input type="number" placeholder="年" value={minY} onChange={e=>setMinY(e.target.value)} disabled={isPosting} />
                  <Input type="number" placeholder="月" value={minM} onChange={e=>setMinM(e.target.value)} disabled={isPosting} />
                </div>
              </div>
              <div className="vstack" style={{flex:1}}>
                <div className="small">上限</div>
                <div className="hstack">
                  <Input type="number" placeholder="年" value={maxY} onChange={e=>setMaxY(e.target.value)} disabled={isPosting} />
                  <Input type="number" placeholder="月" value={maxM} onChange={e=>setMaxM(e.target.value)} disabled={isPosting} />
                </div>
              </div>
            </div>
            {tenureErr && <div className="small" style={{color:'#b91c1c'}}>{tenureErr}</div>}
          </div>
        )}

        <div className="subtitle" style={{marginTop:8}}>留言者年薪（萬/年）</div>
        <div className="hstack">
          <Button variant={salMode==='none'?'primary':'ghost'} onClick={()=>setSalMode('none')} disabled={isPosting}>不限</Button>
          <Button variant={salMode==='range'?'primary':'ghost'} onClick={()=>setSalMode('range')} disabled={isPosting}>範圍</Button>
        </div>
        {salMode==='range' && (
          <div className="card" style={{padding:12, opacity: isPosting? 0.7: 1}}>
            <div className="small" style={{marginBottom:8}}>設定留言者年薪（下限 / 上限）</div>
            <div className="hstack">
              <div className="vstack" style={{flex:1}}>
                <div className="small">下限（萬）</div>
                <Input type="number" placeholder="最少（萬）" value={minS} onChange={e=>setMinS(e.target.value)} disabled={isPosting} />
              </div>
              <div className="vstack" style={{flex:1}}>
                <div className="small">上限（萬）</div>
                <Input type="number" placeholder="最多（萬）" value={maxS} onChange={e=>setMaxS(e.target.value)} disabled={isPosting} />
              </div>
            </div>
            {salaryErr && <div className="small" style={{color:'#b91c1c'}}>{salaryErr}</div>}
          </div>
        )}

        <div className="notice">提交前將顯示免責聲明；按「同意」後才會送出。</div>
        <div className="hstack">
          <Button className="primary" onClick={()=>setShowConsent(true)} disabled={!canSubmit}>發文</Button>
        </div>

        {showConsent && (
          <Card>
            <div className="subtitle">免責聲明</div>
            <div className="small">本平台內容僅供參考，請勿揭露個資或違法資訊。使用即同意站規。</div>
            <div className="hstack">
              <Button onClick={()=>setShowConsent(false)} disabled={isPosting}>取消</Button>
              <Button className="primary" onClick={submit} disabled={!canSubmit}>
                {isPosting ? '發文中…' : '我了解並同意'}
              </Button>
            </div>
            {error && <div className="small" style={{color:'#b91c1c'}}>{error}</div>}
          </Card>
        )}
      </Card>
    </div>
  );
}

export default function Page(){
  return (
    <AuthProvider>
      <Header />
      <CreateInner />
    </AuthProvider>
  );
}
