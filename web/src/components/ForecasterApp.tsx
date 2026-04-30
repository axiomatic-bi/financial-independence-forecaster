import { type FocusEvent, useEffect, useMemo, useState } from 'react';
import {
  Area,
  AreaChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
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
          <strong>£{Math.round(Number(item.value ?? 0)).toLocaleString()}</strong>
        </p>
      ))}
      <p className="chart-tooltip-row chart-tooltip-total">
        <span>Total</span>
        <strong>£{Math.round(total).toLocaleString()}</strong>
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
  const dataColors = useMemo(
    () => ({
      isa: themeDataColor('--data-color-1', '#5B8CFF'),
      nonIsa: themeDataColor('--data-color-2', '#8E75FF'),
      pension: themeDataColor('--data-color-3', '#6E5BFF'),
      homeEquity: themeDataColor('--data-color-4', '#C7B8FF'),
      withdrawal: themeDataColor('--data-color-1', '#5B8CFF'),
      expenses: themeDataColor('--data-color-2', '#8E75FF'),
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
  const formatCurrencyTick = (value: number) => `£${Math.round(value).toLocaleString()}`;
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
        <h1>Financial Forecaster</h1>
        <p>Plan your financial future with data-driven forecasts</p>
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
          <div className="kpis">
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

          <div className="charts">
            <article className="plot-card">
              <h3>Asset Breakdown Over Time</h3>
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

            <article className="plot-card">
              <h3>Potential Passive Income vs Projected Expenses</h3>
              <div className="chart-wrap">
                <ResponsiveContainer width="100%" height={360}>
                  <LineChart data={withdrawalChartData} margin={{ top: 16, right: 8, left: 12, bottom: 8 }}>
                    <CartesianGrid stroke="#32466d" strokeDasharray="3 3" />
                    <XAxis dataKey="year" stroke="#c0ccec" />
                    <YAxis stroke="#c0ccec" tickFormatter={formatCurrencyTick} />
                    <Tooltip
                      formatter={(value) => formatCurrencyTick(Number(value ?? 0))}
                      contentStyle={{ backgroundColor: '#0d162a', border: '1px solid #32466d', borderRadius: 10 }}
                      itemStyle={{ color: '#f0f4ff' }}
                      labelStyle={{ color: '#c0ccec' }}
                    />
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
                      strokeDasharray="6 4"
                      dot={false}
                      activeDot={false}
                      name="Annual Expenses (Inflation-Adjusted)"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </article>
          </div>

          <div className="tables">
            <article className="table-card">
              <h3>Financial Metrics</h3>
              <table>
                <thead>
                  <tr>
                    <th>Metric</th>
                    {metricColumns.map((c) => (
                      <th key={c}>{c}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {vm.financeRows.map((row) => (
                    <tr key={row.label} className={row.label === 'Monthly Savings' ? 'highlight-row' : ''}>
                      <td>{row.label}</td>
                      {row.values.map((value, valueIndex) => (
                        <td key={`${row.label}-${valueIndex}`}>{value}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </article>

            <article className="table-card">
              <h3>Assets and Net Worth</h3>
              <table>
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
            </article>
          </div>
        </section>
      </div>
    </div>
  );
};
