'use client';
import React, { useEffect, useState } from 'react';
import Header from '@/components/header';
import { useAuth } from '@/components/auth-context';
import { Card, Button, Input, Select } from '@/components/ui';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';

const INDUSTRY_OPTIONS = ["IC 設計","晶圓代工","半導體設備","筆電/系統","模組廠","封測","電子代工(OEM/ODM)","面板","記憶體","通訊網通","伺服器/資料中心","雲端/SaaS","AI/ML","資安","電商","遊戲","軟體接案/SI","其他"] as const;

export default function Page() {
  const { user, profile, refreshProfile } = useAuth();
  const [nick, setNick] = useState('');
  const [industry, setIndustry] = useState<string>(INDUSTRY_OPTIONS[0]);
  const [position, setPosition] = useState('');
  const [y, setY] = useState<number>(0);
  const [m, setM] = useState<number>(0);
  const [salaryInput, setSalaryInput] = useState<number>(0); // 以萬/年為單位
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!profile) return;
    setNick(profile.nick || '');
    setIndustry(profile.industry || INDUSTRY_OPTIONS[0]);
    setPosition((profile as any)?.position || '');
    setY(profile.y ?? 0);
    setM(profile.m ?? 0);
    setSalaryInput(profile.salary10k ?? 0);
  }, [profile]);

  if (!user) {
    return (
      <>
        <Header />
        <div className="container">
          <Card>請先登入後再編輯個人資料</Card>
        </div>
      </>
    );
  }

  const canSave =
    nick.trim().length > 0 &&
    (y ?? 0) + (m ?? 0) > 0 &&
    (salaryInput ?? 0) > 12 &&
    position.trim().length > 0 &&
    industry.length > 0;

  const save = async () => {
    if (!user || !canSave || busy) return;
    setBusy(true);
    try {
      await setDoc(doc(db, 'profiles', user.uid), {
        uid: user.uid,
        nick: nick.trim(),
        position: position.trim(),
        industry,
        y: Number(y) || 0,
        m: Number(m) || 0,
        salary10k: Number(salaryInput) || 0,
        updatedAt: Date.now(),
        updatedAtServer: serverTimestamp(),
      }, { merge: true });
      await refreshProfile();
      alert('已儲存');
    } catch (e: any) {
      console.error(e);
      alert('儲存失敗：' + (e?.message || '請稍後再試'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <Header />
      <div className="container">
        <Card>
          <div className="title">建立/編輯個人資料</div>
          <div className="grid" style={{ gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <label className="vstack">
              <span className="small">匿名稱號（必填）</span>
              <Input value={nick} onChange={e=>setNick(e.target.value)} />
            </label>
            <label className="vstack">
              <span className="small">職位（必填，例如 PM / FW / EE / QA...）</span>
              <Input value={position} onChange={e=>setPosition(e.target.value)} placeholder="自由填寫中英文" />
            </label>
            <label className="vstack">
              <span className="small">產業（必填）</span>
              <Select value={industry} onChange={e=>setIndustry(e.target.value)}>
                {INDUSTRY_OPTIONS.map(x => <option key={x} value={x}>{x}</option>)}
              </Select>
            </label>
            <div className="vstack">
              <span className="small">年資（必填）</span>
              <div className="hstack">
                <Input type="number" min={0} max={50} value={y} onChange={e=>setY(Number(e.target.value)||0)} placeholder="年" />
                <Input type="number" min={0} max={11} value={m} onChange={e=>setM(Number(e.target.value)||0)} placeholder="月" />
              </div>
            </div>
            <label className="vstack">
		<span className="small">年薪（萬/年，&gt; 12）或月薪自動換算</span>
              <Input type="number" min={0} value={salaryInput} onChange={e=>setSalaryInput(Number(e.target.value)||0)} />
              <div className="small text-gray-600">提示：若輸入月薪，請自行換算成年薪（萬/年）。</div>
            </label>
          </div>

          <div className="hstack" style={{ justifyContent: 'flex-end', marginTop: 12 }}>
            <Button onClick={save} disabled={!canSave || busy}>{busy ? '儲存中…' : '儲存'}</Button>
          </div>
        </Card>
      </div>
    </>
  );
}
