import pandas as pd
from datetime import datetime

CSV_FILE = "teamwater_progress.csv"
TEMPLATE_FILE = "docs/template.html"
HTML_FILE = "docs/index.html"

# Load latest data from CSV
df = pd.read_csv(CSV_FILE, parse_dates=["timestamp"])
latest = df.sort_values("timestamp").iloc[-1]

amount = f"${latest['amount']:,.2f}"
timestamp = latest["timestamp"].strftime("%Y-%m-%d %H:%M:%S UTC")

# Read template and replace placeholders
with open(TEMPLATE_FILE) as f:
    template = f.read()

html = template.replace("{{amount}}", amount).replace("{{timestamp}}", timestamp)

with open(HTML_FILE, "w") as f:
    f.write(html)
