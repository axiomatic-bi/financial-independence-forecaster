import type { ForecastResult, PensionType } from '../types/forecast';

const FI_EVALUATION_MONTHS = 40 * 12;
const DEFAULT_EXTRACTION_RATE = 3.9;

const orZero = (value: number | null | undefined): number => value ?? 0;
const calculateAnnualWithdrawal = (isa: number, nonIsa: number, extractionRatePercent: number): number => {
  const extractionRate = extractionRatePercent / 100;
  return isa * extractionRate + Math.min(nonIsa, 3000) * extractionRate + Math.max(0, nonIsa - 3000) * extractionRate * 0.76;
};

const addMonths = (baseDate: Date, months: number): Date => {
  const date = new Date(baseDate);
  date.setUTCMonth(baseDate.getUTCMonth() + months, 1);
  date.setUTCHours(0, 0, 0, 0);
  return date;
};

const toIsoMonth = (date: Date): string => {
  const year = date.getUTCFullYear();
  const month = `${date.getUTCMonth() + 1}`.padStart(2, '0');
  return `${year}-${month}`;
};

export const calculateMonthlyPension = (
  baseIncome: number,
  pensionType: PensionType,
  pensionContribution: number,
  pensionRate: number,
): number => {
  if (pensionType === 'percentage') {
    const pensionAmount = pensionContribution || pensionRate;
    return baseIncome * (pensionAmount / 100);
  }
  return pensionContribution;
};

export const calculateMortgagePayment = (
  balance: number,
  annualRate: number,
  yearsRemaining: number,
): number => {
  if (balance <= 0 || yearsRemaining <= 0 || annualRate <= 0) {
    return 0;
  }

  const monthlyRate = annualRate / 12 / 100;
  const numPayments = Math.trunc(yearsRemaining * 12);
  if (monthlyRate === 0) {
    return balance / numPayments;
  }
  const numerator = monthlyRate * (1 + monthlyRate) ** numPayments;
  const denominator = (1 + monthlyRate) ** numPayments - 1;
  return balance * (numerator / denominator);
};

interface SimulateMonthArgs {
  month: number;
  date: Date;
  currentIsa: number;
  currentNonIsa: number;
  currentPension: number;
  currentIncome: number;
  currentPensionableIncome: number;
  currentExpenses: number;
  isaRate: number;
  nonIsaRate: number;
  pensionInterestRate: number;
  annualIsaLimit: number;
  isaAnnualUsed: number;
  inflationRate: number;
  wageIncreaseRate: number;
  pensionType: PensionType;
  pensionContribution: number;
  employerPensionContributionRate: number;
  pensionRate: number;
  sippType: PensionType;
  sippContribution: number;
  sippRate: number;
  pensionTaxReliefRate: number;
}

interface MonthResult {
  isa: number;
  non_isa: number;
  pension: number;
  income: number;
  pensionable_income: number;
  expenses: number;
  savings: number;
  isa_annual_used: number;
  monthly_personal_pension: number;
}

