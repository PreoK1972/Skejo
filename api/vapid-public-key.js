module.exports = (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  const publicKey = process.env.VAPID_PUBLIC_KEY;

  if (!publicKey) {
    res.status(500).json({ error: 'VAPID_PUBLIC_KEY environment variable is not configured on the server.' });
    return;
  }

  res.status(200).json({ publicKey });
};
