# Feature Summary: 3.9% Withdrawal Rate Analysis

## What's New

### 1. **3.9% Withdrawal Rate (Safe Withdrawal Rule)**
Shows how much you could sustainably withdraw from your ISA **annually** based on the conservative safe withdrawal rate:
- Calculated as: **ISA Value × 3.9% = Annual Withdrawal**
- Conservative approach useful for retirement planning
- Helps identify when you have passive income to cover expenses

### 2. **Inflation-Adjusted Expenses**
Your expenses grow with inflation annually (you set the rate in inputs):
- Starting expenses: £3,000/month
- After 1 year at 2% inflation: ~£3,060/month
- After 5 years at 2% inflation: ~£3,312/month
- The dashboard tracks all these inflation-adjusted values

### 3. **Years Until Expenses Covered**
Key metric showing **how long until your 3.9% annual withdrawal covers your annual expenses**:
- ✅ Green: You will reach this milestone within the forecast period
- ❌ Red: Expenses will never be covered by 3.9% withdrawal in the forecast period
- Compares **Annual 3.9% Withdrawal** vs **Annual Expenses (Inflation-Adjusted)**
- This is the goal for many pursuing FIRE (Financial Independence, Retire Early)

### 4. **New "Withdrawal vs Expenses" Chart**
Visual representation of your financial independence journey:
- **Blue area**: Your 3.9% **annual** withdrawal amount (grows with ISA)
- **Red dashed line**: Your annual expenses (inflation-adjusted, growing each January)
- **Intersection point**: When you reach financial independence via the 4% rule

### 5. **New Summary Statistics** (4 additional metrics)
- Final ISA Value
- 3.9% Annual Withdrawal
- Final Monthly Expenses (Inflation-Adjusted)
- Final Annual Expenses (Inflation-Adjusted)
- Years Until Expenses Covered

---

## How to Interpret the Results

### Scenario 1: "Never Covered"
If the blue area never meets the red line:
- Your 3.9% withdrawal won't cover expenses even after the forecast period
- Consider: increasing income, decreasing expenses, or extending forecast period

### Scenario 2: "2.5 years"
If they intersect at 2.5 years:
- Your ISA will be large enough that 3.9% withdrawals cover inflation-adjusted expenses
- This is a key milestone for financial independence planning
- Note: Pension and other income sources provide additional security

### Scenario 3: "0.8 years" (Quick Win)
If you start with a large ISA (£120k+ earning 7%):
- You may achieve independence very quickly
- Check the exact intersection point on the withdrawal chart
- Your high savings rate accelerates the timeline

---

## Your Current Configuration

| Parameter | Value |
|-----------|-------|
| Monthly Income | £7,400 |
| Monthly Expenses | £3,000 |
| ISA Assets | £120,000 @ 7% |
| Non-ISA Assets | £10,000 @ 3.5% |
| Forecast Period | 120 months (10 years) |
| Inflation Rate | 2% (affects expenses) |
| Wage Growth | 4% (affects income) |

This shows a healthy savings rate (£4,400/month in savings before pension), which will quickly grow your ISA.

### Example Calculations:
- Year 0: Expenses = £3,000/month (£36,000/year)
- Year 1: Expenses = £3,060/month (£36,720/year) due to 2% inflation
- Year 2: Expenses = £3,121/month (£37,452/year) due to 2% inflation
- Year 5: Expenses = £3,312/month (£39,745/year)
- Year 10: Expenses = £3,657/month (£43,884/year)

As your ISA grows, the 3.9% withdrawal grows too, eventually meeting or exceeding these inflation-adjusted expenses.

---

## Files Modified

1. **components/inputs.py** - Updated default values
2. **forecast.py** - Added 3.9% withdrawal and FI calculation with expense tracking
3. **components/charts.py** - Added withdrawal chart showing annual comparisons
4. **callbacks.py** - Connected new outputs to UI

All changes maintain backward compatibility with existing features.

---

## Technical Details

### Withdrawal Calculation:
```
Annual Withdrawal = Final ISA Value × 0.039
```

### Inflation-Adjusted Expenses:
```
Monthly Expense at Month M = Initial Expense × (1 + inflation_rate/100)^(years_elapsed)
```

### Financial Independence Point:
Occurs when:
```
ISA Value × 0.039 ≥ Monthly Expenses × 12
```

