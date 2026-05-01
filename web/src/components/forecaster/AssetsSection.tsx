import { Fragment } from 'react';
import { Area, AreaChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

import { chartDescriptions, metricColumns } from './constants';
import { formatCompactCurrency, formatTableCurrency, isZeroDisplay, parseCurrencyValue } from './format';
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
  advice: string[];
  expandedAssetGroups: Record<string, boolean>;
  onToggleAssetGroup: (groupKey: string) => void;
}

const assetTableLabel = (label: string): string => {
  if (label === 'ISA') {
    return 'ISA assets';
  }
  return label;
};

export const AssetsSection = ({ data, dataColors, advice, expandedAssetGroups, onToggleAssetGroup }: AssetsSectionProps) => (
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
      <div className="section-advice section-advice--assets">
        <p className="section-advice-title">Insights</p>
        <ul>
          {advice.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </div>
      <p className="assumption-note">
        <em>
          Assumption: ISA, non-ISA, pension, and home values grow using constant annual rates from Inputs (before inflation adjustments
          shown in separate real-value metrics).
        </em>
      </p>
    </div>
    <article className="plot-card">
      <h4 className="section-subheading">Asset breakdown over time</h4>
      <div className="chart-wrap">
        <ResponsiveContainer width="100%" height={360}>
          <AreaChart data={data.assetChartData} margin={{ top: 16, right: 8, left: 12, bottom: 8 }}>
            <CartesianGrid stroke="#32466d" strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="year" stroke="#c0ccec" />
            <YAxis stroke="#c0ccec" tickFormatter={formatCompactCurrency} />
            <Tooltip content={renderAssetTooltip} />
            <Legend />
            <Area type="monotone" dataKey="isa" stackId="1" stroke={dataColors.isa} fill={dataColors.isa} name="ISA assets" />
            <Area type="monotone" dataKey="nonIsa" stackId="1" stroke={dataColors.nonIsa} fill={dataColors.nonIsa} name="Non-ISA assets" />
            <Area type="monotone" dataKey="pension" stackId="1" stroke={dataColors.pension} fill={dataColors.pension} name="Pension" />
            <Area type="monotone" dataKey="homeEquity" stackId="1" stroke={dataColors.homeEquity} fill={dataColors.homeEquity} name="Home equity" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </article>

    <AssetsTable data={data} expandedAssetGroups={expandedAssetGroups} onToggleAssetGroup={onToggleAssetGroup} />
  </section>
);

const AssetsTable = ({
  data,
  expandedAssetGroups,
  onToggleAssetGroup,
}: Pick<AssetsSectionProps, 'data' | 'expandedAssetGroups' | 'onToggleAssetGroup'>) => {
  const investmentChildren = data.vm.netWorthRows.filter(
    (row) => row.label === 'ISA investments' || row.label === 'Non-ISA investments (GIA)',
  );
  const investmentParentValues = metricColumns.map((_, index) =>
    formatTableCurrency(investmentChildren.reduce((sum, row) => sum + parseCurrencyValue(row.values[index] ?? '£0'), 0)),
  );
  const primaryRows = data.vm.netWorthRows.filter(
    (row) => row.label !== 'ISA investments' && row.label !== 'Non-ISA investments (GIA)',
  );

  return (
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
        <Fragment key="investments-group">
          <tr>
            <td>
              <button
                type="button"
                className="table-expand-button"
                onClick={() => onToggleAssetGroup('investments')}
                aria-expanded={expandedAssetGroups.investments ? 'true' : 'false'}
                aria-label={expandedAssetGroups.investments ? 'Collapse investments' : 'Expand investments'}
              >
                <span className="table-expand-icon" aria-hidden="true">
                  <span className="table-expand-symbol">›</span>
                </span>
                <span>Investments</span>
              </button>
            </td>
            {investmentParentValues.map((value, valueIndex) => (
              <td key={`investments-${valueIndex}`}>
                <span className={isZeroDisplay(value) ? 'table-zero-value' : undefined}>{value}</span>
              </td>
            ))}
          </tr>
          {expandedAssetGroups.investments
            ? investmentChildren.map((row) => (
                <tr key={row.label} className="table-detail-row">
                  <td>{assetTableLabel(row.label)}</td>
                  {row.values.map((value, valueIndex) => (
                    <td key={`${row.label}-${valueIndex}`}>
                      <span className={isZeroDisplay(value) ? 'table-zero-value' : undefined}>{value}</span>
                    </td>
                  ))}
                </tr>
              ))
            : null}
        </Fragment>
        {primaryRows.map((row) => (
          <tr key={row.label} className={row.label === "Real net worth (today's £)" ? 'highlight-row' : ''}>
            <td>{assetTableLabel(row.label)}</td>
            {row.values.map((value, valueIndex) => (
              <td key={`${row.label}-${valueIndex}`}>
                <span className={isZeroDisplay(value) ? 'table-zero-value' : undefined}>{value}</span>
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
};
