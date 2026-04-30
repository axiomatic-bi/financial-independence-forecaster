/**
 * UK baseline assumptions used for pre-populated form defaults.
 *
 * Update these values when newer ONS releases are available.
 * Sources (retrieved Apr 2026):
 * - ONS Average household income FYE 2024: median household disposable income = GBP 36,700
 * - ONS Family Spending FYE 2024: average weekly household expenditure = GBP 623.30
 */
const ONS_MEDIAN_ANNUAL_HOUSEHOLD_DISPOSABLE_INCOME_GBP = 36_700;
const ONS_AVERAGE_WEEKLY_EXPENDITURE_GBP = 623.3;

export const UK_BASELINE_DEFAULTS = {
  monthlyIncomeAfterTax: Math.round(ONS_MEDIAN_ANNUAL_HOUSEHOLD_DISPOSABLE_INCOME_GBP / 12),
  monthlyExpensesExMortgage: Math.round((ONS_AVERAGE_WEEKLY_EXPENDITURE_GBP * 52) / 12),
} as const;

