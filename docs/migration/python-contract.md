# Python Forecast Contract Snapshot

This document captures the current Python-side contract before TypeScript migration.

## Source Modules

- Domain engine: `src/financial_forecaster/forecast.py`
- UI callbacks/orchestration: `src/financial_forecaster/callbacks.py`
- Display builders: `src/financial_forecaster/components/charts.py`
- Input defaults and IDs: `src/financial_forecaster/components/input_sections.py`

## Callback Input Mapping

The primary dashboard update callback consumes these input IDs:

- `monthly-income`
- `monthly-expenses`
- `isa-assets`
- `isa-interest-rate`
- `non-isa-assets`
- `non-isa-interest-rate`
- `home-value`
- `mortgage-balance`
- `mortgage-term`
- `mortgage-interest-rate`
- `home-appreciation-rate`
- `forecast-period` (years)
- `isa-annual-contribution`
- `pension-type` (`percentage` or `fixed`)
- `pension-assets`
- `pension-contribution`
- `employer-pension-contribution-rate`
- `pension-interest-rate`
- `pension-tax-relief-rate`
- `inflation-rate`
- `wage-increase-rate`

## Domain Function Contract

`calculate_forecast(...)` returns a dictionary with:

- Date/time axis: `dates`
- Asset and wealth series: `total_wealth`, `isa_values`, `non_isa_values`, `pension_values`, `home_equity_values`
- Cashflow series: `income_values`, `expense_values`, `monthly_savings_values`, `mortgage_payment_values`
- Mortgage series/state: `mortgage_balance_values`, `final_mortgage_balance`, `monthly_mortgage_payment`
- Summary scalars: `final_wealth`, `final_pension`, `total_gain`, `withdrawal_39_annual`, `final_isa`, `final_monthly_expenses`, `final_annual_expenses`
- FI signals: `years_until_expenses_covered`, `fi_date`, `fi_month_index`, `fi_evaluation_end_month`

## Default and Fallback Behavior

- `months = forecast_period * 12` in callback, with fallback to `480` when period is missing.
- Input `None`/falsey values are coerced to zero in domain function for most numeric fields.
- Callback-level defaults:
  - `mortgage_interest_rate or 3.83`
  - `home_appreciation_rate or 3.0`
  - `pension_interest_rate or 5.0`
  - `inflation_rate or 2.0`
  - `wage_increase_rate or 3.0`
  - `isa_annual_contribution or 40000`
- FI withdrawal annual formula combines ISA + tax-free non-ISA tranche + taxed non-ISA tranche with 3.9% rule and 24% tax haircut on taxed tranche.

## Snapshot Fixtures

Canonical fixtures are generated from Python using:

- `scripts/generate_forecast_fixtures.py`
- output: `web/src/fixtures/forecast-fixtures.json`

These fixtures are the baseline for parity tests in the TypeScript port.
