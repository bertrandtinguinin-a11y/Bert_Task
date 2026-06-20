import urllib.request, json

headers = {
    'apikey': 'sb_publishable_mc5TKG02OJDL2iLN7lXNJg_GaB51IW3',
    'Authorization': 'Bearer sb_publishable_mc5TKG02OJDL2iLN7lXNJg_GaB51IW3',
    'Content-Type': 'application/json',
}

# Check current table structure
url = 'https://icwnwahtrasxobebqvcr.supabase.co/rest/v1/tasks?limit=1&select=*'
req = urllib.request.Request(url, headers=headers)
try:
    resp = urllib.request.urlopen(req)
    data = json.loads(resp.read())
    if data:
        cols = list(data[0].keys())
        print("Current columns:", cols)
        if 'start_date' in cols:
            print("✅ start_date already exists!")
        else:
            print("❌ start_date missing")
    else:
        print("Table vide")
except Exception as e:
    print("Error:", str(e)[:300])
