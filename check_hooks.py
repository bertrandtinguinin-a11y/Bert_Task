import urllib.request
import json

# Check the GitHub API to see if Vercel hooks are configured
url = 'https://api.github.com/repos/bertrandtinguinin-a11y/Bert_Task/hooks'
req = urllib.request.Request(url, headers={
    'Accept': 'application/vnd.github.v3+json',
    'User-Agent': 'Python'
})
try:
    resp = urllib.request.urlopen(req, timeout=15)
    hooks = json.loads(resp.read())
    print('Hooks found:', len(hooks))
    for h in hooks:
        print(f'  - {h.get("name", "unknown")}: url={h.get("config", {}).get("url", "N/A")[:80]}')
except urllib.error.HTTPError as e:
    print(f'Error: {e.code}')
    print(e.read().decode()[:300])
except Exception as ex:
    print(f'Exception: {str(ex)[:150]}')
