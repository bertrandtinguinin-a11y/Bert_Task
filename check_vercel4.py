import urllib.request

# Check what the JS file actually contains
url = 'https://taskmn-gestion-de-taches.vercel.app/assets/index-CrSthxOs.js'
resp = urllib.request.urlopen(urllib.request.Request(url), timeout=10)
data = resp.read()
print('Size:', len(data), 'bytes')
print('Content preview:', data[:200])
print('Is Vercel auth page:', b'DOCTYPE' in data or b'Authentication' in data or b'Password' in data)
