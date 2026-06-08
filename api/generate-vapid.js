const webpush = require('web-push');

module.exports = (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, DELETE');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    const keys = webpush.generateVAPIDKeys();
    res.status(200).json(keys);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
