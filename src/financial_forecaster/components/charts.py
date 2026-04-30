import plotly.graph_objs as go
from dash import dcc, html

from financial_forecaster.theme import COLORS, hex_to_rgba


def build_wealth_chart(dates, total_wealth):
    chart = go.Figure()
    chart.add_trace(
        go.Scatter(
            x=dates,
            y=total_wealth,
            fill="tozeroy",
            name="Total Wealth",
            line=dict(color=COLORS["primary"], width=3),
            fillcolor=hex_to_rgba(COLORS["primary_light"], 0.3),
        )
    )
    chart.update_layout(
        title="Total Wealth Forecast",
        xaxis_title="Month",
        yaxis_title="Total Wealth (£)",
        hovermode="x unified",
        template="plotly_dark",
        height=400,
    )
    return chart


def build_savings_chart(dates, monthly_savings_values):
    chart = go.Figure()
    chart.add_trace(
        go.Bar(
            x=dates,
            y=monthly_savings_values,
            name="Monthly Savings",
            marker=dict(color=COLORS["success"]),
        )
    )
    chart.update_layout(
        title="Monthly Savings (Adjusted for Income Growth & Inflation)",
        xaxis_title="Month",
        yaxis_title="Savings (£)",
        hovermode="x unified",
        template="plotly_dark",
        height=400,
        showlegend=False,
    )
    return chart


def build_breakdown_chart(dates, isa_values, non_isa_values, pension_values, home_equity_values=None):
    chart = go.Figure()
    chart.add_trace(
        go.Scatter(
            x=dates,
            y=isa_values,
            name="ISA Assets",
            line=dict(color=COLORS["primary"], width=2),
            stackgroup="one",
        )
    )
    chart.add_trace(
        go.Scatter(
            x=dates,
            y=non_isa_values,
            name="Non-ISA Assets",
            line=dict(color=COLORS["success"], width=2),
            stackgroup="one",
        )
    )
    chart.add_trace(
        go.Scatter(
            x=dates,
            y=pension_values,
            name="Pension (SIPP)",
            line=dict(color=COLORS["primary_light"], width=2),
            stackgroup="one",
        )
    )
    if home_equity_values:
        chart.add_trace(
            go.Scatter(
                x=dates,
                y=home_equity_values,
                name="Home Equity",
                line=dict(color=COLORS["warning"], width=2),
                stackgroup="one",
            )
        )
    chart.update_layout(
        title="Asset Breakdown Over Time (ISA, Non-ISA, Pension, Home Equity)",
        xaxis_title="Month",
        yaxis_title="Assets (£)",
        hovermode="x unified",
        template="plotly_dark",
        height=400,
    )
    return chart


def build_withdrawal_chart(dates, isa_values, expense_values):
    withdrawal_39_annual = [isa_val * 0.039 for isa_val in isa_values]
    annual_expenses = [exp * 12 for exp in expense_values]

    chart = go.Figure()
    chart.add_trace(
        go.Scatter(
            x=dates,
            y=withdrawal_39_annual,
            name="3.9% Annual Withdrawal",
            line=dict(color=COLORS["primary"], width=2),
            fill="tozeroy",
            fillcolor=hex_to_rgba(COLORS["primary"], 0.2),
        )
    )
    chart.add_trace(
        go.Scatter(
            x=dates,
            y=annual_expenses,
            name="Annual Expenses (Inflation-Adjusted)",
            line=dict(color=COLORS["danger"], width=2, dash="dash"),
        )
    )
    chart.update_layout(
        title="3.9% Annual Withdrawal vs Annual Expenses",
        xaxis_title="Month",
        yaxis_title="Amount (£)",
        hovermode="x unified",
        template="plotly_dark",
        height=400,
    )
    return chart


