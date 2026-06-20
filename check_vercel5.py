import urllib.request

url = 'https://taskmn-gestion-de-taches.vercel.app/'
resp = urllib.request.urlopen(urllib.request.Request(url), timeout=15)
print('Status:', resp.status)
html = resp.read().decode('utf-8', errors='replace')
print('Length:', len(html), 'bytes')
if 'root' in html and '<div id="root">' in html:
    print('Still old build (HTML shell only)')
elif 'vercel' in html.lower() and 'building' in html.lower():
    print('Currently building/deploying...')
else:
    print('First 200 chars:', html[:200])
