import { useEffect, useMemo, useState } from 'react';

import { buildForecastViewModel, defaultInputs } from '../application/buildForecastViewModel';
import type { ForecastInputs } from '../types/forecast';

const colors = ['#5768ff', '#8e75ff', '#22c55e', '#f59e0b'];

const fields: { key: keyof ForecastInputs; label: string; step?: number }[] = [
  { key: 'income', label: 'Monthly Income (After Tax) (£)' },
  { key: 'expenses', label: 'Monthly Expenses (Excluding Mortgage) (£)' },
  { key: 'isaAssets', label: 'ISA Assets (£)' },
  { key: 'isaRate', label: 'ISA Interest Rate (%)', step: 0.1 },
  { key: 'nonIsaAssets', label: 'Non-ISA Assets (£)' },
  { key: 'nonIsaRate', label: 'Non-ISA Interest Rate (%)', step: 0.1 },
  { key: 'homeValue', label: 'Home Value (£)' },
  { key: 'mortgageBalance', label: 'Remaining Mortgage Balance (£)' },
  { key: 'mortgageTerm', label: 'Remaining Mortgage Term (Years)' },
  { key: 'mortgageInterestRate', label: 'Mortgage Interest Rate (%)', step: 0.01 },
  { key: 'homeAppreciationRate', label: 'Home Appreciation Rate (%)', step: 0.1 },
  { key: 'pensionAssets', label: 'Current Pension Pot (£)' },
  { key: 'pensionContribution', label: 'Personal Contribution (% or £)', step: 0.1 },
  { key: 'employerPensionContributionRate', label: 'Employer Contribution (%)', step: 0.1 },
  { key: 'pensionInterestRate', label: 'Pension Interest Rate (%)', step: 0.1 },
  { key: 'isaAnnualContribution', label: 'Annual ISA Contribution Limit (£)', step: 1000 },
  { key: 'inflationRate', label: 'Inflation Rate (%)', step: 0.1 },
  { key: 'wageIncreaseRate', label: 'Wage Increase Rate (%)', step: 0.1 },
];

const metricColumns = ['Current', '1Y', '5Y', '10Y', '20Y', 'FI'];

