import pandas as pd
from datetime import datetime

CSV_FILE = "teamwater_progress.csv"
HTML_FILE = "docs/index.html"

# Load latest value
df = pd.read_csv(CSV_FILE, parse_dates=["timestamp"])
latest = df.sort_values("timestamp").iloc[-1]

amount = f"${latest['amount']:,.2f}"
timestamp = latest["timestamp"].strftime("%Y-%m-%d %H:%M:%S UTC")

# Write HTML
with open(HTML_FILE, "w") as f:
    f.write(f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>TeamWater Worm Chart</title>
</head>
<body>
  <h1>💧 TeamWater Fundraising Worm Chart</h1>
  <p><strong>Latest total:</strong> {amount}</p>
  <p><strong>Last updated:</strong> {timestamp}</p>
  <p>Updated every 10 minutes from <a href="https://teamwater.org/">teamwater.org</a></p>
  <img src="worm_chart.png" alt="Worm Chart" style="max-width: 100%; height: auto;" />
</body>
</html>""")
