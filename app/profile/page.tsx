
'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Header from '@/components/header';
import { AuthProvider, useAuth } from '@/components/auth-context';
import { Button, Card, Input } from '@/components/ui';
import { db } from '@/lib/firebase';
import { doc, setDoc } from 'firebase/firestore';

type UserProfile = {
  uid: string;
  nick: string;
  industry: string;
  position?: string;
  y: number;
  m: number;
  salary10k: number; // 年薪（萬）
  updatedAt?: number;
};

const INDUSTRY_OPTIONS = [
  'IC 設計','晶圓代工','半導體設備','筆電/系統','模組廠','封測',
  '電子代工(OEM/ODM)','面板','記憶體','通訊網通','伺服器/資料中心',
  '雲端/SaaS','AI/ML','資安','電商','遊戲','軟體接案/SI','其他'
] as const;

function CooldownBar({ updatedAt }: { updatedAt?: number }) {
  const THREE_DAYS = 3 * 24 * 60 * 60 * 1000;
  const now = Date.now();
  const nextEditable = (updatedAt || 0) + THREE_DAYS;
  const remain = Math.max(0, nextEditable - now);
  const fmt = (ms: number) => {
    if (ms <= 0) return '現在可編輯';
    const d = Math.floor(ms / (24 * 60 * 60 * 1000));
    const h = Math.floor((ms % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));
    const m = Math.floor((ms % (60 * 60 * 1000)) / (60 * 1000));
    return `${d}天 ${h}小時 ${m}分後可編輯`;
  };
  return (
    <div className="notice" style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
      <div>
        最後更新時間：<strong>{updatedAt ? new Date(updatedAt).toLocaleString() : '尚未建立'}</strong>
        <span className="small" style={{marginLeft:8}}>（下一次可編輯時間：{updatedAt ? new Date(nextEditable).toLocaleString() : '建立後 3 天' }）</span>
      </div>
      <div className="pill blue">{fmt(remain)}</div>
    </div>
  );
}

