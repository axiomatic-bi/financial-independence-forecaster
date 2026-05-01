import { kpiTooltipText } from './constants';
import type { ForecastViewModel } from '../../types/forecast';

interface KpiCardsProps {
  vm: ForecastViewModel;
  extractionRate: number;
}

export const KpiCards = ({ vm, extractionRate }: KpiCardsProps) => (
  <section className="kpis" data-tour-target="kpi-strip">
    <div className="kpis-inner">
      {vm.kpis.map((card) => (
        <article key={card.label} className="card">
          {kpiTooltipText(card.label, extractionRate) && (
            <span className="tooltip-wrap tooltip-corner">
              <button type="button" className="info-icon" aria-label="What FI means">
                i
              </button>
              <span className="tooltip-content" role="tooltip">
                {kpiTooltipText(card.label, extractionRate)}
              </span>
            </span>
          )}
          <h3>{card.label}</h3>
          <p className="kpi-value">{card.value}</p>
        </article>
      ))}
    </div>
  </section>
);
