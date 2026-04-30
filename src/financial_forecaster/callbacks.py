from dash import Input, Output, State

from financial_forecaster.components.charts import (
    build_breakdown_chart,
    build_projected_stats,
    build_savings_chart,
    build_summary_stats,
    build_wealth_chart,
    build_withdrawal_chart,
)
from financial_forecaster.forecast import calculate_forecast


def register_callbacks(app):
    """Register all callbacks for the dashboard."""

    @app.callback(
        [
            Output("summary-stats", "children"),
            Output("projected-stats", "children"),
            Output("wealth-forecast-chart", "figure"),
            Output("monthly-savings-chart", "figure"),
            Output("asset-breakdown-chart", "figure"),
            Output("withdrawal-chart", "figure"),
        ],
        [Input("calculate-button", "n_clicks")],
        [
            State("monthly-income", "value"),
            State("monthly-expenses", "value"),
            State("isa-assets", "value"),
            State("isa-interest-rate", "value"),
            State("non-isa-assets", "value"),
            State("non-isa-interest-rate", "value"),
            State("home-value", "value"),
            State("mortgage-balance", "value"),
            State("mortgage-term", "value"),
            State("mortgage-interest-rate", "value"),
            State("home-appreciation-rate", "value"),
            State("forecast-period", "value"),
            State("isa-annual-contribution", "value"),
            State("pension-type", "value"),
            State("pension-contribution", "value"),
            State("pension-interest-rate", "value"),
            State("pension-tax-relief", "value"),
            State("inflation-rate", "value"),
            State("wage-increase-rate", "value"),
        ],
    )
    def update_dashboard(
        n_clicks,
        income,
        expenses,
        isa_assets,
        isa_rate,
        non_isa_assets,
        non_isa_rate,
        home_value,
        mortgage_balance,
        mortgage_term,
        mortgage_interest_rate,
        home_appreciation_rate,
        years,
        isa_annual_contribution,
        pension_type,
        pension_contribution,
        pension_interest_rate,
        pension_tax_relief,
        inflation_rate,
        wage_increase_rate,
    ):
        months = years * 12 if years else 480
        tax_relief_enabled = "yes" in (pension_tax_relief or [])

        forecast_data = calculate_forecast(
            income,
            expenses,
            isa_assets,
            isa_rate,
            non_isa_assets,
            non_isa_rate,
            months,
            home_value=home_value,
            mortgage_balance=mortgage_balance,
            mortgage_term=mortgage_term,
            mortgage_interest_rate=mortgage_interest_rate or 3.83,
            home_appreciation_rate=home_appreciation_rate or 3.0,
            pension_contribution=pension_contribution,
            pension_type=pension_type,
            pension_rate=pension_contribution if pension_type == "percentage" else 5.0,
            pension_interest_rate=pension_interest_rate or 5.0,
            pension_tax_relief=tax_relief_enabled,
            inflation_rate=inflation_rate or 2.0,
            wage_increase_rate=wage_increase_rate or 3.0,
            isa_annual_contribution=isa_annual_contribution or 40000,
        )

        summary = build_summary_stats(
            forecast_data["income"],
            forecast_data["expenses"],
            forecast_data["monthly_pension"],
            forecast_data["monthly_savings"],
            forecast_data["inflation_rate"],
            forecast_data["wage_increase_rate"],
            forecast_data["isa_assets"],
            forecast_data["non_isa_assets"],
            forecast_data["final_wealth"],
            forecast_data["final_pension"],
            forecast_data["total_gain"],
            forecast_data["months"],
            withdrawal_39_annual=forecast_data["withdrawal_39_annual"],
            final_isa=forecast_data["final_isa"],
            years_until_expenses_covered=forecast_data["years_until_expenses_covered"],
            final_monthly_expenses=forecast_data["final_monthly_expenses"],
            final_annual_expenses=forecast_data["final_annual_expenses"],
            home_value=forecast_data["home_value"],
            final_home_equity=forecast_data["final_home_equity"],
            final_mortgage_balance=forecast_data["final_mortgage_balance"],
            monthly_mortgage_payment=forecast_data["monthly_mortgage_payment"],
            mortgage_interest_rate=forecast_data["mortgage_interest_rate"],
        )

        projected = build_projected_stats(
            forecast_data["final_wealth"],
            forecast_data["final_pension"],
            forecast_data["final_isa"],
            forecast_data["years_until_expenses_covered"],
            forecast_data["final_monthly_expenses"],
            forecast_data["withdrawal_39_annual"],
            forecast_data["home_value"],
            forecast_data["final_home_equity"],
        )

        wealth_chart = build_wealth_chart(forecast_data["dates"], forecast_data["total_wealth"])
        savings_chart = build_savings_chart(
            forecast_data["dates"], forecast_data["monthly_savings_values"]
        )
        breakdown_chart = build_breakdown_chart(
            forecast_data["dates"],
            forecast_data["isa_values"],
            forecast_data["non_isa_values"],
            forecast_data["pension_values"],
            forecast_data["home_equity_values"],
        )
        withdrawal_chart = build_withdrawal_chart(
            forecast_data["dates"], forecast_data["isa_values"], forecast_data["expense_values"]
        )

        return (
            summary,
            projected,
            wealth_chart,
            savings_chart,
            breakdown_chart,
            withdrawal_chart,
        )
