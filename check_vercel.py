import urllib.request
import re

# Check what assets exist by fetching the HTML
url2 = 'https://taskmn-gestion-de-taches.vercel.app/'
html = urllib.request.urlopen(urllib.request.Request(url2), timeout=10).read().decode()
print('HTML loaded OK')

# Find the JS asset referenced
js_match = re.search(r'src="(/assets/index-[^\.]+\.js)"', html)
if js_match:
    js_path = js_match.group(1)
    print('Expected JS:', js_path)
    # Try to load it
    js_url = 'https://taskmn-gestion-de-taches.vercel.app' + js_path
    try:
        resp = urllib.request.urlopen(urllib.request.Request(js_url), timeout=10)
        print('JS loaded OK, size:', len(resp.read()), 'bytes')
    except urllib.error.HTTPError as e:
        print('JS load failed:', e.code, e.read().decode()[:200])
else:
    print('No JS asset found in HTML')
