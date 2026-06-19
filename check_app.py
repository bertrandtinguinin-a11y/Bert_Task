import urllib.request, json

headers = {
    'apikey': 'sb_publishable_mc5TKG02OJDL2iLN7lXNJg_GaB51IW3',
    'Authorization': 'Bearer sb_publishable_mc5TKG02OJDL2iLN7lXNJg_GaB51IW3',
    'Accept': 'application/json',
    'Content-Type': 'application/json',
}

# Try with explicit schema header
headers2 = {**headers, 'Accept-Profile': 'public'}

url = 'https://icwnwahtrasxobebqvcr.supabase.co/rest/v1/tasks?limit=1'
req = urllib.request.Request(url, headers=headers2)
try:
    resp = urllib.request.urlopen(req, timeout=10)
    data = json.loads(resp.read())
    print('Response:', data)
except urllib.error.HTTPError as e:
    body = e.read().decode()
    print('Error:', e.code, body[:500])
except Exception as ex:
    print('Exception:', str(ex)[:300])

# Also check if the project itself is accessible
url2 = 'https://icwnwahtrasxobebqvcr.supabase.co/rest/v1/'
try:
    resp = urllib.request.urlopen(urllib.request.Request(url2, headers=headers), timeout=10)
    print('Root accessible:', resp.status)
except urllib.error.HTTPError as e2:
    print('Root error:', e2.code, e2.read().decode()[:200])
