const https = require('https');

module.exports = async function(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-auth-token, Authorization');
  
  if (req.method === 'OPTIONS') { res.status(200).end(); return; }

  const PUBLIC_TOKEN = process.env.GOAFFPRO_PUBLIC_TOKEN;
  const path = req.query.path || '/v1/affiliate/login';
  const method = req.method;

  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'api.goaffpro.com',
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        'x-auth-token': PUBLIC_TOKEN
      }
    };

    // Pass through Authorization header if present (for authenticated calls)
    if (req.headers.authorization) {
      options.headers['Authorization'] = req.headers.authorization;
    }

    const proxyReq = https.request(options, (proxyRes) => {
      let data = '';
      proxyRes.on('data', (chunk) => { data += chunk; });
      proxyRes.on('end', () => {
        res.status(proxyRes.statusCode).json(JSON.parse(data || '{}'));
        resolve();
      });
    });

    proxyReq.on('error', (e) => {
      res.status(500).json({ error: e.message });
      resolve();
    });

    if (method === 'POST' && req.body) {
      proxyReq.write(JSON.stringify(req.body));
    }
    proxyReq.end();
  });
};