function ProfileInner(){
  const { user, profile, refreshProfile } = useAuth();
  const [nick, setNick] = useState(profile?.nick || '');
  const [industry, setIndustry] = useState<string>(profile?.industry || INDUSTRY_OPTIONS[0]);
  // 改為「自由輸入職位」
  const [position, setPosition] = useState<string>((profile as any)?.position || '');
  const [y, setY] = useState<number>(profile?.y || 0);
  const [m, setM] = useState<number>(profile?.m || 0);

  // 薪資輸入：兩種模式，最後轉成年薪（萬）儲存
  const [salaryType, setSalaryType] = useState<'year'|'month'>('year');
  const [salaryInput, setSalaryInput] = useState<number>(profile?.salary10k || 0); // year: 萬/年；month: 元/月
  const [isSaving, setIsSaving] = useState(false);
  const [hint, setHint] = useState('');
  const [errors, setErrors] = useState<string[]>([]);

  useEffect(()=>{
    if (profile){
      setNick(profile.nick);
      setIndustry(profile.industry || INDUSTRY_OPTIONS[0]);
      setPosition((profile as any)?.position || '');
      setY(profile.y); setM(profile.m);
      setSalaryInput(profile.salary10k);
    }
  }, [profile]);

  // 換算：月薪（元/月）→ 年薪（萬）
  const annualSalary10k = useMemo(()=> {
    if (salaryType === 'year') {
      return Math.max(0, Number(salaryInput) || 0);
    } else {
      const monthly = Math.max(0, Number(salaryInput) || 0);
      return Math.round(monthly * 12 / 10000);
    }
  }, [salaryInput, salaryType]);

  const tenureMonths = useMemo(()=> y*12 + m, [y,m]);
  const THREE_DAYS = 3 * 24 * 60 * 60 * 1000;
  const remain = useMemo(()=>{
    if (!profile?.updatedAt) return 0;
    return Math.max(0, (profile.updatedAt + THREE_DAYS) - Date.now());
  }, [profile?.updatedAt]);
  const canEdit = remain === 0 || !profile?.updatedAt;

  if (!user) return <div className="container"><Card>請先登入</Card></div>;

  // 職位欄位：允許中英文、數字、一般符號（/ & - . 空白），僅於前端輕量驗證；後端仍以非空為準
  const positionOk = position.trim().length > 0 && position.trim().length <= 50;

  const validate = (): boolean => {
    const es: string[] = [];
    if (!nick.trim()) es.push('請填寫匿名稱號');
    if (!positionOk) es.push('請填寫職位（支援中英文，1–50 字）');
    if (tenureMonths <= 0) es.push('請填寫年資（年/月）不可為 0');
    // 只要任一有填且換算年薪 > 12 萬即可
    if (annualSalary10k <= 12) es.push('薪資需大於 12 萬/年（可用年薪或月薪換算）');
    setErrors(es);
    return es.length===0;
  };

  const save = async ()=>{
    if (isSaving) return;
    setIsSaving(true);
    setErrors([]);
    setHint('');
    try{
      if (!canEdit && profile?.updatedAt) { setHint('距離上次更新未滿 3 天，暫時不可修改'); return; }
      if (!validate()) return;
      const data: UserProfile & { position: string } = {
        uid: user.uid,
        nick, industry, position: position.trim(), y, m,
        salary10k: annualSalary10k,
        updatedAt: Date.now(),
      };
      await setDoc(doc(db,'profiles', user.uid), data, { merge: true });
      setHint('已儲存');
      await refreshProfile();
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="container">
      <CooldownBar updatedAt={profile?.updatedAt} />
      <Card>
        <div className="title">建立 / 編輯個人資料</div>

        <div className="vstack">
          <div>
            <label className="small">匿名稱號</label>
            <Input value={nick} onChange={e=>setNick(e.target.value)} placeholder="例：後端打螺絲工程師" disabled={!canEdit || isSaving} />
          </div>

          <div>
            <label className="small">產業類別</label>
            <select className="select" value={industry} onChange={e=>setIndustry(e.target.value)} disabled={!canEdit || isSaving}>
              {INDUSTRY_OPTIONS.map(it => <option value={it} key={it}>{it}</option>)}
            </select>
          </div>

          <div>
            <label className="small">職位（中英文自由輸入）</label>
            <Input
              value={position}
              onChange={e=>setPosition(e.target.value)}
              placeholder="例：PM / 前端工程師 / Firmware / QA / EE"
              disabled={!canEdit || isSaving}
              maxLength={50}
            />
            <div className="small">支援中英文與常見符號（/、&、-、.、空白）；1–50 字</div>
          </div>

          <div>
            <label className="small">年資（年／月）</label>
            <div className="hstack">
              <Input type="number" placeholder="年" value={y} onChange={e=>setY(Math.max(0, Math.min(50, parseInt(e.target.value||'0'))))} disabled={!canEdit || isSaving} />
              <Input type="number" placeholder="月" value={m} onChange={e=>setM(Math.max(0, Math.min(11, parseInt(e.target.value||'0'))))} disabled={!canEdit || isSaving} />
            </div>
            <div className="small">系統將以 年×12 + 月 計算留言資格</div>
          </div>

          <div>
            <label className="small">薪資</label>
            <div className="hstack">
              <Button variant={salaryType==='year'?'primary':'ghost'} onClick={()=>{ if(canEdit && !isSaving){ setSalaryType('year'); setSalaryInput(profile?.salary10k || 0); } }} disabled={!canEdit || isSaving}>以年薪填寫（萬/年）</Button>
              <Button variant={salaryType==='month'?'primary':'ghost'} onClick={()=>{ if(canEdit && !isSaving){ setSalaryType('month'); setSalaryInput(0); } }} disabled={!canEdit || isSaving}>以月薪填寫（元/月）</Button>
            </div>

            {salaryType==='year' ? (
              <div className="hstack">
                <Input type="number" min={0} step="1" placeholder="數值（萬/年）" value={Number.isNaN(salaryInput)?0:salaryInput} onChange={e=>setSalaryInput(parseInt(e.target.value||'0'))} disabled={!canEdit || isSaving} />
              </div>
            ) : (
              <div className="hstack">
                <Input type="number" min={0} step="1" placeholder="數值（元/月）" value={Number.isNaN(salaryInput)?0:salaryInput} onChange={e=>setSalaryInput(parseInt(e.target.value||'0'))} disabled={!canEdit || isSaving} />
              </div>
            )}

            <div className="small">以年薪換算：<strong>{isNaN(annualSalary10k)? 0 : annualSalary10k}</strong> 萬 / 年（需 &gt; 12 才可儲存）</div>
            {salaryType==='month' && <div className="small">計算：年薪（萬） = 月薪（元） × 12 ÷ 10000</div>}
          </div>
        </div>

        {errors.length>0 && (
          <Card><div className="small" style={{color:'#b91c1c'}}>{errors.join('、')}</div></Card>
        )}

        <div className="hstack" style={{justifyContent:'flex-end'}}>
          <Button className="primary" onClick={save} disabled={!canEdit || isSaving}>儲存資料</Button>
        </div>
        {hint && <div className="small">{hint}</div>}
      </Card>
    </div>
  );
}

export default function Page(){
  return (
    <AuthProvider>
      <Header />
      <ProfileInner />
    </AuthProvider>
  );
}
