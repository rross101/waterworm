from playwright.sync_api import sync_playwright
import csv
from datetime import datetime
import os
import time

CSV_FILE = "teamwater_progress.csv"

def scrape_total():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        page.goto("https://teamwater.org/", wait_until="networkidle")

        # Allow time for count-up animation
        time.sleep(5)

        try:
            element = page.locator("#ab_hero_total_amount_raised_number")
            raw_text = element.inner_text().strip().replace(",", "")
            amount = float(raw_text)
            print(f"💧 Total raised: ${amount:,.2f}")
            return amount
        except Exception as e:
            print("❌ Could not extract amount:", e)
            return None
        finally:
            browser.close()

def log_progress(amount):
    now = datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S")
    exists = os.path.isfile(CSV_FILE)

    with open(CSV_FILE, "a", newline="") as f:
        writer = csv.writer(f)
        if not exists:
            writer.writerow(["timestamp", "amount"])
        writer.writerow([now, amount])
        print(f"✅ Logged ${amount:,.2f} at {now}")

if __name__ == "__main__":
    amount = scrape_total()
    if amount:
        log_progress(amount)
