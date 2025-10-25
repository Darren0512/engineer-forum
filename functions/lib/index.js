"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.onLikeDelete = exports.onLikeCreate = exports.onCommentCreate = void 0;
const functions = __importStar(require("firebase-functions"));
const admin = __importStar(require("firebase-admin"));
admin.initializeApp();
const db = admin.firestore();
exports.onCommentCreate = functions.firestore
    .document('posts/{postId}/comments/{commentId}')
    .onCreate(async (snap, ctx) => {
    const postId = ctx.params.postId;
    const comment = snap.data() || {};
    const postRef = db.collection('posts').doc(postId);
    await db.runTransaction(async (tx) => {
        const post = await tx.get(postRef);
        if (!post.exists)
            return;
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
    }
    catch (e) {
        console.error('notify error', e);
    }
});
exports.onLikeCreate = functions.firestore
    .document('posts/{postId}/likes/{uid}')
    .onCreate(async (snap, ctx) => {
    const postId = ctx.params.postId;
    const postRef = db.collection('posts').doc(postId);
    await postRef.update({ likesCount: admin.firestore.FieldValue.increment(1) });
});
exports.onLikeDelete = functions.firestore
    .document('posts/{postId}/likes/{uid}')
    .onDelete(async (snap, ctx) => {
    const postId = ctx.params.postId;
    const postRef = db.collection('posts').doc(postId);
    await postRef.update({ likesCount: admin.firestore.FieldValue.increment(-1) });
});
//# sourceMappingURL=index.js.map