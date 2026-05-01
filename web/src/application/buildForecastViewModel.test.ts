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
  householdMode: Number(inputs.isa_annual_contribution) >= 30000 ? ('couple' as const) : ('individual' as const),
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
      expect(vm.raw.final_wealth, `Scenario ${scenario.scenario.name} final_wealth`).toBeCloseTo(
        Number(scenario.result_snapshot.scalar_outputs.final_wealth),
        0,
      );
      expect(vm.raw.final_pension, `Scenario ${scenario.scenario.name} final_pension`).toBeCloseTo(
        Number(scenario.result_snapshot.scalar_outputs.final_pension),
        0,
      );
      expect(vm.raw.withdrawal_39_annual, `Scenario ${scenario.scenario.name} withdrawal_39_annual`).toBeCloseTo(
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
    const passiveIncomeKpi = vm.kpis.find((kpi) => kpi.label.includes('Passive income at FI'));
    const savingsRateKpi = vm.kpis.find((kpi) => kpi.label === 'Savings rate at FI');
    expect(passiveIncomeKpi?.value).toMatch(/^£/);
    expect(passiveIncomeKpi?.value).not.toContain('NaN');
    expect(savingsRateKpi?.value).toMatch(/%$/);
    expect(savingsRateKpi?.value).not.toContain('NaN');
    expect(vm.financeRows[0].values.length).toBe(6);
    const monthlySurplusIsaRow = vm.financeRows.find((row) => row.label === 'Monthly surplus (ISA)');
    const monthlySurplusNonIsaRow = vm.financeRows.find((row) => row.label === 'Monthly surplus (non-ISA)');
    expect(monthlySurplusIsaRow?.values.length).toBe(6);
    expect(monthlySurplusNonIsaRow?.values.length).toBe(6);
    expect(vm.fiHealthRows.length).toBe(2);
    expect(vm.fiHealthRows[0]?.label).toBe('Liquid runway (years)');
    expect(vm.fiHealthRows[1]?.label).toBe('FI coverage ratio');
    expect(vm.fiHealthRows[0]?.values.length).toBe(6);
    expect(vm.fiHealthRows[1]?.values.length).toBe(6);
    const totalRowIndex = vm.netWorthRows.findIndex((row) => row.label === 'Total net worth');
    expect(totalRowIndex).toBeGreaterThanOrEqual(0);
    expect(vm.netWorthRows[totalRowIndex].isTotal).toBe(true);
    expect(vm.netWorthRows[totalRowIndex + 1]?.label).toBe("Real net worth (today's £)");
    expect(vm.netWorthRows[totalRowIndex + 1]?.values.length).toBe(6);
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
    expect(vm.raw.household_mode).toBe('individual');
    expect(vm.raw.cgt_annual_exempt_amount).toBe(3000);
  });

  it('applies couple-mode ISA and CGT assumptions without rescaling cashflow inputs', () => {
    const vm = buildForecastViewModel({
      ...defaultInputs,
      householdMode: 'couple',
      income: 3200,
      expenses: 1800,
      pensionableMonthlyPay: 3000,
    });
    expect(vm.raw.household_mode).toBe('couple');
    expect(vm.raw.cgt_annual_exempt_amount).toBe(6000);
    expect(vm.raw.income).toBe(3200);
    expect(vm.raw.expenses).toBe(1800);
  });

  it('uses actual modeled ISA/non-ISA contributions in surplus split rows', () => {
    const vm = buildForecastViewModel({
      ...defaultInputs,
      householdMode: 'individual',
      income: 50000,
      expenses: 0,
      isaAssets: 0,
      nonIsaAssets: 0,
      isaRate: 0,
      nonIsaRate: 0,
      forecastYears: 1,
      pensionContribution: 0,
      employerPensionContributionRate: 0,
      sippContribution: 0,
      pensionableMonthlyPay: 0,
    });
    const monthlySurplusIsaRow = vm.financeRows.find((row) => row.label === 'Monthly surplus (ISA)');
    const monthlySurplusNonIsaRow = vm.financeRows.find((row) => row.label === 'Monthly surplus (non-ISA)');
    const parseCurrency = (value: string): number => Number(value.replace(/[^0-9.-]/g, ''));
    const monthlyIsaCap = defaultInputs.isaAnnualContribution / 12;
    const isaAtOneYear = parseCurrency(monthlySurplusIsaRow?.values[1] ?? '£0');
    const nonIsaAtOneYear = parseCurrency(monthlySurplusNonIsaRow?.values[1] ?? '£0');
    // Regression guard: row should reflect simulated annual-cap behavior, not a synthetic monthly ISA cap split.
    expect(isaAtOneYear).not.toBe(Math.round(monthlyIsaCap));
    expect(nonIsaAtOneYear).toBeGreaterThan(0);
  });

  it('keeps explicitly entered zero pensionable pay in calculations', () => {
    const vm = buildForecastViewModel({
      ...defaultInputs,
      income: 3000,
      expenses: 1000,
      pensionableMonthlyPay: 0,
      pensionType: 'percentage',
      pensionContribution: 10,
      employerPensionContributionRate: 5,
      sippContribution: 0,
      forecastYears: 1,
    });
    expect(vm.raw.pensionable_monthly_pay).toBe(0);
    expect(vm.raw.workplace_pension_contribution_values[1]).toBeCloseTo(0, 5);
  });
});
