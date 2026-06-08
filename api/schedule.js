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

  const { subscription, taskId, taskName, type, timeStr, delay, qStashToken, vapidKeys } = req.body;

  if (!subscription || !taskId || !taskName || !type || !timeStr || delay === undefined || !qStashToken || !vapidKeys) {
    res.status(400).json({ error: 'Missing required parameters' });
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
        timeStr,
        vapidKeys
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
