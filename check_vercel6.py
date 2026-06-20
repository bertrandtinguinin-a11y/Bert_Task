import urllib.request
import json

headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
}

urls = [
    'https://taskmn-gestion-de-taches.vercel.app/__api/deployments',
    'https://taskmn-gestion-de-taches.vercel.app/_vercel/insights/status',
    'https://taskmn-gestion-de-taches.vercel.app/500.html',
]

for url in urls:
    try:
        req = urllib.request.Request(url, headers=headers)
        resp = urllib.request.urlopen(req, timeout=8)
        data = resp.read().decode('utf-8', errors='replace')
        label = url.rstrip('/').split('/')[-1]
        print(f'{label}: {resp.status} ({len(data)} bytes)')
        print(data[:300])
        print('---')
    except urllib.error.HTTPError as e:
        label = url.rstrip('/').split('/')[-1]
        print(f'{label}: {e.code}')
        print('---')
    except Exception as e:
        label = url.rstrip('/').split('/')[-1]
        print(f'{label}: {str(e)[:80]}')
        print('---')
