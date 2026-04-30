# Code Structure and Organization

## Overview

The project now follows a package-first structure under `src/financial_forecaster`, with a clear split between:

- `forecast.py`: pure financial simulation logic
- `components/`: Dash/Plotly presentation layer
- `callbacks.py`: orchestration from input state to forecast results to UI
- `theme.py`: shared visual constants/helpers

Root-level modules are compatibility shims so existing launch commands continue to work.

## Directory Layout

```text
financial_forecaster/
├── app.py                                # compatibility entrypoint
├── callbacks.py                          # compatibility shim
├── dashboard.py                          # compatibility shim
├── forecast.py                           # compatibility shim
├── pyproject.toml                        # project + tool config
├── requirements.txt                      # runtime dependencies
├── assets/
│   └── style.css
├── src/
│   └── financial_forecaster/
│       ├── __init__.py
│       ├── app.py
│       ├── callbacks.py
│       ├── dashboard.py
│       ├── forecast.py
│       ├── theme.py
│       └── components/
│           ├── __init__.py
│           ├── charts.py
│           └── inputs.py
└── tests/
    └── test_forecast.py
```

## Module Responsibilities

- `src/financial_forecaster/forecast.py`
  - `calculate_forecast()`, `simulate_month()`, mortgage and pension helpers.
  - No Dash/Plotly dependencies.
- `src/financial_forecaster/components/inputs.py`
  - Input panel and controls.
- `src/financial_forecaster/components/charts.py`
  - Chart/KPI builders and chart section layout helpers.
- `src/financial_forecaster/callbacks.py`
  - Dash callback wiring and data flow orchestration.
- `src/financial_forecaster/dashboard.py`
  - App initialization and page layout assembly.
- `src/financial_forecaster/theme.py`
  - Shared `COLORS` and `hex_to_rgba()`.

## Data Flow

```text
User Input
  -> callbacks.py (reads input state)
  -> forecast.py (returns raw projection data)
  -> components/charts.py (builds figures + KPI blocks)
  -> dashboard.py (renders updated UI)
```

## Why This Structure

- Scales better as features grow.
- Supports testability by isolating business logic.
- Removes duplicated visual constants across modules.
- Keeps backward compatibility while moving toward a cleaner package design.

