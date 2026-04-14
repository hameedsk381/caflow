import re

file_path = 'app/(dashboard)/tasks/page.tsx'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Replace inline styles with classNames or append to existing classNames
replacements = [
    (r'style=\{\{ display: \'flex\', gap: 8 \}\}', r'className="flex gap-2"'),
    (r'style=\{\{ display: \'flex\', background: \'var\(--bg-card\)\', border: \'1px solid var\(--border\)\', borderRadius: \'var\(--radius-sm\)\', overflow: \'hidden\' \}\}', r'className="flex bg-card rounded-md shadow-vercel overflow-hidden"'),
    (r'style=\{\{ width: \'auto\' \}\}', r'className="w-auto"'),
    (r'style=\{\{ display: \'flex\', gap: 16\, overflowX: \'auto\'\, paddingBottom: 16 \}\}', r'className="flex gap-4 overflow-x-auto pb-4"'),
    (r'style=\{\{ display: \'grid\'\, gridTemplateColumns: \'1fr 1fr\'\, gap: 16 \}\}', r'className="grid grid-cols-1 md:grid-cols-2 gap-4"'),
    (r'style=\{\{ resize: \'vertical\' \}\}', r'className="resize-y"'),
    (r'style=\{\{ display: \'flex\', alignItems: \'center\', justifyContent: \'space-between\', marginBottom: 14 \}\}', r'className="flex items-center justify-between mb-4"'),
    (r'style=\{\{ display: \'flex\'\, flexDirection: \'column\'\, gap: 8 \}\}', r'className="flex flex-col gap-2"'),
]

for old, new in replacements:
    content = re.sub(old, new, content)

# Handing existing classNames + styles
content = re.sub(r'className="([^"]+)" style=\{\{ padding: 48, gap: 12 \}\}', r'className="\1 p-12 gap-3"', content)
content = re.sub(r'className="([^"]+)" style=\{\{ padding: \'4px 28px 4px 8px\'\, fontSize: 12\, width: \'auto\' \}\}', r'className="\1 px-2 py-1 text-xs w-auto"', content)
content = re.sub(r'style=\{\{ gridColumn: \'1 / -1\' \}\}', r'className="md:col-span-2"', content)
content = re.sub(r'style=\{\{ flex: \'0 0 280px\'\, background: \'var\(--bg-card\)\'\, border: \'1px solid var\(--border\)\'\, borderRadius: \'var\(--radius\)\'\, padding: 16 \}\}', r'className="w-[280px] shrink-0 bg-card border-none shadow-vercel rounded-lg p-4"', content)
content = re.sub(r'style=\{\{ fontSize: 12\, fontWeight: 700\, textTransform: \'uppercase\'\, letterSpacing: \'0\.05em\'\, color: \'var\(--text-muted\)\' \}\}', r'className="text-xs font-bold uppercase tracking-wider text-muted-foreground"', content)
content = re.sub(r'style=\{\{ background: \'var\(--bg-secondary\)\'\, borderRadius: 100\, padding: \'2px 8px\'\, fontSize: 11\, fontWeight: 700 \}\}', r'className="bg-secondary rounded-full px-2 py-0.5 text-[11px] font-bold"', content)
content = re.sub(r'style=\{\{ fontSize: 13\, fontWeight: 600\, marginBottom: 6 \}\}', r'className="text-[13px] font-semibold mb-1.5"', content)
content = re.sub(r'style=\{\{ fontSize: 11\, color: \'var\(--text-muted\)\'\, marginBottom: 6 \}\}', r'className="text-[11px] text-muted-foreground mb-1.5"', content)
content = re.sub(r'style=\{\{ display: \'flex\'\, alignItems: \'center\'\, justifyContent: \'space-between\' \}\}', r'className="flex items-center justify-between"', content)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)
print("done tasks")
