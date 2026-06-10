const https = require('https');

exports.handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json',
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers, body: JSON.stringify({ error: 'Método não permitido' }) };
  }

  try {
    const body = event.body ? JSON.parse(event.body) : {};

    const appId = process.env.ONESIGNAL_APP_ID;
    const apiKey = process.env.ONESIGNAL_REST_API_KEY;

    if (!appId || !apiKey) {
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ error: 'OneSignal não configurado no servidor (ONESIGNAL_APP_ID / ONESIGNAL_REST_API_KEY)' }),
      };
    }

    const title = String(body?.title || 'Novo evento').trim();
    const message = String(body?.message || 'Confira os detalhes no app.').trim();
    const eventId = body?.eventId ? String(body.eventId) : '';

    const payload = {
      app_id: appId,
      included_segments: ['Subscribed Users'],
      headings: { pt: title },
      contents: { pt: message },
      data: {
        type: 'event',
        event_id: eventId,
      },
    };

    const resBody = await new Promise((resolve, reject) => {
      const req = https.request(
        {
          hostname: 'onesignal.com',
          path: '/api/v1/notifications',
          method: 'POST',
          headers: {
            Authorization: `Basic ${apiKey}`,
            'Content-Type': 'application/json; charset=utf-8',
          },
        },
        (res) => {
          let data = '';
          res.on('data', (chunk) => (data += chunk));
          res.on('end', () => {
            if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) {
              resolve(data);
            } else {
              reject(new Error(`OneSignal error ${res.statusCode}: ${data}`));
            }
          });
        }
      );

      req.on('error', reject);
      req.write(JSON.stringify(payload));
      req.end();
    });

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ ok: true, result: safeParseJson(resBody) }),
    };
  } catch (error) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ ok: false, error: error?.message || 'Erro interno' }),
    };
  }
};

function safeParseJson(value) {
  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
}
