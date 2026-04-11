const https = require('https');
const data = JSON.stringify({ pages: [] });
const options = {
  method: 'POST',
  hostname: 'epcs-reliability-report.onrender.com',
  path: '/api/cms/restore-original',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(data)
  }
};
const req = https.request(options, (res) => {
  console.log('status', res.statusCode);
  let body = '';
  res.setEncoding('utf8');
  res.on('data', (chunk) => { body += chunk; });
  res.on('end', () => { console.log('body', body); });
});
req.on('error', (err) => { console.error('error', err.message); });
req.write(data);
req.end();
