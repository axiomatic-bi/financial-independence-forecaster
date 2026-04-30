from dataclasses import dataclass, field
from typing import Any

from dash import dcc, html

from financial_forecaster.styles.forms import INPUT_STYLE
from financial_forecaster.styles.inputs import (
    INFO_ICON_STYLE,
    LABEL_STYLE,
    SECTION_CONTAINER_STYLE,
    SECTION_HEADING_MARGIN_STYLE,
    SECTION_HEADING_ROW_STYLE,
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
    InputFieldConfig(label="Monthly Income (After Tax) (£)", input_id="monthly-income", value=0),
    InputFieldConfig(
        label="Monthly Expenses (Excluding Mortgage) (£)",
        input_id="monthly-expenses",
        value=0,
    ),
]

ASSET_FIELDS = [
    InputFieldConfig(label="ISA Assets (£)", input_id="isa-assets", value=0),
    InputFieldConfig(
        label="ISA Interest Rate (%)",
        input_id="isa-interest-rate",
        value=7,
        input_props={"step": 0.1},
    ),
    InputFieldConfig(label="Non-ISA Assets (£)", input_id="non-isa-assets", value=0),
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
        value=0,
        input_props={"step": 10000},
    ),
    InputFieldConfig(
        label="Remaining Mortgage Balance (£)",
        input_id="mortgage-balance",
        value=0,
        input_props={"step": 10000},
    ),
    InputFieldConfig(
        label="Remaining Mortgage Term (Years)",
        input_id="mortgage-term",
        value=0,
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

CURRENT_PENSION_FIELD = InputFieldConfig(label="Current Pension Pot (£)", input_id="pension-assets", value=0)

PENSION_FIELDS = [
    InputFieldConfig(label="Personal Contribution (% or £)", input_id="pension-contribution", value=5.0),
    InputFieldConfig(
        label="Employer Contribution (%)",
        input_id="employer-pension-contribution-rate",
        value=3.0,
        input_props={"step": 0.1},
    ),
    InputFieldConfig(
        label="Interest Rate (%)",
        input_id="pension-interest-rate",
        value=5.0,
        input_props={"step": 0.1},
    ),
]

FORECAST_ADVANCED_FIELDS = [
    InputFieldConfig(
        label="Annual ISA Contribution Limit (£)",
        input_id="isa-annual-contribution",
        value=20000,
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


def build_section_heading(title: str, help_text: str | None = None) -> html.Div | html.H3:
    heading = html.H3(title, style={**SECTION_TITLE_STYLE, "marginBottom": "0"})
    if not help_text:
        return html.H3(title, style=SECTION_TITLE_STYLE)
    return html.Div(
        [
            heading,
            html.Span("i", title=help_text, style=INFO_ICON_STYLE),
        ],
        style=SECTION_HEADING_ROW_STYLE,
    )


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


def build_fields_group(
    section_title: str, fields: list[InputFieldConfig], help_text: str | None = None
) -> html.Div:
    return html.Div(
        [build_section_heading(section_title, help_text), *[build_number_field(field) for field in fields]],
        style=SECTION_CONTAINER_STYLE,
    )


def build_fields_group_no_divider(
    section_title: str, fields: list[InputFieldConfig], help_text: str | None = None
) -> html.Div:
    no_divider_style = {
        **SECTION_CONTAINER_STYLE,
        "borderBottom": "none",
        "paddingBottom": "0",
        "marginBottom": "0",
    }
    return html.Div(
        [build_section_heading(section_title, help_text), *[build_number_field(field) for field in fields]],
        style=no_divider_style,
    )


def build_income_expenses_section() -> html.Div:
    return build_fields_group(
        "Income & Expenses",
        INCOME_EXPENSES_FIELDS,
        help_text="Income should be monthly take-home pay after tax. Expenses should exclude mortgage payments.",
    )


def build_assets_section() -> html.Div:
    return build_fields_group("Current Assets", ASSET_FIELDS)


def build_property_section() -> html.Div:
    return build_fields_group_no_divider(
        "Property & Mortgage",
        PROPERTY_FIELDS,
        help_text="Use your current home value, remaining mortgage balance, and remaining term.",
    )


def build_pension_section() -> html.Div:
    return html.Div(
        [
            build_section_heading(
                "Pension",
                help_text=(
                    "Add your current pension pot and ongoing contribution. "
                    "Tax relief applies an uplift to the entered contribution."
                ),
            ),
            build_number_field(CURRENT_PENSION_FIELD),
            html.Div(
                [
                    html.Label("Contribution Type", style=SECTION_HEADING_MARGIN_STYLE),
                    dcc.RadioItems(
                        id="pension-type",
                        options=[
                            {"label": " Percentage of Income", "value": "percentage"},
                            {"label": " Fixed Amount", "value": "fixed"},
                        ],
                        value="percentage",
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
                    html.Label("Pension Tax Relief", style=SECTION_HEADING_MARGIN_STYLE),
                    dcc.RadioItems(
                        id="pension-tax-relief-rate",
                        options=[
                            {"label": " No Relief (0%)", "value": 0},
                            {"label": " Basic Rate (20%)", "value": 20},
                            {"label": " Higher Rate (40%)", "value": 40},
                            {"label": " Additional Rate (45%)", "value": 45},
                        ],
                        value=20,
                        style={"marginBottom": "12px"},
                        labelStyle={
                            "display": "block",
                            "marginBottom": "6px",
                            "color": LABEL_STYLE["color"],
                        },
                    )
                ],
                style={"marginBottom": "12px"},
            ),
        ],
        style={
            **SECTION_CONTAINER_STYLE,
            "borderBottom": "none",
            "paddingBottom": "0",
            "marginBottom": "0",
        },
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
                        value=30,
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
    return build_fields_group_no_divider(
        "Forecast Assumptions",
        FORECAST_ADVANCED_FIELDS,
        help_text="Annual ISA limit caps how much monthly surplus can be routed into ISA each tax year.",
    )
