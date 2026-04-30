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
