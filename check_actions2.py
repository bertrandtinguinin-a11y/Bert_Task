import urllib.request
import json

# Get latest failed run ID
url = 'https://api.github.com/repos/bertrandtinguinin-a11y/Bert_Task/actions/runs?per_page=1&status=failure&event=push'
req = urllib.request.Request(url, headers={
    'Accept': 'application/vnd.github.v3+json',
    'User-Agent': 'Python'
})
try:
    resp = urllib.request.urlopen(req, timeout=15)
    data = json.loads(resp.read())
    runs = data.get('workflow_runs', [])
    if runs:
        run = runs[0]
        run_id = run['id']
        print('Latest failed run:', run_id)
        print('Created:', run.get('created_at', '?'))
        print('Branch:', run.get('head_branch', '?'))
        print('Commit:', run.get('head_sha', '?')[:7])
        print('Conclusion:', run.get('conclusion', '?'))
        print()
        
        # Get jobs for this run
        jobs_url = run['jobs_url']
        req2 = urllib.request.Request(jobs_url, headers={
            'Accept': 'application/vnd.github.v3+json',
            'User-Agent': 'Python'
        })
        resp2 = urllib.request.urlopen(req2, timeout=15)
        jobs_data = json.loads(resp2.read())
        jobs = jobs_data.get('jobs', [])
        for job in jobs:
            print('Job:', job.get('name', '?'))
            print('  Status:', job.get('status', '?'))
            print('  Conclusion:', job.get('conclusion', '?'))
            # Get steps
            for step in job.get('steps', []):
                sname = step.get('name', '?')
                sconc = step.get('conclusion', '?')
                sstat = step.get('status', '?')
                if sconc == 'failure' or sstat == 'failure':
                    print(f'  🔴 FAILED STEP: {sname}')
                else:
                    print(f'  Step: {sname} -> {sconc}')
            
            # Get step logs URL
            log_url = job.get('logs_url', '')
            if log_url:
                print(f'  Logs: {log_url}')
    else:
        print('No failed runs found')
except urllib.error.HTTPError as e:
    print('Error:', e.code, e.read().decode()[:300])
except Exception as ex:
    print('Exception:', str(ex)[:150])
