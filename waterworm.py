from playwright.sync_api import sync_playwright
import time

def get_teamwater_total():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        page.goto("https://teamwater.org/", wait_until="networkidle")

        # Wait a bit to allow JS animation to complete
        time.sleep(5)

        try:
            element = page.locator("#ab_hero_total_amount_raised_number")
            text = element.inner_text().strip().replace(",", "")
            amount = float(text)
            print(f"💧 Total raised: ${amount:,.2f}")
            return amount
        except Exception as e:
            print("❌ Could not extract amount:", e)
            return None
        finally:
            browser.close()

# Run it
if __name__ == "__main__":
    get_teamwater_total()