def build_summary_stats(
    income,
    expenses,
    monthly_pension,
    monthly_savings,
    inflation_rate,
    wage_increase_rate,
    isa_assets,
    non_isa_assets,
    final_wealth,
    final_pension,
    total_gain,
    months,
    withdrawal_39_annual=0,
    final_isa=0,
    years_until_expenses_covered=None,
    final_monthly_expenses=0,
    final_annual_expenses=0,
    home_value=0,
    final_home_equity=0,
    final_mortgage_balance=0,
    monthly_mortgage_payment=0,
    mortgage_interest_rate=0,
):
    def kpi_card(label, value, color=COLORS["text_primary"]):
        return html.Div(
            [
                html.H3(
                    label,
                    style={
                        "fontSize": "11px",
                        "color": COLORS["text_secondary"],
                        "margin": "0 0 6px 0",
                        "textTransform": "uppercase",
                        "letterSpacing": "0.4px",
                    },
                ),
                html.P(
                    value,
                    style={"fontSize": "16px", "fontWeight": "700", "color": color, "margin": "0"},
                ),
            ],
            style={"backgroundColor": COLORS["surface_hover"], "padding": "10px", "borderRadius": "4px"},
        )

    return html.Div(
        [
            html.Div(
                [
                    html.H3(
                        "KEY METRICS",
                        style={
                            "fontSize": "12px",
                            "color": COLORS["text_secondary"],
                            "margin": "0 0 12px 0",
                            "textTransform": "uppercase",
                            "letterSpacing": "0.5px",
                            "fontWeight": "600",
                        },
                    ),
                    html.Div(
                        [
                            kpi_card("Monthly Income", f"£{income:,.0f}", COLORS["primary"]),
                            kpi_card("Monthly Expenses", f"£{expenses:,.0f}", COLORS["danger"]),
                            kpi_card(
                                "Monthly Savings",
                                f"£{monthly_savings:,.0f}",
                                COLORS["success"] if monthly_savings >= 0 else COLORS["danger"],
                            ),
                            kpi_card(
                                "Savings Rate",
                                f"{(monthly_savings / income * 100) if income > 0 else 0:.1f}%",
                                COLORS["primary_light"],
                            ),
                            kpi_card("Current Assets", f"£{isa_assets + non_isa_assets:,.0f}", COLORS["primary"]),
                            kpi_card("Monthly Pension", f"£{monthly_pension:,.0f}", COLORS["primary_light"]),
                        ],
                        style={
                            "display": "grid",
                            "gridTemplateColumns": "1fr 1fr 1fr 1fr 1fr 1fr",
                            "gap": "12px",
                            "marginBottom": "20px",
                        },
                    ),
                ]
            )
            if home_value == 0
            else html.Div(
                [
                    html.H3(
                        "KEY METRICS",
                        style={
                            "fontSize": "12px",
                            "color": COLORS["text_secondary"],
                            "margin": "0 0 12px 0",
                            "textTransform": "uppercase",
                            "letterSpacing": "0.5px",
                            "fontWeight": "600",
                        },
                    ),
                    html.Div(
                        [
                            kpi_card("Monthly Income", f"£{income:,.0f}", COLORS["primary"]),
                            kpi_card("Monthly Expenses", f"£{expenses:,.0f}", COLORS["danger"]),
                            kpi_card(
                                "Monthly Savings",
                                f"£{monthly_savings:,.0f}",
                                COLORS["success"] if monthly_savings >= 0 else COLORS["danger"],
                            ),
                            kpi_card("Monthly Payment", f"£{monthly_mortgage_payment:,.0f}", COLORS["danger"]),
                            kpi_card("Current Assets", f"£{isa_assets + non_isa_assets:,.0f}", COLORS["primary"]),
                            kpi_card("Home Equity", f"£{final_home_equity:,.0f}", COLORS["success"]),
                        ],
                        style={
                            "display": "grid",
                            "gridTemplateColumns": "1fr 1fr 1fr 1fr 1fr 1fr",
                            "gap": "12px",
                            "marginBottom": "20px",
                        },
                    ),
                ]
            ),
        ]
    )


