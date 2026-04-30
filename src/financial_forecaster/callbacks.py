from dash import Input, Output, State

from financial_forecaster.components.charts import (
    build_breakdown_chart,
    build_projected_stats,
    build_summary_stats,
    build_withdrawal_chart,
)
from financial_forecaster.forecast import calculate_forecast


def register_callbacks(app):
    """Register all callbacks for the dashboard."""

    @app.callback(
        [
            Output("app-side-panel", "className"),
            Output("side-panel-bar", "children"),
            Output("app-main-column", "className"),
        ],
        Input("side-panel-bar", "n_clicks"),
        State("app-side-panel", "className"),
    )
    def toggle_side_panel(n_clicks, current_class_name):
        """Toggle mobile full-width inputs view."""

        is_open = bool(n_clicks) and n_clicks % 2 == 1
        side_panel_class = "app-side-panel is-open" if is_open else "app-side-panel"
        bar_label = "✕ Close inputs" if is_open else "☰ Inputs"
        main_column_class = "app-main-column mobile-hidden" if is_open else "app-main-column"
        return side_panel_class, bar_label, main_column_class

    @app.callback(
        [
            Output("summary-stats", "children"),
            Output("projected-stats", "children"),
            Output("asset-breakdown-chart", "figure"),
            Output("withdrawal-chart", "figure"),
        ],
        [
            Input("monthly-income", "value"),
            Input("monthly-expenses", "value"),
            Input("isa-assets", "value"),
            Input("isa-interest-rate", "value"),
            Input("non-isa-assets", "value"),
            Input("non-isa-interest-rate", "value"),
            Input("home-value", "value"),
            Input("mortgage-balance", "value"),
            Input("mortgage-term", "value"),
            Input("mortgage-interest-rate", "value"),
            Input("home-appreciation-rate", "value"),
            Input("forecast-period", "value"),
            Input("isa-annual-contribution", "value"),
            Input("pension-type", "value"),
            Input("pension-assets", "value"),
            Input("pension-contribution", "value"),
            Input("employer-pension-contribution-rate", "value"),
            Input("pension-interest-rate", "value"),
            Input("pension-tax-relief-rate", "value"),
            Input("inflation-rate", "value"),
            Input("wage-increase-rate", "value"),
        ],
    )
    def update_dashboard(
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
        pension_assets,
        pension_contribution,
        employer_pension_contribution_rate,
        pension_interest_rate,
        pension_tax_relief_rate,
        inflation_rate,
        wage_increase_rate,
    ):
        months = years * 12 if years else 480

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
            pension_assets=pension_assets,
            pension_contribution=pension_contribution,
            employer_pension_contribution_rate=employer_pension_contribution_rate,
            pension_type=pension_type,
            pension_rate=pension_contribution if pension_type == "percentage" else 5.0,
            pension_interest_rate=pension_interest_rate or 5.0,
            pension_tax_relief_rate=pension_tax_relief_rate or 0,
            inflation_rate=inflation_rate or 2.0,
            wage_increase_rate=wage_increase_rate or 3.0,
            isa_annual_contribution=isa_annual_contribution or 40000,
        )

        summary = build_summary_stats(
            forecast_data["income"],
            forecast_data["expenses"],
            forecast_data["monthly_savings"],
            forecast_data["isa_assets"],
            forecast_data["non_isa_assets"],
            current_home_equity=max((home_value or 0) - (mortgage_balance or 0), 0),
            monthly_mortgage_payment=forecast_data["monthly_mortgage_payment"],
            income_values=forecast_data["income_values"],
            expense_values=forecast_data["expense_values"],
            monthly_savings_values=forecast_data["monthly_savings_values"],
            mortgage_payment_values=forecast_data["mortgage_payment_values"],
            isa_values=forecast_data["isa_values"],
            non_isa_values=forecast_data["non_isa_values"],
            pension_values=forecast_data["pension_values"],
            home_equity_values=forecast_data["home_equity_values"],
            fi_month_index=forecast_data["fi_month_index"],
        )

        fi_month_index = (
            forecast_data["fi_month_index"]
            if forecast_data["fi_month_index"] is not None
            else max(len(forecast_data["isa_values"]) - 1, 0)
        )
        fi_isa = forecast_data["isa_values"][fi_month_index]
        fi_non_isa = forecast_data["non_isa_values"][fi_month_index]
        fi_income = forecast_data["income_values"][fi_month_index]
        fi_savings = forecast_data["monthly_savings_values"][fi_month_index]
        fi_non_isa_tax_free = min(fi_non_isa, 3000)
        fi_non_isa_taxed = max(0, fi_non_isa - 3000)
        fi_withdrawal_39_annual = (
            (fi_isa * 0.039)
            + (fi_non_isa_tax_free * 0.039)
            + (fi_non_isa_taxed * 0.039 * 0.76)
        )
        fi_savings_rate = (fi_savings / fi_income * 100) if fi_income > 0 else 0

        projected = build_projected_stats(
            forecast_data["years_until_expenses_covered"],
            forecast_data["fi_date"],
            fi_withdrawal_39_annual,
            fi_savings_rate,
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
            breakdown_chart,
            withdrawal_chart,
        )
