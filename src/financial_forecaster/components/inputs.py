from dash import html

from financial_forecaster.components.input_sections import (
    build_assets_section,
    build_forecast_assumptions_section,
    build_forecast_years_section,
    build_income_expenses_section,
    build_pension_section,
    build_property_section,
    build_submit_button,
)
from financial_forecaster.styles.inputs import (
    DETAILS_STYLE,
    PANEL_STYLE,
    PANEL_TITLE_STYLE,
    PANEL_WRAPPER_STYLE,
    SUMMARY_STYLE,
)


def create_input_panel():
    return html.Div(
        [
            html.Div(
                [
                    html.H2("Financial Details", style=PANEL_TITLE_STYLE),
                    build_income_expenses_section(),
                    build_assets_section(),
                    build_forecast_years_section(),
                    html.Details(
                        [
                            html.Summary("Advanced Inputs", style=SUMMARY_STYLE),
                            build_property_section(),
                            build_pension_section(),
                            build_forecast_assumptions_section(),
                        ],
                        open=False,
                        style=DETAILS_STYLE,
                    ),
                    build_submit_button(),
                ],
                style=PANEL_STYLE,
            )
        ],
        style=PANEL_WRAPPER_STYLE,
    )
