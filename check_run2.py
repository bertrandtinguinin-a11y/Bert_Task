import urllib.request
import json

# Get the MOST RECENT run regardless of status
url = 'https://api.github.com/repos/bertrandtinguinin-a11y/Bert_Task/actions/runs?per_page=3&branch=main'
req = urllib.request.Request(url, headers={
    'Accept': 'application/vnd.github.v3+json', 'User-Agent': 'Python'
})
resp = urllib.request.urlopen(req, timeout=15)
data = json.loads(resp.read())
runs = data.get('workflow_runs', [])
for r in runs:
    created = r['created_at']
    sha = r['head_sha'][:7]
    name = r['name']
    conclusion = r.get('conclusion', r.get('status', 'running'))
    print(f'[{created}] {sha}: {name} -> {conclusion}')
