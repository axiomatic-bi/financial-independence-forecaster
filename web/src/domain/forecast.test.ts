import { describe, expect, it } from 'vitest';

import { calculateForecast, calculateMonthlyPension, calculateMortgagePayment } from './forecast';

describe('forecast domain helpers', () => {
  it('calculates percentage pension contribution', () => {
    expect(calculateMonthlyPension(5000, 'percentage', 5, 0)).toBe(250);
  });

  it('calculates fixed pension contribution', () => {
    expect(calculateMonthlyPension(5000, 'fixed', 300, 5)).toBe(300);
  });

  it('returns zero mortgage payment for invalid inputs', () => {
    expect(calculateMortgagePayment(0, 4, 25)).toBe(0);
    expect(calculateMortgagePayment(250000, 0, 25)).toBeCloseTo(833.3333333, 5);
    expect(calculateMortgagePayment(250000, 4, 0)).toBe(0);
  });

  it('returns reasonable mortgage payment for standard case', () => {
    const payment = calculateMortgagePayment(300000, 5, 30);
    expect(payment).toBeGreaterThan(1500);
    expect(payment).toBeLessThan(1700);
  });
});

describe('calculateForecast', () => {
  it('returns expected shapes for one-year simulation', () => {
    const result = calculateForecast({
      income: 6000,
      expenses: 3000,
      isaAssets: 10000,
      isaRate: 5,
      nonIsaAssets: 5000,
      nonIsaRate: 3,
      months: 12,
      pensionContribution: 5,
      pensionType: 'percentage',
      pensionRate: 5,
      pensionInterestRate: 5,
      pensionTaxReliefRate: 20,
      inflationRate: 2,
      wageIncreaseRate: 3,
      isaAnnualContribution: 20000,
    });

    expect(result.dates).toHaveLength(13);
    expect(result.total_wealth).toHaveLength(13);
    expect(result.isa_values).toHaveLength(13);
    expect(result.non_isa_values).toHaveLength(13);
    expect(result.pension_values).toHaveLength(13);
    expect(result.final_wealth).toBeGreaterThanOrEqual(0);
  });

  it('handles zeroed edge inputs without crashing', () => {
    const result = calculateForecast({
      income: 0,
      expenses: 0,
      isaAssets: 0,
      isaRate: 0,
      nonIsaAssets: 0,
      nonIsaRate: 0,
      months: 24,
      pensionType: 'percentage',
      pensionContribution: 0,
      pensionRate: 0,
      pensionInterestRate: 0,
      pensionTaxReliefRate: 0,
      inflationRate: 0,
      wageIncreaseRate: 0,
      isaAnnualContribution: 20000,
    });

    expect(result.final_wealth).toBe(0);
    expect(result.withdrawal_39_annual).toBe(0);
  });

  it('applies SIPP tax relief to pension pot but not cashflow deduction', () => {
    const result = calculateForecast({
      income: 5000,
      expenses: 2000,
      isaAssets: 0,
      isaRate: 0,
      nonIsaAssets: 0,
      nonIsaRate: 0,
      months: 1,
      pensionAssets: 10000,
      pensionableMonthlyPay: 5000,
      pensionContribution: 0,
      pensionType: 'fixed',
      pensionRate: 0,
      employerPensionContributionRate: 0,
      sippType: 'fixed',
      sippContribution: 100,
      sippRate: 0,
      pensionInterestRate: 0,
      pensionTaxReliefRate: 20,
      inflationRate: 2,
      wageIncreaseRate: 3,
      isaAnnualContribution: 20000,
    });

    expect(result.monthly_savings).toBeCloseTo(2900, 5);
    expect(result.pension_values[result.pension_values.length - 1]).toBeCloseTo(10125, 5);
  });

  it('applies higher-rate selected relief as extra cash relief while keeping relief-at-source pension top-up', () => {
    const result = calculateForecast({
      income: 5000,
      expenses: 2000,
      isaAssets: 0,
      isaRate: 0,
      nonIsaAssets: 0,
      nonIsaRate: 0,
      months: 1,
      pensionAssets: 10000,
      pensionableMonthlyPay: 5000,
      pensionContribution: 0,
      pensionType: 'fixed',
      pensionRate: 0,
      employerPensionContributionRate: 0,
      sippType: 'fixed',
      sippContribution: 100,
      sippRate: 0,
      pensionInterestRate: 0,
      pensionTaxReliefRate: 40,
      inflationRate: 2,
      wageIncreaseRate: 3,
      isaAnnualContribution: 20000,
    });

    expect(result.monthly_savings).toBeCloseTo(2920, 5);
    expect(result.pension_values[result.pension_values.length - 1]).toBeCloseTo(10125, 5);
  });

  it('does not double-deduct workplace pension from net-income cashflow', () => {
    const result = calculateForecast({
      income: 5000,
      expenses: 2000,
      isaAssets: 0,
      isaRate: 0,
      nonIsaAssets: 0,
      nonIsaRate: 0,
      months: 1,
      pensionAssets: 10000,
      pensionableMonthlyPay: 5000,
      pensionContribution: 5,
      pensionType: 'percentage',
      pensionRate: 5,
      employerPensionContributionRate: 3,
      sippType: 'fixed',
      sippContribution: 0,
      sippRate: 0,
      pensionInterestRate: 0,
      pensionTaxReliefRate: 20,
      inflationRate: 2,
      wageIncreaseRate: 3,
      isaAnnualContribution: 20000,
    });

    expect(result.monthly_savings).toBeCloseTo(3000, 5);
    expect(result.pension_values[result.pension_values.length - 1]).toBeCloseTo(10400, 5);
  });

  it('includes mortgage repayments in FI affordability until mortgage is repaid', () => {
    const result = calculateForecast({
      income: 0,
      expenses: 1000,
      isaAssets: 400000,
      isaRate: 0,
      nonIsaAssets: 0,
      nonIsaRate: 0,
      months: 12,
      mortgageBalance: 240000,
      mortgageTerm: 40,
      mortgageInterestRate: 1,
      pensionInterestRate: 0,
    });

    expect(result.years_until_expenses_covered).toBeNull();
  });

  it('applies CGT only to realized gains for non-ISA withdrawals (zero other income assumption)', () => {
    const result = calculateForecast({
      income: 0,
      expenses: 0,
      isaAssets: 0,
      isaRate: 0,
      nonIsaAssets: 300000,
      nonIsaCostBasis: 100000,
      nonIsaRate: 0,
      months: 0,
      pensionInterestRate: 0,
    });

    expect(result.withdrawal_39_annual).toBeCloseTo(10836, 5);
  });

  it('calculates total_gain from full initial wealth baseline', () => {
    const result = calculateForecast({
      income: 0,
      expenses: 0,
      isaAssets: 10000,
      isaRate: 0,
      nonIsaAssets: 5000,
      nonIsaRate: 0,
      months: 0,
      homeValue: 300000,
      mortgageBalance: 100000,
      pensionAssets: 25000,
      pensionInterestRate: 0,
    });
    expect(result.total_gain).toBeCloseTo(0, 5);
  });
});
