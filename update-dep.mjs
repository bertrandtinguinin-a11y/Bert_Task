import { createHash } from 'crypto';
import https from 'https';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const token = 'vcp_7eularMoankzb3IW5V7h1rC5ejImzCyuaMZqhm9vXL5PAoX8wz1nI4Xt';

// Deploy the frontend/dist files as static
async function deploy() {
  const distDir = path.join(__dirname, 'frontend', 'dist');
  const files = [];
  
  function walk(dir) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const e of entries) {
      const full = path.join(dir, e.name);
      if (e.isDirectory()) walk(full);
      else files.push(full);
    }
  }
  walk(distDir);
  
  const uploads = [];
  for (const f of files) {
    const name = path.relative(distDir, f).replace(/\\/g, '/');
    const data = fs.readFileSync(f).toString('base64');
    uploads.push({ file: name, data });
  }
  
  const body = JSON.stringify({
    name: 'taskmn',
    project: 'prj_NFwdQcONZrBZCHtFEB6A6YuJEuZf',
    files: uploads,
    routes: [{ src: '/(.*)', dest: '/index.html' }]
  });
  
  console.log('Files:', uploads.length, 'Size:', (body.length/1024).toFixed(0), 'KB');
  
  return new Promise((resolve, reject) => {
    const req = https.request({
      hostname: 'api.vercel.com',
      path: '/v13/deployments',
      method: 'POST',
      headers: {
        Authorization: 'Bearer ' + token,
        'Content-Type': 'application/json'
      }
    }, (r) => {
      let d = '';
      r.on('data', c => d += c);
      r.on('end', () => {
        const j = JSON.parse(d);
        console.log('Status:', r.statusCode);
        if (j.url) console.log('URL:', j.url);
        if (j.error) console.log('Error:', j.error.message);
        resolve(j);
      });
    });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

deploy().catch(console.error);
