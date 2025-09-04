import pandas as pd
import matplotlib.pyplot as plt
import matplotlib.dates as mdates
from datetime import datetime
import numpy as np

# Read the CSV data
df = pd.read_csv('teamwater_progress.csv')

# Convert timestamp to datetime
df['timestamp'] = pd.to_datetime(df['timestamp'])

# Calculate incremental donations (difference between consecutive entries)
df['incremental'] = df['amount'].diff().fillna(0)

# Identify large donations - let's define "large" as donations over a certain threshold
# We'll look at the distribution of incremental donations to set a reasonable threshold
incremental_donations = df['incremental'][df['incremental'] > 0]
print("Donation statistics:")
print(f"Mean incremental: ${incremental_donations.mean():.2f}")
print(f"Median incremental: ${incremental_donations.median():.2f}")
print(f"95th percentile: ${incremental_donations.quantile(0.95):.2f}")
print(f"99th percentile: ${incremental_donations.quantile(0.99):.2f}")

# Let's use the 95th percentile as our threshold for "large" donations
large_donation_threshold = incremental_donations.quantile(0.95)
print(f"\nUsing threshold of ${large_donation_threshold:.2f} for large donations")

# Identify large donations
df['is_large_donation'] = df['incremental'] > large_donation_threshold

# Create filtered data excluding large donations
df_filtered = df.copy()
large_donation_mask = df['is_large_donation']

# For the filtered dataset, we'll replace large donations with the median increment
median_increment = incremental_donations.median()

# Recalculate cumulative amounts excluding large donations
df_filtered['amount_filtered'] = 0
df_filtered.loc[0, 'amount_filtered'] = df.loc[0, 'amount']

for i in range(1, len(df_filtered)):
    if df_filtered.loc[i, 'is_large_donation']:
        # Use median increment instead of the large donation
        increment = median_increment
    else:
        increment = df_filtered.loc[i, 'incremental']
    
    df_filtered.loc[i, 'amount_filtered'] = df_filtered.loc[i-1, 'amount_filtered'] + increment

# Create the visualization
fig, (ax1, ax2, ax3) = plt.subplots(3, 1, figsize=(15, 12))

# Plot 1: Original cumulative data
ax1.plot(df['timestamp'], df['amount'], 'b-', linewidth=2, label='Original Data')
ax1.set_title('Original Cumulative Fundraising Progress', fontsize=14, fontweight='bold')
ax1.set_ylabel('Total Amount ($)', fontsize=12)
ax1.grid(True, alpha=0.3)
ax1.legend()

# Format y-axis to show currency
ax1.yaxis.set_major_formatter(plt.FuncFormatter(lambda x, p: f'${x:,.0f}'))

# Plot 2: Filtered cumulative data (excluding large donations)
ax2.plot(df_filtered['timestamp'], df_filtered['amount_filtered'], 'g-', linewidth=2, label='Filtered Data (Large Donations Smoothed)')
ax2.set_title('Filtered Cumulative Progress (Underlying Trend)', fontsize=14, fontweight='bold')
ax2.set_ylabel('Total Amount ($)', fontsize=12)
ax2.grid(True, alpha=0.3)
ax2.legend()
ax2.yaxis.set_major_formatter(plt.FuncFormatter(lambda x, p: f'${x:,.0f}'))

# Plot 3: Daily incremental donations with large donations highlighted
ax3.scatter(df[~df['is_large_donation']]['timestamp'], 
           df[~df['is_large_donation']]['incremental'], 
           c='blue', alpha=0.6, s=20, label='Regular Donations')
ax3.scatter(df[df['is_large_donation']]['timestamp'], 
           df[df['is_large_donation']]['incremental'], 
           c='red', alpha=0.8, s=50, label=f'Large Donations (>${large_donation_threshold:.0f})')
ax3.set_title('Individual Donation Amounts', fontsize=14, fontweight='bold')
ax3.set_xlabel('Date', fontsize=12)
ax3.set_ylabel('Donation Amount ($)', fontsize=12)
ax3.grid(True, alpha=0.3)
ax3.legend()
ax3.yaxis.set_major_formatter(plt.FuncFormatter(lambda x, p: f'${x:,.0f}'))

# Format x-axis for all plots
for ax in [ax1, ax2, ax3]:
    ax.xaxis.set_major_formatter(mdates.DateFormatter('%m/%d'))
    ax.xaxis.set_major_locator(mdates.DayLocator(interval=1))
    plt.setp(ax.xaxis.get_majorticklabels(), rotation=45)

plt.tight_layout()
plt.savefig('donation_analysis.png', dpi=300, bbox_inches='tight')
plt.show()

# Print summary of large donations
print(f"\nLarge donations identified:")
large_donations = df[df['is_large_donation']][['timestamp', 'incremental']]
for _, row in large_donations.iterrows():
    print(f"{row['timestamp'].strftime('%Y-%m-%d %H:%M')}: ${row['incremental']:,.2f}")

print(f"\nTotal from large donations: ${df[df['is_large_donation']]['incremental'].sum():,.2f}")
print(f"Total from regular donations: ${df[~df['is_large_donation']]['incremental'].sum():,.2f}")
print(f"Final filtered amount: ${df_filtered['amount_filtered'].iloc[-1]:,.2f}")
print(f"Original final amount: ${df['amount'].iloc[-1]:,.2f}")
