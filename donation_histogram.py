import pandas as pd
import matplotlib.pyplot as plt
import numpy as np

df = pd.read_csv('teamwater_progress.csv')
df = df.dropna()

amounts = df['amount'].values
donation_sizes = np.diff(amounts)
donation_sizes = donation_sizes[donation_sizes > 0]

# Define bins
bins = [0, 10, 100, 500, 1000, 5000, 10000, 100000, float('inf')]
labels = ['0-10', '10-100', '100-500', '500-1000', '1000-5000', '5000-10,000', '10,000-100,000', '100,000+']

# Calculate total amount for each bin
bin_totals = []
for i in range(len(bins)-1):
    mask = (donation_sizes >= bins[i]) & (donation_sizes < bins[i+1])
    bin_totals.append(donation_sizes[mask].sum())

plt.figure(figsize=(12, 8))
plt.bar(labels, bin_totals, alpha=0.7, edgecolor='black')
plt.xlabel('Donation Size Range')
plt.ylabel('Total Amount ($)')
plt.title('Total Donation Amount by Size Range')
plt.xticks(rotation=45)
plt.grid(True, alpha=0.3, axis='y')
plt.tight_layout()
plt.savefig('donation_histogram.png', dpi=300, bbox_inches='tight')
plt.show()

print("Total amount by donation size range:")
for label, total in zip(labels, bin_totals):
    print(f"{label}: ${total:,.2f}")
print(f"\nOverall total: ${sum(bin_totals):,.2f}")