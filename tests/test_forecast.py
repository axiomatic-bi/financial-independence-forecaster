import pytest

from financial_forecaster.forecast import (
    calculate_forecast,
    calculate_monthly_pension,
    calculate_mortgage_payment,
)


def test_calculate_monthly_pension_percentage():
    assert calculate_monthly_pension(5000, "percentage", 5, 0) == 250


def test_calculate_monthly_pension_fixed():
    assert calculate_monthly_pension(5000, "fixed", 300, 5) == 300


def test_calculate_mortgage_payment_zero_inputs():
    assert calculate_mortgage_payment(0, 4.0, 25) == 0
    assert calculate_mortgage_payment(250000, 0, 25) == 0
    assert calculate_mortgage_payment(250000, 4.0, 0) == 0


def test_calculate_mortgage_payment_reasonable_value():
    payment = calculate_mortgage_payment(300000, 5.0, 30)
    assert payment == pytest.approx(1610.46, abs=1.0)


def test_calculate_forecast_returns_expected_shape():
    result = calculate_forecast(
        income=6000,
        expenses=3000,
        isa_assets=10000,
        isa_rate=5.0,
        non_isa_assets=5000,
        non_isa_rate=3.0,
        months=12,
        pension_contribution=5,
        pension_type="percentage",
        pension_rate=5.0,
        pension_interest_rate=5.0,
    )

    assert len(result["dates"]) == 13
    assert len(result["total_wealth"]) == 13
    assert len(result["isa_values"]) == 13
    assert len(result["non_isa_values"]) == 13
    assert len(result["pension_values"]) == 13
    assert result["final_wealth"] >= 0


def test_calculate_forecast_applies_sipp_relief_to_pot_not_cashflow():
    result = calculate_forecast(
        income=5000,
        expenses=2000,
        isa_assets=0,
        isa_rate=0,
        non_isa_assets=0,
        non_isa_rate=0,
        months=1,
        pension_assets=10000,
        pensionable_monthly_pay=5000,
        pension_type="fixed",
        pension_contribution=0,
        employer_pension_contribution_rate=0,
        sipp_type="fixed",
        sipp_contribution=100,
        sipp_rate=0,
        pension_tax_relief_rate=20,
        pension_interest_rate=0,
    )

    # Cashflow only deducts net SIPP contribution.
    assert result["monthly_savings"] == pytest.approx(2900.0)
    # Pension pot receives SIPP contribution uplifted by selected tax relief.
    assert result["pension_values"][-1] == pytest.approx(10120.0)


def test_calculate_forecast_does_not_double_deduct_workplace_pension_from_net_income():
    result = calculate_forecast(
        income=5000,
        expenses=2000,
        isa_assets=0,
        isa_rate=0,
        non_isa_assets=0,
        non_isa_rate=0,
        months=1,
        pension_assets=10000,
        pensionable_monthly_pay=5000,
        pension_type="percentage",
        pension_contribution=5,
        pension_rate=5,
        employer_pension_contribution_rate=3,
        sipp_type="fixed",
        sipp_contribution=0,
        sipp_rate=0,
        pension_tax_relief_rate=20,
        pension_interest_rate=0,
    )

    # Net-pay model: workplace pension should not be deducted again from monthly savings.
    assert result["monthly_savings"] == pytest.approx(3000.0)
    # Pension pot still receives workplace personal + employer contributions.
    assert result["pension_values"][-1] == pytest.approx(10400.0)
