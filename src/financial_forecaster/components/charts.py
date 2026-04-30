import plotly.graph_objs as go
from dash import dcc, html

from financial_forecaster.theme import COLORS, DATA_COLORS, RADII, SPACING, TYPOGRAPHY, hex_to_rgba
from financial_forecaster.styles.inputs import PANEL_TITLE_STYLE

HOVER_LABEL_STYLE = {
    "bgcolor": COLORS["surface"],
    "bordercolor": COLORS["border"],
    "font": {"color": COLORS["text_primary"], "size": 13},
}

TIMEPOINTS_YEARS = [0, 1, 5, 10, 20]
SECTION_HEADER_STYLE = {
    "size": 14,
    "color": COLORS["primary"],
}
def _format_currency(value: float) -> str:
    return f"£{value:,.0f}"


def _format_percent(value: float) -> str:
    return f"{value:.1f}%"


def _month_from_years(years: int, max_month: int) -> int:
    return min(years * 12, max_month)


def _safe_value(values: list[float], month_index: int) -> float:
    if not values:
        return 0
    clamped_index = min(max(month_index, 0), len(values) - 1)
    return values[clamped_index]


def _build_table(
    title: str,
    columns: list[str],
    rows: list[list[str]],
    total_row_labels: set[str] | None = None,
) -> html.Div:
    total_row_labels = total_row_labels or set()
    return html.Div(
        [
            html.H3(
                title,
                style=PANEL_TITLE_STYLE,
            ),
            html.Div(
                [
                    html.Table(
                        [
                            html.Thead(html.Tr([html.Th(col) for col in columns])),
                            html.Tbody(
                                [
                                    html.Tr(
                                        [html.Td(cell) for cell in row],
                                        className=(
                                            "summary-total-row"
                                            if row and row[0] in total_row_labels
                                            else None
                                        ),
                                    )
                                    for row in rows
                                ]
                            ),
                        ],
                        className="summary-table",
                    )
                ],
                className="summary-table-wrap",
            ),
        ],
        className="summary-table-card",
    )


def _yearly_indices(length: int) -> list[int]:
    if length <= 0:
        return []
    indices = list(range(0, length, 12))
    last_index = length - 1
    if indices[-1] != last_index:
        indices.append(last_index)
    return indices


def _year_end_indices(dates: list[str]) -> list[int]:
    """Return December indices and include the final partial year endpoint."""
    december_indices = [index for index, date_label in enumerate(dates) if date_label.endswith("-12")]
    if not dates:
        return december_indices

    last_index = len(dates) - 1
    if last_index not in december_indices:
        december_indices.append(last_index)
    return december_indices


def _sample_yearly(values: list[float], indices: list[int]) -> list[float]:
    return [values[i] for i in indices]


def _extend_series_to_year_end(dates: list[str], values: list[float]) -> tuple[list[str], list[float]]:
    """Extend a partial final year to December using recent monthly growth."""
    if not dates or not values:
        return dates, values

    last_year, last_month_text = dates[-1].split("-")
    last_month = int(last_month_text)
    if last_month == 12:
        return dates, values

    remaining_months = 12 - last_month
    if len(values) >= 2 and values[-2] != 0:
        monthly_growth_factor = values[-1] / values[-2]
    else:
        monthly_growth_factor = 1.0

    projected_value = values[-1] * (monthly_growth_factor**remaining_months)
    extended_dates = [*dates[:-1], f"{last_year}-12"]
    extended_values = [*values[:-1], projected_value]
    return extended_dates, extended_values


def _sparse_year_ticks(years: list[str], interval: int = 5) -> list[str]:
    """Return sparse tick labels at a fixed interval, excluding final year."""
    if not years:
        return []
    final_year = years[-1]
    return [year for year in years if int(year) % interval == 0 and year != final_year]


