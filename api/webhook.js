const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const readingCache = require('./_store');

module.exports.config = { api: { bodyParser: false } };

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  let event;
  try {
    const rawBody = await getRawBody(req);
    event = stripe.webhooks.constructEvent(
      rawBody,
      req.headers['stripe-signature'],
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error('Webhook verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    const { natalKey } = session.metadata;

    try {
      const natal = readingCache.get(natalKey);
      if (!natal) throw new Error('Natal data not found in cache');

      const baseUrl = process.env.VERCEL_URL
        ? `https://${process.env.VERCEL_URL}`
        : 'http://localhost:3000';

      const resp = await fetch(`${baseUrl}/api/generate-reading`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(natal),
      });
      if (!resp.ok) throw new Error(`generate-reading returned ${resp.status}`);

      const { reading } = await resp.json();
      readingCache.set(`reading:${session.id}`, reading);
      console.log(`Reading stored: ${session.id}`);
    } catch (err) {
      console.error('Reading generation failed:', err);
    }
  }

  return res.status(200).json({ received: true });
};

function getRawBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', chunk => chunks.push(chunk));
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
}
