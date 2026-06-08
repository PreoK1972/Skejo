module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, DELETE');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const { messageId } = req.body;

  if (!messageId) {
    res.status(400).json({ error: 'Missing required parameters' });
    return;
  }

  const qStashToken = process.env.QSTASH_TOKEN;

  if (!qStashToken) {
    res.status(500).json({ error: 'Server environment is not configured with QSTASH_TOKEN.' });
    return;
  }

  try {
    const response = await fetch(`https://qstash.upstash.io/v2/messages/${messageId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${qStashToken}`
      }
    });

    if (!response.ok && response.status !== 404) {
      const errorText = await response.text();
      throw new Error(`QStash API error: ${response.status} - ${errorText}`);
    }

    res.status(200).json({ success: true, alreadyDelivered: response.status === 404 });
  } catch (error) {
    console.error('Cancel function error:', error);
    res.status(500).json({ error: error.message });
  }
};
