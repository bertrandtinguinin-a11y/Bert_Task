import { readFileSync, readdirSync, statSync } from 'fs';
import { join, relative } from 'path';
import https from 'https';

const token = 'vcp_7eularMoankzb3IW5V7h1rC5ejImzCyuaMZqhm9vXL5PAoX8wz1nI4Xt';

// 1. Set project to static mode
const projectUrl = 'https://api.vercel.com/v9/projects/prj_NFwdQcONZrBZCHtFEB6A6YuJEuZf';
const config = JSON.stringify({
  framework: null, buildCommand: null, outputDirectory: '.',
  installCommand: null, devCommand: null, rootDirectory: null
});

const setConfig = () => new Promise(res => {
  const r = https.request(projectUrl, {
    method: 'PATCH',
    headers: { Authorization: 'Bearer ' + token, 'Content-Type': 'application/json' }
  }, res2 => {
    let d = '';
    res2.on('data', c => d += c);
    res2.on('end', () => { res(JSON.parse(d)); });
  });
  r.write(config);
  r.end();
});

const result = await setConfig();
console.log('Project mode:', result.framework || 'static');

// 2. Upload dist files
const distDir = 'C:/Users/BertrandTINGUININ/.openclaw-autoclaw/workspace/point-dg-app/frontend/dist';

function walk(dir) {
  return readdirSync(dir, {withFileTypes:true}).flatMap(e => {
    const p = join(dir, e.name);
    return e.isDirectory() ? walk(p) : [p];
  });
}

const files = walk(distDir);
const uploads = files.map(f => ({
  file: relative(distDir, f).replace(/\\/g, '/'),
  data: readFileSync(f).toString('base64')
}));

const body = JSON.stringify({
  name: 'taskmn',
  project: 'prj_NFwdQcONZrBZCHtFEB6A6YuJEuZf',
  files: uploads,
  routes: [{ src: '/(.*)', dest: '/index.html' }],
  target: 'production'
});

console.log('Deploying', uploads.length, 'files (' + (body.length/1024).toFixed(0) + ' KB)...');

const deploy = () => new Promise(res => {
  const r = https.request('https://api.vercel.com/v13/deployments?forceNew=1', {
    method: 'POST',
    headers: { Authorization: 'Bearer ' + token, 'Content-Type': 'application/json' }
  }, res2 => {
    let d = '';
    res2.on('data', c => d += c);
    res2.on('end', () => { res({ status: res2.statusCode, body: JSON.parse(d) }); });
  });
  r.write(body);
  r.end();
});

const depResult = await deploy();
console.log('Status:', depResult.status);
console.log('URL:', depResult.body.url || '?');
console.log('State:', depResult.body.readyState || depResult.body.state || '?');
if (depResult.body.error) console.log('Error:', depResult.body.error.message);

// 3. Wait and check
await new Promise(r => setTimeout(r, 15000));

const checkDep = () => new Promise(res => {
  https.get('https://api.vercel.com/v6/deployments?limit=1&projectId=prj_NFwdQcONZrBZCHtFEB6A6YuJEuZf', {
    headers: { Authorization: 'Bearer ' + token }
  }, r2 => {
    let d = '';
    r2.on('data', c => d += c);
    r2.on('end', () => { res(JSON.parse(d).deployments[0]); });
  });
});

const latest = await checkDep();
console.log('Latest state:', latest.state, '| Ready:', latest.readyState);

// 4. Try the URL
try {
  const page = await new Promise(res => {
    https.get('https://' + latest.url + '/', r2 => {
      let d = '';
      r2.on('data', c => d += c);
      r2.on('end', () => res({ status: r2.statusCode, text: d.slice(0, 200) }));
    });
  });
  console.log('Page status:', page.status);
  console.log('Content:', page.text.slice(0, 100));
} catch(e) {
  console.log('Page error:', e.message);
}
