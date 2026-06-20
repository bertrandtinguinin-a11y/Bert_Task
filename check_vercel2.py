import urllib.request
import re

url = 'https://taskmn-gestion-de-taches.vercel.app/'
html = urllib.request.urlopen(urllib.request.Request(url), timeout=10).read().decode()

# Print the full HTML
print(html)
