# 富遊・賽特二數據分析中心

富遊平台賽特二（遊戲入口參考：https://casino.rgslotgame.com/?game=3045）的個人紀錄與統計工具。

## 目前功能
- 每局紀錄：時間、房間、投注、派彩、倍數、免遊觸發、備註。
- 總覽：累計局數、投注、派彩、樣本 RTP、淨損益。
- 房間表現比較、房間清單。
- CSV 匯入與匯出。
- Buy Feature 成本、回本門檻、單次淨損益與回報率計算。
- 資料存於瀏覽器 localStorage，請定期匯出備份。

## 資料來源限制
目前尚未確認富遊官方即時 API 或 WebSocket。本專案不會假裝已連線即時房間數據；所有統計只來自使用者輸入或匯入的紀錄。未來取得合法授權 API 或官方匯出格式後，才新增自動資料接收功能。不得繞過登入、存取控制或反機器人機制，也不要將帳密、Cookie 或 session token 放入程式碼。

## 部署
直接開啟 index.html 可本機預覽。GitHub Pages：Repository Settings → Pages → Build and deployment → Source 選 GitHub Actions；推送 main 後由工作流程部署。

## 定義
RTP（樣本）= 紀錄派彩總和 ÷ 紀錄投注總和 × 100%。淨損益 = 派彩總和 − 投注總和。Buy Feature 淨損益 = 免遊派彩 − 買入成本。

歷史 RTP、短期房間結果或未觸發次數都不能推導下一局更容易中獎，也不代表未來報酬。本工具不提供投注建議或獲利保證。