export const ForecasterApp = () => {
  const [inputs, setInputs] = useState<ForecastInputs>(defaultInputs);
  const [PlotComponent, setPlotComponent] = useState<null | React.ComponentType<any>>(null);
  const [plotError, setPlotError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    import('react-plotly.js')
      .then((module) => {
        if (mounted) {
          setPlotComponent(() => module.default);
        }
      })
      .catch((error: unknown) => {
        const message = error instanceof Error ? error.message : 'Unknown chart loading error';
        if (mounted) {
          setPlotError(message);
        }
      });
    return () => {
      mounted = false;
    };
  }, []);
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

  if (vmResult.error || !vmResult.vm) {
    return (
      <div className="app-error">
        <h1>App failed to render</h1>
        <pre>{vmResult.error ?? 'Unknown error'}</pre>
      </div>
    );
  }

  const vm = vmResult.vm;

  return (
    <div className="app">
      <header className="hero">
        <h1>Financial Forecaster</h1>
        <p>Plan your financial future with data-driven forecasts</p>
      </header>
      <div className="main">
        <aside className="panel">
          <h2>Inputs</h2>
          <div className="field">
            <label>Contribution Type</label>
            <select
              value={inputs.pensionType}
              onChange={(event) => setInputs((prev) => ({ ...prev, pensionType: event.target.value as ForecastInputs['pensionType'] }))}
            >
              <option value="percentage">Percentage</option>
              <option value="fixed">Fixed Amount</option>
            </select>
          </div>
          <div className="field">
            <label>Pension Tax Relief</label>
            <select
              value={inputs.pensionTaxReliefRate}
              onChange={(event) => setInputs((prev) => ({ ...prev, pensionTaxReliefRate: Number(event.target.value) }))}
            >
              <option value={0}>No Relief (0%)</option>
              <option value={20}>Basic Rate (20%)</option>
              <option value={40}>Higher Rate (40%)</option>
              <option value={45}>Additional Rate (45%)</option>
            </select>
          </div>
          <div className="field">
            <label>Forecast Period (Years)</label>
            <input
              type="range"
              min={1}
              max={40}
              step={1}
              value={inputs.forecastYears}
              onChange={(event) => setInputs((prev) => ({ ...prev, forecastYears: Number(event.target.value) }))}
            />
            <small>{inputs.forecastYears} years</small>
          </div>
          {fields.map(({ key, label, step }) => (
            <div className="field" key={key}>
              <label>{label}</label>
              <input
                type="number"
                step={step ?? 1}
                value={inputs[key] as number}
                onChange={(event) =>
                  setInputs((prev) => ({
                    ...prev,
                    [key]: Number(event.target.value),
                  }))
                }
              />
            </div>
          ))}
          <p className="perf">Recompute latency: {vmResult.elapsedMs.toFixed(1)}ms</p>
        </aside>

        <section className="content">
          <div className="kpis">
            {vm.kpis.map((card) => (
              <article key={card.label} className="card">
                <h3>{card.label}</h3>
                <p>{card.value}</p>
              </article>
            ))}
          </div>

          <div className="charts">
            <article className="plot-card">
              <h3>Asset Breakdown Over Time</h3>
              {PlotComponent ? (
                <PlotComponent
                  data={vm.assetSeries.map((series, index) => ({
                    x: vm.yearlyLabels,
                    y: series.values,
                    type: 'scatter',
                    mode: 'lines',
                    stackgroup: 'one',
                    name: series.name,
                    line: { color: colors[index % colors.length], width: 2, shape: 'spline' as const },
                  }))}
                  layout={{
                    autosize: true,
                    paper_bgcolor: 'rgba(0,0,0,0)',
                    plot_bgcolor: '#141f34',
                    font: { color: '#f0f4ff' },
                    margin: { t: 20, r: 10, l: 50, b: 40 },
                    yaxis: { tickprefix: '£' },
                    legend: { orientation: 'h', y: -0.2 },
                  }}
                  config={{ responsive: true, displaylogo: false }}
                  style={{ width: '100%', height: '100%' }}
                />
              ) : (
                <p className="chart-fallback">
                  {plotError ? `Chart library failed to load: ${plotError}` : 'Loading chart...'}
                </p>
              )}
            </article>

            <article className="plot-card">
              <h3>3.9% Annual Withdrawal vs Annual Expenses</h3>
              {PlotComponent ? (
                <PlotComponent
                  data={vm.withdrawalSeries.map((series, index) => ({
                    x: vm.yearlyLabels,
                    y: series.values,
                    type: 'scatter',
                    mode: 'lines',
                    name: series.name,
                    line: {
                      color: index === 1 ? '#ef4444' : '#5768ff',
                      dash: index === 1 ? 'dash' : 'solid',
                      width: 2,
                      shape: 'spline' as const,
                    },
                  }))}
                  layout={{
                    autosize: true,
                    paper_bgcolor: 'rgba(0,0,0,0)',
                    plot_bgcolor: '#141f34',
                    font: { color: '#f0f4ff' },
                    margin: { t: 20, r: 10, l: 50, b: 40 },
                    yaxis: { tickprefix: '£' },
                    legend: { orientation: 'h', y: -0.2 },
                  }}
                  config={{ responsive: true, displaylogo: false }}
                  style={{ width: '100%', height: '100%' }}
                />
              ) : (
                <p className="chart-fallback">
                  {plotError ? `Chart library failed to load: ${plotError}` : 'Loading chart...'}
                </p>
              )}
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
                    <tr key={row.label}>
                      <td>{row.label}</td>
                      {row.values.map((value) => (
                        <td key={`${row.label}-${value}`}>{value}</td>
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
                      {row.values.map((value) => (
                        <td key={`${row.label}-${value}`}>{value}</td>
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
