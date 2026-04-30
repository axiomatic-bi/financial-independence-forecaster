import { describe, expect, it } from 'vitest';

import fixtureData from '../fixtures/forecast-fixtures.json';
import { UK_BASELINE_DEFAULTS } from '../domain/ukBaseline';
import { buildForecastViewModel, defaultInputs } from './buildForecastViewModel';

interface ScenarioFixture {
  scenario: {
    name: string;
    inputs: Record<string, number | string>;
  };
  result_snapshot: {
    scalar_outputs: Record<string, number | string | null>;
    series: Record<string, number[]>;
  };
}

const scenarios = (fixtureData as { scenarios: ScenarioFixture[] }).scenarios;

const mapFixtureInputs = (inputs: Record<string, number | string>) => ({
  income: Number(inputs.income),
  expenses: Number(inputs.expenses),
  pensionableMonthlyPay: Number(inputs.pensionable_monthly_pay ?? inputs.income),
  isaAssets: Number(inputs.isa_assets),
  isaRate: Number(inputs.isa_rate),
  nonIsaAssets: Number(inputs.non_isa_assets),
  nonIsaRate: Number(inputs.non_isa_rate),
  forecastYears: Number(inputs.months) / 12,
  homeValue: Number(inputs.home_value),
  mortgageBalance: Number(inputs.mortgage_balance),
  mortgageTerm: Number(inputs.mortgage_term),
  mortgageInterestRate: Number(inputs.mortgage_interest_rate),
  homeAppreciationRate: Number(inputs.home_appreciation_rate),
  isaAnnualContribution: Number(inputs.isa_annual_contribution),
  pensionType: (inputs.pension_type as 'percentage' | 'fixed') ?? 'percentage',
  pensionAssets: Number(inputs.pension_assets),
  pensionContribution: Number(inputs.pension_contribution),
  employerPensionContributionRate: Number(inputs.employer_pension_contribution_rate),
  pensionInterestRate: Number(inputs.pension_interest_rate),
  pensionTaxReliefRate: Number(inputs.pension_tax_relief_rate),
  sippContribution: Number(inputs.sipp_contribution ?? 0),
  inflationRate: Number(inputs.inflation_rate),
  wageIncreaseRate: Number(inputs.wage_increase_rate),
  extractionRate: 3.9,
});

describe('buildForecastViewModel parity', () => {
  it('uses centralized UK baseline defaults for income and expenses', () => {
    expect(defaultInputs.income).toBe(UK_BASELINE_DEFAULTS.monthlyIncomeAfterTax);
    expect(defaultInputs.expenses).toBe(UK_BASELINE_DEFAULTS.monthlyExpensesExMortgage);
    expect(defaultInputs.income).toBeGreaterThan(defaultInputs.expenses);
  });

  it('matches scalar outputs for baseline fixtures', () => {
    for (const scenario of scenarios) {
      const vm = buildForecastViewModel(mapFixtureInputs(scenario.scenario.inputs));
      expect(vm.raw.final_wealth).toBeCloseTo(Number(scenario.result_snapshot.scalar_outputs.final_wealth), 0);
      expect(vm.raw.final_pension).toBeCloseTo(Number(scenario.result_snapshot.scalar_outputs.final_pension), 0);
      expect(vm.raw.withdrawal_39_annual).toBeCloseTo(
        Number(scenario.result_snapshot.scalar_outputs.withdrawal_39_annual),
        0,
      );
    }
  });

  it('keeps recompute latency guardrail for default inputs', () => {
    const start = performance.now();
    buildForecastViewModel(defaultInputs);
    const elapsed = performance.now() - start;
    expect(elapsed).toBeLessThan(200);
  });

  it('produces yearly chart-ready labels and table rows', () => {
    const vm = buildForecastViewModel(defaultInputs);
    expect(vm.yearlyLabels.length).toBeGreaterThan(0);
    expect(vm.assetSeries.length).toBe(4);
    expect(vm.withdrawalSeries.length).toBe(2);
    const passiveIncomeKpi = vm.kpis.find((kpi) => kpi.label.includes('Passive Income at FI'));
    const savingsRateKpi = vm.kpis.find((kpi) => kpi.label === 'Savings Rate at FI');
    expect(passiveIncomeKpi?.value).toMatch(/^£/);
    expect(passiveIncomeKpi?.value).not.toContain('NaN');
    expect(savingsRateKpi?.value).toMatch(/%$/);
    expect(savingsRateKpi?.value).not.toContain('NaN');
    expect(vm.financeRows[0].values.length).toBe(6);
    expect(vm.netWorthRows[vm.netWorthRows.length - 1].isTotal).toBe(true);
  });

  it('normalizes fallback defaults when falsy values supplied', () => {
    const vm = buildForecastViewModel({
      ...defaultInputs,
      forecastYears: 0,
      mortgageInterestRate: 0,
      homeAppreciationRate: 0,
      pensionInterestRate: 0,
      inflationRate: 0,
      wageIncreaseRate: 0,
      isaAnnualContribution: 0,
    });
    expect(vm.raw.months).toBe(40 * 12);
    expect(vm.raw.mortgage_interest_rate).toBe(3.83);
    expect(vm.raw.inflation_rate).toBe(2);
    expect(vm.raw.wage_increase_rate).toBe(3);
  });
});
