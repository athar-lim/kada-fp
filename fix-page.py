import re

with open('app/dashboard/page.tsx', 'r') as f:
    text = f.read()

# Remove the import `getDashboardNotifications,`
text = re.sub(r"\s*getDashboardNotifications,", "", text)

# Remove `import { DashboardNotification } from "@/lib/cinetrack-api";`
text = re.sub(r"\s*type DashboardNotification,", "", text)

# Remove `const [notifications, setNotifications] = useState<DashboardNotification[]>([]);`
text = re.sub(r"\s*const \[notifications, setNotifications\].*?\n", "\n", text)

# Remove `useEffect` for notifications
text = re.sub(r"\s*useEffect\(\(\) => \{\n\s*getDashboardNotifications\(\)\n\s*\.then\(setNotifications\)\n\s*\.catch\(\(\) => setNotifications\(\[\]\)\);\n\s*\}, \[\]\);\n", "\n", text)

# Replace the grid start
text = text.replace("""      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader className="flex items-center justify-between px-8 pt-6 pb-2">""", """      <Card>
        <CardHeader className="flex items-center justify-between px-8 pt-6 pb-2">""")

# Find and replace the card
start_idx = text.find("""        </Card>

        <Card>
          <CardHeader className="flex items-center justify-between px-8 pt-6 pb-2">
            <div className="flex w-full items-center justify-between gap-2">
              <div>
                <CardTitle>Notifikasi Sistem</CardTitle>""")

end_idx = text.find("""      <Card>
        <CardContent className="px-0 pb-0">""", start_idx)

if start_idx != -1 and end_idx != -1:
    text = text[:start_idx] + "        </Card>\n\n" + text[end_idx:]

with open('app/dashboard/page.tsx', 'w') as f:
    f.write(text)
