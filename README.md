# Financial Forecaster Dashboard

An interactive Dash application for forecasting personal wealth using income, expenses, investments, pension contributions, and property equity assumptions.

## Features

- Monthly forecasting for ISA, non-ISA, pension, and home equity.
- Interactive charts for wealth, savings, withdrawal sustainability, and asset mix.
- Configurable assumptions: inflation, wage growth, pension settings, and mortgage.
- Structured Python package layout for maintainability and testing.

## Project Structure

```text
financial_forecaster/
├── app.py                                # Compatibility entrypoint
├── pyproject.toml                        # Project and tooling config
├── requirements.txt                      # Runtime dependencies
├── assets/
│   └── style.css
├── src/
│   └── financial_forecaster/
│       ├── app.py                        # Package entrypoint
│       ├── dashboard.py                  # Dash app and layout
│       ├── callbacks.py                  # Dash callback wiring
│       ├── forecast.py                   # Pure financial calculations
│       ├── theme.py                      # Shared colors and helpers
│       └── components/
│           ├── charts.py
│           └── inputs.py
└── tests/
    └── test_forecast.py                  # Forecast engine tests
```

## Setup

1. Create and activate a virtual environment:
   ```bash
   python -m venv .venv
   .venv\Scripts\activate
   ```
2. Install dependencies:
   ```bash
   pip install -e ".[dev]"
   ```
3. Run the app:
   ```bash
   python app.py
   ```
4. Open [http://127.0.0.1:8050/](http://127.0.0.1:8050/).

## Development

- Run tests:
  ```bash
  pytest
  ```
- Optional linting:
  ```bash
  ruff check .
  ```

## Notes

- Root-level modules are kept as lightweight compatibility shims while the main code lives under `src/financial_forecaster`.
- Core simulation logic in `forecast.py` intentionally stays UI-independent for easier testing and reuse.
