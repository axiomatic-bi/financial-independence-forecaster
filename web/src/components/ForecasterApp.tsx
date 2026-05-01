import { Fragment, type FocusEvent, useEffect, useMemo, useState } from 'react';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

import { buildForecastViewModel, defaultInputs } from '../application/buildForecastViewModel';
import type { ForecastInputs } from '../types/forecast';

const themeDataColor = (token: string, fallback: string): string => {
  if (typeof window === 'undefined') {
    return fallback;
  }
  const value = getComputedStyle(document.documentElement).getPropertyValue(token).trim();
  return value || fallback;
};

const metricColumns = ['Current', '1Y', '5Y', '10Y', '20Y', 'FI'];
const chartDescriptions = {
  assetBreakdown:
    'Stacked areas show how ISA, non-ISA, pension, and home equity contribute to your overall net worth path.',
  passiveIncome:
    'This compares projected annual withdrawal capacity against annual inflation-adjusted spending (including mortgage) to highlight your FI crossover.',
  savings:
    'This breaks down monthly cash flow into income, core outgoings, and the surplus allocated between ISA and non-ISA investing.',
} as const;

const incomeFields: { key: keyof ForecastInputs; label: string; step?: number }[] = [
  { key: 'income', label: 'Monthly Income (After Tax, After Workplace Pension) (£)' },
  { key: 'expenses', label: 'Monthly Expenses (Excluding Mortgage) (£)' },
];

const currentAssetsFields: { key: keyof ForecastInputs; label: string; step?: number }[] = [
  { key: 'isaAssets', label: 'ISA Assets (£)' },
  { key: 'nonIsaAssets', label: 'Non-ISA Assets (£)' },
];

const growthAssumptionsFields: { key: keyof ForecastInputs; label: string; step?: number }[] = [
  { key: 'isaRate', label: 'ISA Interest Rate (%)', step: 0.1 },
  { key: 'nonIsaRate', label: 'Non-ISA Interest Rate (%)', step: 0.1 },
];

const propertyFields: { key: keyof ForecastInputs; label: string; step?: number }[] = [
  { key: 'homeValue', label: 'Home Value (£)' },
  { key: 'mortgageBalance', label: 'Remaining Mortgage Balance (£)' },
  { key: 'mortgageTerm', label: 'Remaining Mortgage Term (Years)' },
  { key: 'mortgageInterestRate', label: 'Mortgage Interest Rate (%)', step: 0.01 },
  { key: 'homeAppreciationRate', label: 'Home Appreciation Rate (%)', step: 0.1 },
];

const pensionFields: { key: keyof ForecastInputs; label: string; step?: number }[] = [
  { key: 'pensionAssets', label: 'Current Pension Pot (£)' },
  { key: 'pensionableMonthlyPay', label: 'Pensionable Monthly Pay (£)' },
  { key: 'pensionContribution', label: 'Workplace Personal Contribution (% of pensionable pay or £)', step: 0.1 },
  { key: 'employerPensionContributionRate', label: 'Employer Contribution (% of pensionable pay)', step: 0.1 },
  { key: 'pensionInterestRate', label: 'Pension Interest Rate (%)', step: 0.1 },
];
const sippFields: { key: keyof ForecastInputs; label: string; step?: number }[] = [
  { key: 'sippContribution', label: 'SIPP Contribution (£ per month, net)', step: 1 },
];

const advancedAssumptionsFields: { key: keyof ForecastInputs; label: string; step?: number }[] = [
  { key: 'inflationRate', label: 'Inflation Rate (%)', step: 0.1 },
  { key: 'wageIncreaseRate', label: 'Wage Increase Rate (%)', step: 0.1 },
  { key: 'extractionRate', label: 'Extraction Rate (%)', step: 0.1 },
  { key: 'isaAnnualContribution', label: 'Annual ISA Contribution Limit (£)', step: 1000 },
];

const fiBasisTooltipText = (extractionRate: number) =>
  `Financial independence (FI) here means annual ISA + non-ISA withdrawal at ${extractionRate.toFixed(1)}% covers annual expenses; pension and home equity are excluded.`;
