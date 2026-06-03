import sys
sys.stdout.reconfigure(encoding='utf-8')

with open(r'd:\ahla-shabab\src\app\forms\[id]\edit\page.tsx', 'r', encoding='utf-8') as f:
    lines = f.readlines()
for i, line in enumerate(lines):
    if 'textarea' in line.lower() or '\u0627\u0644\u0648\u0635\u0641' in line:
        print(f'Line {i+1}: {line.rstrip()}')
