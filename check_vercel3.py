import urllib.request

urls = [
    'https://taskmn-gestion-de-taches.vercel.app/assets/index-CrSthxOs.js',
    'https://taskmn-gestion-de-taches.vercel.app/assets/index-DPE6yMuK.css',
    'https://taskmn-gestion-de-taches.vercel.app/manifest.json',
    'https://taskmn-gestion-de-taches.vercel.app/supabase.js',
]
for u in urls:
    try:
        resp = urllib.request.urlopen(urllib.request.Request(u), timeout=10)
        name = u.split('/')[-1]
        print('OK:', name, '(' + str(len(resp.read())) + ' bytes)')
    except urllib.error.HTTPError as e:
        name = u.split('/')[-1]
        print('FAIL:', name, '->', e.code)
    except Exception as e:
        name = u.split('/')[-1]
        print('FAIL:', name, '->', str(e)[:50])
