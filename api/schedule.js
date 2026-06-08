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

  const { subscription, taskId, taskName, type, timeStr, delay } = req.body;

  if (!subscription || !taskId || !taskName || !type || !timeStr || delay === undefined) {
    res.status(400).json({ error: 'Missing required parameters' });
    return;
  }

  const qStashToken = process.env.QSTASH_TOKEN;
  const vapidPublicKey = process.env.VAPID_PUBLIC_KEY;
  const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY;

  if (!qStashToken || !vapidPublicKey || !vapidPrivateKey) {
    res.status(500).json({ error: 'Server environment is not fully configured. Please set QSTASH_TOKEN, VAPID_PUBLIC_KEY, and VAPID_PRIVATE_KEY.' });
    return;
  }

  try {
    const protocol = req.headers['x-forwarded-proto'] || 'https';
    const host = req.headers['host'];
    
    const baseUrl = host.includes('localhost') ? 'http://localhost:3000' : `${protocol}://${host}`;
    const destinationUrl = `${baseUrl}/api/send-push`;

    // Call QStash REST API
    const response = await fetch(`https://qstash.upstash.io/v2/publish/${destinationUrl}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${qStashToken}`,
        'Content-Type': 'application/json',
        'Upstash-Delay': `${Math.max(1, Math.round(delay))}s`
      },
      body: JSON.stringify({
        subscription,
        taskId,
        taskName,
        type,
        timeStr
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`QStash API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    res.status(200).json({ messageId: data.messageId });
  } catch (error) {
    console.error('Schedule function error:', error);
    res.status(500).json({ error: error.message });
  }
};
