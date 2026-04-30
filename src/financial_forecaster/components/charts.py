import plotly.graph_objs as go
from dash import dcc, html

from financial_forecaster.theme import COLORS, DATA_COLORS, RADII, SPACING, TYPOGRAPHY, hex_to_rgba

HOVER_LABEL_STYLE = {
    "bgcolor": COLORS["surface"],
    "bordercolor": COLORS["border"],
    "font": {"color": COLORS["text_primary"], "size": 13},
}


def build_wealth_chart(dates, total_wealth):
    chart = go.Figure()
    chart.add_trace(
        go.Scatter(
            x=dates,
            y=total_wealth,
            fill="tozeroy",
            name="Total Wealth",
            line=dict(color=DATA_COLORS[0], width=3),
            fillcolor=hex_to_rgba(DATA_COLORS[0], 0.25),
        )
    )
    chart.update_layout(
        title="Total Wealth Forecast",
        xaxis_title="Month",
        yaxis_title="Total Wealth (£)",
        hovermode="x unified",
        template="plotly_dark",
        paper_bgcolor="rgba(0,0,0,0)",
        plot_bgcolor="rgba(0,0,0,0)",
        hoverlabel=HOVER_LABEL_STYLE,
        height=400,
        legend=dict(orientation="h", x=0, xanchor="left", y=1.02, yanchor="bottom"),
    )
    return chart


