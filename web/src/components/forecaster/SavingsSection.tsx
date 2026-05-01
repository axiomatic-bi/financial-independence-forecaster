import { Fragment } from 'react';
import { Bar, BarChart, CartesianGrid, Legend, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

import { chartDescriptions, metricColumns } from './constants';
import { formatCompactCurrency } from './format';
import type { DataColors, ForecasterPresentation } from './types';

interface SavingsSectionProps {
  data: ForecasterPresentation;
  dataColors: DataColors;
  expandedSavingsGroups: Record<string, boolean>;
  onToggleSavingsGroup: (groupKey: string) => void;
}

export const SavingsSection = ({ data, dataColors, expandedSavingsGroups, onToggleSavingsGroup }: SavingsSectionProps) => {
  const savingsLegendItems = [
    { label: 'Living Expenses', color: dataColors.livingExpenses },
    { label: 'Mortgage', color: dataColors.mortgage },
    { label: 'Monthly Pension Contribution', color: dataColors.monthlyPensionContribution },
    { label: 'Monthly Surplus', color: dataColors.monthlySurplus },
    { label: 'Monthly Investment Gains', color: dataColors.monthlyInvestmentGains },
  ];

  const renderSavingsLegend = () => (
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

  return (
    <section className="savings-section">
      <div className="savings-inner narrative-chart">
        <h3 className="section-heading">Savings</h3>
        <div className="narrative-copy">
          <p>{chartDescriptions.savings}</p>
          <ul className="chart-takeaways">
            <li>
              <strong>Active income at {data.latestSavingsSnapshot.label} (post-tax / pre-tax):</strong>{' '}
              {formatCompactCurrency(data.latestActiveIncomePostTax)} / {formatCompactCurrency(data.latestActiveIncomePreTax)}
            </li>
            <li>
              <strong>Total committed monthly outflow at {data.latestSavingsSnapshot.label}:</strong>{' '}
              {formatCompactCurrency(
                data.latestSavingsSnapshot.livingExpenses + data.latestSavingsSnapshot.mortgage + data.latestSavingsSnapshot.sippContribution,
              )}
            </li>
            <li>
              <strong>Total monthly surplus at {data.latestSavingsSnapshot.label}:</strong> {formatCompactCurrency(data.latestMonthlySurplus)}
            </li>
            <li>
              <strong>Total monthly pension contribution at {data.latestSavingsSnapshot.label}:</strong>{' '}
              {formatCompactCurrency(data.latestSavingsSnapshot.monthlyPensionContribution)}
            </li>
          </ul>
        </div>
        <article className="plot-card">
          <h4 className="section-subheading">Monthly Cash Flow Allocation</h4>
          <div className="chart-wrap">
            <ResponsiveContainer width="100%" height={360}>
              <BarChart data={data.savingsChartData} margin={{ top: 16, right: 8, left: 12, bottom: 8 }}>
                <CartesianGrid stroke="#32466d" strokeDasharray="3 3" />
                <ReferenceLine y={0} stroke="#f0f4ff" strokeWidth={2} />
                <XAxis dataKey="label" stroke="#c0ccec" axisLine={false} tickLine={false} />
                <YAxis stroke="#c0ccec" tickFormatter={formatCompactCurrency} />
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
                <Bar dataKey="monthlyInvestmentGains" stackId="gains" fill={dataColors.monthlyInvestmentGains} name="Monthly Investment Gains" />
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
            {data.savingsTableRows.map((row) => (
              <Fragment key={row.key}>
                <tr key={row.key} className={row.highlight ? 'highlight-row' : ''}>
                  <td>
                    {row.children ? (
                      <button
                        type="button"
                        className="table-expand-button"
                        onClick={() => onToggleSavingsGroup(row.key)}
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
      </div>
    </section>
  );
};
