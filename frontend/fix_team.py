import re

file_path = 'app/(dashboard)/team/page.tsx'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Replace inline styles with classNames or append to existing classNames
content = re.sub(r'className="([^"]+)" style=\{\{ padding: 64, gap: 12 \}\}', r'className="\1 p-16 gap-3"', content)
content = re.sub(r'style=\{\{ display: \'grid\'\, gridTemplateColumns: \'repeat\(auto-fill, minmax\(300px, 1fr\)\)\', gap: 16 \}\}', r'className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"', content)
content = re.sub(r'className="([^"]+)" style=\{\{ display: \'flex\', flexDirection: \'column\', gap: 16 \}\}', r'className="\1 flex flex-col gap-4"', content)

content = re.sub(r'style=\{\{ flex: 1, minWidth: 0 \}\}', r'className="flex-1 min-w-0"', content)
content = re.sub(r'style=\{\{ fontWeight: 700, fontSize: 15, color: \'var\(--text-primary\)\', overflow: \'hidden\', textOverflow: \'ellipsis\', whiteSpace: \'nowrap\' \}\}', r'className="font-bold text-[15px] text-foreground truncate"', content)
content = re.sub(r'style=\{\{ fontSize: 11, color: \'var\(--accent-light\)\', marginLeft: 6 \}\}', r'className="text-[11px] text-accent ml-1.5"', content)
content = re.sub(r'style=\{\{ fontSize: 13, color: \'var\(--text-muted\)\', overflow: \'hidden\', textOverflow: \'ellipsis\' \}\}', r'className="text-[13px] text-muted-foreground truncate"', content)
content = re.sub(r'style=\{\{ fontSize: 11, color: \'var\(--text-muted\)\' \}\}', r'className="text-[11px] text-muted-foreground"', content)

# Drop any remaining unhandled generic style objects inside elements that already have classNames
content = re.sub(r' style=\{\{[^\}]+\}\}', '', content)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)
print("done team")
