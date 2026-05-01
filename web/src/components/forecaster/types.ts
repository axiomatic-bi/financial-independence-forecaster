import type { ForecastInputs, ForecastViewModel } from '../../types/forecast';
import type { Dispatch, SetStateAction } from 'react';

export interface DataColors {
  isa: string;
  nonIsa: string;
  pension: string;
  homeEquity: string;
  withdrawal: string;
  expenses: string;
  livingExpenses: string;
  mortgage: string;
  surplusIsa: string;
  surplusNonIsa: string;
  monthlySurplus: string;
  sippContribution: string;
  workplacePensionContribution: string;
  monthlyPensionContribution: string;
  monthlyInvestmentGains: string;
}

export interface AssetChartPoint {
  year: string;
  isa: number;
  nonIsa: number;
  pension: number;
  homeEquity: number;
}

export interface WithdrawalChartPoint {
  year: string;
  withdrawal: number;
  expenses: number;
}

export interface SavingsChartPoint {
  label: string;
  livingExpenses: number;
  mortgage: number;
  sippContribution: number;
  workplacePensionContribution: number;
  surplusIsa: number;
  surplusNonIsa: number;
  monthlyPensionContribution: number;
  monthlySurplus: number;
  monthlyInvestmentGains: number;
}

export interface SavingsTableRowChild {
  key: string;
  label: string;
  values: string[];
}

export interface SavingsTableRow {
  key: string;
  label: string;
  values: string[];
  children?: SavingsTableRowChild[];
  highlight?: boolean;
}

export interface ForecasterPresentation {
  vm: ForecastViewModel;
  assetChartData: AssetChartPoint[];
  withdrawalChartData: WithdrawalChartPoint[];
  savingsChartData: SavingsChartPoint[];
  savingsTableRows: SavingsTableRow[];
  latestAssetSnapshot: AssetChartPoint;
  latestAssetTotal: number;
  leadingAsset: { label: string; value: number };
  assetGrowthMultiple: number | null;
  latestIncomeSnapshot: WithdrawalChartPoint;
  latestCoverageGap: number;
  latestCoverageRatio: number;
  crossoverYear: string;
  fiAchievedYear: string | null;
  mortgagePaidOffYear: string | null;
  showFiReferenceLine: boolean;
  showMortgageReferenceLine: boolean;
  fiAchievedText: string;
  mortgagePaidOffText: string;
  latestSavingsSnapshot: SavingsChartPoint;
  latestActiveIncomePostTax: number;
  latestActiveIncomePreTax: number;
  latestMonthlySurplus: number;
}

export interface InputsPanelProps {
  inputs: ForecastInputs;
  elapsedMs: number;
  isOpen: boolean;
  onInputsChange: Dispatch<SetStateAction<ForecastInputs>>;
  onCloseMobilePanel: () => void;
}
