import os, re

root = r'C:\Users\BertrandTINGUININ\.openclaw-autoclaw\workspace\point-dg-app\frontend\src'
# Build map of actual filenames
actual_files_lower_to_real = {}
for dirpath, dirnames, filenames in os.walk(root):
    for f in filenames:
        if f.endswith(('.jsx', '.js', '.tsx', '.ts')):
            actual_files_lower_to_real[f.lower()] = f

# Check all files for imports (both relative and alias)
issues = []
for dirpath, dirnames, filenames in os.walk(root):
    for fname in filenames:
        if not fname.endswith(('.jsx', '.js')):
            continue
        file_rel = os.path.relpath(os.path.join(dirpath, fname), root)
        with open(os.path.join(dirpath, fname), 'r', encoding='utf-8') as f:
            content = f.read()
        
        # Find all imports from local files
        # Relative imports: from './something' or from '../something'
        local_imports = re.findall(r"from\s+['\"]((?:\.\.?/)[^'\"]+)['\"]", content)
        
        for imp in local_imports:
            # Resolve relative to current file directory
            if imp.startswith('./'):
                resolved_dir = dirpath
                rest = imp[2:]
            elif imp.startswith('../'):
                resolved_dir = os.path.dirname(dirpath.rstrip('/'))
                rest = imp[3:]
            else:
                continue
            
            # Get the filename from the path
            parts = rest.split('/')
            imp_filename = parts[-1]
            
            # Add extension if missing
            imp_filename_with_ext = imp_filename
            if '.' not in imp_filename:
                imp_filename_with_ext = imp_filename + '.jsx'
                if imp_filename_with_ext.lower() not in actual_files_lower_to_real:
                    imp_filename_with_ext = imp_filename + '.js'
            
            # Check if it's in the resolved directory
            full_path = os.path.join(resolved_dir, imp_filename_with_ext)
            if os.path.exists(full_path):
                actual_name = os.path.basename(full_path)
                if actual_name != imp_filename_with_ext:
                    issues.append(f'{file_rel}: imports "{imp}" -> resolves as "{actual_name}" (case mismatch)')
            else:
                # Maybe it's a different directory path (e.g. ./components/ → components/)
                pass

for i in issues:
    print('ISSUE:', i)
if not issues:
    print('No case issues found')
