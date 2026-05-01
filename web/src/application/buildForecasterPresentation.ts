import { metricColumns } from '../components/forecaster/constants';
import { formatTableCurrency, parseCurrencyValue } from '../components/forecaster/format';
import type { ForecasterPresentation, SavingsChartPoint, SavingsTableRow } from '../components/forecaster/types';
import type { ForecastViewModel } from '../types/forecast';

const COST_ROW_LABELS = new Set(['Living Expenses', 'Mortgage']);

const signedFinanceValue = (label: string, rawValue: number): number => (COST_ROW_LABELS.has(label) ? -Math.abs(rawValue) : Math.abs(rawValue));

export const buildForecasterPresentation = (vm: ForecastViewModel): ForecasterPresentation => {
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
  ].reduce(
    (largest, current) => (current.value > largest.value ? current : largest),
    { label: 'ISA', value: latestAssetSnapshot.isa },
  );

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
  const financeSeries = (label: string): number[] =>
    metricColumns.map((_, index) => signedFinanceValue(label, parseCurrencyValue(financeRowByLabel[label]?.[index] ?? '£0')));
  const financeValueAt = (label: string, index: number): number => financeSeries(label)[index] ?? 0;

  const latestActiveIncomePostTax = financeValueAt('Active Income (Post-Tax)', metricColumns.length - 1);
  const latestActiveIncomePreTax = financeValueAt('Active Income (Pre-Tax)', metricColumns.length - 1);
  const savingsChartData: SavingsChartPoint[] = metricColumns.map((label, index) => ({
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

  const groupRowValues = (labels: string[]): string[] =>
    metricColumns.map((_, index) => formatTableCurrency(labels.reduce((sum, label) => sum + financeValueAt(label, index), 0)));
  const formatSeries = (label: string): string[] => financeSeries(label).map((value) => formatTableCurrency(value));

  const savingsTableRows: SavingsTableRow[] = [
    {
      key: 'income',
      label: 'Active Income',
      values: formatSeries('Active Income (Post-Tax)'),
      children: [
        { key: 'active-income-post-tax', label: 'Active Income (Post-Tax)', values: formatSeries('Active Income (Post-Tax)') },
        { key: 'active-income-pre-tax', label: 'Active Income (Pre-Tax)', values: formatSeries('Active Income (Pre-Tax)') },
      ],
    },
    { key: 'living-expenses', label: 'Living Expenses', values: formatSeries('Living Expenses') },
    { key: 'mortgage', label: 'Mortgage', values: formatSeries('Mortgage') },
    {
      key: 'pension',
      label: 'Monthly Pension Contribution',
      values: groupRowValues(['Monthly SIPP Contribution', 'Monthly Workplace Pension Contribution']),
      children: [
        { key: 'sipp-contribution', label: 'Monthly SIPP Contribution', values: formatSeries('Monthly SIPP Contribution') },
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
        { key: 'monthly-surplus-isa', label: 'Monthly Surplus (ISA)', values: formatSeries('Monthly Surplus (ISA)') },
        { key: 'monthly-surplus-non-isa', label: 'Monthly Surplus (Non-ISA)', values: formatSeries('Monthly Surplus (Non-ISA)') },
      ],
      highlight: true,
    },
    {
      key: 'gains',
      label: 'Monthly Investment Gains',
      values: groupRowValues(['Monthly Capital Gains (ISA)', 'Monthly Gains (Non-ISA)']),
      children: [
        { key: 'monthly-capital-gains-isa', label: 'Monthly Capital Gains (ISA)', values: formatSeries('Monthly Capital Gains (ISA)') },
        { key: 'monthly-gains-non-isa', label: 'Monthly Gains (Non-ISA)', values: formatSeries('Monthly Gains (Non-ISA)') },
      ],
    },
  ];

  return {
    vm,
    assetChartData,
    withdrawalChartData,
    savingsChartData,
    savingsTableRows,
    latestAssetSnapshot,
    latestAssetTotal,
    leadingAsset,
    assetGrowthMultiple,
    latestIncomeSnapshot,
    latestCoverageGap,
    latestCoverageRatio,
    crossoverYear,
    fiAchievedYear,
    mortgagePaidOffYear,
    showFiReferenceLine,
    showMortgageReferenceLine,
    fiAchievedText,
    mortgagePaidOffText,
    latestSavingsSnapshot,
    latestActiveIncomePostTax,
    latestActiveIncomePreTax,
    latestMonthlySurplus: latestSavingsSnapshot.surplusIsa + latestSavingsSnapshot.surplusNonIsa,
  };
};
