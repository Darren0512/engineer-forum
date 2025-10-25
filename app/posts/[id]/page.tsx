
'use client';
import React, { useEffect, useMemo, useState } from 'react';
import Header from '@/components/header';
import { AuthProvider, useAuth } from '@/components/auth-context';
import { Button, Card, Input, Textarea } from '@/components/ui';
import { db } from '@/lib/firebase';
import { addDoc, collection, deleteDoc, doc, getDoc, onSnapshot, orderBy, query, updateDoc } from 'firebase/firestore';
import { useParams, useRouter } from 'next/navigation';

type Comment = {
  id: string;
  uid: string;
  content: string;
  createdAt: number;
  parentId?: string | null;
  authorSnapshot?: any;
};

function PostPageInner(){
  const { user, profile } = useAuth();
  const params = useParams();
  const router = useRouter();
  const postId = String(params?.id || '');

  const [post, setPost] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [likeLock, setLikeLock] = useState(false);
  const [deleteLock, setDeleteLock] = useState(false);

  // comments
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentText, setCommentText] = useState('');
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [isCommenting, setIsCommenting] = useState(false);
  const [error, setError] = useState('');

  useEffect(()=>{
    (async()=>{
      const snap = await getDoc(doc(db,'posts',postId));
      if (!snap.exists()) { setLoading(false); return; }
      setPost({ id:snap.id, ...snap.data() });
      setLoading(false);
    })();
    const q = query(collection(db,'posts',postId,'comments'), orderBy('createdAt','asc'));
    const unsub = onSnapshot(q, s=>{
      const list: Comment[] = [];
      s.forEach(d => list.push({ id:d.id, ...(d.data() as any) }));
      setComments(list);
    });
    return ()=> unsub();
  }, [postId]);

  const like = async()=>{
    if (!user) return;
    if (likeLock) return;
    setLikeLock(true);
    try{
      const ref = doc(db,'posts',postId);
      const curr = (await getDoc(ref)).data();
      if (!curr) return;
      const n = Number(curr.likesCount||0) + 1;
      await updateDoc(ref, { likesCount: n });
      setPost({ ...post, likesCount: n });
    } finally {
      setTimeout(()=> setLikeLock(false), 600); // debounce 600ms
    }
  };

  const deleteMyPost = async()=>{
    if (!user || user.uid !== post?.authorUid) return;
    if (deleteLock) return;
    if (!confirm('確定刪除此文章？此動作無法復原')) return;
    setDeleteLock(true);
    try{
      await deleteDoc(doc(db,'posts',postId));
      router.push('/');
    } finally {
      setDeleteLock(false);
    }
  };

  const sendComment = async()=>{
    if (!user || !profile) { setError('請先登入並建立個人資料'); return; }
    if (isCommenting) return;
    if (!commentText.trim()) return;
    setIsCommenting(true);
    setError('');
    try{
      const payload = {
        uid: user.uid,
        content: commentText.trim(),
        parentId: replyTo || null,
        authorSnapshot: { 
          nick: profile.nick, 
          position: (profile as any).position, 
          industry: profile.industry, 
          y: profile.y, 
          m: profile.m, 
          salary10k: profile.salary10k 
        },
        createdAt: Date.now()
      };
      await addDoc(collection(db,'posts',postId,'comments'), payload);
      setCommentText('');
      setReplyTo(null);
    }catch(e:any){
      console.error(e);
      setError(e?.message || '送出留言失敗');
    }finally{
      setIsCommenting(false);
    }
  };

  if (loading) return <div className="container">讀取中…</div>;
  if (!post) return <div className="container"><Card>文章不存在或已被刪除</Card></div>;

  // 產生巢狀留言樹
  const rootComments = comments.filter(c => !c.parentId);
  const repliesByParent = new Map<string, Comment[]>();
  comments.forEach(c=>{
    if (c.parentId) {
      if (!repliesByParent.has(c.parentId)) repliesByParent.set(c.parentId, []);
      repliesByParent.get(c.parentId)!.push(c);
    }
  });

  const fmtAuthor = (a:any)=> {
    if (!a) return '作者資訊缺失';
    const pos = a.position ? `${a.position} / ` : '';
    return `${a.nick}（${pos}${a.industry} / ${a.y}年${a.m}月 / ${a.salary10k}萬/年）`;
  };

  return (
    <div className="container">
      <Card>
        <div className="title">{post.title}</div>
        <div className="small">作者：{fmtAuthor(post?.authorSnapshot)}</div>
        <div style={{whiteSpace:'pre-wrap'}}>{post.content}</div>

        <div className="hstack" style={{marginTop:8}}>
          <Button onClick={like} disabled={likeLock}>{likeLock ? '按讚中…' : `👍 讚 (${post.likesCount||0})`}</Button>
          {user?.uid === post.authorUid && (
            <>
              <Button variant="ghost" onClick={async ()=>{
                const t = prompt('編輯標題', post.title);
                if (t!==null) {
                  await updateDoc(doc(db,'posts',postId), { title:t, editedAt: Date.now() });
                  setPost((p:any)=> ({...p, title:t, editedAt: Date.now()}));
                }
              }}>編輯標題</Button>
              <Button variant="danger" onClick={deleteMyPost} disabled={deleteLock}>{deleteLock?'刪除中…':'刪除文章'}</Button>
            </>
          )}
        </div>
      </Card>

      <Card>
        <div className="subtitle">留言（{comments.length}）</div>
        {rootComments.length===0 && <div className="small">還沒有人留言，搶頭香吧！</div>}
        {rootComments.map((c, idx)=>(
          <div key={c.id} className="vstack" style={{borderTop:'1px solid #eee', paddingTop:8, marginTop:8}}>
            <div className="small">#{idx+1} · {fmtAuthor(c.authorSnapshot)}</div>
            <div>{c.content}</div>
            <div className="hstack">
              <Button variant="ghost" onClick={()=> setReplyTo(c.id)}>回覆</Button>
              {(user?.uid === c.uid) && (
                <Button variant="danger" onClick={async ()=>{
                  if (!confirm('刪除此留言？')) return;
                  // 先刪子留言
                  const children = (repliesByParent.get(c.id) || []);
                  for (const ch of children) {
                    await deleteDoc(doc(db,'posts',postId,'comments',ch.id));
                  }
                  await deleteDoc(doc(db,'posts',postId,'comments',c.id));
                }}>刪除</Button>
              )}
            </div>
            {/* 子留言 */}
            {(repliesByParent.get(c.id)||[]).map((r, ridx)=>(
              <div key={r.id} className="vstack" style={{marginLeft:16, marginTop:6, paddingLeft:8, borderLeft:'2px solid #f0f0f0'}}>
                <div className="small">↳ {fmtAuthor(r.authorSnapshot)}</div>
                <div>{r.content}</div>
                {(user?.uid === r.uid) && (
                  <div className="hstack">
                    <Button variant="danger" onClick={async ()=>{
                      if (!confirm('刪除此回覆？')) return;
                      await deleteDoc(doc(db,'posts',postId,'comments',r.id));
                    }}>刪除</Button>
                  </div>
                )}
              </div>
            ))}
          </div>
        ))}

        <div className="hr" />
        {/* 發表留言區 */}
        <div className="vstack">
          {replyTo && <div className="small">回覆目標：#{rootComments.findIndex(rc => rc.id===replyTo)+1} <Button variant="ghost" onClick={()=>setReplyTo(null)}>取消</Button></div>}
          <Textarea placeholder="寫點什麼…" value={commentText} onChange={e=>setCommentText(e.target.value)} disabled={isCommenting} />
          <div className="hstack" style={{justifyContent:'flex-end'}}>
            <Button className="primary" onClick={sendComment} disabled={isCommenting || !commentText.trim()}>
              {isCommenting ? '送出中…' : '送出留言'}
            </Button>
          </div>
          {error && <div className="small" style={{color:'#b91c1c'}}>{error}</div>}
        </div>
      </Card>
    </div>
  );
}

export default function Page(){
  return (
    <AuthProvider>
      <Header />
      <PostPageInner />
    </AuthProvider>
  );
}
