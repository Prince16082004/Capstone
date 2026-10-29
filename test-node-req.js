const http = require('http');
const body = JSON.stringify({N: 90, P: 42, K: 43, temperature: 20.8, humidity: 82.0, ph: 6.5, rainfall: 202.9});
const req = http.request({
  hostname: '127.0.0.1',
  port: 8001,
  path: '/predict',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(body)
  }
}, (res) => {
  let data = '';
  res.on('data', c => data += c);
  res.on('end', () => console.log('RES:', data));
});
req.on('error', e => console.error('ERR:', e));
req.write(body);
req.end();
