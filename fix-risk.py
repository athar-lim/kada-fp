import re

with open('app/dashboard/films/page.tsx', 'r') as f:
    text = f.read()

# Replace the grid layout wrapper for the remaining table
text = text.replace(
    '<div className="grid gap-6 lg:grid-cols-3">\n                    <Card className="lg:col-span-2">',
    '<div className="grid gap-6">\n                    <Card>'
)

# Remove the Operational Risk Card and Problematic Schedules Card
start_str = """                    <Card>
                        <CardHeader>
                            <div className="flex items-center gap-2">
                                <AlertTriangle className="h-4 w-4 text-amber-500" />
                                <CardTitle>Risiko operasional</CardTitle>"""

end_str = """                        </CardContent>
                    </Card>
                ) : null}"""

start_idx = text.find(start_str)
end_idx = text.find(end_str) + len(end_str)

if start_idx != -1 and end_idx != -1:
    text = text[:start_idx] + text[end_idx:]

with open('app/dashboard/films/page.tsx', 'w') as f:
    f.write(text)

