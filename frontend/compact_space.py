import os
import re
import glob

base_path = 'app'
tsx_files = glob.glob(f'{base_path}/**/*.tsx', recursive=True)

replacements = [
    (r'py-6 md:py-12', r'py-4 md:py-6'),         # page-container vertical spacing
    (r'mb-8 md:mb-12', r'mb-4 md:mb-6'),         # page-header bottom margin
    (r'p-4 md:p-6 lg:p-8', r'p-4 md:p-6'),       # Layout main container padding
    (r'gap-4 md:gap-6 lg:gap-8', r'gap-3 md:gap-4 lg:gap-4'), # stats-grid gap
    (r'gap-6 md:gap-8', r'gap-4 md:gap-6'),      # Other generic gaps
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

print('Done compacting whitespace.')
