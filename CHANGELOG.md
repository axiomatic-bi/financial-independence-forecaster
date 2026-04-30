# Changes Made

## 1. Updated Default Input Values
Changed the default values in `components/inputs.py` to match your provided screenshot:
- **Monthly Income**: 7400 (was 3000)
- **Monthly Expenses**: 3000 (was 1500)
- **ISA Assets**: 120000 (was 10000)
- **Non-ISA Assets**: 10000 (was 5000)
- **Forecast Period**: 120 months (was 24 months) - 10 year default

Note: Interest rates remain the same (ISA 7%, Non-ISA 3.5%)

## 2. Added 3.9% Withdrawal Rate Tracking
Enhanced `forecast.py` to calculate sustainable 3.9% withdrawal rates:
- **Monthly Withdrawal**: 3.9% annual rate divided by 12
- **Annual Withdrawal**: 3.9% of final ISA value annually
- **Final ISA Value**: Projected ISA balance at end of forecast period

These values are included in the forecast data and displayed in the summary stats.

## 3. Added "Years Until Expenses Covered" Calculation
Added logic to track when the 3.9% withdrawal rate will be sufficient to cover monthly expenses:
- Iterates through each month of the forecast
- Finds the first month where monthly withdrawal >= monthly expenses
- Accounts for inflation-adjusted expenses
- Returns `None` if expenses are never covered within the forecast period
- Displays in red (danger color) if never covered, green (success color) if covered

## 4. New 3.9% Withdrawal Chart
Created `build_withdrawal_chart()` in `components/charts.py` showing:
- **Blue area chart**: Monthly 3.9% withdrawal amount over time
- **Red dashed line**: Monthly expenses (adjusted for inflation)
- This visual immediately shows the financial independence point where withdrawals cover expenses

## 5. Updated Summary Statistics
Enhanced `build_summary_stats()` with 5 new metrics:
1. **Final ISA Value**: Projected ISA balance
2. **3.9% Monthly Withdrawal**: Monthly sustainable withdrawal
3. **3.9% Annual Withdrawal**: Annual sustainable withdrawal
4. **Final Monthly Expenses**: Inflation-adjusted expenses at end of period
5. **Years Until Expenses Covered**: Time to financial independence via 3.9% rule

The statistics grid now displays 15 metrics total (was 10), organized in 2 columns for clarity.

## 6. Updated Dashboard Layout
- Added new withdrawal rate chart to the charts section
- All 4 charts now display:
  1. Total Wealth Forecast
  2. Monthly Savings
  3. Asset Breakdown (ISA/Non-ISA/Pension)
  4. 3.9% Withdrawal vs Expenses

## 7. Updated Callbacks
Modified `callbacks.py` to:
- Import the new `build_withdrawal_chart` function
- Add new output for the withdrawal chart
- Pass additional parameters to `build_summary_stats()`

---

## Financial Independence Insights
The new 3.9% withdrawal feature implements the **4% Safe Withdrawal Rate** rule (using the more conservative 3.9%):
- This is based on historical market returns (~7%) minus inflation (~2.5%)
- Shows approximately how much you could withdraw yearly from your ISA
- Highlights when passive income covers your living expenses
- Useful for FIRE (Financial Independence, Retire Early) planning

### Example Scenario with Your Defaults:
- Starting ISA: £120,000
- Monthly expenses: £3,000
- At completion (10 years):
  - If ISA has grown to ~£240,000, your 3.9% withdrawal would be ~£780/month
  - Still short of £3,000 expenses, but combined with other income/pension it may be sufficient
  - The chart makes it easy to see if/when you'll reach financial independence goals
