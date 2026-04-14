import os
import re
import glob

base_path = 'app'
tsx_files = glob.glob(f'{base_path}/**/*.tsx', recursive=True)

# Replace already updated values with even smaller ones
replacements = [
    # Topbar reduction
    (r'h-16', r'h-14'),
    # Layout main block
    (r'p-4 md:p-6 lg:p-8', r'p-4'),
    (r'p-4 md:p-6', r'p-4'),
    # Component vertical compacting
    (r'py-4 md:py-6', r'py-3 md:py-4'),
    (r'mb-4 md:mb-6', r'mb-4'),
    # Grid gaps
    (r'gap-3 md:gap-4 lg:gap-4', r'gap-3 md:gap-4'),
    (r'gap-4 md:gap-6', r'gap-3 md:gap-4'),
    (r'mb-8 ', r'mb-4 '),   # fallback for raw classes
    (r'p-16 gap-3', r'p-8 gap-3'),
]

for file_path in tsx_files:
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()

    original_content = content
    for old, new in replacements:
        content = re.sub(old, new, content)
        
    if content != original_content:
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f'Updated {file_path}')

# Topbar component explicitly:
tb_path = 'components/layout/Topbar.tsx'
if os.path.exists(tb_path):
    with open(tb_path, 'r', encoding='utf-8') as f:
        content = f.read()
    content = content.replace('h-16', 'h-12')
    with open(tb_path, 'w', encoding='utf-8') as f:
        f.write(content)
    print("Updated Topbar.tsx")

print('Done compacting whitespace forcefully.')
