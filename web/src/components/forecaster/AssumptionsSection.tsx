import { formatCompactCurrency } from './format';
import type { ForecasterPresentation } from './types';
import type { ForecastInputs } from '../../types/forecast';

interface AssumptionsSectionProps {
  data: ForecasterPresentation;
  inputs: ForecastInputs;
}

const formatRate = (value: number): string => `${value.toFixed(1)}%`;

const formatMoney = (value: number): string => formatCompactCurrency(value);

const pensionContributionLabel = (inputs: ForecastInputs): string => {
  if (inputs.pensionType === 'fixed') {
    return `${formatMoney(inputs.pensionContribution)} per month (fixed)`;
  }
  return `${formatRate(inputs.pensionContribution)} of pensionable pay (${formatMoney(inputs.pensionableMonthlyPay)}/month)`;
};

export const AssumptionsSection = ({ data, inputs }: AssumptionsSectionProps) => {
  const assumptionRows: Array<{ assumption: string; value: string; usage: string }> = [
    {
      assumption: 'Forecast horizon',
      value: `${inputs.forecastYears} years`,
      usage: 'All projections run monthly over this period.',
    },
    {
      assumption: 'Monthly take-home income baseline',
      value: `${formatMoney(inputs.income)}/month`,
      usage: 'Starting post-tax income used for monthly surplus calculations.',
    },
    {
      assumption: 'Monthly living expenses baseline',
      value: `${formatMoney(inputs.expenses)}/month`,
      usage: 'Core spending before mortgage, inflated through time.',
    },
    {
      assumption: 'Wage growth',
      value: formatRate(inputs.wageIncreaseRate),
      usage: 'Used to grow active income over time.',
    },
    {
      assumption: 'Inflation',
      value: formatRate(inputs.inflationRate),
      usage: 'Used to grow spending and convert real-value metrics.',
    },
    {
      assumption: 'ISA growth rate',
      value: formatRate(inputs.isaRate),
      usage: 'Applied to ISA balances in asset and gain projections.',
    },
    {
      assumption: 'Non-ISA growth rate',
      value: formatRate(inputs.nonIsaRate),
      usage: 'Applied to taxable investments outside ISA wrappers.',
    },
    {
      assumption: 'Pension growth rate',
      value: formatRate(inputs.pensionInterestRate),
      usage: 'Applied to pension pot growth over the forecast.',
    },
    {
      assumption: 'Home appreciation rate',
      value: formatRate(inputs.homeAppreciationRate),
      usage: 'Used to project home value and home-equity series.',
    },
    {
      assumption: 'ISA annual contribution cap',
      value: `${formatMoney(inputs.isaAnnualContribution)}/year`,
      usage: 'Monthly surplus is allocated to ISA first up to this cap, then to non-ISA.',
    },
    {
      assumption: 'Workplace pension personal contribution',
      value: pensionContributionLabel(inputs),
      usage: 'Contributes to pension accumulation according to selected contribution type.',
    },
    {
      assumption: 'Employer pension contribution',
      value: formatRate(inputs.employerPensionContributionRate),
      usage: 'Added from pensionable pay into pension projections.',
    },
    {
      assumption: 'SIPP contribution (net)',
      value: `${formatMoney(inputs.sippContribution)}/month`,
      usage: 'Paid from take-home cash flow and added to pension investing.',
    },
    {
      assumption: 'Pension tax relief',
      value: formatRate(inputs.pensionTaxReliefRate),
      usage: 'Applied to SIPP contributions when calculating pension inflows.',
    },
    {
      assumption: 'Mortgage terms',
      value: `${formatMoney(inputs.mortgageBalance)} balance, ${formatRate(inputs.mortgageInterestRate)} rate, ${inputs.mortgageTerm} years`,
      usage: 'Drives monthly mortgage cash outflow and payoff timing.',
    },
    {
      assumption: 'FI extraction rate',
      value: formatRate(inputs.extractionRate),
      usage: 'Annual ISA + non-ISA withdrawal rate used for FI checks and passive-income projections.',
    },
    {
      assumption: 'FI asset basis',
      value: 'ISA and Non-ISA only',
      usage: 'Pension and home equity are excluded from FI withdrawal coverage.',
    },
    {
      assumption: 'FI spending basis',
      value: 'Inflation-adjusted annual expenses, including mortgage where applicable',
      usage: 'FI is reached when projected withdrawal covers projected annual spending.',
    },
    {
      assumption: 'Current model outcome under these assumptions',
      value: `FI: ${data.fiAchievedText}; Mortgage paid off: ${data.mortgagePaidOffText}`,
      usage: 'High-level outcome resulting from the above parameter set.',
    },
  ];

  return (
    <section className="narrative-chart assumptions-section">
      <h3 className="section-heading">Assumptions</h3>
      <div className="narrative-copy">
        <p>
          This section documents the calculation assumptions currently active in your model. Where possible, values are pulled directly
          from your current input panel settings.
        </p>
        <ul className="chart-takeaways">
          <li>
            <strong>Coverage ratio in {data.latestIncomeSnapshot.year}:</strong> {data.latestCoverageRatio.toFixed(2)}x
          </li>
          <li>
            <strong>FI status:</strong> {data.fiAchievedText}
          </li>
          <li>
            <strong>Mortgage status:</strong> {data.mortgagePaidOffText}
          </li>
        </ul>
      </div>
      <table className="section-table">
        <thead>
          <tr>
            <th>Assumption</th>
            <th>Current Setting</th>
            <th>How It Is Used In Calculations</th>
          </tr>
        </thead>
        <tbody>
          {assumptionRows.map((row) => (
            <tr key={row.assumption}>
              <td>{row.assumption}</td>
              <td>{row.value}</td>
              <td>{row.usage}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
};
