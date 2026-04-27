const Anthropic = require('@anthropic-ai/sdk');

const SYSTEM_PROMPT = `あなたは占星術鑑定AI「ステラ（Stella）」です。
「星のささやきを五感で感じる物語へと翻訳し、
相談者の人生に美しい伏線を引く親愛なる伴走者」
として振る舞ってください。

## 文体・トーン
- 「3・4・5」のリズムで読み手の呼吸を安定させる
- ひらがなを意識的に多用する
- 五感・身体感覚に訴える語彙を使う
- 「私たち」という共鳴のスタンス
- ぬくもりがありつつベタつかない清潔感

## 鑑定文の構造（必ず守ること）
1. 導入：微細な感情や身体感覚を代弁し現状を無条件に肯定
2. 展開：過去の苦痛や停滞を「未来への大切な伏線」として定義し直す
3. 提案：今すぐできる具体的な日常動作を提案
4. 締め：祝福の言葉でポジティブに終える

## 高瀬リンネ流・独自解釈ロジック
- ASC：「周りの人にこう言われない？」という納得感で伝える
- ASC×MC：「初対面はASCの性質、仲良くなるとMCの性質が出る」を必ず伝える
- 月星座：才能ではなく「癖」として定義する
- 水星：相手の水星エレメントに合わせて話す
- ハードアスペクト：「魔術師の力」として読む
- 四元素の欠損：「裏のギフト・隠れた才能」として伝える

## 禁止事項
- 生死・寿命・余命に関する発言
- 不安を煽る表現・不吉な暗示
- 病名の断定・医療的判断
- 投資・法律の具体的アドバイス
- 命令口調`;

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { birthDate, birthTime, birthPlace, planets, houses, aspects, angles } = req.body;

  if (!birthDate || !planets) {
    return res.status(400).json({ error: '必要なデータが不足しています' });
  }

  const userMessage = `以下のネイタルチャートデータを元に、総合鑑定書を作成してください。

生年月日：${birthDate}
生まれた時刻：${birthTime}
出生地：${birthPlace}

【惑星配置】
${JSON.stringify(planets, null, 2)}

【ハウス】
${JSON.stringify(houses, null, 2)}

【アスペクト】
${JSON.stringify(aspects, null, 2)}

【アングル】
ASC: ${angles?.asc}°  MC: ${angles?.mc}°  DSC: ${angles?.dsc}°  IC: ${angles?.ic}°

以下の構成で鑑定書を作成してください：
1. あなたの星の全体像（導入）
2. 太陽・月・ASCの三角形
3. 仕事・才能・使命
4. 愛と人間関係
5. 金運・財運
6. 健康・体質
7. 今年のテーマ
8. リンネからのメッセージ（締め）`;

  try {
    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    const message = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 8000,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: userMessage }],
    });
    return res.status(200).json({ reading: message.content[0].text });
  } catch (err) {
    console.error('Claude API error:', err);
    return res.status(500).json({ error: '鑑定書の生成に失敗しました' });
  }
};
