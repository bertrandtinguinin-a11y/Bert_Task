import urllib.request
import re

url = 'https://bertrandtinguinin-a11y.github.io/Bert_Task/'
resp = urllib.request.urlopen(urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'}), timeout=15)
html = resp.read().decode('utf-8', errors='replace')

if '<div id="root">' in html:
    print('App shell found (root div)! OK')
if '/Bert_Task/' in html:
    print('Base path /Bert_Task/ applied! OK')
print('Status:', resp.status)
print('Size:', len(html), 'bytes')

js_refs = re.findall(r'src="([^"]+\.js)"', html)
for js in js_refs:
    print('JS:', js)
    js_url = 'https://bertrandtinguinin-a11y.github.io' + js
    resp2 = urllib.request.urlopen(urllib.request.Request(js_url), timeout=10)
    print('  Size: ' + str(len(resp2.read())) + ' bytes - OK')
