import os
import re
import glob

CLASS_MAP = {
    '<table>': '<table className="w-full caption-bottom text-sm">',
    '<thead>': '<thead className="border-b border-border">',
    '<tr>': '<tr className="border-b border-border transition-colors hover:bg-muted/50">',
    '<th>': '<th className="h-10 px-4 text-left align-middle font-medium text-muted-foreground whitespace-nowrap">',
    '<td>': '<td className="p-4 align-middle whitespace-nowrap">',
}

base_path = 'app'
tsx_files = glob.glob(f'{base_path}/**/*.tsx', recursive=True)

for file_path in tsx_files:
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()

    original_content = content
    for old_tag, new_tag in CLASS_MAP.items():
        content = content.replace(old_tag, new_tag)
        
    if content != original_content:
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f'Updated {file_path}')

print('Done replacing table tags.')
