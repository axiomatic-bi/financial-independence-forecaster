"""Shared theme constants and color helpers."""


COLORS = {
    "background": "#060a14",
    "surface": "#141f34",
    "surface_hover": "#1a2740",
    "surface_subtle": "#20304e",
    "primary": "#5768ff",
    "primary_light": "#8e75ff",
    "success": "#22c55e",
    "danger": "#ef4444",
    "text_primary": "#f0f4ff",
    "text_secondary": "#c0ccec",
    "border": "#32466d",
    "warning": "#f59e0b",
}

DATA_COLORS = [
    "#7B8DFF",
    "#4FA3FF",
    "#8B6DFF",
    "#33C7B5",
    "#F2A65A",
]

TYPOGRAPHY = {
    "font_family": "Inter, 'Segoe UI', Arial, sans-serif",
    "size_label": "11px",
    "size_section_label": "12px",
    "size_body": "14px",
    "size_value": "16px",
    "size_callout_value": "20px",
    "size_title": "20px",
    "size_heading": "22px",
    "size_hero_title": "42px",
    "tracking_tight": "0.4px",
    "tracking_label": "0.5px",
}

RADII = {
    "sm": "10px",
    "md": "14px",
}

SPACING = {
    "xs": "6px",
    "sm": "8px",
    "md": "12px",
    "lg": "16px",
    "xl": "20px",
    "xxl": "24px",
    "page": "30px",
}


def hex_to_rgba(hex_color: str, alpha: float = 0.3) -> str:
    """Convert a hex color code to an rgba string."""
    hex_color = hex_color.lstrip("#")
    r, g, b = tuple(int(hex_color[i : i + 2], 16) for i in (0, 2, 4))
    return f"rgba({r}, {g}, {b}, {alpha})"
