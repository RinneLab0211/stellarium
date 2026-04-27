// vercel dev ではモジュールキャッシュが共有されるため、
// webhook.js と get-reading.js が同一インスタンスを参照できる。
// 本番（サーバーレス）では invocation をまたいで消えるため、
// 将来的には Upstash Redis（Vercel Marketplace）への移行を推奨。
module.exports = new Map();
