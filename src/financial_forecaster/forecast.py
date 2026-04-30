"""Core financial forecasting logic with no UI dependencies."""

from datetime import datetime

FI_EVALUATION_MONTHS = 40 * 12


def _add_months(base_date: datetime, months: int) -> datetime:
    """Add calendar months while keeping day at month start."""
    month_index = (base_date.month - 1) + months
    year = base_date.year + (month_index // 12)
    month = (month_index % 12) + 1
    return base_date.replace(year=year, month=month, day=1)


def calculate_monthly_pension(
    base_income: float, pension_type: str, pension_contribution: float, pension_rate: float
) -> float:
    """Calculate a monthly contribution from either percentage or fixed input."""
    if pension_type == "percentage":
        pension_amount = pension_contribution or pension_rate
        return base_income * (pension_amount / 100)
    return pension_contribution


def calculate_mortgage_payment(balance: float, annual_rate: float, years_remaining: float) -> float:
    """Calculate monthly mortgage payment using the amortization formula."""
    if balance <= 0 or years_remaining <= 0 or annual_rate <= 0:
        return 0

    monthly_rate = annual_rate / 12 / 100
    num_payments = int(years_remaining * 12)

    if monthly_rate == 0:
        return balance / num_payments

    numerator = monthly_rate * ((1 + monthly_rate) ** num_payments)
    denominator = ((1 + monthly_rate) ** num_payments) - 1
    return balance * (numerator / denominator)


def simulate_month(
    month: int,
    date: datetime,
    current_isa: float,
    current_non_isa: float,
    current_pension: float,
    current_income: float,
    current_pensionable_income: float,
    current_expenses: float,
    isa_rate: float,
    non_isa_rate: float,
    pension_interest_rate: float,
    annual_isa_limit: float,
    isa_annual_used: float,
    inflation_rate: float,
    wage_increase_rate: float,
    pension_type: str,
    pension_contribution: float,
    employer_pension_contribution_rate: float,
    pension_rate: float,
    sipp_type: str,
    sipp_contribution: float,
    sipp_rate: float,
    pension_tax_relief_rate: float,
) -> dict:
    """Simulate one month and return updated account state."""
    if month > 0 and date.month == 1:
        current_expenses = current_expenses * (1 + inflation_rate / 100)
        current_income = current_income * (1 + wage_increase_rate / 100)
        current_pensionable_income = current_pensionable_income * (1 + wage_increase_rate / 100)

    if month > 0 and date.month == 4:
        isa_annual_used = 0

    current_monthly_workplace_pension = calculate_monthly_pension(
        current_pensionable_income, pension_type, pension_contribution, pension_rate
    )
    current_monthly_sipp_net = calculate_monthly_pension(
        current_pensionable_income, sipp_type, sipp_contribution, sipp_rate
    )
    current_monthly_employer_pension = current_pensionable_income * (employer_pension_contribution_rate / 100)
    current_monthly_sipp_gross = current_monthly_sipp_net

    if pension_tax_relief_rate and current_monthly_sipp_net > 0:
        current_monthly_sipp_gross = current_monthly_sipp_net * (1 + pension_tax_relief_rate / 100)

    current_monthly_personal_pension = current_monthly_workplace_pension + current_monthly_sipp_net
    # Net-pay model: take-home income already excludes workplace employee pension deductions.
    current_monthly_savings = current_income - current_expenses - current_monthly_sipp_net

    if month > 0:
        current_isa = current_isa * (1 + isa_rate / 12)
        current_non_isa = current_non_isa * (1 + non_isa_rate / 12)
        current_pension = current_pension * (1 + pension_interest_rate / 12)

        if current_monthly_savings > 0:
            remaining_isa_allowance = annual_isa_limit - isa_annual_used
            isa_contribution = min(current_monthly_savings, remaining_isa_allowance)
            non_isa_contribution = max(0, current_monthly_savings - isa_contribution)

            current_isa += isa_contribution
            current_non_isa += non_isa_contribution
            isa_annual_used += isa_contribution

        current_pension += (
            current_monthly_workplace_pension
            + current_monthly_sipp_gross
            + current_monthly_employer_pension
        )

    return {
        "isa": current_isa,
        "non_isa": current_non_isa,
        "pension": current_pension,
        "income": current_income,
        "pensionable_income": current_pensionable_income,
        "expenses": current_expenses,
        "savings": current_monthly_savings,
        "monthly_personal_pension": current_monthly_personal_pension,
        "isa_annual_used": isa_annual_used,
    }


def calculate_forecast(
    income: float,
    expenses: float,
    isa_assets: float,
    isa_rate: float,
    non_isa_assets: float,
    non_isa_rate: float,
    months: int,
    home_value: float = 0,
    mortgage_balance: float = 0,
    mortgage_term: float = 0,
    mortgage_interest_rate: float = 3.83,
    home_appreciation_rate: float = 3.0,
    pension_assets: float = 0,
    pension_contribution: float = 0,
    employer_pension_contribution_rate: float = 0.0,
    pension_type: str = "percentage",
    pension_rate: float = 5.0,
    pension_interest_rate: float = 5.0,
    pension_tax_relief_rate: float = 20.0,
    inflation_rate: float = 2.0,
    wage_increase_rate: float = 3.0,
    isa_annual_contribution: float = 40000,
    pensionable_monthly_pay: float | None = None,
    sipp_type: str = "fixed",
    sipp_contribution: float = 0,
    sipp_rate: float = 0,
) -> dict:
    """Calculate a month-by-month financial projection."""
    income = income or 0
    expenses = expenses or 0
    isa_assets = isa_assets or 0
    isa_rate = (isa_rate or 0) / 100
    non_isa_assets = non_isa_assets or 0
    non_isa_rate = (non_isa_rate or 0) / 100
    pension_interest_rate = (pension_interest_rate or 0) / 100
    pension_assets = pension_assets or 0
    pension_contribution = pension_contribution or 0
    employer_pension_contribution_rate = employer_pension_contribution_rate or 0
    pensionable_monthly_pay = income if pensionable_monthly_pay is None else pensionable_monthly_pay or 0
    sipp_contribution = sipp_contribution or 0
    sipp_rate = sipp_rate or 0

    home_value = home_value or 0
    mortgage_balance = mortgage_balance or 0
    mortgage_term = mortgage_term or 0
    mortgage_interest_rate = mortgage_interest_rate or 0
    home_appreciation_rate = (home_appreciation_rate or 0) / 100
    mortgage_months_remaining = int(mortgage_term * 12) if mortgage_term else 0

    monthly_mortgage_payment = calculate_mortgage_payment(
        mortgage_balance, mortgage_interest_rate, mortgage_term
    )
    monthly_workplace_pension = calculate_monthly_pension(
        pensionable_monthly_pay, pension_type, pension_contribution, pension_rate
    )
    monthly_sipp_net = calculate_monthly_pension(
        pensionable_monthly_pay, sipp_type, sipp_contribution, sipp_rate
    )
    # Net-pay model: only SIPP is deducted from take-home cashflow.
    monthly_savings = income - expenses - monthly_sipp_net
    annual_isa_limit = isa_annual_contribution

    dates = []
    total_wealth = []
    isa_values = []
    non_isa_values = []
    pension_values = []
    expense_values = []
    monthly_savings_values = []
    mortgage_balance_values = []
    home_equity_values = []
    income_values = []
    mortgage_payment_values = []

    current_isa = isa_assets
    current_non_isa = non_isa_assets
    current_pension = pension_assets
    current_income = income
    current_pensionable_income = pensionable_monthly_pay
    current_expenses = expenses
    isa_annual_used = 0
    current_mortgage_balance = mortgage_balance
    current_home_equity = max(0, home_value - current_mortgage_balance)

    years_until_covered = None
    fi_date = None
    fi_month_index = None
    fi_evaluation_end_month = max(months, FI_EVALUATION_MONTHS)

    start_date = datetime.now().replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    for month in range(fi_evaluation_end_month + 1):
        date = _add_months(start_date, month)
        if month <= months:
            dates.append(date.strftime("%Y-%m"))

        month_result = simulate_month(
            month=month,
            date=date,
            current_isa=current_isa,
            current_non_isa=current_non_isa,
            current_pension=current_pension,
            current_income=current_income,
            current_pensionable_income=current_pensionable_income,
            current_expenses=current_expenses,
            isa_rate=isa_rate,
            non_isa_rate=non_isa_rate,
            pension_interest_rate=pension_interest_rate,
            annual_isa_limit=annual_isa_limit,
            isa_annual_used=isa_annual_used,
            inflation_rate=inflation_rate,
            wage_increase_rate=wage_increase_rate,
            pension_type=pension_type,
            pension_contribution=pension_contribution,
            employer_pension_contribution_rate=employer_pension_contribution_rate,
            pension_rate=pension_rate,
            sipp_type=sipp_type,
            sipp_contribution=sipp_contribution,
            sipp_rate=sipp_rate,
            pension_tax_relief_rate=pension_tax_relief_rate,
        )

        current_isa = month_result["isa"]
        current_non_isa = month_result["non_isa"]
        current_pension = month_result["pension"]
        current_income = month_result["income"]
        current_pensionable_income = month_result["pensionable_income"]
        current_expenses = month_result["expenses"]
        isa_annual_used = month_result["isa_annual_used"]

        if month > 0 and date.month == 1:
            home_value = home_value * (1 + home_appreciation_rate)

        if month > 0 and mortgage_months_remaining > 0:
            monthly_rate = mortgage_interest_rate / 12 / 100
            interest_payment = current_mortgage_balance * monthly_rate
            principal_payment = monthly_mortgage_payment - interest_payment
            current_mortgage_balance = max(0, current_mortgage_balance - principal_payment)
            mortgage_months_remaining -= 1

        current_home_equity = max(0, home_value - current_mortgage_balance)
        current_mortgage_payment = monthly_mortgage_payment if mortgage_months_remaining > 0 else 0

        if month <= months:
            isa_values.append(current_isa)
            non_isa_values.append(current_non_isa)
            pension_values.append(current_pension)
            expense_values.append(current_expenses)
            income_values.append(current_income)
            monthly_savings_values.append(month_result["savings"])
            mortgage_balance_values.append(current_mortgage_balance)
            home_equity_values.append(current_home_equity)
            mortgage_payment_values.append(current_mortgage_payment)

            total_wealth_with_equity = (
                current_isa + current_non_isa + current_pension + current_home_equity
            )
            total_wealth.append(total_wealth_with_equity)

        if years_until_covered is None:
            annual_withdrawal = (
                (current_isa * 0.039)
                + (min(current_non_isa, 3000) * 0.039)
                + (max(0, current_non_isa - 3000) * 0.039 * 0.76)
            )
            month_annual_expenses = current_expenses * 12
            if annual_withdrawal >= month_annual_expenses:
                years_until_covered = month / 12
                fi_date = date.strftime("%Y-%m")
                fi_month_index = month

    final_wealth = total_wealth[-1]
    final_pension = pension_values[-1]
    total_gain = final_wealth - (isa_assets + non_isa_assets)

    final_isa = isa_values[-1] if isa_values else 0
    final_non_isa = non_isa_values[-1] if non_isa_values else 0
    final_non_isa_tax_free = min(final_non_isa, 3000)
    final_non_isa_taxed = max(0, final_non_isa - 3000)
    withdrawal_39_annual = (
        (final_isa * 0.039)
        + (final_non_isa_tax_free * 0.039)
        + (final_non_isa_taxed * 0.039 * 0.76)
    )

    final_monthly_expenses = expense_values[-1] if expense_values else expenses
    final_annual_expenses = final_monthly_expenses * 12
    return {
        "dates": dates,
        "total_wealth": total_wealth,
        "isa_values": isa_values,
        "non_isa_values": non_isa_values,
        "pension_values": pension_values,
        "monthly_savings": monthly_savings,
        "monthly_savings_values": monthly_savings_values,
        "income": income,
        "expenses": expenses,
        "monthly_pension": monthly_workplace_pension + monthly_sipp_net,
        "inflation_rate": inflation_rate,
        "wage_increase_rate": wage_increase_rate,
        "isa_assets": isa_assets,
        "non_isa_assets": non_isa_assets,
        "final_wealth": final_wealth,
        "final_pension": final_pension,
        "total_gain": total_gain,
        "months": months,
        "withdrawal_39_annual": withdrawal_39_annual,
        "final_isa": final_isa,
        "years_until_expenses_covered": years_until_covered,
        "final_monthly_expenses": final_monthly_expenses,
        "final_annual_expenses": final_annual_expenses,
        "expense_values": expense_values,
        "income_values": income_values,
        "mortgage_balance_values": mortgage_balance_values,
        "mortgage_payment_values": mortgage_payment_values,
        "home_equity_values": home_equity_values,
        "home_value": home_value,
        "final_mortgage_balance": current_mortgage_balance,
        "final_home_equity": current_home_equity,
        "monthly_mortgage_payment": monthly_mortgage_payment,
        "mortgage_interest_rate": mortgage_interest_rate,
        "pensionable_monthly_pay": pensionable_monthly_pay,
        "sipp_type": sipp_type,
        "sipp_contribution": sipp_contribution,
        "sipp_rate": sipp_rate,
        "fi_date": fi_date,
        "fi_month_index": fi_month_index,
        "fi_evaluation_end_month": fi_evaluation_end_month,
    }
