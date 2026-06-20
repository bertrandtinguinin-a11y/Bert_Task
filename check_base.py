import re
with open(r'C:\Users\BertrandTINGUININ\.openclaw-autoclaw\workspace\point-dg-app\frontend\dist\index.html', 'r') as f:
    html = f.read()
refs = re.findall(r'(?:src|href)="([^"]+)"', html)
for r in refs:
    print(r)
