import dash
from dash import html

from financial_forecaster.callbacks import register_callbacks
from financial_forecaster.components.charts import create_charts_section, create_summary_stats
from financial_forecaster.components.inputs import create_input_panel
from financial_forecaster.theme import COLORS, SPACING, TYPOGRAPHY

app = dash.Dash(__name__)
app.title = "Financial Forecaster"

main_column = html.Div(
    [
        html.Div(
            [
                html.H1("Financial Forecaster", style={"color": COLORS["text_primary"], "margin": "0"}),
                html.P(
                    "Plan your financial future with data-driven forecasts",
                    style={"color": COLORS["text_secondary"], "margin": f"{SPACING['sm']} 0 0 0"},
                ),
            ],
            style={
                "background": (
                    "radial-gradient(circle at 14% 18%, rgba(87, 104, 255, 0.45), transparent 50%), "
                    "radial-gradient(circle at 86% 8%, rgba(156, 114, 255, 0.42), transparent 48%), "
                    "linear-gradient(180deg, #263f8f 0%, #1b3270 46%, #060a14 100%)"
                ),
                "padding": f"{SPACING['xxl']} {SPACING['page']}",
                "borderBottom": f"1px solid {COLORS['border']}",
            },
            className="app-hero",
        ),
        html.Div([create_summary_stats(full_bleed=True)], className="summary-main-band"),
        html.Div([create_charts_section()], style={"padding": SPACING["xxl"]}, className="app-main-content"),
    ],
    className="app-main-column",
)

app.layout = html.Div(
    [
        html.Div(
            [
                html.Div(
                    [create_input_panel()],
                    style={
                        "height": "100vh",
                        "overflowY": "auto",
                        "paddingRight": "0",
                        "borderRight": f"1px solid {COLORS['border']}",
                    },
                    className="app-side-panel",
                ),
                main_column,
            ],
            style={"backgroundColor": COLORS["background"]},
            className="app-main-row",
        ),
    ],
    style={
        "display": "flex",
        "flexDirection": "column",
        "height": "100vh",
        "fontFamily": TYPOGRAPHY["font_family"],
        "backgroundColor": COLORS["background"],
        "margin": "0",
        "padding": "0",
    },
)

register_callbacks(app)
