import http.client
import json

headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
}

# Check headers and response details
conn = http.client.HTTPSConnection('taskmn-gestion-de-taches.vercel.app')
conn.request('GET', '/assets/index-CrSthxOs.js', headers=headers)
resp = conn.getresponse()
body = resp.read()

print('Status:', resp.status, resp.reason)
all_headers = dict(resp.getheaders())
print('Headers:')
for k, v in sorted(all_headers.items()):
    print(f'  {k}: {v}')
print()
print('Body length:', len(body))
print('Content-Type:', all_headers.get('content-type', 'unknown'))

# Decode body
text = body.decode('utf-8', errors='replace')
has_html = '<!DOCTYPE html>' in text or '<html' in text
print('Is HTML page:', has_html)
if has_html:
    print('First 200 chars:', text[:200])
conn.close()
