import { CartesianGrid, Legend, Line, LineChart, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

import { chartDescriptions, metricColumns } from './constants';
import { formatCompactCurrency, isZeroDisplay } from './format';
import type { DataColors, ForecasterPresentation } from './types';

interface PassiveIncomeSectionProps {
  data: ForecasterPresentation;
  dataColors: DataColors;
  isaAnnualContribution: number;
  advice: string[];
}

export const PassiveIncomeSection = ({ data, dataColors, isaAnnualContribution, advice }: PassiveIncomeSectionProps) => (
  <section className="passive-income-section">
    <div className="passive-income-inner narrative-chart">
      <h3 className="section-heading">Passive income</h3>
      <div className="narrative-copy">
        <p>{chartDescriptions.passiveIncome}</p>
        <ul className="chart-takeaways">
          <li>
            <strong>Financial independence (FI) achieved year:</strong> {data.fiAchievedText}
          </li>
          <li>
            <strong>Mortgage paid off year:</strong> {data.mortgagePaidOffText}
          </li>
          <li>
            <strong>Coverage ratio in {data.latestIncomeSnapshot.year}:</strong> {data.latestCoverageRatio.toFixed(2)}x
          </li>
          <li>
            <strong>Withdrawal minus total spending in {data.latestIncomeSnapshot.year}:</strong> {formatCompactCurrency(data.latestCoverageGap)}
          </li>
        </ul>
        <div className="section-advice section-advice--passive">
          <p className="section-advice-title">Insights</p>
          <ul>
            {advice.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
        <p className="assumption-note">
          <em>
            Assumption: monthly surplus is directed to tax-efficient ISA contributions first, up to your selected annual ISA
            allowance (£{Math.round(isaAnnualContribution).toLocaleString('en-GB')}); any remaining surplus is invested outside ISA
            wrappers.
          </em>
        </p>
      </div>
      <article className="plot-card" data-tour-target="passive-income-chart">
        <h4 className="section-subheading">Potential passive income vs projected expenses</h4>
        <div className="chart-wrap">
          <ResponsiveContainer width="100%" height={360}>
            <LineChart data={data.withdrawalChartData} margin={{ top: 16, right: 90, left: 12, bottom: 8 }}>
              <CartesianGrid stroke="#32466d" strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="year" stroke="#c0ccec" />
              <YAxis stroke="#c0ccec" tickFormatter={formatCompactCurrency} />
              <Tooltip
                formatter={(value) => formatCompactCurrency(Number(value ?? 0))}
                contentStyle={{ backgroundColor: '#0d162a', border: '1px solid #32466d', borderRadius: 10 }}
                itemStyle={{ color: '#f0f4ff' }}
                labelStyle={{ color: '#c0ccec' }}
              />
              {data.showMortgageReferenceLine ? (
                <ReferenceLine
                  x={data.mortgagePaidOffYear ?? undefined}
                  stroke="#94a3b8"
                  strokeDasharray="6 4"
                  label={{
                    value: 'Mortgage paid off',
                    position: 'right',
                    offset: 12,
                    dy: -14,
                    fill: '#e2e8f0',
                    fontSize: 11,
                    fontWeight: 600,
                    stroke: '#0d162a',
                    strokeWidth: 3,
                    paintOrder: 'stroke',
                  }}
                />
              ) : null}
              {data.showFiReferenceLine ? (
                <ReferenceLine
                  x={data.fiAchievedYear ?? undefined}
                  stroke="#94a3b8"
                  strokeDasharray="6 4"
                  label={{
                    value: 'FI achieved',
                    position: 'right',
                    offset: 12,
                    dy: 14,
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
                name={data.vm.withdrawalSeries[0]?.name ?? 'Annual withdrawal'}
              />
              <Line
                type="monotone"
                dataKey="expenses"
                stroke={dataColors.expenses}
                strokeWidth={2}
                dot={false}
                activeDot={false}
                name="Annual expenses (incl. mortgage)"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </article>

      <table className="section-table section-table--passive">
        <thead>
          <tr>
            <th>Metric</th>
            {metricColumns.map((c) => (
              <th key={c}>{c}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.vm.fiHealthRows.map((row) => (
            <tr key={row.label}>
              <td>
                {row.label === 'Liquid runway (years)' ? (
                  <span className="label-with-info">
                    <span>{row.label}</span>
                    <span className="tooltip-wrap">
                      <button type="button" className="info-icon" aria-label="About liquid runway">
                        i
                      </button>
                      <span className="tooltip-content tooltip-content--right" role="tooltip">
                        Static runway based on current liquid assets and current annual spend; assumes no investment growth.
                      </span>
                    </span>
                  </span>
                ) : row.label === 'FI coverage ratio' ? (
                  <span className="label-with-info">
                    <span>{row.label}</span>
                    <span className="tooltip-wrap">
                      <button type="button" className="info-icon" aria-label="About FI coverage ratio">
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
                <td key={`${row.label}-${valueIndex}`}>
                  <span className={isZeroDisplay(value) ? 'table-zero-value' : undefined}>{value}</span>
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </section>
);
