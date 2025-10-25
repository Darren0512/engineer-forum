# Vercel Secure Pack (Next.js)

把這些檔案放在**專案根目錄**（與 `app/` 同層），然後重新部署到 Vercel。

## 內容
- `.vercelignore`：從 Vercel 上傳/建置中排除 `functions/` 與 Firebase 檔案，避免型別錯誤。
- `tsconfig.json`：加入 `exclude: ["functions", ...]`，防止 TypeScript 檢查掃到 Cloud Functions。
- `next.config.js`：加強安全標頭（CSP/Frame/Referrer/Permissions），並禁止預覽網址被索引。
- `middleware.ts`：輕量 Rate Limit（10s / 5 次），sameSite 型別已修正為 `'lax'`。

## 步驟
1. 將本包檔案覆蓋到你的專案根目錄（若已有 `tsconfig.json`，請手動合併 `exclude` 設定）。
2. 推上 GitHub，讓 Vercel 重新建置。
3. Cloud Functions 請在本機用 Firebase CLI 部署（不要交給 Vercel）：
   ```bash
   cd functions
   npm i
   npm run build
   firebase deploy --only functions
   ```

## 安全提醒
- CSP 白名單已包含 Firebase 必要網域；若你導入其他第三方（例如分析、圖庫），請同步加入白名單。
- 若要更強的限流，建議使用 Upstash/Vercel KV 實作伺服器端儲存的配額桶。
