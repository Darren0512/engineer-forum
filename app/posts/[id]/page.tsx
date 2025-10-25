
'use client';
import React, { useEffect, useMemo, useState } from 'react';
import { useParams } from 'next/navigation';
import { doc, onSnapshot, collection, getCountFromServer } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Card } from '@/components/ui';
import LikeButton from '@/components/like-button';
import Comments from '@/components/comments';
import Header from '@/components/header';

type PostDoc = {
  id: string;
  title: string;
  content: string;
  industry: string;
  authorUid: string;
  authorSnapshot?: {
    nick?: string;
    position?: string;
    industry?: string;
    y?: number;
    m?: number;
    salary10k?: number;
  };
  likesCount?: number;
  commentsCount?: number;
  createdAt: number;
};

export default function Page() {
  const params = useParams<{ id: string }>();
  const postId = params?.id as string;
  const [post, setPost] = useState<PostDoc | null>(null);
  const [fallbackCounts, setFallbackCounts] = useState<{ likes: number; comments: number }>({ likes: 0, comments: 0 });

  useEffect(() => {
    if (!postId) return;
    const ref = doc(db, 'posts', postId);
    const unsub = onSnapshot(ref, (s) => {
      if (!s.exists()) { setPost(null); return; }
      setPost({ id: s.id, ...(s.data() as any) });
    });
    return () => unsub();
  }, [postId]);

  useEffect(() => {
    (async () => {
      if (!postId) return;
      try {
        const likesCol = collection(db, 'posts', postId, 'likes');
        const commentsCol = collection(db, 'posts', postId, 'comments');
        const [lc, cc] = await Promise.all([getCountFromServer(likesCol), getCountFromServer(commentsCol)]);
        setFallbackCounts({ likes: lc.data().count, comments: cc.data().count });
      } catch {}
    })();
  }, [postId]);

  const authorLine = useMemo(() => {
    const a = (post as any)?.authorSnapshot || {};
    const pos = a.position ? `${a.position} / ` : '';
    return `${a.nick ?? '匿名'}（${pos}${a.industry ?? '-'} / ${a.y ?? 0}年${a.m ?? 0}月 / ${a.salary10k ?? 0}萬/年）`;
  }, [post?.authorSnapshot]);

  if (!post) {
    return (
      <>
        <Header />
        <div className="container">
          <Card>文章不存在或已被刪除</Card>
        </div>
      </>
    );
  }

  const likes = typeof post.likesCount === 'number' ? post.likesCount : fallbackCounts.likes;
  const comments = typeof post.commentsCount === 'number' ? post.commentsCount : fallbackCounts.comments;

  return (
    <>
      <Header />
      <div className="container">
        <Card>
          <div className="hstack" style={{ justifyContent: 'space-between' }}>
            <div className="title">{post.title}</div>
            <div className="small" title="按讚數">👍 {likes}</div>
          </div>
          <div className="small text-gray-600">
            作者：{authorLine} · 發佈於 {new Date(post.createdAt).toLocaleString()}
          </div>
          <div className="hr" />
          <div style={{ whiteSpace: 'pre-wrap' }}>{post.content}</div>
          <div className="hr" />
          <div className="hstack" style={{ gap: 8 }}>
            <LikeButton postId={postId} />
            <span className="small text-gray-600">留言數：{comments}</span>
          </div>
        </Card>

        <div style={{ height: 12 }} />
        <Comments postId={postId} />
      </div>
    </>
  );
}
