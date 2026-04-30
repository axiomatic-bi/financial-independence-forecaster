import { calculateForecast } from '../domain/forecast';
import type { ForecastInputs, ForecastResult, ForecastViewModel, TableRow } from '../types/forecast';

const TIMEPOINTS_YEARS = [0, 1, 5, 10, 20];

const currency = (value: number): string => `£${value.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
const percent = (value: number): string => `${value.toFixed(1)}%`;

const safeValue = (values: number[], index: number): number => {
  if (!values.length) return 0;
  const i = Math.min(Math.max(index, 0), values.length - 1);
  return values[i];
};

const monthFromYears = (years: number, maxMonth: number): number => Math.min(years * 12, maxMonth);

const extendSeriesToYearEnd = (dates: string[], values: number[]): { dates: string[]; values: number[] } => {
  if (!dates.length || !values.length) return { dates, values };
  const [lastYear, lastMonthTxt] = dates[dates.length - 1].split('-');
  const lastMonth = Number(lastMonthTxt);
  if (lastMonth === 12) return { dates, values };
  const remainingMonths = 12 - lastMonth;
  const growth = values.length >= 2 && values[values.length - 2] !== 0 ? values[values.length - 1] / values[values.length - 2] : 1;
  const projected = values[values.length - 1] * growth ** remainingMonths;
  return {
    dates: [...dates.slice(0, -1), `${lastYear}-12`],
    values: [...values.slice(0, -1), projected],
  };
};

const yearEndIndices = (dates: string[]): number[] => {
  const december = dates
    .map((label, i) => ({ label, i }))
    .filter(({ label }) => label.endsWith('-12'))
    .map(({ i }) => i);
  if (!dates.length) return december;
  const last = dates.length - 1;
  if (!december.includes(last)) december.push(last);
  return december;
};

const sample = (values: number[], indices: number[]): number[] => indices.map((i) => values[i]);

const buildFinanceRows = (result: ForecastResult): TableRow[] => {
  const maxMonth = result.income_values.length - 1;
  const fiMonth = result.fi_month_index ?? maxMonth;
  const metrics: [string, number[]][] = [
    ['Monthly Income', result.income_values],
    ['Monthly Expenses', result.expense_values],
    ['Monthly Mortgage Repayments', result.mortgage_payment_values],
    ['Monthly Savings', result.monthly_savings_values],
  ];
  return metrics.map(([label, series]) => ({
    label,
    values: [...TIMEPOINTS_YEARS.map((y) => currency(safeValue(series, monthFromYears(y, maxMonth)))), currency(safeValue(series, fiMonth))],
  }));
};

const buildNetWorthRows = (result: ForecastResult): TableRow[] => {
  const maxMonth = result.income_values.length - 1;
  const fiMonth = result.fi_month_index ?? maxMonth;
  const metrics: [string, number[]][] = [
    ['Pension Pot', result.pension_values],
    ['ISA Investments', result.isa_values],
    ['Non-ISA Investments (GIA)', result.non_isa_values],
    ['Home Equity', result.home_equity_values],
  ];
  const rows = metrics.map(([label, series]) => ({
    label,
    values: [...TIMEPOINTS_YEARS.map((y) => currency(safeValue(series, monthFromYears(y, maxMonth)))), currency(safeValue(series, fiMonth))],
  }));
  const totalValues = [...TIMEPOINTS_YEARS, -1].map((year) => {
    const index = year === -1 ? fiMonth : monthFromYears(year, maxMonth);
    const total =
      safeValue(result.pension_values, index) +
      safeValue(result.isa_values, index) +
      safeValue(result.non_isa_values, index) +
      safeValue(result.home_equity_values, index);
    return currency(total);
  });
  return [...rows, { label: 'Total Net Worth', values: totalValues, isTotal: true }];
};

export const normalizeInputs = (inputs: ForecastInputs): ForecastInputs => ({
  ...inputs,
  forecastYears: inputs.forecastYears || 40,
  mortgageInterestRate: inputs.mortgageInterestRate || 3.83,
  homeAppreciationRate: inputs.homeAppreciationRate || 3.0,
  pensionInterestRate: inputs.pensionInterestRate || 5.0,
  inflationRate: inputs.inflationRate || 2.0,
  wageIncreaseRate: inputs.wageIncreaseRate || 3.0,
  isaAnnualContribution: inputs.isaAnnualContribution || 40000,
});

export const buildForecastViewModel = (rawInputs: ForecastInputs): ForecastViewModel => {
  const inputs = normalizeInputs(rawInputs);
  const result = calculateForecast({
    income: inputs.income,
    expenses: inputs.expenses,
    isaAssets: inputs.isaAssets,
    isaRate: inputs.isaRate,
    nonIsaAssets: inputs.nonIsaAssets,
    nonIsaRate: inputs.nonIsaRate,
    months: inputs.forecastYears * 12,
    homeValue: inputs.homeValue,
    mortgageBalance: inputs.mortgageBalance,
    mortgageTerm: inputs.mortgageTerm,
    mortgageInterestRate: inputs.mortgageInterestRate,
    homeAppreciationRate: inputs.homeAppreciationRate,
    pensionAssets: inputs.pensionAssets,
    pensionContribution: inputs.pensionContribution,
    employerPensionContributionRate: inputs.employerPensionContributionRate,
    pensionType: inputs.pensionType,
    pensionRate: inputs.pensionType === 'percentage' ? inputs.pensionContribution : 5.0,
    pensionInterestRate: inputs.pensionInterestRate,
    pensionTaxReliefRate: inputs.pensionTaxReliefRate,
    inflationRate: inputs.inflationRate,
    wageIncreaseRate: inputs.wageIncreaseRate,
    isaAnnualContribution: inputs.isaAnnualContribution,
  });
  const fiIndex = result.fi_month_index ?? Math.max(result.isa_values.length - 1, 0);
  const fiIsa = result.isa_values[fiIndex];
  const fiNonIsa = result.non_isa_values[fiIndex];
  const fiIncome = result.income_values[fiIndex];
  const fiSavings = result.monthly_savings_values[fiIndex];
  const fiNonIsaTaxFree = Math.min(fiNonIsa, 3000);
  const fiNonIsaTaxed = Math.max(0, fiNonIsa - 3000);
  const fiWithdrawalAnnual = fiIsa * 0.039 + fiNonIsaTaxFree * 0.039 + fiNonIsaTaxed * 0.039 * 0.76;
  const fiSavingsRate = fiIncome > 0 ? (fiSavings / fiIncome) * 100 : 0;
  const yearsText = result.years_until_expenses_covered === null ? 'Never' : `${result.years_until_expenses_covered.toFixed(1)}`;

  const extendedIsa = extendSeriesToYearEnd(result.dates, result.isa_values);
  const extendedNonIsa = extendSeriesToYearEnd(result.dates, result.non_isa_values);
  const extendedPension = extendSeriesToYearEnd(result.dates, result.pension_values);
  const extendedHome = extendSeriesToYearEnd(result.dates, result.home_equity_values);
  const indices = yearEndIndices(extendedIsa.dates);
  const yearlyLabels = indices.map((i) => extendedIsa.dates[i].slice(0, 4));
  const assetSeries = [
    { name: 'ISA Assets', values: sample(extendedIsa.values, indices) },
    { name: 'Non-ISA Assets', values: sample(extendedNonIsa.values, indices) },
    { name: 'Pension (SIPP)', values: sample(extendedPension.values, indices) },
    { name: 'Home Equity', values: sample(extendedHome.values, indices) },
  ];

  const extendedExpenses = extendSeriesToYearEnd(result.dates, result.expense_values);
  const withdrawalSeries = [
    { name: '3.9% Annual Withdrawal', values: sample(extendedIsa.values.map((v) => v * 0.039), indices) },
    { name: 'Annual Expenses (Inflation-Adjusted)', values: sample(extendedExpenses.values.map((v) => v * 12), indices) },
  ];

  return {
    kpis: [
      { label: '3.9% Withdrawal', value: currency(fiWithdrawalAnnual) },
      { label: 'FI Date', value: result.fi_date ?? 'Not reached' },
      { label: 'Years Until FI', value: yearsText },
      { label: 'Savings Rate', value: percent(fiSavingsRate) },
    ],
    yearlyLabels,
    assetSeries,
    withdrawalSeries,
    financeRows: buildFinanceRows(result),
    netWorthRows: buildNetWorthRows(result),
    raw: result,
  };
};

export const defaultInputs: ForecastInputs = {
  income: 0,
  expenses: 0,
  isaAssets: 0,
  isaRate: 7,
  nonIsaAssets: 0,
  nonIsaRate: 3.5,
  forecastYears: 30,
  homeValue: 0,
  mortgageBalance: 0,
  mortgageTerm: 0,
  mortgageInterestRate: 3.83,
  homeAppreciationRate: 3,
  isaAnnualContribution: 20000,
  pensionType: 'percentage',
  pensionAssets: 0,
  pensionContribution: 5,
  employerPensionContributionRate: 3,
  pensionInterestRate: 5,
  pensionTaxReliefRate: 20,
  inflationRate: 2,
  wageIncreaseRate: 3,
};
