import urllib.request
import json

# Get latest failed run ID
url = 'https://api.github.com/repos/bertrandtinguinin-a11y/Bert_Task/actions/runs?per_page=1&status=failure&event=push'
req = urllib.request.Request(url, headers={
    'Accept': 'application/vnd.github.v3+json',
    'User-Agent': 'Python'
})
resp = urllib.request.urlopen(req, timeout=15)
data = json.loads(resp.read())
run = data['workflow_runs'][0]

# Get jobs
jobs_url = run['jobs_url']
req2 = urllib.request.Request(jobs_url, headers={
    'Accept': 'application/vnd.github.v3+json',
    'User-Agent': 'Python'
})
resp2 = urllib.request.urlopen(req2, timeout=15)
jobs_data = json.loads(resp2.read())
job = jobs_data['jobs'][0]

# Get step details without emoji
for step in job.get('steps', []):
    sname = step.get('name', '?')
    sconc = step.get('conclusion', step.get('status', '?'))
    sstat = step.get('status', '?')
    print(f'  [{sconc}] {sname}')
    if sconc == 'failure':
        # Get the logs for this step
        if step.get('number') is not None:
            # Try to get the logs URL from the job
            logs_url = job.get('logs_url', '')
            if logs_url:
                print(f'    -> Logs: {logs_url}')
                break
