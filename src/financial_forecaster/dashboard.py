from pathlib import Path

import dash
from dash import html

from financial_forecaster.callbacks import register_callbacks
from financial_forecaster.components.charts import create_charts_section, create_summary_stats
from financial_forecaster.components.inputs import create_forecast_period_section, create_input_panel
from financial_forecaster.styles.inputs import SECTION_TITLE_STYLE
from financial_forecaster.theme import COLORS, SPACING, TYPOGRAPHY

APP_ROOT = Path(__file__).resolve().parents[2]

app = dash.Dash(__name__, assets_folder=str(APP_ROOT / "assets"))
app.title = "Financial Forecaster"
app.index_string = """
<!DOCTYPE html>
<html>
    <head>
        {%metas%}
        <title>{%title%}</title>
        {%favicon%}
        {%css%}
        <style>html, body { margin: 0 !important; padding: 0 !important; }</style>
    </head>
    <body>
        {%app_entry%}
        <footer>
            {%config%}
            {%scripts%}
            {%renderer%}
        </footer>
    </body>
</html>
"""

header = html.Div(
    [
        html.H1(
            "Financial Forecaster",
            style={"color": COLORS["text_primary"], "margin": "0", "fontSize": TYPOGRAPHY["size_hero_title"]},
        ),
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
)

main_column = html.Div(
    [
        html.Div(
            [
                html.H3(
                    "PROJECTED OUTCOMES",
                    style=SECTION_TITLE_STYLE,
                ),
                html.Div(id="projected-stats"),
            ],
            className="projected-main-band",
        ),
        html.Div(
            [create_forecast_period_section()],
            className="forecast-period-band",
        ),
        html.Div(
            [create_charts_section()],
            style={"padding": f"{SPACING['lg']} {SPACING['xxl']}"},
            className="app-main-content",
        ),
        html.Div(
            [create_summary_stats(full_bleed=True)],
            style={"padding": f"{SPACING['lg']} {SPACING['xxl']}"},
            className="app-main-content",
        ),
    ],
    style={"flex": "1", "minWidth": "0", "display": "flex", "flexDirection": "column"},
    className="app-main-column",
)

app.layout = html.Div(
    [
        header,
        html.Div(
            [
                html.Div(
                    [create_input_panel()],
                    style={
                        "width": "clamp(260px, 24vw, 340px)",
                        "minWidth": "clamp(260px, 24vw, 340px)",
                        "overflowY": "visible",
                        "paddingRight": "0",
                        "borderRight": f"1px solid {COLORS['border']}",
                        "flexShrink": "0",
                        "alignSelf": "stretch",
                    },
                    className="app-side-panel",
                ),
                main_column,
            ],
            style={
                "display": "flex",
                "flexDirection": "row",
                "flexWrap": "nowrap",
                "alignItems": "stretch",
                "backgroundColor": COLORS["background"],
                "width": "100%",
                "minHeight": "0",
                "flex": "1",
            },
            className="app-main-row",
        ),
    ],
    style={
        "display": "flex",
        "flexDirection": "column",
        "minHeight": "100vh",
        "fontFamily": TYPOGRAPHY["font_family"],
        "backgroundColor": COLORS["background"],
        "margin": "0",
        "padding": "0",
    },
)

register_callbacks(app)
