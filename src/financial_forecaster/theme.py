"""Shared theme constants and color helpers."""


COLORS = {
    "background": "#0f172a",
    "surface": "#1e293b",
    "surface_hover": "#334155",
    "primary": "#3b82f6",
    "primary_light": "#60a5fa",
    "success": "#10b981",
    "danger": "#ef4444",
    "text_primary": "#f1f5f9",
    "text_secondary": "#cbd5e1",
    "border": "#475569",
    "warning": "#f59e0b",
}


def hex_to_rgba(hex_color: str, alpha: float = 0.3) -> str:
    """Convert a hex color code to an rgba string."""
    hex_color = hex_color.lstrip("#")
    r, g, b = tuple(int(hex_color[i : i + 2], 16) for i in (0, 2, 4))
    return f"rgba({r}, {g}, {b}, {alpha})"
