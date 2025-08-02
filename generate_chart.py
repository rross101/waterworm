import pandas as pd
import matplotlib.pyplot as plt
from datetime import datetime
import matplotlib.ticker as mticker

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
    ax = plt.gca()
    ax.set_facecolor("#f0f8ff")  # Subtle blue background

    # Custom color palette
    plt.plot(days, amounts, marker="o", color="#009edb", label="TeamWater Progress")
    plt.plot([0, (GOAL_DATE - START_DATE).days], [0, GOAL_AMOUNT], "r--", label="Target")

    # Annotate latest data point
    if len(days) > 0:
        plt.annotate(
            f"${amounts.iloc[-1]:,.0f}",
            (days.iloc[-1], amounts.iloc[-1]),
            textcoords="offset points",
            xytext=(0, 10),
            ha='center',
            color="#009edb",
            fontsize=12,
            fontweight='bold'
        )

    # Improve axis formatting
    ax.yaxis.set_major_formatter(mticker.FuncFormatter(lambda x, _: f"${int(x):,}"))
    plt.ylim(0, GOAL_AMOUNT * 1.1)

    # Add subtitle/context
    plt.title("TeamWater Progress Chart", fontsize=18, fontweight='bold')

    plt.xlabel("Days since Aug 1")
    plt.ylabel("Amount Raised (USD)")
    plt.grid(True, color="#cccccc", linestyle="--", linewidth=0.7)
    plt.legend()
    plt.tight_layout()
    plt.savefig(OUTPUT_FILE)
    print(f"📈 Chart saved as {OUTPUT_FILE}")

if __name__ == "__main__":
    plot_worm_chart()

