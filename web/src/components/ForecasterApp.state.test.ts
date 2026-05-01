import { describe, expect, it } from 'vitest';

import { getIsaAnnualContributionForHousehold } from '../domain/forecast';
import { UK_BASELINE_BY_HOUSEHOLD_MODE } from '../domain/ukBaseline';
import { defaultInputs } from '../application/buildForecastViewModel';
import { applyHouseholdDerivedValues, deriveInitialInputsFromStorage, modeAwareDefaults } from './ForecasterApp';

describe('ForecasterApp state helpers', () => {
  it('derives household ISA allowance from selected mode', () => {
    const individual = applyHouseholdDerivedValues({ ...defaultInputs, householdMode: 'individual', isaAnnualContribution: 99999 });
    const couple = applyHouseholdDerivedValues({ ...defaultInputs, householdMode: 'couple', isaAnnualContribution: 1 });

    expect(individual.isaAnnualContribution).toBe(getIsaAnnualContributionForHousehold('individual'));
    expect(couple.isaAnnualContribution).toBe(getIsaAnnualContributionForHousehold('couple'));
  });

  it('resets to mode-aware UK baseline defaults', () => {
    const individualDefaults = modeAwareDefaults('individual');
    const coupleDefaults = modeAwareDefaults('couple');

    expect(individualDefaults.income).toBe(UK_BASELINE_BY_HOUSEHOLD_MODE.individual.monthlyIncomeAfterTax);
    expect(individualDefaults.pensionableMonthlyPay).toBe(UK_BASELINE_BY_HOUSEHOLD_MODE.individual.monthlyIncomeGross);
    expect(coupleDefaults.income).toBe(UK_BASELINE_BY_HOUSEHOLD_MODE.couple.monthlyIncomeAfterTax);
    expect(coupleDefaults.pensionableMonthlyPay).toBe(UK_BASELINE_BY_HOUSEHOLD_MODE.couple.monthlyIncomeGross);
  });

  it('normalizes migrated localStorage payload and enforces safe values', () => {
    const stored = JSON.stringify({
      householdMode: 'couple',
      isaAnnualContribution: 12345,
      income: 4500,
      pensionAssets: -500,
    });

    const hydrated = deriveInitialInputsFromStorage(stored);

    expect(hydrated.householdMode).toBe('couple');
    expect(hydrated.isaAnnualContribution).toBe(getIsaAnnualContributionForHousehold('couple'));
    expect(hydrated.income).toBe(4500);
    expect(hydrated.pensionAssets).toBe(0);
  });

  it('falls back to app defaults for empty storage', () => {
    expect(deriveInitialInputsFromStorage(null)).toEqual(defaultInputs);
  });
});
