export type PensionType = 'percentage' | 'fixed';

export interface ForecastInputs {
  income: number;
  expenses: number;
  pensionableMonthlyPay: number;
  isaAssets: number;
  isaRate: number;
  nonIsaAssets: number;
  nonIsaRate: number;
  forecastYears: number;
  homeValue: number;
  mortgageBalance: number;
  mortgageTerm: number;
  mortgageInterestRate: number;
  homeAppreciationRate: number;
  isaAnnualContribution: number;
  pensionType: PensionType;
  pensionAssets: number;
  pensionContribution: number;
  employerPensionContributionRate: number;
  pensionInterestRate: number;
  pensionTaxReliefRate: number;
  sippContribution: number;
  inflationRate: number;
  wageIncreaseRate: number;
  extractionRate: number;
}

export interface ForecastResult {
  dates: string[];
  total_wealth: number[];
  isa_values: number[];
  non_isa_values: number[];
  pension_values: number[];
  monthly_savings: number;
  monthly_savings_values: number[];
  income: number;
  expenses: number;
  monthly_pension: number;
  inflation_rate: number;
  wage_increase_rate: number;
  isa_assets: number;
  non_isa_assets: number;
  final_wealth: number;
  final_pension: number;
  total_gain: number;
  months: number;
  withdrawal_39_annual: number;
  final_isa: number;
  years_until_expenses_covered: number | null;
  final_monthly_expenses: number;
  final_annual_expenses: number;
  expense_values: number[];
  income_values: number[];
  mortgage_balance_values: number[];
  mortgage_payment_values: number[];
  home_equity_values: number[];
  home_value: number;
  final_mortgage_balance: number;
  final_home_equity: number;
  monthly_mortgage_payment: number;
  mortgage_interest_rate: number;
  pensionable_monthly_pay: number;
  sipp_contribution: number;
  fi_date: string | null;
  fi_month_index: number | null;
  fi_evaluation_end_month: number;
  extraction_rate: number;
}

export interface TableRow {
  label: string;
  values: string[];
  isTotal?: boolean;
}

export interface KpiCard {
  label: string;
  value: string;
}

export interface ForecastViewModel {
  kpis: KpiCard[];
  yearlyLabels: string[];
  assetSeries: { name: string; values: number[] }[];
  withdrawalSeries: { name: string; values: number[] }[];
  financeRows: TableRow[];
  netWorthRows: TableRow[];
  raw: ForecastResult;
}
