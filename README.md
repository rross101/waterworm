# TeamWater Progress Worm

This project visualizes the fundraising progress of #TeamWater over time using a dynamic D3.js chart. It updates every 10 minutes using a CSV data source it scrapes from `teamwater.org`, and is styled to align with WaterAid's brand.

---

## 🚀 Features

* **Live updating chart** (polls every 10 minutes)
* **Animated "progress worm"** showing cumulative totals
* **Target line** with glowing highlight
* **Mini-milestones** marked and labeled on the chart (e.g. £10M, £20M, £30M)
* **Responsive design** and mobile-friendly typography
* **Lightweight and dependency-free** (uses only D3.js v7)

---

## 📁 Project Structure

```txt
/
/
├── waterworm.py        # scraper
├── index.html          # Main page
├── assets/
│   └── chart.js        # D3 chart logic and rendering
└── teamwater_progress.csv   # (Expected data source: cumulative progress log)
```

---

## 🛠 Setup & Deployment

To deploy locally:

1. Clone the repo:

   ```bash
   git clone https://github.com/rross101/waterworm.git
   cd waterworm
   ```

2. Serve the project locally (e.g. with Python):

   ```bash
   python3 -m http.server
   ```

3. Open in browser:

   ```
   http://localhost:8000
   ```

4. Ensure `teamwater_progress.csv` is updated externally every 10 minutes. The chart will fetch it on each interval.

---

## 📎 Attribution

* Font: [Noto Sans](https://fonts.google.com/specimen/Noto+Sans) via Google Fonts
* Charting: [D3.js v7](https://d3js.org/)
* Colors & branding inspired by [WaterAid](https://www.wateraid.org/)
* Support #TeamWater at www.teamwater.org
