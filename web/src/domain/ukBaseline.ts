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
const HOUSEHOLD_TO_INDIVIDUAL_FACTOR = 0.5;
const ASSUMED_NET_TO_GROSS_MULTIPLIER = 1.35;

const monthlyHouseholdIncomeAfterTax = Math.round(ONS_MEDIAN_ANNUAL_HOUSEHOLD_DISPOSABLE_INCOME_GBP / 12);
const monthlyHouseholdIncomeGross = Math.round(monthlyHouseholdIncomeAfterTax * ASSUMED_NET_TO_GROSS_MULTIPLIER);
const monthlyHouseholdExpensesExMortgage = Math.round((ONS_AVERAGE_WEEKLY_EXPENDITURE_GBP * 52) / 12);

export const UK_BASELINE_DEFAULTS = {
  monthlyIncomeAfterTax: Math.round(monthlyHouseholdIncomeAfterTax * HOUSEHOLD_TO_INDIVIDUAL_FACTOR),
  monthlyIncomeGross: Math.round(monthlyHouseholdIncomeGross * HOUSEHOLD_TO_INDIVIDUAL_FACTOR),
  monthlyExpensesExMortgage: Math.round(monthlyHouseholdExpensesExMortgage * HOUSEHOLD_TO_INDIVIDUAL_FACTOR),
} as const;

export const UK_BASELINE_BY_HOUSEHOLD_MODE = {
  individual: {
    monthlyIncomeAfterTax: Math.round(monthlyHouseholdIncomeAfterTax * HOUSEHOLD_TO_INDIVIDUAL_FACTOR),
    monthlyIncomeGross: Math.round(monthlyHouseholdIncomeGross * HOUSEHOLD_TO_INDIVIDUAL_FACTOR),
    monthlyExpensesExMortgage: Math.round(monthlyHouseholdExpensesExMortgage * HOUSEHOLD_TO_INDIVIDUAL_FACTOR),
  },
  couple: {
    monthlyIncomeAfterTax: monthlyHouseholdIncomeAfterTax,
    monthlyIncomeGross: monthlyHouseholdIncomeGross,
    monthlyExpensesExMortgage: monthlyHouseholdExpensesExMortgage,
  },
} as const;

