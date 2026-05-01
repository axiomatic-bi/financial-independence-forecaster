import { Area, AreaChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

import { chartDescriptions, metricColumns } from './constants';
import { formatCompactCurrency } from './format';
import type { DataColors, ForecasterPresentation } from './types';

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

interface AssetsSectionProps {
  data: ForecasterPresentation;
  dataColors: DataColors;
}

export const AssetsSection = ({ data, dataColors }: AssetsSectionProps) => (
  <section className="narrative-chart">
    <h3 className="section-heading">Assets</h3>
    <div className="narrative-copy">
      <p>{chartDescriptions.assetBreakdown}</p>
      <ul className="chart-takeaways">
        <li>
          <strong>Projected total assets ({data.latestAssetSnapshot.year}):</strong> {formatCompactCurrency(data.latestAssetTotal)}
        </li>
        <li>
          <strong>Largest component at end of forecast:</strong> {data.leadingAsset.label} ({formatCompactCurrency(data.leadingAsset.value)})
        </li>
        <li>
          <strong>Growth from first to final year:</strong> {data.assetGrowthMultiple ? `${data.assetGrowthMultiple.toFixed(1)}x` : 'N/A (starting assets are £0)'}
        </li>
      </ul>
    </div>
    <article className="plot-card">
      <h4 className="section-subheading">Asset Breakdown Over Time</h4>
      <div className="chart-wrap">
        <ResponsiveContainer width="100%" height={360}>
          <AreaChart data={data.assetChartData} margin={{ top: 16, right: 8, left: 12, bottom: 8 }}>
            <CartesianGrid stroke="#32466d" strokeDasharray="3 3" />
            <XAxis dataKey="year" stroke="#c0ccec" />
            <YAxis stroke="#c0ccec" tickFormatter={formatCompactCurrency} />
            <Tooltip content={renderAssetTooltip} />
            <Legend />
            <Area type="monotone" dataKey="isa" stackId="1" stroke={dataColors.isa} fill={dataColors.isa} name="ISA Assets" />
            <Area type="monotone" dataKey="nonIsa" stackId="1" stroke={dataColors.nonIsa} fill={dataColors.nonIsa} name="Non-ISA Assets" />
            <Area type="monotone" dataKey="pension" stackId="1" stroke={dataColors.pension} fill={dataColors.pension} name="Pension" />
            <Area type="monotone" dataKey="homeEquity" stackId="1" stroke={dataColors.homeEquity} fill={dataColors.homeEquity} name="Home Equity" />
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
        {data.vm.netWorthRows.map((row) => (
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
);
