import re

with open('app/dashboard/films/page.tsx', 'r') as f:
    text = f.read()

pattern = re.compile(
    r'<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">\s*'
    r'<CardTitle className="text-sm font-medium">(.*?)</CardTitle>\s*'
    r'<(.*?)\s+className="h-4 w-4 text-muted-foreground" />\s*'
    r'</CardHeader>'
)

def replacer(match):
    title = match.group(1)
    icon = match.group(2)
    return f"""<CardHeader className="pb-2">
                            <div className="flex items-center justify-between">
                                <CardTitle className="text-sm font-medium">{title}</CardTitle>
                                <{icon} className="h-4 w-4 text-muted-foreground" />
                            </div>
                        </CardHeader>"""

new_text = pattern.sub(replacer, text)

with open('app/dashboard/films/page.tsx', 'w') as f:
    f.write(new_text)
print("Replaced!")
