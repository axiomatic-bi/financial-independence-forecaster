from dataclasses import dataclass, field
from typing import Any

from dash import dcc, html

from financial_forecaster.styles.forms import INPUT_STYLE
from financial_forecaster.styles.inputs import (
    BUTTON_STYLE,
    LABEL_STYLE,
    SECTION_CONTAINER_STYLE,
    SECTION_HEADING_MARGIN_STYLE,
    SECTION_TITLE_STYLE,
)


@dataclass(frozen=True)
class InputFieldConfig:
    label: str
    input_id: str
    value: Any
    input_type: str = "number"
    wrapper_margin_bottom: str = "12px"
    input_props: dict[str, Any] = field(default_factory=dict)


INCOME_EXPENSES_FIELDS = [
    InputFieldConfig(label="Monthly Income (£)", input_id="monthly-income", value=7700),
    InputFieldConfig(label="Monthly Expenses (£)", input_id="monthly-expenses", value=5000),
]

ASSET_FIELDS = [
    InputFieldConfig(label="ISA Assets (£)", input_id="isa-assets", value=90000),
    InputFieldConfig(
        label="ISA Interest Rate (%)",
        input_id="isa-interest-rate",
        value=7,
        input_props={"step": 0.1},
    ),
    InputFieldConfig(label="Non-ISA Assets (£)", input_id="non-isa-assets", value=10000),
    InputFieldConfig(
        label="Non-ISA Interest Rate (%)",
        input_id="non-isa-interest-rate",
        value=3.5,
        input_props={"step": 0.1},
    ),
]

PROPERTY_FIELDS = [
    InputFieldConfig(
        label="Home Value (£)",
        input_id="home-value",
        value=430000,
        input_props={"step": 10000},
    ),
    InputFieldConfig(
        label="Mortgage Balance (£)",
        input_id="mortgage-balance",
        value=370000,
        input_props={"step": 10000},
    ),
    InputFieldConfig(
        label="Mortgage Term (Years)",
        input_id="mortgage-term",
        value=30,
        input_props={"step": 1, "min": 0},
    ),
    InputFieldConfig(
        label="Mortgage Interest Rate (%)",
        input_id="mortgage-interest-rate",
        value=3.83,
        input_props={"step": 0.01},
    ),
    InputFieldConfig(
        label="Home Appreciation Rate (%)",
        input_id="home-appreciation-rate",
        value=3.0,
        input_props={"step": 0.1},
    ),
]

PENSION_FIELDS = [
    InputFieldConfig(label="Contribution (% or £)", input_id="pension-contribution", value=125),
    InputFieldConfig(
        label="Interest Rate (%)",
        input_id="pension-interest-rate",
        value=5.0,
        input_props={"step": 0.1},
    ),
]

FORECAST_ADVANCED_FIELDS = [
    InputFieldConfig(
        label="Target ISA Contribution (£)",
        input_id="isa-annual-contribution",
        value=40000,
        input_props={"step": 1000},
    ),
    InputFieldConfig(
        label="Inflation Rate (%)",
        input_id="inflation-rate",
        value=2.0,
        input_props={"step": 0.1},
    ),
    InputFieldConfig(
        label="Wage Increase Rate (%)",
        input_id="wage-increase-rate",
        value=3.0,
        input_props={"step": 0.1},
    ),
]


def build_section_heading(title: str) -> html.H3:
    return html.H3(title, style=SECTION_TITLE_STYLE)


def build_number_field(field_config: InputFieldConfig) -> html.Div:
    props = {
        "id": field_config.input_id,
        "type": field_config.input_type,
        "value": field_config.value,
        "style": INPUT_STYLE,
        **field_config.input_props,
    }
    return html.Div(
        [
            html.Label(field_config.label, style=LABEL_STYLE),
            dcc.Input(**props),
        ],
        style={"marginBottom": field_config.wrapper_margin_bottom},
    )


def build_fields_group(section_title: str, fields: list[InputFieldConfig]) -> html.Div:
    return html.Div(
        [build_section_heading(section_title), *[build_number_field(field) for field in fields]],
        style=SECTION_CONTAINER_STYLE,
    )


def build_income_expenses_section() -> html.Div:
    return build_fields_group("Income & Expenses", INCOME_EXPENSES_FIELDS)


def build_assets_section() -> html.Div:
    return build_fields_group("Current Assets", ASSET_FIELDS)


def build_property_section() -> html.Div:
    return build_fields_group("Property & Mortgage", PROPERTY_FIELDS)


def build_pension_section() -> html.Div:
    return html.Div(
        [
            build_section_heading("Pension"),
            html.Div(
                [
                    html.Label("Contribution Type", style=SECTION_HEADING_MARGIN_STYLE),
                    dcc.RadioItems(
                        id="pension-type",
                        options=[
                            {"label": " Percentage of Income", "value": "percentage"},
                            {"label": " Fixed Amount", "value": "fixed"},
                        ],
                        value="fixed",
                        style={"marginBottom": "12px"},
                        labelStyle={
                            "display": "block",
                            "marginBottom": "6px",
                            "color": LABEL_STYLE["color"],
                        },
                    ),
                ],
                style={"marginBottom": "12px"},
            ),
            *[build_number_field(field) for field in PENSION_FIELDS],
            html.Div(
                [
                    dcc.Checklist(
                        id="pension-tax-relief",
                        options=[{"label": " Include 20% Tax Relief", "value": "yes"}],
                        value=["yes"],
                        style={"marginBottom": "12px"},
                        labelStyle={"color": LABEL_STYLE["color"]},
                    )
                ],
                style={"marginBottom": "12px"},
            ),
        ],
        style=SECTION_CONTAINER_STYLE,
    )


def build_forecast_years_section() -> html.Div:
    return html.Div(
        [
            html.Div(
                [
                    html.Label("Forecast Period (Years)", style=SECTION_HEADING_MARGIN_STYLE),
                    dcc.Slider(
                        id="forecast-period",
                        min=1,
                        max=40,
                        step=1,
                        value=40,
                        marks={1: "1Y", 5: "5Y", 10: "10Y", 20: "20Y", 30: "30Y", 40: "40Y"},
                        tooltip={"placement": "bottom", "always_visible": True},
                    ),
                ],
                style={"marginBottom": "0"},
            ),
        ],
        style={"paddingBottom": "0", "marginBottom": "0"},
    )


def build_forecast_assumptions_section() -> html.Div:
    return build_fields_group("Forecast Assumptions", FORECAST_ADVANCED_FIELDS)


def build_submit_button() -> html.Div:
    return html.Div(
        [
            html.Button(
                "📊 Calculate Forecast",
                id="calculate-button",
                n_clicks=0,
                style=BUTTON_STYLE,
            )
        ],
        style={"marginTop": "24px"},
    )
