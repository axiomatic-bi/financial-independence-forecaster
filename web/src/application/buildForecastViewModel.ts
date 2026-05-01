import { calculateForecast, getIsaAnnualContributionForHousehold } from '../domain/forecast';
import { UK_BASELINE_BY_HOUSEHOLD_MODE } from '../domain/ukBaseline';
import type { ForecastInputs, ForecastResult, ForecastViewModel, TableRow } from '../types/forecast';

const TIMEPOINTS_YEARS = [0, 1, 5, 10, 20];
const FI_EVALUATION_MONTHS = 40 * 12;
const UK_CGT_BASIC_RATE = 0.18;

const finiteOrZero = (value: number): number => (Number.isFinite(value) ? value : 0);

const currency = (value: number): string => `£${finiteOrZero(value).toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
const percent = (value: number): string => `${finiteOrZero(value).toFixed(1)}%`;
const extractionRateLabel = (value: number): string => `${finiteOrZero(value).toFixed(1)}%`;
const years = (value: number): string => `${finiteOrZero(value).toFixed(1)}y`;
const ratio = (value: number): string => `${finiteOrZero(value).toFixed(2)}x`;
const MONTH_ABBREVIATIONS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'] as const;

const formatKpiMonthYear = (dateValue: string | null): string => {
  if (!dateValue) {
    return 'Not reached';
  }
  const [yearPart, monthPart] = dateValue.split('-');
  const monthIndex = Number(monthPart) - 1;
  if (!yearPart || !Number.isInteger(monthIndex) || monthIndex < 0 || monthIndex > 11) {
    return dateValue;
  }
  return `${MONTH_ABBREVIATIONS[monthIndex]} ${yearPart}`;
};

const normalizeHouseholdMode = (value: ForecastInputs['householdMode']): ForecastInputs['householdMode'] =>
  value === 'couple' ? 'couple' : 'individual';

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
const calculateNonIsaNetWithdrawal = (
  nonIsaValue: number,
  nonIsaCostBasis: number,
  extractionRatePercent: number,
  cgtAnnualExemptAmount: number,
): number => {
  if (nonIsaValue <= 0 || extractionRatePercent <= 0) return 0;
  const grossWithdrawal = nonIsaValue * (extractionRatePercent / 100);
  const unrealizedGain = Math.max(0, nonIsaValue - Math.max(0, nonIsaCostBasis));
  const gainRatio = nonIsaValue > 0 ? unrealizedGain / nonIsaValue : 0;
  const gainsRealized = grossWithdrawal * gainRatio;
  const taxableGains = Math.max(0, gainsRealized - cgtAnnualExemptAmount);
  const cgtDue = taxableGains * UK_CGT_BASIC_RATE;
  return Math.max(0, grossWithdrawal - cgtDue);
};

const deriveMonthlyContributions = (balances: number[], gains: number[]): number[] =>
  balances.map((balance, index) => {
    if (index === 0) {
      return 0;
    }
    const priorBalance = balances[index - 1] ?? 0;
    const gain = gains[index] ?? 0;
    // Use realized balance deltas so displayed surplus split matches the simulation exactly.
    const contribution = balance - priorBalance - gain;
    return Math.max(0, contribution);
  });

const buildFinanceRows = (result: ForecastResult): TableRow[] => {
  const maxMonth = result.income_values.length - 1;
  const fiMonth = result.fi_month_index ?? maxMonth;
  const monthlySurplusIsaValues = deriveMonthlyContributions(result.isa_values, result.isa_capital_gain_values);
  const monthlySurplusNonIsaValues = deriveMonthlyContributions(result.non_isa_values, result.non_isa_gain_values);
  const metrics: [string, number[]][] = [
    ['Active income (post-tax)', result.income_values],
    ['Active income (pre-tax)', result.active_income_pre_tax_values],
    ['Living expenses', result.expense_values],
    ['Mortgage', result.mortgage_payment_values],
    ['Monthly SIPP contribution', result.sipp_contribution_values],
    ['Monthly workplace pension contribution', result.workplace_pension_contribution_values],
    ['Monthly capital gains (ISA)', result.isa_capital_gain_values],
    ['Monthly gains (non-ISA)', result.non_isa_gain_values],
    ['Monthly surplus (ISA)', monthlySurplusIsaValues],
    ['Monthly surplus (non-ISA)', monthlySurplusNonIsaValues],
  ];
  return metrics.map(([label, series]) => ({
    label,
    values: [...TIMEPOINTS_YEARS.map((y) => currency(safeValue(series, monthFromYears(y, maxMonth)))), currency(safeValue(series, fiMonth))],
  }));
};

const buildFiHealthRows = (result: ForecastResult): TableRow[] => {
  const maxMonth = result.income_values.length - 1;
  const fiMonth = result.fi_month_index ?? maxMonth;
  const checkpoints = [...TIMEPOINTS_YEARS, -1];

  const liquidRunwayValues = checkpoints.map((year) => {
    const monthIndex = year === -1 ? fiMonth : monthFromYears(year, maxMonth);
    const liquidAssets = safeValue(result.isa_values, monthIndex) + safeValue(result.non_isa_values, monthIndex);
    const annualSpend =
      (safeValue(result.expense_values, monthIndex) + safeValue(result.mortgage_payment_values, monthIndex)) * 12;
    if (annualSpend <= 0) {
      return liquidAssets > 0 ? 'Infinite' : '0.0y';
    }
    return years(liquidAssets / annualSpend);
  });

  const fiCoverageRatioValues = checkpoints.map((year) => {
    const monthIndex = year === -1 ? fiMonth : monthFromYears(year, maxMonth);
    const isaValue = safeValue(result.isa_values, monthIndex);
    const nonIsaValue = safeValue(result.non_isa_values, monthIndex);
    const nonIsaCostBasis = safeValue(result.non_isa_cost_basis_values, monthIndex);
    const annualWithdrawal =
      isaValue * (result.extraction_rate / 100) +
      calculateNonIsaNetWithdrawal(nonIsaValue, nonIsaCostBasis, result.extraction_rate, result.cgt_annual_exempt_amount);
    const annualSpend =
      (safeValue(result.expense_values, monthIndex) + safeValue(result.mortgage_payment_values, monthIndex)) * 12;
    if (annualSpend <= 0) {
      return annualWithdrawal > 0 ? 'Infinite' : '0.00x';
    }
    return ratio(annualWithdrawal / annualSpend);
  });

  return [
    { label: 'Liquid runway (years)', values: liquidRunwayValues },
    { label: 'FI coverage ratio', values: fiCoverageRatioValues },
  ];
};

const buildNetWorthRows = (result: ForecastResult): TableRow[] => {
  const maxMonth = result.income_values.length - 1;
  const fiMonth = result.fi_month_index ?? maxMonth;
  const metrics: [string, number[]][] = [
    ['Pension pot', result.pension_values],
    ['ISA investments', result.isa_values],
    ['Non-ISA investments (GIA)', result.non_isa_values],
    ['Home equity', result.home_equity_values],
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
  const inflationRate = result.inflation_rate / 100;
  const realNetWorthValues = [...TIMEPOINTS_YEARS, -1].map((year) => {
    const monthIndex = year === -1 ? fiMonth : monthFromYears(year, maxMonth);
    const nominalValue =
      safeValue(result.pension_values, monthIndex) +
      safeValue(result.isa_values, monthIndex) +
      safeValue(result.non_isa_values, monthIndex) +
      safeValue(result.home_equity_values, monthIndex);
    const inflationFactor = (1 + inflationRate) ** (monthIndex / 12);
    return currency(inflationFactor > 0 ? nominalValue / inflationFactor : nominalValue);
  });
  return [
    ...rows,
    { label: 'Total net worth', values: totalValues, isTotal: true },
    { label: "Real net worth (today's £)", values: realNetWorthValues },
  ];
};

export const normalizeInputs = (inputs: ForecastInputs): ForecastInputs => ({
  ...inputs,
  householdMode: normalizeHouseholdMode(inputs.householdMode),
  pensionableMonthlyPay: inputs.pensionableMonthlyPay ?? inputs.income,
  forecastYears: inputs.forecastYears || 40,
  mortgageInterestRate: inputs.mortgageInterestRate || 3.83,
  homeAppreciationRate: inputs.homeAppreciationRate || 3.0,
  pensionInterestRate: inputs.pensionInterestRate || 5.0,
  inflationRate: inputs.inflationRate || 2.0,
  wageIncreaseRate: inputs.wageIncreaseRate || 3.0,
  isaAnnualContribution: getIsaAnnualContributionForHousehold(normalizeHouseholdMode(inputs.householdMode)),
  extractionRate: inputs.extractionRate || 3.9,
});

export const buildForecastViewModel = (rawInputs: ForecastInputs): ForecastViewModel => {
  const inputs = normalizeInputs(rawInputs);
  const chartMonths = inputs.forecastYears * 12;
  const chartResult = calculateForecast({
    householdMode: inputs.householdMode,
    income: inputs.income,
    expenses: inputs.expenses,
    isaAssets: inputs.isaAssets,
    isaRate: inputs.isaRate,
    nonIsaAssets: inputs.nonIsaAssets,
    nonIsaRate: inputs.nonIsaRate,
    months: chartMonths,
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
    pensionableMonthlyPay: inputs.pensionableMonthlyPay,
    sippContribution: inputs.sippContribution,
    inflationRate: inputs.inflationRate,
    wageIncreaseRate: inputs.wageIncreaseRate,
    isaAnnualContribution: inputs.isaAnnualContribution,
    extractionRate: inputs.extractionRate,
  });
  const fiResult = calculateForecast({
    householdMode: inputs.householdMode,
    income: inputs.income,
    expenses: inputs.expenses,
    isaAssets: inputs.isaAssets,
    isaRate: inputs.isaRate,
    nonIsaAssets: inputs.nonIsaAssets,
    nonIsaRate: inputs.nonIsaRate,
    months: FI_EVALUATION_MONTHS,
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
    pensionableMonthlyPay: inputs.pensionableMonthlyPay,
    sippContribution: inputs.sippContribution,
    inflationRate: inputs.inflationRate,
    wageIncreaseRate: inputs.wageIncreaseRate,
    isaAnnualContribution: inputs.isaAnnualContribution,
    extractionRate: inputs.extractionRate,
  });
  const fiIndex = fiResult.fi_month_index ?? Math.max(fiResult.isa_values.length - 1, 0);
  const fiIsa = safeValue(fiResult.isa_values, fiIndex);
  const fiNonIsa = safeValue(fiResult.non_isa_values, fiIndex);
  const fiIncome = safeValue(fiResult.income_values, fiIndex);
  const fiSavings = safeValue(fiResult.monthly_savings_values, fiIndex);
  const fiNonIsaCostBasis = safeValue(fiResult.non_isa_cost_basis_values, fiIndex);
  const extractionRate = fiResult.extraction_rate / 100;
  const fiWithdrawalAnnual =
    fiIsa *
      extractionRate +
    calculateNonIsaNetWithdrawal(fiNonIsa, fiNonIsaCostBasis, fiResult.extraction_rate, fiResult.cgt_annual_exempt_amount);
  const fiSavingsRate = fiIncome > 0 ? (fiSavings / fiIncome) * 100 : 0;
  const yearsText = fiResult.years_until_expenses_covered === null ? 'Never' : `${fiResult.years_until_expenses_covered.toFixed(1)}`;

  const extendedIsa = extendSeriesToYearEnd(chartResult.dates, chartResult.isa_values);
  const extendedNonIsa = extendSeriesToYearEnd(chartResult.dates, chartResult.non_isa_values);
  const extendedPension = extendSeriesToYearEnd(chartResult.dates, chartResult.pension_values);
  const extendedHome = extendSeriesToYearEnd(chartResult.dates, chartResult.home_equity_values);
  const chartLimitIndex = Math.min(chartMonths, Math.max(extendedIsa.dates.length - 1, 0));
  const chartDates = extendedIsa.dates.slice(0, chartLimitIndex + 1);
  const indices = yearEndIndices(chartDates);
  const yearlyLabels = indices.map((i) => extendedIsa.dates[i].slice(0, 4));
  const assetSeries = [
    { name: 'ISA assets', values: sample(extendedIsa.values, indices) },
    { name: 'Non-ISA assets', values: sample(extendedNonIsa.values, indices) },
    { name: 'Pension', values: sample(extendedPension.values, indices) },
    { name: 'Home equity', values: sample(extendedHome.values, indices) },
  ];

  const extendedExpenses = extendSeriesToYearEnd(chartResult.dates, chartResult.expense_values);
  const extendedMortgagePayments = extendSeriesToYearEnd(chartResult.dates, chartResult.mortgage_payment_values);
  const withdrawalSeries = [
    {
      name: `${extractionRateLabel(chartResult.extraction_rate)} Annual withdrawal`,
      values: indices.map((index) => {
        const isaValue = extendedIsa.values[index] ?? 0;
        const nonIsaValue = extendedNonIsa.values[index] ?? 0;
        const nonIsaCostBasis = safeValue(chartResult.non_isa_cost_basis_values, index);
        return (
          isaValue * (chartResult.extraction_rate / 100) +
          calculateNonIsaNetWithdrawal(nonIsaValue, nonIsaCostBasis, chartResult.extraction_rate, chartResult.cgt_annual_exempt_amount)
        );
      }),
    },
    {
      name: 'Annual expenses (incl. mortgage)',
      values: indices.map((index) => (extendedExpenses.values[index] + extendedMortgagePayments.values[index]) * 12),
    },
  ];

  return {
    kpis: [
      { label: 'Financial independence (FI) date', value: formatKpiMonthYear(fiResult.fi_date) },
      { label: 'Years until FI', value: yearsText },
      { label: `Passive income at FI (${extractionRateLabel(fiResult.extraction_rate)})`, value: currency(fiWithdrawalAnnual) },
      { label: 'Savings rate at FI', value: percent(fiSavingsRate) },
    ],
    yearlyLabels,
    assetSeries,
    withdrawalSeries,
    financeRows: buildFinanceRows(fiResult),
    netWorthRows: buildNetWorthRows(fiResult),
    fiHealthRows: buildFiHealthRows(fiResult),
    raw: chartResult,
  };
};

const individualDefaults = UK_BASELINE_BY_HOUSEHOLD_MODE.individual;

export const defaultInputs: ForecastInputs = {
  householdMode: 'individual',
  income: individualDefaults.monthlyIncomeAfterTax,
  expenses: individualDefaults.monthlyExpensesExMortgage,
  pensionableMonthlyPay: individualDefaults.monthlyIncomeGross,
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
  isaAnnualContribution: getIsaAnnualContributionForHousehold('individual'),
  pensionType: 'percentage',
  pensionAssets: 0,
  pensionContribution: 5,
  employerPensionContributionRate: 3,
  pensionInterestRate: 5,
  pensionTaxReliefRate: 20,
  sippContribution: 0,
  inflationRate: 2,
  wageIncreaseRate: 3,
  extractionRate: 3.9,
};
