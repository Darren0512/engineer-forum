# engineer-forum

一個以 Next.js 建構的工程師匿名論壇（Engineer Forum）。
採用 **Next.js App Router** 與 **Firebase (Auth + Firestore + Storage)**，
提供發文、留言、按讚、通知與個人資料管理等功能。

## 🧱 Tech Stack
- **Framework**: Next.js (App Router) with TypeScript
- **UI**: React, Tailwind CSS
- **Backend as a Service**: Firebase Auth / Firestore / Storage
- **State / Utilities**: 見 `package.json`
- **Build Tooling**: Node >=18, npm / pnpm / yarn

## 📁 專案結構（節錄）
```
engineer-forum-main/
  .env.local
  .env.local.example
  .gitignore
  README.md
  app/
    create/
      page.tsx
    globals.css
    globals.d.ts
    layout.tsx
    my-posts/
      page.tsx
    page.tsx
    posts/
      [id]/
        page.tsx
    profile/
      page.tsx
  components/
    auth-context.tsx
    header.tsx
    post-list.tsx
    ui.tsx
  firestore.rules
  lib/
    firebase.ts
    rules.ts
    types.ts
  next-env.d.ts
  next.config.mjs
  package-lock.json
  package.json
  tsconfig.json
```

## ✨ 功能 Features
- 發文：建立、分類、標籤與防呆驗證
- 個人資料：編輯暱稱、產業類別、薪資欄位（以 1 元為單位）
- 文章詳情：留言、編輯、刪除、按讚、通知檢核
- 我的文章清單：管理自己的發文與刪除狀態
- 首頁：最新/熱門/搜尋、分類瀏覽

## 🔐 Firestore Collections（依程式碼掃描推測）
- `notifications`
- `posts`

## 🚀 快速開始
```bash
# 1) 安裝依賴
npm install

# 2) 設定環境變數（建立 .env.local）
#   需包含 Firebase 專案設定，例如：
#   NEXT_PUBLIC_FIREBASE_API_KEY=...
#   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...
#   NEXT_PUBLIC_FIREBASE_PROJECT_ID=...
#   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=...
#   NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
#   NEXT_PUBLIC_FIREBASE_APP_ID=...

# 3) 本機啟動
npm run dev

# 4) 建置
npm run build
npm run start
```

## 🧪 NPM Scripts
- `dev`: next dev
- `build`: next build
- `start`: next start
- `lint`: next lint

## 🔒 Firestore Rules（節錄）
```

rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    function isSignedIn() { return request.auth != null; }
    function isOwner(uid) { return isSignedIn() && request.auth.uid == uid; }

    match /profiles/{uid} {
      allow read: if true;
      allow create: if isOwner(uid);
      allow update: if isOwner(uid)
        && (request.time.toMillis() - resource.data.updatedAt) > 1000*60*60*24*3;
    }

    match /posts/{postId} {
      allow read: if true;
      allow create: if isSignedIn();
      allow update, delete: if isOwner(resource.data.authorUid);
      match /comments/{commentId} {
        allow read: if true;
        allow create: if isSignedIn();
        allow update, delete: if isOwner(resource.data.uid);
      }
      match /likes/{uid} {
        allow read: if true;
        allow write: if isOwner(uid);
      }
    }

    match /notifications/{notifId} {
      allow read, write: if isOwner(resource.data.uid);
    }
  }
}

```

## 📝 開發指引
- 使用 TypeScript。
- **防止連點**：提交/刪除/按讚等操作應加上 pending 狀態與節流。
- **刪除文章**：若標記為刪除，前端列表應直接過濾不顯示。
- **產業類別一致性**：個人資料的產業類別需與發文使用的類別選單保持一致。
- **薪資輸入**：以「1 元」為單位，避免自動四捨五入導致金額偏差。
- **資料權限**：依照 Firestore Rules，限制僅擁有者可修改/刪除自己的文件；讀取權限視功能需求設定。

## 📦 版本與授權
- Node 版本：>=18
- 授權：請於 `LICENSE` 填寫，或保留預設。

---

> 本 README 依上傳專案自動生成；若需改為面試作品集/部署教學/維運手冊版，我可以再幫你客製化調整。