def build_savings_chart(dates, monthly_savings_values):
    chart = go.Figure()
    chart.add_trace(
        go.Bar(
            x=dates,
            y=monthly_savings_values,
            name="Monthly Savings",
            marker=dict(color=DATA_COLORS[3]),
        )
    )
    chart.update_layout(
        title="Monthly Savings (Adjusted for Income Growth & Inflation)",
        xaxis_title="Month",
        yaxis_title="Savings (£)",
        hovermode="x unified",
        template="plotly_dark",
        paper_bgcolor="rgba(0,0,0,0)",
        plot_bgcolor="rgba(0,0,0,0)",
        hoverlabel=HOVER_LABEL_STYLE,
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
            line=dict(color=DATA_COLORS[0], width=2),
            stackgroup="one",
        )
    )
    chart.add_trace(
        go.Scatter(
            x=dates,
            y=non_isa_values,
            name="Non-ISA Assets",
            line=dict(color=DATA_COLORS[1], width=2),
            stackgroup="one",
        )
    )
    chart.add_trace(
        go.Scatter(
            x=dates,
            y=pension_values,
            name="Pension (SIPP)",
            line=dict(color=DATA_COLORS[2], width=2),
            stackgroup="one",
        )
    )
    if home_equity_values:
        chart.add_trace(
            go.Scatter(
                x=dates,
                y=home_equity_values,
                name="Home Equity",
                line=dict(color=DATA_COLORS[4], width=2),
                stackgroup="one",
            )
        )
    chart.update_layout(
        title="Asset Breakdown Over Time (ISA, Non-ISA, Pension, Home Equity)",
        xaxis_title="Month",
        yaxis_title="Assets (£)",
        hovermode="x unified",
        template="plotly_dark",
        paper_bgcolor="rgba(0,0,0,0)",
        plot_bgcolor="rgba(0,0,0,0)",
        hoverlabel=HOVER_LABEL_STYLE,
        height=400,
        legend=dict(orientation="h", x=0, xanchor="left", y=1.02, yanchor="bottom"),
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
            line=dict(color=DATA_COLORS[0], width=2),
            fill="tozeroy",
            fillcolor=hex_to_rgba(DATA_COLORS[0], 0.2),
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
        paper_bgcolor="rgba(0,0,0,0)",
        plot_bgcolor="rgba(0,0,0,0)",
        hoverlabel=HOVER_LABEL_STYLE,
        height=400,
        legend=dict(orientation="h", x=0, xanchor="left", y=1.02, yanchor="bottom"),
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
    current_home_equity=0,
    final_home_equity=0,
    final_mortgage_balance=0,
    monthly_mortgage_payment=0,
    mortgage_interest_rate=0,
):
    def kpi_card(label, value):
        return html.Div(
            [
                html.H3(
                    label,
                    style={
                        "fontSize": TYPOGRAPHY["size_label"],
                        "color": COLORS["text_secondary"],
                        "margin": f"0 0 {SPACING['xs']} 0",
                        "textTransform": "uppercase",
                        "letterSpacing": TYPOGRAPHY["tracking_tight"],
                    },
                ),
                html.P(
                    value,
                    style={
                        "fontSize": TYPOGRAPHY["size_callout_value"],
                        "fontWeight": "700",
                        "color": COLORS["primary"],
                        "margin": "0",
                    },
                ),
            ],
            style={
                "padding": "0",
            },
        )

    return html.Div(
        [
            html.Div(
                [
                    html.H3(
                        "CURRENT FINANCES",
                        style={
                            "fontSize": TYPOGRAPHY["size_section_label"],
                            "color": COLORS["text_secondary"],
                            "margin": f"0 0 {SPACING['md']} 0",
                            "textTransform": "uppercase",
                            "letterSpacing": TYPOGRAPHY["tracking_label"],
                            "fontWeight": "600",
                        },
                    ),
                    html.Div(
                        [
                            kpi_card("Monthly Income", f"£{income:,.0f}"),
                            kpi_card("Monthly Expenses", f"£{expenses:,.0f}"),
                            kpi_card("Monthly Savings", f"£{monthly_savings:,.0f}"),
                            kpi_card("Savings Rate", f"{(monthly_savings / income * 100) if income > 0 else 0:.1f}%"),
                            kpi_card("Current Assets", f"£{isa_assets + non_isa_assets:,.0f}"),
                            kpi_card("Monthly Pension", f"£{monthly_pension:,.0f}"),
                        ],
                        style={
                            "display": "grid",
                            "gridTemplateColumns": "repeat(auto-fit, minmax(170px, 1fr))",
                            "gap": SPACING["md"],
                            "marginBottom": SPACING["xl"],
                        },
                    ),
                ]
            )
            if home_value == 0
            else html.Div(
                [
                    html.H3(
                        "CURRENT FINANCES",
                        style={
                            "fontSize": TYPOGRAPHY["size_section_label"],
                            "color": COLORS["text_secondary"],
                            "margin": f"0 0 {SPACING['md']} 0",
                            "textTransform": "uppercase",
                            "letterSpacing": TYPOGRAPHY["tracking_label"],
                            "fontWeight": "600",
                        },
                    ),
                    html.Div(
                        [
                            kpi_card("Monthly Income", f"£{income:,.0f}"),
                            kpi_card("Monthly Expenses", f"£{expenses:,.0f}"),
                            kpi_card("Monthly Savings", f"£{monthly_savings:,.0f}"),
                            kpi_card("Monthly Payment", f"£{monthly_mortgage_payment:,.0f}"),
                            kpi_card("Current Assets", f"£{isa_assets + non_isa_assets:,.0f}"),
                            kpi_card("Home Equity", f"£{current_home_equity:,.0f}"),
                        ],
                        style={
                            "display": "grid",
                            "gridTemplateColumns": "repeat(auto-fit, minmax(170px, 1fr))",
                            "gap": SPACING["md"],
                            "marginBottom": SPACING["xl"],
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
    else:
        years_text = f"{years_until_expenses_covered:.1f} years"

    def kpi_card(label, value):
        return html.Div(
            [
                html.H3(
                    label,
                    style={
                        "fontSize": TYPOGRAPHY["size_label"],
                        "color": COLORS["text_secondary"],
                        "margin": f"0 0 {SPACING['xs']} 0",
                        "textTransform": "uppercase",
                        "letterSpacing": TYPOGRAPHY["tracking_tight"],
                    },
                ),
                html.P(
                    value,
                    style={
                        "fontSize": TYPOGRAPHY["size_callout_value"],
                        "fontWeight": "700",
                        "color": COLORS["primary"],
                        "margin": "0",
                    },
                ),
            ],
            style={
                "padding": "0",
            },
        )

    cards = [
        kpi_card("Non-Pension Wealth", f"£{(final_wealth - final_pension):,.0f}"),
        kpi_card("Pension Pot", f"£{final_pension:,.0f}"),
        kpi_card("Final ISA", f"£{final_isa:,.0f}"),
        kpi_card("3.9% Withdrawal", f"£{withdrawal_39_annual:,.0f}"),
        kpi_card("Final Monthly Expenses", f"£{final_monthly_expenses:,.0f}"),
        kpi_card("Years Until FI", years_text),
    ]

    if home_value > 0:
        cards.extend(
            [
                kpi_card("Home Equity", f"£{final_home_equity:,.0f}"),
                kpi_card("Total Net Worth", f"£{(final_wealth + final_home_equity - final_pension):,.0f}"),
            ]
        )

    return html.Div(
        cards,
        style={
            "display": "grid",
            "gridTemplateColumns": "repeat(auto-fit, minmax(170px, 1fr))",
            "gap": SPACING["md"],
        },
    )


def create_summary_stats(full_bleed: bool = False):
    content = [
        html.H2(
            "Financial Summary",
            style={
                "color": COLORS["text_primary"],
                "marginBottom": SPACING["xl"],
                "fontSize": TYPOGRAPHY["size_heading"],
            },
        ),
        html.Div(id="summary-stats"),
    ]

    if full_bleed:
        return html.Div(content)

    return html.Div(
        [
            *content,
        ],
        style={
            "backgroundColor": COLORS["surface"],
            "padding": SPACING["xl"],
            "borderRadius": RADII["md"],
            "border": f"1px solid {COLORS['border']}",
            "marginBottom": SPACING["xxl"],
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
                            "padding": SPACING["lg"],
                            "borderRadius": RADII["md"],
                            "border": f"1px solid {COLORS['border']}",
                            "flex": "1 1 420px",
                            "minWidth": "0",
                        },
                    ),
                    html.Div(
                        [dcc.Graph(id="asset-breakdown-chart")],
                        style={
                            "backgroundColor": COLORS["surface"],
                            "padding": SPACING["lg"],
                            "borderRadius": RADII["md"],
                            "border": f"1px solid {COLORS['border']}",
                            "flex": "1 1 420px",
                            "minWidth": "0",
                        },
                    ),
                ],
                style={"display": "flex", "flexWrap": "wrap", "gap": SPACING["xxl"], "marginBottom": SPACING["xxl"]},
            ),
            html.Div(
                [
                    html.Div(
                        [dcc.Graph(id="monthly-savings-chart")],
                        style={
                            "backgroundColor": COLORS["surface"],
                            "padding": SPACING["lg"],
                            "borderRadius": RADII["md"],
                            "border": f"1px solid {COLORS['border']}",
                            "flex": "1 1 420px",
                            "minWidth": "0",
                        },
                    ),
                    html.Div(
                        [dcc.Graph(id="withdrawal-chart")],
                        style={
                            "backgroundColor": COLORS["surface"],
                            "padding": SPACING["lg"],
                            "borderRadius": RADII["md"],
                            "border": f"1px solid {COLORS['border']}",
                            "flex": "1 1 420px",
                            "minWidth": "0",
                        },
                    ),
                ],
                style={"display": "flex", "flexWrap": "wrap", "gap": SPACING["xxl"]},
            ),
        ],
        style={"marginTop": SPACING["xxl"]},
    )
