const https = require('https');
const token = 'vcp_7eularMoankzb3IW5V7h1rC5ejImzCyuaMZqhm9vXL5PAoX8wz1nI4Xt';

const data = JSON.stringify({
  framework: null,
  buildCommand: null,
  installCommand: null,
  outputDirectory: null,
  devCommand: null
});

const req = https.request({
  hostname: 'api.vercel.com',
  path: '/v9/projects/prj_NFwdQcONZrBZCHtFEB6A6YuJEuZf',
  method: 'PATCH',
  headers: {
    Authorization: 'Bearer ' + token,
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(data)
  }
}, (r) => {
  let d = '';
  r.on('data', c => d += c);
  r.on('end', () => {
    console.log('Status:', r.statusCode);
    const j = JSON.parse(d);
    console.log('Framework:', j.framework);
    console.log('BuildCommand:', j.buildCommand);
    console.log('InstallCommand:', j.installCommand);
  });
});
req.write(data);
req.end();
