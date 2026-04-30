"""Generate deterministic JSON fixtures from the Python forecast engine."""

from __future__ import annotations

import importlib.util
import json
from dataclasses import asdict, dataclass
from pathlib import Path
from typing import Any

def _load_calculate_forecast():
    forecast_path = Path(__file__).resolve().parents[1] / "src" / "financial_forecaster" / "forecast.py"
    spec = importlib.util.spec_from_file_location("forecast_module", forecast_path)
    if spec is None or spec.loader is None:
        raise RuntimeError(f"Unable to load forecast module from {forecast_path}")
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module.calculate_forecast


calculate_forecast = _load_calculate_forecast()


@dataclass(frozen=True)
class Scenario:
    name: str
    description: str
    inputs: dict[str, Any]


SCENARIOS: list[Scenario] = [
    Scenario(
        name="baseline_defaults",
        description="Typical baseline with moderate income and default-like growth assumptions.",
        inputs={
            "income": 5500,
            "expenses": 2800,
            "isa_assets": 35000,
            "isa_rate": 7.0,
            "non_isa_assets": 15000,
            "non_isa_rate": 3.5,
            "months": 30 * 12,
            "home_value": 0,
            "mortgage_balance": 0,
            "mortgage_term": 0,
            "mortgage_interest_rate": 3.83,
            "home_appreciation_rate": 3.0,
            "pension_assets": 20000,
            "pension_contribution": 5.0,
            "employer_pension_contribution_rate": 3.0,
            "pension_type": "percentage",
            "pension_rate": 5.0,
            "pension_interest_rate": 5.0,
            "pension_tax_relief_rate": 20.0,
            "inflation_rate": 2.0,
            "wage_increase_rate": 3.0,
            "isa_annual_contribution": 20000,
        },
    ),
    Scenario(
        name="high_savings",
        description="Large monthly surplus, no mortgage, long horizon.",
        inputs={
            "income": 9000,
            "expenses": 2200,
            "isa_assets": 50000,
            "isa_rate": 7.5,
            "non_isa_assets": 20000,
            "non_isa_rate": 4.0,
            "months": 35 * 12,
            "home_value": 0,
            "mortgage_balance": 0,
            "mortgage_term": 0,
            "mortgage_interest_rate": 3.83,
            "home_appreciation_rate": 3.0,
            "pension_assets": 35000,
            "pension_contribution": 8.0,
            "employer_pension_contribution_rate": 5.0,
            "pension_type": "percentage",
            "pension_rate": 8.0,
            "pension_interest_rate": 5.5,
            "pension_tax_relief_rate": 20.0,
            "inflation_rate": 2.0,
            "wage_increase_rate": 3.5,
            "isa_annual_contribution": 20000,
        },
    ),
    Scenario(
        name="mortgage_heavy",
        description="Property and mortgage are dominant in early years.",
        inputs={
            "income": 6200,
            "expenses": 3000,
            "isa_assets": 15000,
            "isa_rate": 6.5,
            "non_isa_assets": 5000,
            "non_isa_rate": 3.0,
            "months": 25 * 12,
            "home_value": 420000,
            "mortgage_balance": 320000,
            "mortgage_term": 27,
            "mortgage_interest_rate": 4.25,
            "home_appreciation_rate": 2.75,
            "pension_assets": 18000,
            "pension_contribution": 5.0,
            "employer_pension_contribution_rate": 3.0,
            "pension_type": "percentage",
            "pension_rate": 5.0,
            "pension_interest_rate": 5.0,
            "pension_tax_relief_rate": 20.0,
            "inflation_rate": 2.2,
            "wage_increase_rate": 3.0,
            "isa_annual_contribution": 20000,
        },
    ),
    Scenario(
        name="pension_heavy_fixed_contrib",
        description="Fixed pension contributions with strong employer contribution and tax relief.",
        inputs={
            "income": 5800,
            "expenses": 2600,
            "isa_assets": 20000,
            "isa_rate": 6.0,
            "non_isa_assets": 7000,
            "non_isa_rate": 3.0,
            "months": 30 * 12,
            "home_value": 0,
            "mortgage_balance": 0,
            "mortgage_term": 0,
            "mortgage_interest_rate": 3.83,
            "home_appreciation_rate": 3.0,
            "pension_assets": 75000,
            "pension_contribution": 900,
            "employer_pension_contribution_rate": 8.0,
            "pension_type": "fixed",
            "pension_rate": 5.0,
            "pension_interest_rate": 6.0,
            "pension_tax_relief_rate": 40.0,
            "inflation_rate": 2.0,
            "wage_increase_rate": 2.5,
            "isa_annual_contribution": 20000,
        },
    ),
    Scenario(
        name="edge_zero_inputs",
        description="All major financial inputs at zero to lock baseline edge behavior.",
        inputs={
            "income": 0,
            "expenses": 0,
            "isa_assets": 0,
            "isa_rate": 0,
            "non_isa_assets": 0,
            "non_isa_rate": 0,
            "months": 10 * 12,
            "home_value": 0,
            "mortgage_balance": 0,
            "mortgage_term": 0,
            "mortgage_interest_rate": 0,
            "home_appreciation_rate": 0,
            "pension_assets": 0,
            "pension_contribution": 0,
            "employer_pension_contribution_rate": 0,
            "pension_type": "percentage",
            "pension_rate": 0,
            "pension_interest_rate": 0,
            "pension_tax_relief_rate": 0,
            "inflation_rate": 0,
            "wage_increase_rate": 0,
            "isa_annual_contribution": 20000,
        },
    ),
]


