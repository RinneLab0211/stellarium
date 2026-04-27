const readingCache = require('./_store');

module.exports = async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { session_id } = req.query;
  if (!session_id) {
    return res.status(400).json({ error: 'session_id is required' });
  }

  const reading = readingCache.get(`reading:${session_id}`);
  if (!reading) {
    return res.status(404).json({ error: '鑑定書がまだ準備できていません' });
  }
  return res.status(200).json({ reading });
};
