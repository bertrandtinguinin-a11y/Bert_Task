import httpx, json

key = 'sb_publishable_mc5TKG02OJDL2iLN7lXNJg_GaB51IW3'
headers = {'apikey': key, 'Authorization': 'Bearer ' + key}

for table in ['tasks', 'users', 'task_history']:
    try:
        url = f'https://icwnwahtrasxobebqvcr.supabase.co/rest/v1/{table}?select=count'
        r = httpx.get(url, headers=headers, timeout=10)
        data = r.json()
        print(f'{table}: OK, count={data[0]["count"]}')
    except Exception as e:
        print(f'{table}: ERROR - {e}')
