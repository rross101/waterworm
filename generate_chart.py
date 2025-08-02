import pandas as pd
import matplotlib.pyplot as plt
from datetime import datetime

CSV_FILE = "teamwater_progress.csv"
OUTPUT_FILE = "worm_chart.png"

# Fundraising goal
GOAL_AMOUNT = 40_000_000
GOAL_DATE = datetime(2025, 8, 31)
START_DATE = datetime(2025, 8, 1)

def plot_worm_chart():
    df = pd.read_csv(CSV_FILE, parse_dates=["timestamp"])

    # Sort and drop duplicates
    df = df.sort_values("timestamp").drop_duplicates()

    # Calculate days since start
    df["days_since_start"] = (df["timestamp"] - START_DATE).dt.days
    df["days_since_start"] = df["days_since_start"].clip(lower=0)

    # Target line
    days = df["days_since_start"]
    amounts = df["amount"]

    plt.figure(figsize=(10, 6))
    plt.plot(days, amounts, marker="o", label="TeamWater Progress")
    plt.plot([0, (GOAL_DATE - START_DATE).days], [0, GOAL_AMOUNT], "k--", label="Target")
    plt.title("TeamWater Fundraising Worm Chart")
    plt.xlabel("Days since Aug 1")
    plt.ylabel("Amount Raised (USD)")
    plt.grid(True)
    plt.legend()
    plt.tight_layout()
    plt.savefig(OUTPUT_FILE)
    print(f"📈 Chart saved as {OUTPUT_FILE}")

if __name__ == "__main__":
    plot_worm_chart()