const simulateMonth = (args: SimulateMonthArgs): MonthResult => {
  let {
    month,
    date,
    currentIsa,
    currentNonIsa,
    currentPension,
    currentIncome,
    currentPensionableIncome,
    currentExpenses,
    isaRate,
    nonIsaRate,
    pensionInterestRate,
    annualIsaLimit,
    isaAnnualUsed,
    inflationRate,
    wageIncreaseRate,
    pensionType,
    pensionContribution,
    employerPensionContributionRate,
    pensionRate,
    sippType,
    sippContribution,
    sippRate,
    pensionTaxReliefRate,
  } = args;

  if (month > 0 && date.getUTCMonth() + 1 === 1) {
    currentExpenses = currentExpenses * (1 + inflationRate / 100);
    currentIncome = currentIncome * (1 + wageIncreaseRate / 100);
    currentPensionableIncome = currentPensionableIncome * (1 + wageIncreaseRate / 100);
  }
  if (month > 0 && date.getUTCMonth() + 1 === 4) {
    isaAnnualUsed = 0;
  }

  const currentMonthlyWorkplacePension = calculateMonthlyPension(
    currentPensionableIncome,
    pensionType,
    pensionContribution,
    pensionRate,
  );
  const currentMonthlySippNet = calculateMonthlyPension(currentPensionableIncome, sippType, sippContribution, sippRate);
  const currentMonthlyEmployerPension = currentPensionableIncome * (employerPensionContributionRate / 100);
  let currentMonthlySippGross = currentMonthlySippNet;
  if (pensionTaxReliefRate && currentMonthlySippNet > 0) {
    currentMonthlySippGross *= 1 + pensionTaxReliefRate / 100;
  }
  const currentMonthlyPersonalPension = currentMonthlyWorkplacePension + currentMonthlySippNet;

  // Net-pay model: take-home income already excludes workplace employee pension deductions.
  const currentMonthlySavings = currentIncome - currentExpenses - currentMonthlySippNet;
  if (month > 0) {
    currentIsa = currentIsa * (1 + isaRate / 12);
    currentNonIsa = currentNonIsa * (1 + nonIsaRate / 12);
    currentPension = currentPension * (1 + pensionInterestRate / 12);
    if (currentMonthlySavings > 0) {
      const remainingIsaAllowance = annualIsaLimit - isaAnnualUsed;
      const isaContribution = Math.min(currentMonthlySavings, remainingIsaAllowance);
      const nonIsaContribution = Math.max(0, currentMonthlySavings - isaContribution);
      currentIsa += isaContribution;
      currentNonIsa += nonIsaContribution;
      isaAnnualUsed += isaContribution;
    }
    currentPension += currentMonthlyWorkplacePension + currentMonthlySippGross + currentMonthlyEmployerPension;
  }

  return {
    isa: currentIsa,
    non_isa: currentNonIsa,
    pension: currentPension,
    income: currentIncome,
    pensionable_income: currentPensionableIncome,
    expenses: currentExpenses,
    savings: currentMonthlySavings,
    isa_annual_used: isaAnnualUsed,
    monthly_personal_pension: currentMonthlyPersonalPension,
  };
};

