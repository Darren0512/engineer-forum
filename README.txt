# Patch — Google login persistence + Profile page TS fix

本包包含：
- `lib/firebase.ts`：設定 `browserLocalPersistence`，確保登入在 Vercel 維持；匯出 `provider` 與 `googleProvider`。
- `app/profile/page.tsx`：把 `setY(profile.y)` 改為 `setY(profile.y ?? 0)` 等，避免 `undefined` 型別錯誤。

## 放置
- 覆蓋你的專案：`/lib/firebase.ts`、`/app/profile/page.tsx`
- 重新部署或本機測試

## 若登入仍無法生效，請檢查：
1) Vercel 環境變數 `NEXT_PUBLIC_FIREBASE_*` 是否齊全且與 Firebase 專案一致
2) Firebase Console → Authentication：啟用 Google，Authorized domains 包含 `<your>.vercel.app`
3) `next.config.js` 的 CSP 是否允許 `accounts.google.com` / `apis.google.com` / `www.googleapis.com`
4) 你的頁面是否有被 `<AuthProvider>` 包住（確保 `onAuthStateChanged` 可以更新 UI）
