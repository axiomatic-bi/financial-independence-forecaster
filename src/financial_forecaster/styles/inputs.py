from financial_forecaster.theme import COLORS

SECTION_TITLE_STYLE = {
    "color": COLORS["primary"],
    "fontSize": "14px",
    "marginBottom": "16px",
    "fontWeight": "600",
    "textTransform": "uppercase",
    "letterSpacing": "0.5px",
}

SECTION_CONTAINER_STYLE = {
    "marginBottom": "24px",
    "paddingBottom": "16px",
    "borderBottom": f"1px solid {COLORS['border']}",
}

LABEL_STYLE = {
    "fontWeight": "600",
    "color": COLORS["text_primary"],
    "marginBottom": "6px",
    "fontSize": "13px",
}

DETAILS_STYLE = {
    "backgroundColor": "#243144",
    "border": f"1px solid {COLORS['border']}",
    "borderRadius": "8px",
    "padding": "12px 12px 0 12px",
}

SUMMARY_STYLE = {
    "color": COLORS["text_primary"],
    "fontWeight": "600",
    "cursor": "pointer",
    "fontSize": "14px",
    "marginBottom": "12px",
}

PANEL_TITLE_STYLE = {"color": COLORS["text_primary"], "marginBottom": "24px", "fontSize": "20px"}

PANEL_STYLE = {
    "backgroundColor": COLORS["surface"],
    "padding": "20px",
    "borderRadius": "8px",
    "border": f"1px solid {COLORS['border']}",
    "height": "100%",
}

PANEL_WRAPPER_STYLE = {"paddingRight": "20px"}

BUTTON_STYLE = {
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
}

SECTION_HEADING_MARGIN_STYLE = {
    "fontWeight": "600",
    "color": COLORS["text_primary"],
    "marginBottom": "8px",
    "fontSize": "13px",
}