def _build_chart_card(title: str, graph_id: str) -> html.Div:
    return html.Div(
        [
            html.H3(title, style=PANEL_TITLE_STYLE),
            dcc.Graph(id=graph_id),
        ],
        className="summary-table-card",
        style={"flex": "1 1 420px", "minWidth": "0"},
    )


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
    dates_for_chart, isa_values_for_chart = _extend_series_to_year_end(dates, isa_values)
    _, non_isa_values_for_chart = _extend_series_to_year_end(dates, non_isa_values)
    _, pension_values_for_chart = _extend_series_to_year_end(dates, pension_values)
    home_equity_values_for_chart = None
    if home_equity_values:
        _, home_equity_values_for_chart = _extend_series_to_year_end(dates, home_equity_values)

    indices = _year_end_indices(dates_for_chart)
    sampled_years = [dates_for_chart[i][:4] for i in indices]
    tick_years = _sparse_year_ticks(sampled_years)
    sampled_isa = _sample_yearly(isa_values_for_chart, indices)
    sampled_non_isa = _sample_yearly(non_isa_values_for_chart, indices)
    sampled_pension = _sample_yearly(pension_values_for_chart, indices)

    chart = go.Figure()
    chart.add_trace(
        go.Scatter(
            x=sampled_years,
            y=sampled_isa,
            name="ISA Assets",
            line=dict(color=DATA_COLORS[0], width=2, shape="spline", smoothing=0.7),
            stackgroup="one",
        )
    )
    chart.add_trace(
        go.Scatter(
            x=sampled_years,
            y=sampled_non_isa,
            name="Non-ISA Assets",
            line=dict(color=DATA_COLORS[1], width=2, shape="spline", smoothing=0.7),
            stackgroup="one",
        )
    )
    chart.add_trace(
        go.Scatter(
            x=sampled_years,
            y=sampled_pension,
            name="Pension (SIPP)",
            line=dict(color=DATA_COLORS[2], width=2, shape="spline", smoothing=0.7),
            stackgroup="one",
        )
    )
    if home_equity_values_for_chart:
        sampled_home_equity = _sample_yearly(home_equity_values_for_chart, indices)
        chart.add_trace(
            go.Scatter(
                x=sampled_years,
                y=sampled_home_equity,
                name="Home Equity",
                line=dict(color=DATA_COLORS[4], width=2, shape="spline", smoothing=0.7),
                stackgroup="one",
            )
        )
    chart.update_layout(
        xaxis_title="Year",
        yaxis_title="Assets (£)",
        hovermode="x unified",
        template="plotly_dark",
        paper_bgcolor="rgba(0,0,0,0)",
        plot_bgcolor="rgba(0,0,0,0)",
        hoverlabel=HOVER_LABEL_STYLE,
        height=400,
        margin={"t": 20, "b": 100},
        xaxis={"tickmode": "array", "tickvals": tick_years},
        legend=dict(orientation="h", x=0, xanchor="left", y=-0.28, yanchor="top"),
    )
    return chart


def build_withdrawal_chart(dates, isa_values, expense_values):
    dates_for_chart, isa_values_for_chart = _extend_series_to_year_end(dates, isa_values)
    _, expense_values_for_chart = _extend_series_to_year_end(dates, expense_values)

    withdrawal_39_annual = [isa_val * 0.039 for isa_val in isa_values_for_chart]
    annual_expenses = [exp * 12 for exp in expense_values_for_chart]
    indices = _year_end_indices(dates_for_chart)
    sampled_years = [dates_for_chart[i][:4] for i in indices]
    tick_years = _sparse_year_ticks(sampled_years)
    sampled_withdrawal = _sample_yearly(withdrawal_39_annual, indices)
    sampled_expenses = _sample_yearly(annual_expenses, indices)

    chart = go.Figure()
    chart.add_trace(
        go.Scatter(
            x=sampled_years,
            y=sampled_withdrawal,
            name="3.9% Annual Withdrawal",
            line=dict(color=DATA_COLORS[0], width=2, shape="spline", smoothing=0.7),
            fill="tozeroy",
            fillcolor=hex_to_rgba(DATA_COLORS[0], 0.2),
        )
    )
    chart.add_trace(
        go.Scatter(
            x=sampled_years,
            y=sampled_expenses,
            name="Annual Expenses (Inflation-Adjusted)",
            line=dict(color=COLORS["danger"], width=2, dash="dash", shape="spline", smoothing=0.7),
        )
    )
    chart.update_layout(
        xaxis_title="Year",
        yaxis_title="Amount (£)",
        hovermode="x unified",
        template="plotly_dark",
        paper_bgcolor="rgba(0,0,0,0)",
        plot_bgcolor="rgba(0,0,0,0)",
        hoverlabel=HOVER_LABEL_STYLE,
        height=400,
        margin={"t": 20, "b": 100},
        xaxis={"tickmode": "array", "tickvals": tick_years},
        legend=dict(orientation="h", x=0, xanchor="left", y=-0.28, yanchor="top"),
    )
    return chart


