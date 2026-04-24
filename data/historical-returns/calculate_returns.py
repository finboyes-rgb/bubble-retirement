"""
Calculate annualised return and volatility from monthly price index data.
Volatility: std dev of monthly log returns × sqrt(12) to annualise.
"""

import csv
import math
from pathlib import Path


def load_series(filepath: Path) -> list[tuple[str, float]]:
    rows = []
    with open(filepath) as f:
        reader = csv.DictReader(f)
        for row in reader:
            date = list(row.values())[0]
            value = float(list(row.values())[1])
            rows.append((date, value))
    return rows


def compute_stats(series: list[tuple[str, float]], label: str) -> dict:
    values = [v for _, v in series]
    log_returns = [math.log(values[i] / values[i - 1]) for i in range(1, len(values))]
    n = len(log_returns)

    mean_monthly = sum(log_returns) / n
    variance_monthly = sum((r - mean_monthly) ** 2 for r in log_returns) / (n - 1)
    std_monthly = math.sqrt(variance_monthly)

    annual_return = math.exp(mean_monthly * 12) - 1
    annual_volatility = std_monthly * math.sqrt(12)

    return {
        "label": label,
        "months": n,
        "date_start": series[0][0],
        "date_end": series[-1][0],
        "annualised_return": annual_return,
        "annualised_volatility": annual_volatility,
    }


HERE = Path(__file__).parent

datasets = [
    ("NZX", HERE / "SPASTT01NZM661N.csv"),
    ("ASX", HERE / "SPASTT01AUM661N.csv"),
    ("S&P 500", HERE / "SPASTT01USM661N.csv"),
]

results = []
for label, path in datasets:
    if not path.exists():
        print(f"[SKIP] {label}: file not found")
        continue
    series = load_series(path)
    full = compute_stats(series, label)
    series_2005 = [(d, v) for d, v in series if d >= "2005-01-01"]
    since2005 = compute_stats(series_2005, label)
    results.append((label, full, since2005))

# Print comparison table
header = f"{'Market':<12} {'Full Return':>12} {'Full Vol':>10} {'2005+ Return':>14} {'2005+ Vol':>11}  {'Period (full)'}"
print("\n" + header)
print("-" * len(header))
for label, full, s05 in results:
    period = f"{full['date_start'][:7]} – {full['date_end'][:7]}"
    print(
        f"{label:<12} {full['annualised_return']:>11.2%} {full['annualised_volatility']:>10.2%}"
        f" {s05['annualised_return']:>13.2%} {s05['annualised_volatility']:>10.2%}  {period}"
    )

# Save markdown table
md_lines = [
    "# Historical Returns Comparison\n",
    "| Market | Full-history Return | Full-history Volatility | 2005–present Return | 2005–present Volatility | Full period |",
    "|--------|--------------------:|------------------------:|--------------------:|------------------------:|-------------|",
]
for label, full, s05 in results:
    period = f"{full['date_start'][:7]} – {full['date_end'][:7]}"
    md_lines.append(
        f"| {label} | {full['annualised_return']:.2%} | {full['annualised_volatility']:.2%}"
        f" | {s05['annualised_return']:.2%} | {s05['annualised_volatility']:.2%} | {period} |"
    )
md_lines.append(
    f"\n_2005–present window: Jan 2005 – {results[0][2]['date_end'][:7] if results else '?'}_"
)

out_path = HERE / "returns_comparison.md"
out_path.write_text("\n".join(md_lines) + "\n")
print(f"\nSaved → {out_path}")
