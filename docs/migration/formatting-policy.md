# Formatting and Semantic Policy

This policy defines how forecast outputs must be interpreted and rendered in both Python and TypeScript implementations.

## Value Semantics

- Currency values are **nominal GBP** (not inflation-adjusted to real terms).
- `income_values` and `expense_values` already include annual wage/inflation growth effects from the simulation.
- Percent displays use one decimal place where shown in KPI cards.

## Cadence Semantics

- Domain simulation runs on a **monthly** cadence.
- Primary series outputs (`isa_values`, `non_isa_values`, `pension_values`, `home_equity_values`, `income_values`, `expense_values`) are monthly.
- Withdrawal KPI uses annualized formulas derived from monthly state at a selected month index.

## Chart Aggregation Rules

- Asset and withdrawal charts are displayed by year.
- Yearly chart points should use **December values** for each year.
- If the final simulation point is not December, include the final endpoint as an additional year point.
- Existing Python behavior extends the final point to year-end for display; the TypeScript version should keep behavior parity unless explicitly changed in a later release.

## Table Timepoints

- Summary tables use fixed columns: `Current`, `1Y`, `5Y`, `10Y`, `20Y`, `FI`.
- Timepoint lookup is monthly index based (`years * 12`) clamped to available range.
- `FI` column uses the FI month index if available; otherwise it falls back to the last available index.

## Number Formatting

- Currency: `£` prefix, thousands separator, no decimals for KPI/table display.
- Chart hover values can include 2 decimals for readability.
- Fixture snapshots round numeric values to 2 decimals for stable parity assertions.
