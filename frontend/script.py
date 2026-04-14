import os
import re
import glob

# Mapping of custom classes to Tailwind utility classes
CLASS_MAP = {
    'page-container': 'container mx-auto px-4 md:px-6 py-6 md:py-12 max-w-6xl',
    'page-header': 'flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8 md:mb-12',
    'page-title': 'text-[28px] md:text-[40px] font-semibold tracking-vercel-display leading-[1.20]',
    'page-subtitle': 'text-muted-foreground mt-2',
    'card': 'bg-card text-card-foreground shadow-vercel-card transition-all duration-200 rounded-lg p-4 md:p-6',
    'stats-grid': 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 lg:gap-8 mb-8 md:mb-12',
    'btn btn-primary': 'inline-flex items-center justify-center rounded-[6px] text-sm font-medium tracking-vercel-ui transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 h-9 px-4 py-2 bg-primary text-primary-foreground shadow-sm hover:bg-primary/90',
    'btn btn-secondary': 'inline-flex items-center justify-center rounded-[6px] text-sm font-medium tracking-vercel-ui transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 h-9 px-4 py-2 bg-secondary text-secondary-foreground shadow-sm hover:bg-secondary/80',
    'btn btn-ghost btn-icon': 'inline-flex items-center justify-center rounded-[6px] text-sm font-medium tracking-vercel-ui transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 p-2 h-9 w-9 bg-transparent shadow-none hover:bg-accent hover:text-accent-foreground',
    'btn btn-ghost': 'inline-flex items-center justify-center rounded-[6px] text-sm font-medium tracking-vercel-ui transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 h-9 px-4 py-2 bg-transparent shadow-none hover:bg-accent hover:text-accent-foreground',
    'form-label': 'text-sm font-medium leading-none mb-2 block text-foreground',
    'form-input': 'flex h-9 w-full rounded-[6px] bg-transparent px-3 py-1 text-sm shadow-vercel transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50',
    'filter-row': 'flex flex-col md:flex-row gap-4 mb-6',
    'search-bar': 'relative flex items-center bg-transparent border-none shadow-vercel rounded-[6px] px-3 py-1 flex-1 h-9',
    'table-wrapper': 'relative w-full overflow-auto rounded-lg shadow-vercel bg-card',
    'badge badge-success': 'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 bg-[#10b981]/10 text-[#10b981] hover:bg-[#10b981]/20',
    'badge badge-neutral': 'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 bg-muted text-muted-foreground hover:bg-muted/80',
    'badge badge-danger': 'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 bg-[#ff5b4f]/10 text-[#ff5b4f] hover:bg-[#ff5b4f]/20',
    'badge badge-info': 'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 bg-[#0a72ef]/10 text-[#0a72ef] hover:bg-[#0a72ef]/20',
    'avatar avatar-sm': 'flex shrink-0 overflow-hidden rounded-full font-medium items-center justify-center text-white h-8 w-8 text-xs',
    'modal-overlay': 'fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in',
    'modal-header': 'flex items-center justify-between p-6 border-b border-border',
    'modal-title': 'text-lg font-semibold tracking-vercel-card',
    'modal-body': 'p-6',
    'modal-footer': 'flex items-center justify-end gap-2 p-6 border-t border-border bg-muted/20',
    'modal': 'bg-background rounded-lg shadow-vercel-popover max-w-2xl w-full max-h-[90vh] overflow-y-auto animate-in zoom-in-95',
    'empty-state-icon': 'mb-4 h-12 w-12 rounded-full bg-muted/50 flex items-center justify-center',
    'empty-state': 'flex flex-col items-center justify-center p-12 text-center text-sm text-muted-foreground rounded-lg shadow-vercel border-dashed border border-border',
}

base_path = 'app'
tsx_files = glob.glob(f'{base_path}/**/*.tsx', recursive=True)

for file_path in tsx_files:
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()

    original_content = content
    # For every key in CLASS_MAP, replace it carefully 
    for old_class, new_class in CLASS_MAP.items():
        # Match className="old_class" or className={'old_class'} or inside template literals
        pattern = r"([\"'\\s])" + re.escape(old_class) + r"([\"'\\s\n])"
        content = re.sub(pattern, r'\g<1>' + new_class + r'\g<2>', content)
        
    if content != original_content:
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f'Updated {file_path}')

print('Done replacing.')
