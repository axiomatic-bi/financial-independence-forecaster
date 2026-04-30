from ..theme import COLORS, RADII, SPACING, TYPOGRAPHY


INPUT_STYLE = {
    "width": "100%",
    "padding": f"{SPACING['sm']} {SPACING['md']}",
    "border": f"1px solid {COLORS['border']}",
    "borderRadius": RADII["sm"],
    "fontSize": TYPOGRAPHY["size_body"],
    "marginBottom": SPACING["lg"],
    "backgroundColor": COLORS["surface_hover"],
    "color": COLORS["text_primary"],
    "boxSizing": "border-box",
}