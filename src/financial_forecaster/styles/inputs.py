from financial_forecaster.theme import COLORS, RADII, SPACING, TYPOGRAPHY

SECTION_TITLE_STYLE = {
    "color": COLORS["primary"],
    "fontSize": TYPOGRAPHY["size_body"],
    "marginBottom": SPACING["lg"],
    "fontWeight": "600",
    "textTransform": "uppercase",
    "letterSpacing": TYPOGRAPHY["tracking_label"],
}

SECTION_CONTAINER_STYLE = {
    "marginBottom": SPACING["xxl"],
    "paddingBottom": SPACING["lg"],
    "borderBottom": f"1px solid {COLORS['border']}",
}

LABEL_STYLE = {
    "fontWeight": "600",
    "color": COLORS["text_primary"],
    "marginBottom": SPACING["xs"],
    "fontSize": TYPOGRAPHY["size_body"],
}

DETAILS_STYLE = {
    "backgroundColor": "transparent",
    "border": f"1px solid {COLORS['border']}",
    "borderRadius": RADII["sm"],
    "padding": f"{SPACING['md']} {SPACING['md']} 0 {SPACING['md']}",
    "marginBottom": SPACING["md"],
}

SUMMARY_STYLE = {
    "color": COLORS["text_primary"],
    "fontWeight": "600",
    "cursor": "pointer",
    "fontSize": "14px",
    "marginBottom": SPACING["md"],
}

PANEL_TITLE_STYLE = {
    "color": COLORS["text_primary"],
    "marginBottom": SPACING["xxl"],
    "fontSize": TYPOGRAPHY["size_title"],
}

PANEL_STYLE = {
    "backgroundColor": "transparent",
    "padding": SPACING["xl"],
    "borderRadius": "0",
    "border": "none",
    "height": "100%",
}

PANEL_WRAPPER_STYLE = {"paddingRight": "0"}

BUTTON_STYLE = {
    "width": "100%",
    "padding": f"14px {SPACING['xl']}",
    "backgroundColor": COLORS["primary"],
    "color": "white",
    "border": "none",
    "borderRadius": RADII["sm"],
    "fontSize": TYPOGRAPHY["size_body"],
    "fontWeight": "600",
    "cursor": "pointer",
    "transition": "background-color 0.2s ease",
}

SECTION_HEADING_MARGIN_STYLE = {
    "fontWeight": "600",
    "color": COLORS["text_primary"],
    "marginBottom": SPACING["sm"],
    "fontSize": TYPOGRAPHY["size_body"],
}