def build_summary_stats(
    income,
    expenses,
    monthly_savings,
    isa_assets,
    non_isa_assets,
    current_home_equity=0,
    monthly_mortgage_payment=0,
    income_values=None,
    expense_values=None,
    monthly_savings_values=None,
    mortgage_payment_values=None,
    isa_values=None,
    non_isa_values=None,
    pension_values=None,
    home_equity_values=None,
    fi_month_index=None,
):
    income_values = income_values or [income]
    expense_values = expense_values or [expenses]
    monthly_savings_values = monthly_savings_values or [monthly_savings]
    mortgage_payment_values = mortgage_payment_values or [monthly_mortgage_payment]
    isa_values = isa_values or [isa_assets]
    non_isa_values = non_isa_values or [non_isa_assets]
    pension_values = pension_values or [0]
    home_equity_values = home_equity_values or [current_home_equity]

    max_month = len(income_values) - 1
    fi_col_month = fi_month_index if fi_month_index is not None else max_month
    table_columns = ["Metric", "Current", "1Y", "5Y", "10Y", "20Y", "FI"]

    finance_rows = []
    for metric_label, series in [
        ("Monthly Income", income_values),
        ("Monthly Expenses", expense_values),
        ("Monthly Mortgage Repayments", mortgage_payment_values),
        ("Monthly Savings", monthly_savings_values),
    ]:
        cells = [metric_label]
        for year in TIMEPOINTS_YEARS:
            month_idx = _month_from_years(year, max_month)
            cells.append(_format_currency(_safe_value(series, month_idx)))
        cells.append(_format_currency(_safe_value(series, fi_col_month)))
        finance_rows.append(cells)

    net_worth_rows = []
    net_worth_series = [
        ("Pension Pot", pension_values),
        ("ISA Investments", isa_values),
        ("Non-ISA Investments (GIA)", non_isa_values),
        ("Home Equity", home_equity_values),
    ]
    for metric_label, series in net_worth_series:
        cells = [metric_label]
        for year in TIMEPOINTS_YEARS:
            month_idx = _month_from_years(year, max_month)
            cells.append(_format_currency(_safe_value(series, month_idx)))
        cells.append(_format_currency(_safe_value(series, fi_col_month)))
        net_worth_rows.append(cells)

    total_net_worth_row = ["Total Net Worth"]
    for year in TIMEPOINTS_YEARS:
        month_idx = _month_from_years(year, max_month)
        total_value = (
            _safe_value(pension_values, month_idx)
            + _safe_value(isa_values, month_idx)
            + _safe_value(non_isa_values, month_idx)
            + _safe_value(home_equity_values, month_idx)
        )
        total_net_worth_row.append(_format_currency(total_value))
    fi_total_value = (
        _safe_value(pension_values, fi_col_month)
        + _safe_value(isa_values, fi_col_month)
        + _safe_value(non_isa_values, fi_col_month)
        + _safe_value(home_equity_values, fi_col_month)
    )
    total_net_worth_row.append(_format_currency(fi_total_value))
    net_worth_rows.append(total_net_worth_row)

    return html.Div(
        [
            html.Div(
                [
                    _build_table("Financial Metrics", table_columns, finance_rows),
                    _build_table(
                        "Assets and Net Worth",
                        table_columns,
                        net_worth_rows,
                        total_row_labels={"Total Net Worth"},
                    ),
                ],
                className="summary-tables-grid",
            ),
        ]
    )


def build_projected_stats(
    years_until_expenses_covered,
    fi_date,
    fi_withdrawal_39_annual,
    fi_savings_rate,
):
    years_text = "Never" if years_until_expenses_covered is None else f"{years_until_expenses_covered:.1f}"
    fi_date_text = fi_date or "Not reached"

    def kpi_card(label, value):
        return html.Div(
            [
                html.H3(
                    label,
                    style={
                        "fontSize": TYPOGRAPHY["size_label"],
                        "color": COLORS["text_primary"],
                        "margin": f"0 0 {SPACING['xs']} 0",
                        "textTransform": "uppercase",
                        "letterSpacing": TYPOGRAPHY["tracking_tight"],
                    },
                ),
                html.P(
                    value,
                    style={
                        "fontSize": "36px",
                        "fontWeight": "700",
                        "color": COLORS["text_primary"],
                        "margin": "0",
                    },
                ),
            ],
            style={"padding": "0"},
        )

    cards = [
        kpi_card("3.9% Withdrawal", _format_currency(fi_withdrawal_39_annual)),
        kpi_card("FI Date", fi_date_text),
        kpi_card("Years Until FI", years_text),
        kpi_card("Savings Rate", _format_percent(fi_savings_rate)),
    ]

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
                    _build_chart_card(
                        "Asset Breakdown Over Time (ISA, Non-ISA, Pension, Home Equity)",
                        "asset-breakdown-chart",
                    ),
                    _build_chart_card(
                        "3.9% Annual Withdrawal vs Annual Expenses",
                        "withdrawal-chart",
                    ),
                ],
                style={"display": "flex", "flexWrap": "wrap", "gap": SPACING["xxl"]},
            ),
        ],
        style={"marginTop": SPACING["lg"]},
    )
