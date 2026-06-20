import urllib.request
import json

# Get jobs for the latest failed run
url = 'https://api.github.com/repos/bertrandtinguinin-a11y/Bert_Task/actions/runs?per_page=1&status=failure&event=push'
req = urllib.request.Request(url, headers={
    'Accept': 'application/vnd.github.v3+json', 'User-Agent': 'Python'
})
resp = urllib.request.urlopen(req, timeout=15)
data = json.loads(resp.read())
run = data['workflow_runs'][0]
run_id = run['id']

# Get jobs
jobs_url = run['jobs_url']
req2 = urllib.request.Request(jobs_url, headers={
    'Accept': 'application/vnd.github.v3+json', 'User-Agent': 'Python'
})
resp2 = urllib.request.urlopen(req2, timeout=15)
jobs_data = json.loads(resp2.read())
job = jobs_data['jobs'][0]

# Get logs (zip URL)
log_url = f'https://api.github.com/repos/bertrandtinguinin-a11y/Bert_Task/actions/runs/{run_id}/logs'
req3 = urllib.request.Request(log_url, headers={
    'Accept': 'application/vnd.github.v3+json', 'User-Agent': 'Python'
})
try:
    resp3 = urllib.request.urlopen(req3, timeout=20)
    import io, zipfile
    zip_data = io.BytesIO(resp3.read())
    with zipfile.ZipFile(zip_data) as z:
        # List files in the zip
        for name in z.namelist():
            print('File in zip:', name)
            if 'Build' in name or 'build' in name:
                content = z.read(name).decode('utf-8', errors='replace')
                print(f'Content of {name}:')
                print(content[-2000:])  # last 2000 chars (where the error usually is)
except Exception as e:
    print(f'Logs error: {str(e)[:200]}')
    # Try direct log URL
    try:
        alt_url = f'https://github.com/bertrandtinguinin-a11y/Bert_Task/actions/runs/{run_id}/attempts/1/logs'
        print(f'Alternative: {alt_url}')
    except:
        pass
