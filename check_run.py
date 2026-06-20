import urllib.request
import json

# Fetch the latest failed run and check if it's a new one
url = 'https://api.github.com/repos/bertrandtinguinin-a11y/Bert_Task/actions/runs?per_page=1&status=failure&event=push&branch=main'
req = urllib.request.Request(url, headers={
    'Accept': 'application/vnd.github.v3+json', 'User-Agent': 'Python'
})
resp = urllib.request.urlopen(req, timeout=15)
data = json.loads(resp.read())
run = data['workflow_runs'][0]
run_id = run['id']
created = run['created_at']
head_sha = run['head_sha']
head_branch = run['head_branch']
conclusion = run['conclusion']
name = run['name']
print(f'Latest failed run: {run_id}')
print(f'Created: {created}')
print(f'Commit: {head_sha[:7]}')
print(f'Branch: {head_branch}')
print(f'Conclusion: {conclusion}')
print(f'Workflow: {name}')

# Get jobs
jobs_url = run['jobs_url']
req2 = urllib.request.Request(jobs_url, headers={
    'Accept': 'application/vnd.github.v3+json', 'User-Agent': 'Python'
})
resp2 = urllib.request.urlopen(req2, timeout=15)
jobs_data = json.loads(resp2.read())
job = jobs_data['jobs'][0]

for step in job.get('steps', []):
    sname = step.get('name', '?')
    sconc = step.get('conclusion', step.get('status', '?'))
    number = step.get('number', 0)
    print(f'  Step {number}: [{sconc}] {sname}')
