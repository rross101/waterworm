# 💧 Waterworm

A live, auto-updating "worm chart" tracker for [TeamWater.org](https://teamwater.org/), a campaign to raise $40 million for clean water by August 31, 2025.

This project scrapes the total raised, logs progress, and generates a chart — all deployed via GitHub Pages and automated with GitHub Actions.

## 🧠 Project Overview

- **Scraper**: Uses `playwright` to extract the donation total every 10 mins
- **Logger**: Appends the total + UTC timestamp to `teamwater_progress.csv`
- **Chart Generator**: Creates a cricket-style "worm" chart vs goal line
- **HTML Generator**: Injects latest total and timestamp into a clean dashboard
- **Deployment**: GitHub Actions builds and deploys the site to GitHub Pages

➡️ Live site: [https://rross101.github.io/waterworm](https://rross101.github.io/waterworm)

## 📁 Key Files

| File                  | Purpose                                      |
|-----------------------|----------------------------------------------|
| `waterworm.py`        | Playwright-based scraper                     |
| `generate_chart.py`   | Matplotlib chart generator                   |
| `update_html.py`      | Writes latest stats into `docs/index.html`  |
| `teamwater_progress.csv` | Cumulative log of totals                |
| `docs/`               | Published GitHub Pages content               |
| `.github/workflows/scrape.yml` | CI script to run scraper + push   |

## 🚀 Setup

```bash
pip install playwright pandas matplotlib
playwright install
python waterworm.py
python generate_chart.py
python update_html.py
