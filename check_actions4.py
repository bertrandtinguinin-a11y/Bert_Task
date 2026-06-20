import urllib.request

# Get the latest failed run and fetch its logs
url = 'https://api.github.com/repos/bertrandtinguinin-a11y/Bert_Task/actions/runs?per_page=1&status=failure&event=push'
req = urllib.request.Request(url, headers={
    'Accept': 'application/vnd.github.v3+json',
    'User-Agent': 'Python'
})
resp = urllib.request.urlopen(req, timeout=15)
import json
data = json.loads(resp.read())
run = data['workflow_runs'][0]
run_id = run['id']
print('Run ID:', run_id)

# Try to get the log directly
log_url = f'https://api.github.com/repos/bertrandtinguinin-a11y/Bert_Task/actions/runs/{run_id}/logs'
req2 = urllib.request.Request(log_url, headers={
    'Accept': 'application/vnd.github.v3+json',
    'User-Agent': 'Python'
})
try:
    resp2 = urllib.request.urlopen(req2, timeout=20)
    log_data = resp2.read()
    # Try to find the error in the log
    text = log_data.decode('utf-8', errors='replace')
    # Find lines around "error" or "Error" or "Build" failure
    lines = text.split('\n')
    for i, line in enumerate(lines):
        low = line.lower()
        if 'error' in low or 'build' in low and 'fail' in low:
            start = max(0, i - 2)
            end = min(len(lines), i + 10)
            for j in range(start, end):
                print(f'{j}: {lines[j]}')
            print('---')
except urllib.error.HTTPError as e:
    print('Log fetch error:', e.code, e.read().decode()[:200])
