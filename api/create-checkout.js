const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { kv } = require('@vercel/kv');
const { randomBytes } = require('crypto');

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { birthDate, birthTime, birthPlace, planets, houses, aspects, angles } = req.body;
  const origin = `https://${req.headers.host}`;

  const natalKey = `natal:${randomBytes(8).toString('hex')}`;
  await kv.set(natalKey, { birthDate, birthTime, birthPlace, planets, houses, aspects, angles }, { ex: 86400 });

  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [{
        price_data: {
          currency: 'jpy',
          product_data: {
            name: 'STELLARIUM 総合鑑定書',
            description: 'あなたのホロスコープをもとにした完全パーソナル鑑定書',
          },
          unit_amount: 9800,
        },
        quantity: 1,
      }],
      mode: 'payment',
      success_url: `${origin}/reading-result.html?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/stellarium-v4_1.html`,
      metadata: { natalKey },
    });

    return res.status(200).json({ url: session.url });
  } catch (err) {
    console.error('Stripe error:', err);
    return res.status(500).json({ error: 'チェックアウトの作成に失敗しました' });
  }
};
