import os, re

root = r'C:\Users\BertrandTINGUININ\.openclaw-autoclaw\workspace\point-dg-app\frontend\src'
actual_files = {}
for dirpath, dirnames, filenames in os.walk(root):
    for f in filenames:
        if f.endswith(('.jsx', '.js', '.tsx', '.ts')):
            key = f.lower()
            if key not in actual_files:
                actual_files[key] = os.path.join(dirpath, f)

issues = []
for dirpath, dirnames, filenames in os.walk(root):
    for fname in filenames:
        if not fname.endswith(('.jsx', '.js')):
            continue
        fpath = os.path.join(dirpath, fname)
        with open(fpath, 'r') as f:
            try:
                content = f.read()
            except:
                continue
        imports = re.findall(r"from\s+['\"](\./[^'\"]+)['\"]", content)
        for imp in imports:
            parts = imp.split('/')
            last = parts[-1]
            if '.' not in last:
                last += '.jsx'
            if last.lower() != last:
                actual = actual_files.get(last.lower())
                if actual and not actual.endswith(last):
                    d = os.path.dirname(actual)
                    actual_fname = os.path.basename(actual)
                    rel = os.path.relpath(fpath, root)
                    issues.append(f'{rel}: imports "{imp}" but file is "{actual_fname}"')

for issue in issues:
    print('ISSUE:', issue)
if not issues:
    print('OK - no other case issues found')
