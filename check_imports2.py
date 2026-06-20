import os, re

root = r'C:\Users\BertrandTINGUININ\.openclaw-autoclaw\workspace\point-dg-app\frontend\src'
# Build map of actual filenames (lowercase -> actual)
actual_files = {}
for dirpath, dirnames, filenames in os.walk(root):
    for f in filenames:
        if f.endswith(('.jsx', '.js', '.tsx', '.ts')):
            key = f.lower()
            if key not in actual_files:
                actual_files[key] = os.path.join(dirpath, f)

# Also check from lib/ and api/ folders
extras = [
    r'C:\Users\BertrandTINGUININ\.openclaw-autoclaw\workspace\point-dg-app\frontend\src\api',
    r'C:\Users\BertrandTINGUININ\.openclaw-autoclaw\workspace\point-dg-app\frontend\src\lib',
]
for root_dir in [root] + extras:
    for dirpath, dirnames, filenames in os.walk(root_dir):
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
                    # try .jsx or .js
                    found = False
                    for ext in ['.jsx', '.js']:
                        key = (last + ext).lower()
                        if key in actual_files:
                            actual = actual_files[key]
                            _, actual_fname = os.path.split(actual)
                            if actual_fname != last + ext:
                                rel = os.path.relpath(fpath, root)
                                print(f'{rel}: imports "{imp}" but file is "{actual_fname}"')
                            found = True
                            break
                    if not found:
                        # No actual file found - might be a node_module import
                        pass
                else:
                    key = last.lower()
                    if key in actual_files:
                        actual = actual_files[key]
                        _, actual_fname = os.path.split(actual)
                        if actual_fname != last:
                            rel = os.path.relpath(fpath, root)
                            print(f'{rel}: imports "{imp}" but file is "{actual_fname}"')

print('Check complete.')
