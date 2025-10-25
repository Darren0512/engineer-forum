
import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

admin.initializeApp();
const db = admin.firestore();

// Increment commentsCount and send notifications on new comment
export const onCommentCreate = functions.firestore
  .document('posts/{postId}/comments/{commentId}')
  .onCreate(async (snap, ctx) => {
    const postId = ctx.params.postId as string;
    const comment = snap.data() || {};
    const postRef = db.collection('posts').doc(postId);

    await db.runTransaction(async (tx) => {
      const post = await tx.get(postRef);
      if (!post.exists) return;
      tx.update(postRef, { commentsCount: admin.firestore.FieldValue.increment(1) });
    });

    try {
      const postDoc = await postRef.get();
      if (postDoc.exists) {
        const postAuthor = postDoc.get('authorUid');
        if (postAuthor && postAuthor !== comment.uid) {
          await db.collection('users').doc(postAuthor).collection('notifications').add({
            uid: postAuthor,
            postId,
            type: 'comment',
            text: `你的文章收到新留言`,
            createdAt: Date.now(),
            read: false,
          });
        }
      }
      const parentId = comment.parentId;
      if (parentId) {
        const parentSnap = await db.collection('posts').doc(postId).collection('comments').doc(parentId).get();
        const parentUid = parentSnap.get('uid');
        if (parentUid && parentUid !== comment.uid) {
          await db.collection('users').doc(parentUid).collection('notifications').add({
            uid: parentUid,
            postId,
            type: 'reply',
            text: `你的留言收到回覆`,
            createdAt: Date.now(),
            read: false,
          });
        }
      }
    } catch (e) {
      console.error('notify error', e);
    }
  });

// Increment likesCount on like create/delete
export const onLikeCreate = functions.firestore
  .document('posts/{postId}/likes/{uid}')
  .onCreate(async (snap, ctx) => {
    const postId = ctx.params.postId as string;
    const postRef = db.collection('posts').doc(postId);
    await postRef.update({ likesCount: admin.firestore.FieldValue.increment(1) });
  });

export const onLikeDelete = functions.firestore
  .document('posts/{postId}/likes/{uid}')
  .onDelete(async (snap, ctx) => {
    const postId = ctx.params.postId as string;
    const postRef = db.collection('posts').doc(postId);
    await postRef.update({ likesCount: admin.firestore.FieldValue.increment(-1) });
  });
