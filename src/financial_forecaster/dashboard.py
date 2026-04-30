import dash
from dash import html

from financial_forecaster.callbacks import register_callbacks
from financial_forecaster.components.charts import create_charts_section, create_summary_stats
from financial_forecaster.components.inputs import create_input_panel
from financial_forecaster.theme import COLORS

app = dash.Dash(__name__)
app.title = "Financial Forecaster"

app.layout = html.Div(
    [
        html.Div(
            [
                html.H1("Financial Forecaster", style={"color": COLORS["text_primary"], "margin": "0"}),
                html.P(
                    "Plan your financial future with data-driven forecasts",
                    style={"color": COLORS["text_secondary"], "margin": "8px 0 0 0"},
                ),
            ],
            style={
                "backgroundColor": COLORS["surface"],
                "padding": "24px 30px",
                "borderBottom": f"1px solid {COLORS['border']}",
            },
        ),
        html.Div(
            [
                html.Div(
                    [create_input_panel()],
                    style={
                        "width": "320px",
                        "minHeight": "calc(100vh - 140px)",
                        "overflowY": "auto",
                        "paddingRight": "0",
                        "borderRight": f"1px solid {COLORS['border']}",
                    },
                ),
                html.Div([create_summary_stats(), create_charts_section()], style={"flex": 1, "padding": "24px"}),
            ],
            style={"display": "flex", "flex": 1, "backgroundColor": COLORS["background"]},
        ),
    ],
    style={
        "display": "flex",
        "flexDirection": "column",
        "height": "100vh",
        "backgroundColor": COLORS["background"],
        "margin": "0",
        "padding": "0",
    },
)

register_callbacks(app)
