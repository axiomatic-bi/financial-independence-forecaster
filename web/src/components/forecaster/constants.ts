import type { ForecastInputs } from '../../types/forecast';

export const metricColumns = ['Current', '1Y', '5Y', '10Y', '20Y', 'FI'] as const;

export const chartDescriptions = {
  assetBreakdown:
    'Stacked areas show how ISA, non-ISA, pension, and home equity contribute to your overall net worth path.',
  passiveIncome:
    'This compares projected annual withdrawal capacity against annual inflation-adjusted spending (including mortgage) to highlight your FI crossover.',
  savings:
    'This breaks down monthly cash flow into income, core outgoings, and the surplus allocated between ISA and non-ISA investing.',
} as const;

export const incomeFields: { key: keyof ForecastInputs; label: string; step?: number }[] = [
  { key: 'income', label: 'Monthly Income (Take Home Pay) (£)' },
  { key: 'expenses', label: 'Monthly Expenses (Excluding Mortgage) (£)' },
];

export const currentAssetsFields: { key: keyof ForecastInputs; label: string; step?: number }[] = [
  { key: 'isaAssets', label: 'ISA Assets (£)' },
  { key: 'nonIsaAssets', label: 'Non-ISA Assets (£)' },
];

export const growthAssumptionsFields: { key: keyof ForecastInputs; label: string; step?: number }[] = [
  { key: 'isaRate', label: 'ISA Interest Rate (%)', step: 0.1 },
  { key: 'nonIsaRate', label: 'Non-ISA Interest Rate (%)', step: 0.1 },
];

export const propertyFields: { key: keyof ForecastInputs; label: string; step?: number }[] = [
  { key: 'homeValue', label: 'Home Value (£)' },
  { key: 'mortgageBalance', label: 'Remaining Mortgage Balance (£)' },
  { key: 'mortgageTerm', label: 'Remaining Mortgage Term (Years)' },
  { key: 'mortgageInterestRate', label: 'Mortgage Interest Rate (%)', step: 0.01 },
  { key: 'homeAppreciationRate', label: 'Home Appreciation Rate (%)', step: 0.1 },
];

export const pensionFields: { key: keyof ForecastInputs; label: string; step?: number }[] = [
  { key: 'pensionAssets', label: 'Current Pension Pot (£)' },
  { key: 'pensionableMonthlyPay', label: 'Pensionable Monthly Pay (£)' },
  { key: 'pensionContribution', label: 'Workplace Personal Contribution (% of pensionable pay or £)', step: 0.1 },
  { key: 'employerPensionContributionRate', label: 'Employer Contribution (% of pensionable pay)', step: 0.1 },
  { key: 'pensionInterestRate', label: 'Pension Interest Rate (%)', step: 0.1 },
];

export const sippFields: { key: keyof ForecastInputs; label: string; step?: number }[] = [
  { key: 'sippContribution', label: 'SIPP Contribution (£ per month, net)', step: 1 },
];

export const advancedAssumptionsFields: { key: keyof ForecastInputs; label: string; step?: number }[] = [
  { key: 'inflationRate', label: 'Inflation Rate (%)', step: 0.1 },
  { key: 'wageIncreaseRate', label: 'Wage Increase Rate (%)', step: 0.1 },
  { key: 'extractionRate', label: 'Extraction Rate (%)', step: 0.1 },
  { key: 'isaAnnualContribution', label: 'Annual ISA Contribution Limit (£)', step: 1000 },
];

const fiBasisTooltipText = (extractionRate: number) =>
  `Financial independence (FI) here means annual ISA + non-ISA withdrawal at ${extractionRate.toFixed(1)}% covers annual expenses; pension and home equity are excluded.`;

export const kpiTooltipText = (label: string, extractionRate: number): string | null => {
  if (label === 'Financial Independence (FI) Date') {
    return `Estimated month when FI is first reached under your current assumptions. ${fiBasisTooltipText(extractionRate)}`;
  }
  if (label === 'Years Until FI') {
    return `Number of years from today until the model first reaches FI. ${fiBasisTooltipText(extractionRate)}`;
  }
  if (label.includes('Passive Income at FI')) {
    return `Estimated annual withdrawal available at FI using your ${extractionRate.toFixed(1)}% extraction rate on ISA and non-ISA assets.`;
  }
  if (label === 'Savings Rate at FI') {
    return 'Monthly savings divided by monthly income at the FI point in the projection.';
  }
  return null;
};

export const inputTooltips: Partial<Record<keyof ForecastInputs, string>> = {
  income: 'Your monthly take-home household income after tax and after workplace pension payroll deductions.',
  expenses: 'Your monthly household spending excluding mortgage repayments.',
  isaAssets: 'Current balance held in ISA accounts.',
  nonIsaAssets: 'Current balance held outside ISA wrappers (taxable investments/cash).',
  isaRate: 'Expected annual ISA growth rate before inflation.',
  nonIsaRate: 'Expected annual non-ISA growth rate before inflation.',
  inflationRate: 'Expected long-run annual inflation rate.',
  wageIncreaseRate: 'Expected annual growth in household income.',
  forecastYears: 'How many years to project the model forward.',
  homeValue: 'Current market value of your home.',
  mortgageBalance: 'Outstanding mortgage principal today.',
  mortgageTerm: 'Remaining mortgage term in years.',
  mortgageInterestRate: 'Annual mortgage interest rate.',
  homeAppreciationRate: 'Expected annual home value growth rate.',
  pensionAssets: 'Current total pension pot value.',
  pensionableMonthlyPay: 'Monthly pensionable pay used for workplace pension percentage calculations.',
  pensionContribution:
    'Your workplace personal contribution. In this net-pay model it increases pension growth but is not deducted again from monthly savings.',
  employerPensionContributionRate: 'Employer pension contribution percentage of pensionable pay.',
  pensionInterestRate: 'Expected annual pension growth rate.',
  pensionTaxReliefRate: 'Tax relief rate applied to SIPP contributions.',
  sippContribution: 'Net SIPP contribution paid from take-home cash each month.',
  extractionRate: 'Annual extraction rate used for FI checks and passive income projections.',
  isaAnnualContribution: 'Annual ISA contribution allowance used as a cap in projections.',
};
