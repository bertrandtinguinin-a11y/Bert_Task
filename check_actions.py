import urllib.request
import json

url = 'https://api.github.com/repos/bertrandtinguinin-a11y/Bert_Task/actions/runs?per_page=5&status=completed'
req = urllib.request.Request(url, headers={
    'Accept': 'application/vnd.github.v3+json',
    'User-Agent': 'Python'
})
try:
    resp = urllib.request.urlopen(req, timeout=15)
    data = json.loads(resp.read())
    runs = data.get('workflow_runs', [])
    print('Runs found:', len(runs))
    for r in runs:
        name = r.get('name', '?')
        status = r.get('conclusion', r.get('status', '?'))
        branch = r.get('head_branch', '?')
        created = r.get('created_at', '?')[:19]
        print(f'  [{created}] {name}: {status} (branch: {branch})')
except urllib.error.HTTPError as e:
    print('Error:', e.code, e.read().decode()[:200])
except Exception as ex:
    print('Exception:', str(ex)[:100])
