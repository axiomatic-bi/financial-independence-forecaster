from dash import dcc, html

from financial_forecaster.theme import COLORS

INPUT_STYLE = {
    "width": "100%",
    "padding": "10px 12px",
    "border": "1px solid #475569",
    "borderRadius": "6px",
    "fontSize": "14px",
    "marginBottom": "16px",
    "backgroundColor": "#334155",
    "color": "#f1f5f9",
    "boxSizing": "border-box",
}


def create_input_panel():
    return html.Div(
        [
            html.Div(
                [
                    html.H2(
                        "Financial Details",
                        style={"color": COLORS["text_primary"], "marginBottom": "24px", "fontSize": "20px"},
                    ),
                    html.Div(
                        [
                            html.H3(
                                "Income & Expenses",
                                style={
                                    "color": COLORS["primary"],
                                    "fontSize": "14px",
                                    "marginBottom": "16px",
                                    "fontWeight": "600",
                                    "textTransform": "uppercase",
                                    "letterSpacing": "0.5px",
                                },
                            ),
                            html.Div(
                                [
                                    html.Label(
                                        "Monthly Income (£)",
                                        style={
                                            "fontWeight": "600",
                                            "color": COLORS["text_primary"],
                                            "marginBottom": "6px",
                                            "fontSize": "13px",
                                        },
                                    ),
                                    dcc.Input(id="monthly-income", type="number", value=7700, style=INPUT_STYLE),
                                ],
                                style={"marginBottom": "12px"},
                            ),
                            html.Div(
                                [
                                    html.Label(
                                        "Monthly Expenses (£)",
                                        style={
                                            "fontWeight": "600",
                                            "color": COLORS["text_primary"],
                                            "marginBottom": "6px",
                                            "fontSize": "13px",
                                        },
                                    ),
                                    dcc.Input(id="monthly-expenses", type="number", value=5000, style=INPUT_STYLE),
                                ],
                                style={"marginBottom": "12px"},
                            ),
                        ],
                        style={
                            "marginBottom": "24px",
                            "paddingBottom": "16px",
                            "borderBottom": f"1px solid {COLORS['border']}",
                        },
                    ),
                    html.Div(
                        [
                            html.H3(
                                "Current Assets",
                                style={
                                    "color": COLORS["primary"],
                                    "fontSize": "14px",
                                    "marginBottom": "16px",
                                    "fontWeight": "600",
                                    "textTransform": "uppercase",
                                    "letterSpacing": "0.5px",
                                },
                            ),
                            html.Div(
                                [
                                    html.Label(
                                        "ISA Assets (£)",
                                        style={
                                            "fontWeight": "600",
                                            "color": COLORS["text_primary"],
                                            "marginBottom": "6px",
                                            "fontSize": "13px",
                                        },
                                    ),
                                    dcc.Input(id="isa-assets", type="number", value=90000, style=INPUT_STYLE),
                                ],
                                style={"marginBottom": "12px"},
                            ),
                            html.Div(
                                [
                                    html.Label(
                                        "ISA Interest Rate (%)",
                                        style={
                                            "fontWeight": "600",
                                            "color": COLORS["text_primary"],
                                            "marginBottom": "6px",
                                            "fontSize": "13px",
                                        },
                                    ),
                                    dcc.Input(id="isa-interest-rate", type="number", value=7, step=0.1, style=INPUT_STYLE),
                                ],
                                style={"marginBottom": "12px"},
                            ),
                            html.Div(
                                [
                                    html.Label(
                                        "Non-ISA Assets (£)",
                                        style={
                                            "fontWeight": "600",
                                            "color": COLORS["text_primary"],
                                            "marginBottom": "6px",
                                            "fontSize": "13px",
                                        },
                                    ),
                                    dcc.Input(id="non-isa-assets", type="number", value=10000, style=INPUT_STYLE),
                                ],
                                style={"marginBottom": "12px"},
                            ),
                            html.Div(
                                [
                                    html.Label(
                                        "Non-ISA Interest Rate (%)",
                                        style={
                                            "fontWeight": "600",
                                            "color": COLORS["text_primary"],
                                            "marginBottom": "6px",
                                            "fontSize": "13px",
                                        },
                                    ),
                                    dcc.Input(
                                        id="non-isa-interest-rate",
                                        type="number",
                                        value=3.5,
                                        step=0.1,
                                        style=INPUT_STYLE,
                                    ),
                                ],
                                style={"marginBottom": "12px"},
                            ),
                        ],
                        style={
                            "marginBottom": "24px",
                            "paddingBottom": "16px",
                            "borderBottom": f"1px solid {COLORS['border']}",
                        },
                    ),
                    html.Div(
                        [
                            html.H3(
                                "Property & Mortgage",
                                style={
                                    "color": COLORS["primary"],
                                    "fontSize": "14px",
                                    "marginBottom": "16px",
                                    "fontWeight": "600",
                                    "textTransform": "uppercase",
                                    "letterSpacing": "0.5px",
                                },
                            ),
                            html.Div(
                                [
                                    html.Label(
                                        "Home Value (£)",
                                        style={
                                            "fontWeight": "600",
                                            "color": COLORS["text_primary"],
                                            "marginBottom": "6px",
                                            "fontSize": "13px",
                                        },
                                    ),
                                    dcc.Input(
                                        id="home-value",
                                        type="number",
                                        value=430000,
                                        step=10000,
                                        style=INPUT_STYLE,
                                    ),
                                ],
                                style={"marginBottom": "12px"},
                            ),
                            html.Div(
                                [
                                    html.Label(
                                        "Mortgage Balance (£)",
                                        style={
                                            "fontWeight": "600",
                                            "color": COLORS["text_primary"],
                                            "marginBottom": "6px",
                                            "fontSize": "13px",
                                        },
                                    ),
                                    dcc.Input(
                                        id="mortgage-balance",
                                        type="number",
                                        value=370000,
                                        step=10000,
                                        style=INPUT_STYLE,
                                    ),
                                ],
                                style={"marginBottom": "12px"},
                            ),
                            html.Div(
                                [
                                    html.Label(
                                        "Mortgage Term (Years)",
                                        style={
                                            "fontWeight": "600",
                                            "color": COLORS["text_primary"],
                                            "marginBottom": "6px",
                                            "fontSize": "13px",
                                        },
                                    ),
                                    dcc.Input(
                                        id="mortgage-term",
                                        type="number",
                                        value=30,
                                        step=1,
                                        min=0,
                                        style=INPUT_STYLE,
                                    ),
                                ],
                                style={"marginBottom": "12px"},
                            ),
                            html.Div(
                                [
                                    html.Label(
                                        "Mortgage Interest Rate (%)",
                                        style={
                                            "fontWeight": "600",
                                            "color": COLORS["text_primary"],
                                            "marginBottom": "6px",
                                            "fontSize": "13px",
                                        },
                                    ),
                                    dcc.Input(
                                        id="mortgage-interest-rate",
                                        type="number",
                                        value=3.83,
                                        step=0.01,
                                        style=INPUT_STYLE,
                                    ),
                                ],
                                style={"marginBottom": "12px"},
                            ),
                            html.Div(
                                [
                                    html.Label(
                                        "Home Appreciation Rate (%)",
                                        style={
                                            "fontWeight": "600",
                                            "color": COLORS["text_primary"],
                                            "marginBottom": "6px",
                                            "fontSize": "13px",
                                        },
                                    ),
                                    dcc.Input(
                                        id="home-appreciation-rate",
                                        type="number",
                                        value=3.0,
                                        step=0.1,
                                        style=INPUT_STYLE,
                                    ),
                                ],
                                style={"marginBottom": "12px"},
                            ),
                        ],
                        style={
                            "marginBottom": "24px",
                            "paddingBottom": "16px",
                            "borderBottom": f"1px solid {COLORS['border']}",
                        },
                    ),
                    html.Div(
                        [
                            html.H3(
                                "Pension",
                                style={
                                    "color": COLORS["primary"],
                                    "fontSize": "14px",
                                    "marginBottom": "16px",
                                    "fontWeight": "600",
                                    "textTransform": "uppercase",
                                    "letterSpacing": "0.5px",
                                },
                            ),
                            html.Div(
                                [
                                    html.Label(
                                        "Contribution Type",
                                        style={
                                            "fontWeight": "600",
                                            "color": COLORS["text_primary"],
                                            "marginBottom": "8px",
                                            "fontSize": "13px",
                                        },
                                    ),
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
                                            "color": COLORS["text_primary"],
                                        },
                                    ),
                                ],
                                style={"marginBottom": "12px"},
                            ),
                            html.Div(
                                [
                                    html.Label(
                                        "Contribution (% or £)",
                                        style={
                                            "fontWeight": "600",
                                            "color": COLORS["text_primary"],
                                            "marginBottom": "6px",
                                            "fontSize": "13px",
                                        },
                                    ),
                                    dcc.Input(id="pension-contribution", type="number", value=125, style=INPUT_STYLE),
                                ],
                                style={"marginBottom": "12px"},
                            ),
                            html.Div(
                                [
                                    html.Label(
                                        "Interest Rate (%)",
                                        style={
                                            "fontWeight": "600",
                                            "color": COLORS["text_primary"],
                                            "marginBottom": "6px",
                                            "fontSize": "13px",
                                        },
                                    ),
                                    dcc.Input(
                                        id="pension-interest-rate",
                                        type="number",
                                        value=5.0,
                                        step=0.1,
                                        style=INPUT_STYLE,
                                    ),
                                ],
                                style={"marginBottom": "12px"},
                            ),
                            html.Div(
                                [
                                    dcc.Checklist(
                                        id="pension-tax-relief",
                                        options=[{"label": " Include 20% Tax Relief", "value": "yes"}],
                                        value=["yes"],
                                        style={"marginBottom": "12px"},
                                        labelStyle={"color": COLORS["text_primary"]},
                                    )
                                ],
                                style={"marginBottom": "12px"},
                            ),
                        ],
                        style={
                            "marginBottom": "24px",
                            "paddingBottom": "16px",
                            "borderBottom": f"1px solid {COLORS['border']}",
                        },
                    ),
                    html.Div(
                        [
                            html.H3(
                                "Forecast Settings",
                                style={
                                    "color": COLORS["primary"],
                                    "fontSize": "14px",
                                    "marginBottom": "16px",
                                    "fontWeight": "600",
                                    "textTransform": "uppercase",
                                    "letterSpacing": "0.5px",
                                },
                            ),
                            html.Div(
                                [
                                    html.Label(
                                        "Forecast Period (Years)",
                                        style={
                                            "fontWeight": "600",
                                            "color": COLORS["text_primary"],
                                            "marginBottom": "8px",
                                            "fontSize": "13px",
                                        },
                                    ),
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
                                style={"marginBottom": "16px"},
                            ),
                            html.Div(
                                [
                                    html.Label(
                                        "Target ISA Contribution (£)",
                                        style={
                                            "fontWeight": "600",
                                            "color": COLORS["text_primary"],
                                            "marginBottom": "6px",
                                            "fontSize": "13px",
                                        },
                                    ),
                                    dcc.Input(
                                        id="isa-annual-contribution",
                                        type="number",
                                        value=40000,
                                        step=1000,
                                        style=INPUT_STYLE,
                                    ),
                                ],
                                style={"marginBottom": "12px"},
                            ),
                            html.Div(
                                [
                                    html.Label(
                                        "Inflation Rate (%)",
                                        style={
                                            "fontWeight": "600",
                                            "color": COLORS["text_primary"],
                                            "marginBottom": "6px",
                                            "fontSize": "13px",
                                        },
                                    ),
                                    dcc.Input(
                                        id="inflation-rate", type="number", value=2.0, step=0.1, style=INPUT_STYLE
                                    ),
                                ],
                                style={"marginBottom": "12px"},
                            ),
                            html.Div(
                                [
                                    html.Label(
                                        "Wage Increase Rate (%)",
                                        style={
                                            "fontWeight": "600",
                                            "color": COLORS["text_primary"],
                                            "marginBottom": "6px",
                                            "fontSize": "13px",
                                        },
                                    ),
                                    dcc.Input(
                                        id="wage-increase-rate",
                                        type="number",
                                        value=3.0,
                                        step=0.1,
                                        style=INPUT_STYLE,
                                    ),
                                ],
                                style={"marginBottom": "12px"},
                            ),
                        ],
                        style={
                            "marginBottom": "24px",
                            "paddingBottom": "16px",
                            "borderBottom": f"1px solid {COLORS['border']}",
                        },
                    ),
                    html.Div(
                        [
                            html.Button(
                                "📊 Calculate Forecast",
                                id="calculate-button",
                                n_clicks=0,
                                style={
                                    "width": "100%",
                                    "padding": "14px 20px",
                                    "backgroundColor": COLORS["primary"],
                                    "color": "white",
                                    "border": "none",
                                    "borderRadius": "6px",
                                    "fontSize": "15px",
                                    "fontWeight": "600",
                                    "cursor": "pointer",
                                    "transition": "background-color 0.2s ease",
                                },
                            )
                        ],
                        style={"marginTop": "24px"},
                    ),
                ],
                style={
                    "backgroundColor": COLORS["surface"],
                    "padding": "20px",
                    "borderRadius": "8px",
                    "border": f"1px solid {COLORS['border']}",
                    "height": "100%",
                },
            )
        ],
        style={"paddingRight": "20px"},
    )