def build_projected_stats(
    final_wealth,
    final_pension,
    final_isa,
    years_until_expenses_covered,
    final_monthly_expenses,
    withdrawal_39_annual,
    home_value,
    final_home_equity,
):
    if years_until_expenses_covered is None:
        years_text = "Never"
        years_color = COLORS["danger"]
    else:
        years_text = f"{years_until_expenses_covered:.1f} years"
        years_color = COLORS["success"]

    def kpi_card(label, value, color=COLORS["text_primary"]):
        return html.Div(
            [
                html.H3(
                    label,
                    style={
                        "fontSize": "11px",
                        "color": COLORS["text_secondary"],
                        "margin": "0 0 6px 0",
                        "textTransform": "uppercase",
                        "letterSpacing": "0.4px",
                    },
                ),
                html.P(
                    value,
                    style={"fontSize": "16px", "fontWeight": "700", "color": color, "margin": "0"},
                ),
            ],
            style={"backgroundColor": COLORS["surface_hover"], "padding": "10px", "borderRadius": "4px"},
        )

    cards = [
        kpi_card("Non-Pension Wealth", f"£{(final_wealth - final_pension):,.0f}", COLORS["success"]),
        kpi_card("Pension Pot", f"£{final_pension:,.0f}", COLORS["primary_light"]),
        kpi_card("Final ISA", f"£{final_isa:,.0f}", COLORS["primary"]),
        kpi_card("3.9% Withdrawal", f"£{withdrawal_39_annual:,.0f}", COLORS["success"]),
        kpi_card("Final Monthly Expenses", f"£{final_monthly_expenses:,.0f}", COLORS["danger"]),
        kpi_card("Years Until FI", years_text, years_color),
    ]

    if home_value > 0:
        cards.extend(
            [
                kpi_card("Home Equity", f"£{final_home_equity:,.0f}", COLORS["success"]),
                kpi_card(
                    "Total Net Worth",
                    f"£{(final_wealth + final_home_equity - final_pension):,.0f}",
                    COLORS["success"],
                ),
            ]
        )

    return html.Div(
        cards,
        style={"display": "grid", "gridTemplateColumns": f"repeat({len(cards)}, 1fr)", "gap": "12px"},
    )


def create_summary_stats():
    return html.Div(
        [
            html.H2(
                "Financial Summary",
                style={"color": COLORS["text_primary"], "marginBottom": "20px", "fontSize": "22px"},
            ),
            html.Div(id="summary-stats"),
        ],
        style={
            "backgroundColor": COLORS["surface"],
            "padding": "20px",
            "borderRadius": "8px",
            "border": f"1px solid {COLORS['border']}",
            "marginBottom": "24px",
        },
    )


def create_charts_section():
    return html.Div(
        [
            html.Div(
                [
                    html.Div(
                        [dcc.Graph(id="wealth-forecast-chart")],
                        style={
                            "backgroundColor": COLORS["surface"],
                            "padding": "16px",
                            "borderRadius": "8px",
                            "border": f"1px solid {COLORS['border']}",
                            "flex": "1",
                            "minWidth": "0",
                        },
                    ),
                    html.Div(
                        [dcc.Graph(id="asset-breakdown-chart")],
                        style={
                            "backgroundColor": COLORS["surface"],
                            "padding": "16px",
                            "borderRadius": "8px",
                            "border": f"1px solid {COLORS['border']}",
                            "flex": "1",
                            "minWidth": "0",
                        },
                    ),
                ],
                style={"display": "flex", "gap": "24px", "marginBottom": "24px"},
            ),
            html.Div(
                [
                    html.Div(
                        [dcc.Graph(id="monthly-savings-chart")],
                        style={
                            "backgroundColor": COLORS["surface"],
                            "padding": "16px",
                            "borderRadius": "8px",
                            "border": f"1px solid {COLORS['border']}",
                            "flex": "1",
                            "minWidth": "0",
                        },
                    ),
                    html.Div(
                        [dcc.Graph(id="withdrawal-chart")],
                        style={
                            "backgroundColor": COLORS["surface"],
                            "padding": "16px",
                            "borderRadius": "8px",
                            "border": f"1px solid {COLORS['border']}",
                            "flex": "1",
                            "minWidth": "0",
                        },
                    ),
                ],
                style={"display": "flex", "gap": "24px"},
            ),
            html.Div(
                [
                    html.H3(
                        "PROJECTED OUTCOMES",
                        style={
                            "fontSize": "12px",
                            "color": COLORS["text_secondary"],
                            "margin": "24px 0 12px 0",
                            "textTransform": "uppercase",
                            "letterSpacing": "0.5px",
                            "fontWeight": "600",
                        },
                    ),
                    html.Div(id="projected-stats"),
                ]
            ),
        ],
        style={"marginTop": "24px"},
    )