const kpiTooltipText = (label: string, extractionRate: number): string | null => {
  if (label === 'FI Date') {
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
const INPUTS_STORAGE_KEY = 'financial-forecaster:inputs';
const formatCompactCurrency = (value: number): string => {
  if (!Number.isFinite(value)) {
    return '£0';
  }
  if (Math.abs(value) < 1000) {
    return `£${Math.round(value).toLocaleString()}`;
  }
  const compact = new Intl.NumberFormat('en-GB', {
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(value);
  return `£${compact}`;
};

const parseCurrencyValue = (value: string): number => {
  const parsed = Number(value.replace(/[^\d.-]/g, ''));
  return Number.isFinite(parsed) ? parsed : 0;
};

const formatTableCurrency = (value: number): string => {
  const rounded = Math.round(value);
  const abs = Math.abs(rounded).toLocaleString('en-GB');
  return `${rounded < 0 ? '-' : ''}£${abs}`;
};

const COST_ROW_LABELS = new Set([
  'Living Expenses',
  'Mortgage',
]);
const renderAssetTooltip = ({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: ReadonlyArray<{ name?: unknown; value?: unknown; color?: string }>;
  label?: unknown;
}) => {
  if (!active || !payload || payload.length === 0) {
    return null;
  }
  const total = payload.reduce((sum, item) => sum + Number(item.value ?? 0), 0);
  return (
    <div className="chart-tooltip">
      <p className="chart-tooltip-label">{String(label ?? '')}</p>
      {payload.map((item, index) => (
        <p className="chart-tooltip-row" key={`${String(item.name ?? 'series')}-${index}`}>
          <span className="chart-tooltip-dot" style={{ backgroundColor: item.color ?? '#c0ccec' }} />
          <span>{String(item.name ?? '')}</span>
          <strong>
            {formatCompactCurrency(Number(item.value ?? 0))} ({total > 0 ? ((Number(item.value ?? 0) / total) * 100).toFixed(1) : '0.0'}%)
          </strong>
        </p>
      ))}
      <p className="chart-tooltip-row chart-tooltip-total">
        <span>Total</span>
        <strong>{formatCompactCurrency(total)}</strong>
      </p>
    </div>
  );
};
const inputTooltips: Partial<Record<keyof ForecastInputs, string>> = {
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

export const ForecasterApp = () => {
  const [inputs, setInputs] = useState<ForecastInputs>(() => {
    if (typeof window === 'undefined') {
      return defaultInputs;
    }
    try {
      const raw = window.localStorage.getItem(INPUTS_STORAGE_KEY);
      if (!raw) {
        return defaultInputs;
      }
      const parsed = JSON.parse(raw) as Partial<ForecastInputs>;
      return { ...defaultInputs, ...parsed };
    } catch {
      return defaultInputs;
    }
  });
  const [isInputsOpen, setIsInputsOpen] = useState(false);
  const [expandedSavingsGroups, setExpandedSavingsGroups] = useState<Record<string, boolean>>({
    income: false,
    pension: false,
    surplus: false,
    gains: false,
  });
  const dataColors = useMemo(
    () => ({
      isa: themeDataColor('--data-color-1', '#5B8CFF'),
      nonIsa: themeDataColor('--data-color-2', '#8E75FF'),
      pension: themeDataColor('--data-color-3', '#6E5BFF'),
      homeEquity: themeDataColor('--data-color-4', '#C7B8FF'),
      withdrawal: themeDataColor('--data-color-1', '#5B8CFF'),
      expenses: themeDataColor('--data-color-2', '#8E75FF'),
      livingExpenses: themeDataColor('--data-color-2', '#8E75FF'),
      mortgage: themeDataColor('--data-color-3', '#6E5BFF'),
      surplusIsa: themeDataColor('--data-color-1', '#5B8CFF'),
      surplusNonIsa: themeDataColor('--data-color-2', '#8E75FF'),
      monthlySurplus: themeDataColor('--data-color-1', '#5B8CFF'),
      sippContribution: themeDataColor('--data-color-4', '#C7B8FF'),
      workplacePensionContribution: themeDataColor('--data-color-3', '#6E5BFF'),
      monthlyPensionContribution: themeDataColor('--data-color-4', '#C7B8FF'),
      monthlyInvestmentGains: themeDataColor('--data-color-5', '#88A4FF'),
    }),
    [],
  );
  const handleNumberFocus = (event: FocusEvent<HTMLInputElement>) => {
    if (Number(event.target.value) === 0) {
      event.target.select();
    }
  };
  const vmResult = useMemo(() => {
    try {
      const start = performance.now();
      const computed = buildForecastViewModel(inputs);
      const elapsed = performance.now() - start;
      return { vm: computed, elapsedMs: elapsed, error: null as string | null };
    } catch (error: unknown) {
      const message = error instanceof Error ? `${error.message}\n${error.stack ?? ''}` : 'Unknown forecast rendering error';
      return { vm: null, elapsedMs: 0, error: message };
    }
  }, [inputs]);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }
    window.localStorage.setItem(INPUTS_STORAGE_KEY, JSON.stringify(inputs));
  }, [inputs]);

  if (vmResult.error || !vmResult.vm) {
    return (
      <div className="app-error">
        <h1>App failed to render</h1>
        <pre>{vmResult.error ?? 'Unknown error'}</pre>
      </div>
    );
  }

  const vm = vmResult.vm;
  const assetChartData = vm.yearlyLabels.map((year, i) => ({
    year,
    isa: vm.assetSeries[0]?.values[i] ?? 0,
    nonIsa: vm.assetSeries[1]?.values[i] ?? 0,
    pension: vm.assetSeries[2]?.values[i] ?? 0,
    homeEquity: vm.assetSeries[3]?.values[i] ?? 0,
  }));
  const withdrawalChartData = vm.yearlyLabels.map((year, i) => ({
    year,
    withdrawal: vm.withdrawalSeries[0]?.values[i] ?? 0,
    expenses: vm.withdrawalSeries[1]?.values[i] ?? 0,
  }));
  const latestAssetSnapshot = assetChartData[assetChartData.length - 1] ?? {
    year: 'N/A',
    isa: 0,
    nonIsa: 0,
    pension: 0,
    homeEquity: 0,
  };
  const firstAssetSnapshot = assetChartData[0] ?? latestAssetSnapshot;
  const latestAssetTotal =
    latestAssetSnapshot.isa + latestAssetSnapshot.nonIsa + latestAssetSnapshot.pension + latestAssetSnapshot.homeEquity;
  const firstAssetTotal = firstAssetSnapshot.isa + firstAssetSnapshot.nonIsa + firstAssetSnapshot.pension + firstAssetSnapshot.homeEquity;
  const assetGrowthMultiple = firstAssetTotal > 0 ? latestAssetTotal / firstAssetTotal : null;
  const leadingAsset = [
    { label: 'ISA', value: latestAssetSnapshot.isa },
    { label: 'Non-ISA', value: latestAssetSnapshot.nonIsa },
    { label: 'Pension', value: latestAssetSnapshot.pension },
    { label: 'Home Equity', value: latestAssetSnapshot.homeEquity },
  ].reduce((largest, current) => (current.value > largest.value ? current : largest), {
    label: 'ISA',
    value: latestAssetSnapshot.isa,
  });

  const latestIncomeSnapshot = withdrawalChartData[withdrawalChartData.length - 1] ?? {
    year: 'N/A',
    withdrawal: 0,
    expenses: 0,
  };
  const latestCoverageGap = latestIncomeSnapshot.withdrawal - latestIncomeSnapshot.expenses;
  const latestCoverageRatio = latestIncomeSnapshot.expenses > 0 ? latestIncomeSnapshot.withdrawal / latestIncomeSnapshot.expenses : 0;
  const crossoverPoint = withdrawalChartData.find((point) => point.withdrawal >= point.expenses);
  const crossoverYear = crossoverPoint?.year ?? 'Not reached in forecast window';
  const yearlyWithdrawalLabels = new Set(withdrawalChartData.map((point) => point.year));
  const fiAchievedYear = vm.raw.fi_date ? vm.raw.fi_date.slice(0, 4) : null;
  const hasMortgageSeries = vm.raw.mortgage_payment_values.some((payment) => payment > 0);
  const mortgagePaidOffMonthIndex = hasMortgageSeries ? vm.raw.mortgage_payment_values.findIndex((payment) => payment <= 0) : -1;
  const mortgagePaidOffYear = mortgagePaidOffMonthIndex >= 0 ? vm.raw.dates[mortgagePaidOffMonthIndex]?.slice(0, 4) ?? null : null;
  const showFiReferenceLine = fiAchievedYear !== null && yearlyWithdrawalLabels.has(fiAchievedYear);
  const showMortgageReferenceLine = mortgagePaidOffYear !== null && yearlyWithdrawalLabels.has(mortgagePaidOffYear);
  const fiAchievedText = fiAchievedYear ?? 'Not achieved in forecast window';
  const mortgagePaidOffText = hasMortgageSeries
    ? mortgagePaidOffYear ?? 'Not paid off in forecast window'
    : 'No mortgage balance in forecast';
  const financeRowByLabel = Object.fromEntries(vm.financeRows.map((row) => [row.label, row.values])) as Record<string, string[]>;
  const signedFinanceValue = (label: string, rawValue: number): number => (COST_ROW_LABELS.has(label) ? -Math.abs(rawValue) : Math.abs(rawValue));
  const financeSeries = (label: string): number[] =>
    metricColumns.map((_, index) => signedFinanceValue(label, parseCurrencyValue(financeRowByLabel[label]?.[index] ?? '£0')));
  const financeValueAt = (label: string, index: number): number => financeSeries(label)[index] ?? 0;
  const latestActiveIncomePostTax = financeValueAt('Active Income (Post-Tax)', metricColumns.length - 1);
  const latestActiveIncomePreTax = financeValueAt('Active Income (Pre-Tax)', metricColumns.length - 1);
  const savingsChartData = metricColumns.map((label, index) => ({
    label,
    livingExpenses: financeValueAt('Living Expenses', index),
    mortgage: financeValueAt('Mortgage', index),
    sippContribution: financeValueAt('Monthly SIPP Contribution', index),
    workplacePensionContribution: financeValueAt('Monthly Workplace Pension Contribution', index),
    surplusIsa: financeValueAt('Monthly Surplus (ISA)', index),
    surplusNonIsa: financeValueAt('Monthly Surplus (Non-ISA)', index),
    monthlyPensionContribution: financeValueAt('Monthly SIPP Contribution', index) + financeValueAt('Monthly Workplace Pension Contribution', index),
    monthlySurplus: financeValueAt('Monthly Surplus (ISA)', index) + financeValueAt('Monthly Surplus (Non-ISA)', index),
    monthlyInvestmentGains: financeValueAt('Monthly Capital Gains (ISA)', index) + financeValueAt('Monthly Gains (Non-ISA)', index),
  }));
  const latestSavingsSnapshot = savingsChartData[savingsChartData.length - 1] ?? {
    label: 'FI',
    livingExpenses: 0,
    mortgage: 0,
    sippContribution: 0,
    workplacePensionContribution: 0,
    surplusIsa: 0,
    surplusNonIsa: 0,
    monthlyPensionContribution: 0,
    monthlySurplus: 0,
    monthlyInvestmentGains: 0,
  };
  const savingsLegendItems = [
    { label: 'Living Expenses', color: dataColors.livingExpenses },
    { label: 'Mortgage', color: dataColors.mortgage },
    { label: 'Monthly Pension Contribution', color: dataColors.monthlyPensionContribution },
    { label: 'Monthly Surplus', color: dataColors.monthlySurplus },
    { label: 'Monthly Investment Gains', color: dataColors.monthlyInvestmentGains },
  ];
  const renderSavingsLegend = () => {
    return (
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          justifyContent: 'center',
          gap: 12,
          marginBottom: 8,
          width: '100%',
        }}
      >
        {savingsLegendItems.map((entry) => (
          <span key={entry.label} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: '#c0ccec' }}>
            <span
              aria-hidden="true"
              style={{
                width: 12,
                height: 12,
                borderRadius: 2,
                backgroundColor: entry.color,
                display: 'inline-block',
              }}
            />
            <span>{entry.label}</span>
          </span>
        ))}
      </div>
    );
  };
  const groupRowValues = (labels: string[]): string[] =>
    metricColumns.map((_, index) =>
      formatTableCurrency(
        labels.reduce((sum, label) => sum + financeValueAt(label, index), 0),
      ),
    );
  const formatSeries = (label: string): string[] => financeSeries(label).map((value) => formatTableCurrency(value));
  const savingsTableRows: Array<{
    key: string;
    label: string;
    values: string[];
    children?: Array<{ key: string; label: string; values: string[] }>;
    highlight?: boolean;
  }> = [
    {
      key: 'income',
      label: 'Active Income',
      values: formatSeries('Active Income (Post-Tax)'),
      children: [
        {
          key: 'active-income-post-tax',
          label: 'Active Income (Post-Tax)',
          values: formatSeries('Active Income (Post-Tax)'),
        },
        {
          key: 'active-income-pre-tax',
          label: 'Active Income (Pre-Tax)',
          values: formatSeries('Active Income (Pre-Tax)'),
        },
      ],
    },
    {
      key: 'living-expenses',
      label: 'Living Expenses',
      values: formatSeries('Living Expenses'),
    },
    {
      key: 'mortgage',
      label: 'Mortgage',
      values: formatSeries('Mortgage'),
    },
    {
      key: 'pension',
      label: 'Monthly Pension Contribution',
      values: groupRowValues(['Monthly SIPP Contribution', 'Monthly Workplace Pension Contribution']),
      children: [
        {
          key: 'sipp-contribution',
          label: 'Monthly SIPP Contribution',
          values: formatSeries('Monthly SIPP Contribution'),
        },
        {
          key: 'workplace-pension-contribution',
          label: 'Monthly Workplace Pension Contribution',
          values: formatSeries('Monthly Workplace Pension Contribution'),
        },
      ],
    },
    {
      key: 'surplus',
      label: 'Monthly Surplus',
      values: groupRowValues(['Monthly Surplus (ISA)', 'Monthly Surplus (Non-ISA)']),
      children: [
        {
          key: 'monthly-surplus-isa',
          label: 'Monthly Surplus (ISA)',
          values: formatSeries('Monthly Surplus (ISA)'),
        },
        {
          key: 'monthly-surplus-non-isa',
          label: 'Monthly Surplus (Non-ISA)',
          values: formatSeries('Monthly Surplus (Non-ISA)'),
        },
      ],
      highlight: true,
    },
    {
      key: 'gains',
      label: 'Monthly Investment Gains',
      values: groupRowValues(['Monthly Capital Gains (ISA)', 'Monthly Gains (Non-ISA)']),
      children: [
        {
          key: 'monthly-capital-gains-isa',
          label: 'Monthly Capital Gains (ISA)',
          values: formatSeries('Monthly Capital Gains (ISA)'),
        },
        {
          key: 'monthly-gains-non-isa',
          label: 'Monthly Gains (Non-ISA)',
          values: formatSeries('Monthly Gains (Non-ISA)'),
        },
      ],
    },
  ];
  const latestMonthlySurplus = latestSavingsSnapshot.surplusIsa + latestSavingsSnapshot.surplusNonIsa;
  const formatCurrencyTick = (value: number) => formatCompactCurrency(value);
  const inputId = (key: keyof ForecastInputs) => `input-${key}`;
  const renderInputLabel = (key: keyof ForecastInputs, label: string) => (
    <label htmlFor={inputId(key)} className="label-with-info">
      <span>{label}</span>
      {inputTooltips[key] && (
        <span className="tooltip-wrap">
          <button type="button" className="info-icon" aria-label={`About ${label}`}>
            i
          </button>
          <span className="tooltip-content tooltip-content--center" role="tooltip">
            {inputTooltips[key]}
          </span>
        </span>
      )}
    </label>
  );

  return (
    <div className="app">
      <header className="hero">
        <h1>Financial Independence Forecaster</h1>
        <p>Model your path to financial independence with scenario-based projections</p>
      </header>
      <button
        type="button"
        className="panel-toggle"
        aria-expanded={isInputsOpen}
        aria-controls="inputs-panel"
        onClick={() => setIsInputsOpen((prev) => !prev)}
      >
        <span className="burger-icon" aria-hidden="true">
          <span />
          <span />
          <span />
        </span>
        <span>{isInputsOpen ? 'Close Inputs' : 'Open Inputs'}</span>
      </button>
      <div className="main">
        <aside id="inputs-panel" className={`panel${isInputsOpen ? ' is-open' : ''}`}>
          <h2>Inputs</h2>
          <h3 className="inputs-subtitle">Income</h3>
          {incomeFields.map(({ key, label, step }) => (
            <div className="field" key={key}>
              {renderInputLabel(key, label)}
              <input
                id={inputId(key)}
                name={inputId(key)}
                type="number"
                step={step ?? 1}
                value={inputs[key] as number}
                onFocus={handleNumberFocus}
                onChange={(event) =>
                  setInputs((prev) => ({
                    ...prev,
                    [key]: Number(event.target.value),
                  }))
                }
              />
            </div>
          ))}

          <h3 className="inputs-subtitle">Current Assets</h3>
          {currentAssetsFields.map(({ key, label, step }) => (
            <div className="field" key={key}>
              {renderInputLabel(key, label)}
              <input
                id={inputId(key)}
                name={inputId(key)}
                type="number"
                step={step ?? 1}
                value={inputs[key] as number}
                onFocus={handleNumberFocus}
                onChange={(event) =>
                  setInputs((prev) => ({
                    ...prev,
                    [key]: Number(event.target.value),
                  }))
                }
              />
            </div>
          ))}

          <h3 className="inputs-subtitle">Growth Assumptions</h3>
          {growthAssumptionsFields.map(({ key, label, step }) => (
            <div className="field" key={key}>
              {renderInputLabel(key, label)}
              <input
                id={inputId(key)}
                name={inputId(key)}
                type="number"
                step={step ?? 1}
                value={inputs[key] as number}
                onFocus={handleNumberFocus}
                onChange={(event) =>
                  setInputs((prev) => ({
                    ...prev,
                    [key]: Number(event.target.value),
                  }))
                }
              />
            </div>
          ))}

          <div className="field">
            {renderInputLabel('forecastYears', 'Forecast Period (Years)')}
            <input
              id="input-forecastYears"
              name="input-forecastYears"
              type="range"
              min={1}
              max={40}
              step={1}
              value={inputs.forecastYears}
              onChange={(event) => setInputs((prev) => ({ ...prev, forecastYears: Number(event.target.value) }))}
            />
            <div className="range-markers" aria-hidden="true">
              <span className="range-marker">1</span>
              <span className="range-marker">10</span>
              <span className="range-marker">20</span>
              <span className="range-marker">30</span>
              <span className="range-marker">40</span>
            </div>
            <small className="range-value">{inputs.forecastYears} years</small>
          </div>

          <h3 className="inputs-subtitle">Advanced Inputs</h3>

          <details className="advanced-group">
            <summary>Property & Mortgage</summary>
            {propertyFields.map(({ key, label, step }) => (
              <div className="field" key={key}>
                {renderInputLabel(key, label)}
                <input
                  id={inputId(key)}
                  name={inputId(key)}
                  type="number"
                  step={step ?? 1}
                  value={inputs[key] as number}
                  onFocus={handleNumberFocus}
                  onChange={(event) =>
                    setInputs((prev) => ({
                      ...prev,
                      [key]: Number(event.target.value),
                    }))
                  }
                />
              </div>
            ))}
          </details>

          <details className="advanced-group">
            <summary>Pension</summary>
            <div className="field">
              <label htmlFor="input-pensionType" className="label-with-info">
                <span>Contribution Type</span>
              </label>
              <select
                id="input-pensionType"
                name="input-pensionType"
                value={inputs.pensionType}
                onChange={(event) =>
                  setInputs((prev) => ({ ...prev, pensionType: event.target.value as ForecastInputs['pensionType'] }))
                }
              >
                <option value="percentage">Percentage of Pensionable Pay</option>
                <option value="fixed">Fixed Amount</option>
              </select>
            </div>
            {pensionFields.map(({ key, label, step }) => (
              <div className="field" key={key}>
                {renderInputLabel(key, label)}
                <input
                  id={inputId(key)}
                  name={inputId(key)}
                  type="number"
                  step={step ?? 1}
                  value={inputs[key] as number}
                  onFocus={handleNumberFocus}
                  onChange={(event) =>
                    setInputs((prev) => ({
                      ...prev,
                      [key]: Number(event.target.value),
                    }))
                  }
                />
              </div>
            ))}
            <div className="field">
              {renderInputLabel('pensionTaxReliefRate', 'Pension Tax Relief')}
              <select
                id="input-pensionTaxReliefRate"
                name="input-pensionTaxReliefRate"
                value={inputs.pensionTaxReliefRate}
                onChange={(event) => setInputs((prev) => ({ ...prev, pensionTaxReliefRate: Number(event.target.value) }))}
              >
                <option value={0}>No Relief (0%)</option>
                <option value={20}>Basic Rate (20%)</option>
                <option value={40}>Higher Rate (40%)</option>
                <option value={45}>Additional Rate (45%)</option>
              </select>
            </div>
            {sippFields.map(({ key, label, step }) => (
              <div className="field" key={key}>
                {renderInputLabel(key, label)}
                <input
                  id={inputId(key)}
                  name={inputId(key)}
                  type="number"
                  step={step ?? 1}
                  value={inputs[key] as number}
                  onFocus={handleNumberFocus}
                  onChange={(event) =>
                    setInputs((prev) => ({
                      ...prev,
                      [key]: Number(event.target.value),
                    }))
                  }
                />
              </div>
            ))}
          </details>

          <details className="advanced-group">
            <summary>Forecast Assumptions</summary>
            {advancedAssumptionsFields.map(({ key, label, step }) => (
              <div className="field" key={key}>
                {renderInputLabel(key, label)}
                <input
                  id={inputId(key)}
                  name={inputId(key)}
                  type="number"
                  step={step ?? 1}
                  value={inputs[key] as number}
                  onFocus={handleNumberFocus}
                  onChange={(event) =>
                    setInputs((prev) => ({
                      ...prev,
                      [key]: Number(event.target.value),
                    }))
                  }
                />
              </div>
            ))}
          </details>
          <p className="perf">Recompute latency: {vmResult.elapsedMs.toFixed(1)}ms</p>
        </aside>

        <section className="content">
          <section className="kpis">
            <div className="kpis-inner">
              {vm.kpis.map((card) => (
                <article key={card.label} className="card">
                  {kpiTooltipText(card.label, inputs.extractionRate) && (
                    <span className="tooltip-wrap tooltip-corner">
                      <button type="button" className="info-icon" aria-label="What FI means">
                        i
                      </button>
                      <span className="tooltip-content" role="tooltip">
                        {kpiTooltipText(card.label, inputs.extractionRate)}
                      </span>
                    </span>
                  )}
                  <h3>{card.label}</h3>
                  <p className="kpi-value">{card.value}</p>
                </article>
              ))}
            </div>
          </section>

          <section className="narrative-chart">
            <h3 className="section-heading">Passive Income</h3>
            <div className="narrative-copy">
              <p>{chartDescriptions.passiveIncome}</p>
              <ul className="chart-takeaways">
                <li>
                  <strong>FI achieved year:</strong> {fiAchievedText}
                </li>
                <li>
                  <strong>Mortgage paid off year:</strong> {mortgagePaidOffText}
                </li>
                <li>
                  <strong>Coverage ratio in {latestIncomeSnapshot.year}:</strong> {latestCoverageRatio.toFixed(2)}x
                </li>
                <li>
                  <strong>Withdrawal minus total spending in {latestIncomeSnapshot.year}:</strong> {formatCompactCurrency(latestCoverageGap)}
                </li>
                <li>
                  <strong>Expected FI crossover year (yearly series):</strong> {crossoverYear}
                </li>
              </ul>
            </div>
            <article className="plot-card">
              <h4 className="section-subheading">Potential Passive Income vs Projected Expenses</h4>
              <div className="chart-wrap">
                <ResponsiveContainer width="100%" height={360}>
                  <LineChart data={withdrawalChartData} margin={{ top: 16, right: 8, left: 12, bottom: 8 }}>
                    <CartesianGrid stroke="#32466d" strokeDasharray="3 3" />
                    <XAxis dataKey="year" stroke="#c0ccec" />
                    <YAxis stroke="#c0ccec" tickFormatter={formatCurrencyTick} />
                    <Tooltip
                      formatter={(value) => formatCompactCurrency(Number(value ?? 0))}
                      contentStyle={{ backgroundColor: '#0d162a', border: '1px solid #32466d', borderRadius: 10 }}
                      itemStyle={{ color: '#f0f4ff' }}
                      labelStyle={{ color: '#c0ccec' }}
                    />
                    {showMortgageReferenceLine ? (
                      <ReferenceLine
                        x={mortgagePaidOffYear ?? undefined}
                        stroke="#94a3b8"
                        strokeDasharray="6 4"
                        label={{
                          value: 'Mortgage Paid Off',
                          position: 'insideTopRight',
                          fill: '#e2e8f0',
                          fontSize: 11,
                          fontWeight: 600,
                          stroke: '#0d162a',
                          strokeWidth: 3,
                          paintOrder: 'stroke',
                        }}
                      />
                    ) : null}
                    {showFiReferenceLine ? (
                      <ReferenceLine
                        x={fiAchievedYear ?? undefined}
                        stroke="#94a3b8"
                        strokeDasharray="6 4"
                        label={{
                          value: 'FI Achieved',
                          position: 'insideTopLeft',
                          fill: '#e2e8f0',
                          fontSize: 11,
                          fontWeight: 600,
                          stroke: '#0d162a',
                          strokeWidth: 3,
                          paintOrder: 'stroke',
                        }}
                      />
                    ) : null}
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="withdrawal"
                      stroke={dataColors.withdrawal}
                      strokeWidth={2}
                      dot={false}
                      activeDot={false}
                      name={vm.withdrawalSeries[0]?.name ?? 'Annual Withdrawal'}
                    />
                    <Line
                      type="monotone"
                      dataKey="expenses"
                      stroke={dataColors.expenses}
                      strokeWidth={2}
                      dot={false}
                      activeDot={false}
                      name="Annual Expenses (Incl. Mortgage)"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </article>

            <table className="section-table">
              <thead>
                <tr>
                  <th>Metric</th>
                  {metricColumns.map((c) => (
                    <th key={c}>{c}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {vm.fiHealthRows.map((row) => (
                  <tr key={row.label}>
                    <td>
                      {row.label === 'Liquid Runway (Years)' ? (
                        <span className="label-with-info">
                          <span>{row.label}</span>
                          <span className="tooltip-wrap">
                            <button type="button" className="info-icon" aria-label="About Liquid Runway">
                              i
                            </button>
                            <span className="tooltip-content tooltip-content--right" role="tooltip">
                              Static runway based on current liquid assets and current annual spend; assumes no investment growth.
                            </span>
                          </span>
                        </span>
                      ) : row.label === 'FI Coverage Ratio' ? (
                        <span className="label-with-info">
                          <span>{row.label}</span>
                          <span className="tooltip-wrap">
                            <button type="button" className="info-icon" aria-label="About FI Coverage Ratio">
                              i
                            </button>
                            <span className="tooltip-content tooltip-content--right" role="tooltip">
                              Ratio of annual FI withdrawals to annual spend (including mortgage): values above 1.00x indicate coverage.
                            </span>
                          </span>
                        </span>
                      ) : (
                        row.label
                      )}
                    </td>
                    {row.values.map((value, valueIndex) => (
                      <td key={`${row.label}-${valueIndex}`}>{value}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </section>

          <section className="narrative-chart">
            <h3 className="section-heading">Assets</h3>
            <div className="narrative-copy">
              <p>{chartDescriptions.assetBreakdown}</p>
              <ul className="chart-takeaways">
                <li>
                  <strong>Projected total assets ({latestAssetSnapshot.year}):</strong> {formatCompactCurrency(latestAssetTotal)}
                </li>
                <li>
                  <strong>Largest component at end of forecast:</strong> {leadingAsset.label} ({formatCompactCurrency(leadingAsset.value)})
                </li>
                <li>
                  <strong>Growth from first to final year:</strong>{' '}
                  {assetGrowthMultiple ? `${assetGrowthMultiple.toFixed(1)}x` : 'N/A (starting assets are £0)'}
                </li>
              </ul>
            </div>
            <article className="plot-card">
              <h4 className="section-subheading">Asset Breakdown Over Time</h4>
              <div className="chart-wrap">
                <ResponsiveContainer width="100%" height={360}>
                  <AreaChart data={assetChartData} margin={{ top: 16, right: 8, left: 12, bottom: 8 }}>
                    <CartesianGrid stroke="#32466d" strokeDasharray="3 3" />
                    <XAxis dataKey="year" stroke="#c0ccec" />
                    <YAxis stroke="#c0ccec" tickFormatter={formatCurrencyTick} />
                    <Tooltip content={renderAssetTooltip} />
                    <Legend />
                    <Area type="monotone" dataKey="isa" stackId="1" stroke={dataColors.isa} fill={dataColors.isa} name="ISA Assets" />
                    <Area
                      type="monotone"
                      dataKey="nonIsa"
                      stackId="1"
                      stroke={dataColors.nonIsa}
                      fill={dataColors.nonIsa}
                      name="Non-ISA Assets"
                    />
                    <Area
                      type="monotone"
                      dataKey="pension"
                      stackId="1"
                      stroke={dataColors.pension}
                      fill={dataColors.pension}
                      name="Pension"
                    />
                    <Area
                      type="monotone"
                      dataKey="homeEquity"
                      stackId="1"
                      stroke={dataColors.homeEquity}
                      fill={dataColors.homeEquity}
                      name="Home Equity"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </article>

            <table className="section-table">
              <thead>
                <tr>
                  <th>Metric</th>
                  {metricColumns.map((c) => (
                    <th key={c}>{c}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {vm.netWorthRows.map((row) => (
                  <tr key={row.label} className={row.isTotal ? 'total' : ''}>
                    <td>{row.label}</td>
                    {row.values.map((value, valueIndex) => (
                      <td key={`${row.label}-${valueIndex}`}>{value}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </section>

          <section className="narrative-chart">
            <h3 className="section-heading">Savings</h3>
            <div className="narrative-copy">
              <p>{chartDescriptions.savings}</p>
              <ul className="chart-takeaways">
                <li>
                  <strong>Active income at {latestSavingsSnapshot.label} (post-tax / pre-tax):</strong>{' '}
                  {formatCompactCurrency(latestActiveIncomePostTax)} / {formatCompactCurrency(latestActiveIncomePreTax)}
                </li>
                <li>
                  <strong>Total committed monthly outflow at {latestSavingsSnapshot.label}:</strong>{' '}
                  {formatCompactCurrency(
                    latestSavingsSnapshot.livingExpenses + latestSavingsSnapshot.mortgage + latestSavingsSnapshot.sippContribution,
                  )}
                </li>
                <li>
                  <strong>Total monthly surplus at {latestSavingsSnapshot.label}:</strong> {formatCompactCurrency(latestMonthlySurplus)}
                </li>
                <li>
                  <strong>Total monthly pension contribution at {latestSavingsSnapshot.label}:</strong>{' '}
                  {formatCompactCurrency(latestSavingsSnapshot.monthlyPensionContribution)}
                </li>
              </ul>
            </div>
            <article className="plot-card">
              <h4 className="section-subheading">Monthly Cash Flow Allocation</h4>
              <div className="chart-wrap">
                <ResponsiveContainer width="100%" height={360}>
                  <BarChart data={savingsChartData} margin={{ top: 16, right: 8, left: 12, bottom: 8 }}>
                    <CartesianGrid stroke="#32466d" strokeDasharray="3 3" />
                    <ReferenceLine y={0} stroke="#f0f4ff" strokeWidth={2} />
                    <XAxis dataKey="label" stroke="#c0ccec" axisLine={false} tickLine={false} />
                    <YAxis stroke="#c0ccec" tickFormatter={formatCurrencyTick} />
                    <Tooltip
                      formatter={(value) => formatCompactCurrency(Number(value ?? 0))}
                      contentStyle={{ backgroundColor: '#0d162a', border: '1px solid #32466d', borderRadius: 10 }}
                      itemStyle={{ color: '#f0f4ff' }}
                      labelStyle={{ color: '#c0ccec' }}
                    />
                    <Legend content={renderSavingsLegend} />
                    <Bar dataKey="livingExpenses" stackId="costs" fill={dataColors.livingExpenses} name="Living Expenses" />
                    <Bar dataKey="mortgage" stackId="costs" fill={dataColors.mortgage} name="Mortgage" />
                    <Bar
                      dataKey="monthlyPensionContribution"
                      stackId="gains"
                      fill={dataColors.monthlyPensionContribution}
                      name="Monthly Pension Contribution"
                    />
                    <Bar dataKey="monthlySurplus" stackId="gains" fill={dataColors.monthlySurplus} name="Monthly Surplus" />
                    <Bar
                      dataKey="monthlyInvestmentGains"
                      stackId="gains"
                      fill={dataColors.monthlyInvestmentGains}
                      name="Monthly Investment Gains"
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </article>

            <table className="section-table">
              <thead>
                <tr>
                  <th>Metric</th>
                  {metricColumns.map((c) => (
                    <th key={c}>{c}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {savingsTableRows.map((row) => (
                  <Fragment key={row.key}>
                    <tr key={row.key} className={row.highlight ? 'highlight-row' : ''}>
                      <td>
                        {row.children ? (
                          <button
                            type="button"
                            className="table-expand-button"
                            onClick={() =>
                              setExpandedSavingsGroups((prev) => ({
                                ...prev,
                                [row.key]: !prev[row.key],
                              }))
                            }
                            aria-expanded={expandedSavingsGroups[row.key] ? 'true' : 'false'}
                            aria-label={expandedSavingsGroups[row.key] ? `Collapse ${row.label}` : `Expand ${row.label}`}
                          >
                            <span className="table-expand-icon" aria-hidden="true">
                              <span className="table-expand-symbol">{expandedSavingsGroups[row.key] ? '-' : '+'}</span>
                            </span>
                            <span>{row.label}</span>
                          </button>
                        ) : (
                          row.label
                        )}
                      </td>
                      {row.values.map((value, valueIndex) => (
                        <td key={`${row.key}-${valueIndex}`}>{value}</td>
                      ))}
                    </tr>
                    {row.children && expandedSavingsGroups[row.key]
                      ? row.children.map((childRow) => (
                          <tr key={childRow.key} className="table-detail-row">
                            <td>{childRow.label}</td>
                            {childRow.values.map((value, valueIndex) => (
                              <td key={`${childRow.key}-${valueIndex}`}>{value}</td>
                            ))}
                          </tr>
                        ))
                      : null}
                  </Fragment>
                ))}
              </tbody>
            </table>
          </section>

        </section>
      </div>
    </div>
  );
};