export const calculateForecast = (input: {
  income: number;
  expenses: number;
  isaAssets: number;
  isaRate: number;
  nonIsaAssets: number;
  nonIsaRate: number;
  months: number;
  homeValue?: number;
  mortgageBalance?: number;
  mortgageTerm?: number;
  mortgageInterestRate?: number;
  homeAppreciationRate?: number;
  pensionAssets?: number;
  pensionContribution?: number;
  employerPensionContributionRate?: number;
  pensionType?: PensionType;
  pensionRate?: number;
  pensionInterestRate?: number;
  pensionTaxReliefRate?: number;
  inflationRate?: number;
  wageIncreaseRate?: number;
  isaAnnualContribution?: number;
  extractionRate?: number;
  pensionableMonthlyPay?: number;
  sippType?: PensionType;
  sippContribution?: number;
  sippRate?: number;
}): ForecastResult => {
  const income = orZero(input.income);
  const expenses = orZero(input.expenses);
  const isaAssets = orZero(input.isaAssets);
  const isaRate = orZero(input.isaRate) / 100;
  const nonIsaAssets = orZero(input.nonIsaAssets);
  const nonIsaRate = orZero(input.nonIsaRate) / 100;
  const months = input.months;
  let homeValue = orZero(input.homeValue);
  const mortgageBalance = orZero(input.mortgageBalance);
  const mortgageTerm = orZero(input.mortgageTerm);
  const mortgageInterestRate = orZero(input.mortgageInterestRate);
  const homeAppreciationRate = orZero(input.homeAppreciationRate) / 100;
  const pensionAssets = orZero(input.pensionAssets);
  const pensionContribution = orZero(input.pensionContribution);
  const employerPensionContributionRate = orZero(input.employerPensionContributionRate);
  const pensionType = input.pensionType ?? 'percentage';
  const pensionRate = orZero(input.pensionRate ?? 5);
  const pensionInterestRate = orZero(input.pensionInterestRate) / 100;
  const pensionTaxReliefRate = orZero(input.pensionTaxReliefRate ?? 20);
  const inflationRate = orZero(input.inflationRate ?? 2);
  const wageIncreaseRate = orZero(input.wageIncreaseRate ?? 3);
  const isaAnnualContribution = orZero(input.isaAnnualContribution ?? 40000);
  const extractionRate = orZero(input.extractionRate ?? DEFAULT_EXTRACTION_RATE);
  const pensionableMonthlyPay = input.pensionableMonthlyPay == null ? income : orZero(input.pensionableMonthlyPay);
  const sippType = input.sippType ?? 'fixed';
  const sippContribution = orZero(input.sippContribution);
  const sippRate = orZero(input.sippRate);

  let mortgageMonthsRemaining = mortgageTerm ? Math.trunc(mortgageTerm * 12) : 0;
  const monthlyMortgagePayment = calculateMortgagePayment(
    mortgageBalance,
    mortgageInterestRate,
    mortgageTerm,
  );

  const monthlyWorkplacePension = calculateMonthlyPension(
    pensionableMonthlyPay,
    pensionType,
    pensionContribution,
    pensionRate,
  );
  const monthlySippNet = calculateMonthlyPension(pensionableMonthlyPay, sippType, sippContribution, sippRate);
  // Net-pay model: only SIPP is deducted from take-home cashflow.
  const monthlySavings = income - expenses - monthlySippNet;

  const dates: string[] = [];
  const totalWealth: number[] = [];
  const isaValues: number[] = [];
  const nonIsaValues: number[] = [];
  const pensionValues: number[] = [];
  const expenseValues: number[] = [];
  const monthlySavingsValues: number[] = [];
  const mortgageBalanceValues: number[] = [];
  const homeEquityValues: number[] = [];
  const incomeValues: number[] = [];
  const mortgagePaymentValues: number[] = [];

  let currentIsa = isaAssets;
  let currentNonIsa = nonIsaAssets;
  let currentPension = pensionAssets;
  let currentIncome = income;
  let currentPensionableIncome = pensionableMonthlyPay;
  let currentExpenses = expenses;
  let isaAnnualUsed = 0;
  let currentMortgageBalance = mortgageBalance;
  let currentHomeEquity = Math.max(0, homeValue - currentMortgageBalance);

  let yearsUntilCovered: number | null = null;
  let fiDate: string | null = null;
  let fiMonthIndex: number | null = null;
  const fiEvaluationEndMonth = Math.max(months, FI_EVALUATION_MONTHS);
  const startDate = new Date(Date.UTC(new Date().getUTCFullYear(), new Date().getUTCMonth(), 1));

  for (let month = 0; month <= fiEvaluationEndMonth; month += 1) {
    const date = addMonths(startDate, month);
    if (month <= months) {
      dates.push(toIsoMonth(date));
    }
    const monthResult = simulateMonth({
      month,
      date,
      currentIsa,
      currentNonIsa,
      currentPension,
      currentIncome,
      currentPensionableIncome,
      currentExpenses,
      isaRate,
      nonIsaRate,
      pensionInterestRate,
      annualIsaLimit: isaAnnualContribution,
      isaAnnualUsed,
      inflationRate,
      wageIncreaseRate,
      pensionType,
      pensionContribution,
      employerPensionContributionRate,
      pensionRate,
      sippType,
      sippContribution,
      sippRate,
      pensionTaxReliefRate,
    });
    currentIsa = monthResult.isa;
    currentNonIsa = monthResult.non_isa;
    currentPension = monthResult.pension;
    currentIncome = monthResult.income;
    currentPensionableIncome = monthResult.pensionable_income;
    currentExpenses = monthResult.expenses;
    isaAnnualUsed = monthResult.isa_annual_used;

    if (month > 0 && date.getUTCMonth() + 1 === 1) {
      homeValue = homeValue * (1 + homeAppreciationRate);
    }
    if (month > 0 && mortgageMonthsRemaining > 0) {
      const monthlyRate = mortgageInterestRate / 12 / 100;
      const interestPayment = currentMortgageBalance * monthlyRate;
      const principalPayment = monthlyMortgagePayment - interestPayment;
      currentMortgageBalance = Math.max(0, currentMortgageBalance - principalPayment);
      mortgageMonthsRemaining -= 1;
    }

    currentHomeEquity = Math.max(0, homeValue - currentMortgageBalance);
    const currentMortgagePayment = mortgageMonthsRemaining > 0 ? monthlyMortgagePayment : 0;
    if (month <= months) {
      isaValues.push(currentIsa);
      nonIsaValues.push(currentNonIsa);
      pensionValues.push(currentPension);
      expenseValues.push(currentExpenses);
      incomeValues.push(currentIncome);
      monthlySavingsValues.push(monthResult.savings);
      mortgageBalanceValues.push(currentMortgageBalance);
      homeEquityValues.push(currentHomeEquity);
      mortgagePaymentValues.push(currentMortgagePayment);
      totalWealth.push(currentIsa + currentNonIsa + currentPension + currentHomeEquity);
    }

    if (yearsUntilCovered === null) {
      const annualWithdrawal = calculateAnnualWithdrawal(currentIsa, currentNonIsa, extractionRate);
      const annualExpenses = currentExpenses * 12;
      if (annualWithdrawal >= annualExpenses) {
        yearsUntilCovered = month / 12;
        fiDate = toIsoMonth(date);
        fiMonthIndex = month;
      }
    }
  }

  const finalWealth = totalWealth[totalWealth.length - 1];
  const finalPension = pensionValues[pensionValues.length - 1];
  const totalGain = finalWealth - (isaAssets + nonIsaAssets);
  const finalIsa = isaValues.length ? isaValues[isaValues.length - 1] : 0;
  const finalNonIsa = nonIsaValues.length ? nonIsaValues[nonIsaValues.length - 1] : 0;
  const withdrawal39Annual = calculateAnnualWithdrawal(finalIsa, finalNonIsa, extractionRate);
  const finalMonthlyExpenses = expenseValues.length ? expenseValues[expenseValues.length - 1] : expenses;
  const finalAnnualExpenses = finalMonthlyExpenses * 12;

  return {
    dates,
    total_wealth: totalWealth,
    isa_values: isaValues,
    non_isa_values: nonIsaValues,
    pension_values: pensionValues,
    monthly_savings: monthlySavings,
    monthly_savings_values: monthlySavingsValues,
    income,
    expenses,
    monthly_pension: monthlyWorkplacePension + monthlySippNet,
    inflation_rate: inflationRate,
    wage_increase_rate: wageIncreaseRate,
    isa_assets: isaAssets,
    non_isa_assets: nonIsaAssets,
    final_wealth: finalWealth,
    final_pension: finalPension,
    total_gain: totalGain,
    months,
    withdrawal_39_annual: withdrawal39Annual,
    final_isa: finalIsa,
    years_until_expenses_covered: yearsUntilCovered,
    final_monthly_expenses: finalMonthlyExpenses,
    final_annual_expenses: finalAnnualExpenses,
    expense_values: expenseValues,
    income_values: incomeValues,
    mortgage_balance_values: mortgageBalanceValues,
    mortgage_payment_values: mortgagePaymentValues,
    home_equity_values: homeEquityValues,
    home_value: homeValue,
    final_mortgage_balance: currentMortgageBalance,
    final_home_equity: currentHomeEquity,
    monthly_mortgage_payment: monthlyMortgagePayment,
    mortgage_interest_rate: mortgageInterestRate,
    pensionable_monthly_pay: pensionableMonthlyPay,
    sipp_type: sippType,
    sipp_contribution: sippContribution,
    sipp_rate: sippRate,
    fi_date: fiDate,
    fi_month_index: fiMonthIndex,
    fi_evaluation_end_month: fiEvaluationEndMonth,
    extraction_rate: extractionRate,
  };
};
