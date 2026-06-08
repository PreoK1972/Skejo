const webpush = require('web-push');

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

  const { subscription, taskId, taskName, type, timeStr } = req.body;

  if (!subscription || !taskId || !taskName || !type || !timeStr) {
    res.status(400).json({ error: 'Missing required parameters' });
    return;
  }

  const vapidPublicKey = process.env.VAPID_PUBLIC_KEY;
  const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY;

  if (!vapidPublicKey || !vapidPrivateKey) {
    res.status(500).json({ error: 'Server environment is not configured with VAPID keys.' });
    return;
  }

  try {
    webpush.setVapidDetails(
      'mailto:skejo-alarms@example.com',
      vapidPublicKey,
      vapidPrivateKey
    );

    const title = type === 'start' ? `🌅 Begin: ${taskName}` : `🏁 Complete: ${taskName}`;
    const body = type === 'start' 
      ? `It's time to begin your "${taskName}" routine (${timeStr}).`
      : `It's time to verify completion of your "${taskName}" routine (${timeStr}).`;

    const payload = JSON.stringify({
      title,
      body,
      data: {
        taskId,
        type,
        timeStr
      }
    });

    await webpush.sendNotification(subscription, payload);
    res.status(200).json({ success: true });
  } catch (error) {
    console.error('Send push error:', error);
    res.status(500).json({ error: error.message });
  }
};