def _round_series(values: list[float], digits: int = 2) -> list[float]:
    return [round(value, digits) for value in values]


def _snapshot_result(result: dict[str, Any]) -> dict[str, Any]:
    return {
        "dates": result["dates"],
        "series": {
            "income_values": _round_series(result["income_values"]),
            "expense_values": _round_series(result["expense_values"]),
            "monthly_savings_values": _round_series(result["monthly_savings_values"]),
            "isa_values": _round_series(result["isa_values"]),
            "non_isa_values": _round_series(result["non_isa_values"]),
            "pension_values": _round_series(result["pension_values"]),
            "home_equity_values": _round_series(result["home_equity_values"]),
            "mortgage_balance_values": _round_series(result["mortgage_balance_values"]),
        },
        "scalar_outputs": {
            "monthly_savings": round(result["monthly_savings"], 2),
            "monthly_pension": round(result["monthly_pension"], 2),
            "final_wealth": round(result["final_wealth"], 2),
            "final_pension": round(result["final_pension"], 2),
            "total_gain": round(result["total_gain"], 2),
            "withdrawal_39_annual": round(result["withdrawal_39_annual"], 2),
            "final_isa": round(result["final_isa"], 2),
            "final_monthly_expenses": round(result["final_monthly_expenses"], 2),
            "final_annual_expenses": round(result["final_annual_expenses"], 2),
            "home_value": round(result["home_value"], 2),
            "final_mortgage_balance": round(result["final_mortgage_balance"], 2),
            "final_home_equity": round(result["final_home_equity"], 2),
            "monthly_mortgage_payment": round(result["monthly_mortgage_payment"], 2),
            "years_until_expenses_covered": (
                None
                if result["years_until_expenses_covered"] is None
                else round(result["years_until_expenses_covered"], 4)
            ),
            "fi_date": result["fi_date"],
            "fi_month_index": result["fi_month_index"],
            "fi_evaluation_end_month": result["fi_evaluation_end_month"],
        },
    }


def main() -> None:
    output_path = (
        Path(__file__).resolve().parents[1] / "web" / "src" / "fixtures" / "forecast-fixtures.json"
    )
    output_path.parent.mkdir(parents=True, exist_ok=True)

    fixture_payload = {
        "meta": {
            "source": "Python financial_forecaster.forecast.calculate_forecast",
            "notes": [
                "Values are nominal currency values in GBP.",
                "Series are monthly and rounded to 2 decimal places in fixture snapshots.",
                "Fixtures are generated before TypeScript migration to act as parity baseline.",
            ],
        },
        "scenarios": [],
    }

    for scenario in SCENARIOS:
        result = calculate_forecast(**scenario.inputs)
        fixture_payload["scenarios"].append(
            {
                "scenario": asdict(scenario),
                "result_snapshot": _snapshot_result(result),
            }
        )

    output_path.write_text(json.dumps(fixture_payload, indent=2), encoding="utf-8")
    print(f"Wrote fixtures to {output_path}")


if __name__ == "__main__":
    main()
