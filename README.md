# Financial Forecaster

Financial forecaster with:

- legacy Python Dash app (reference implementation), and
- Astro + React static web app for GitHub Pages publishing.

## Current Deployment Target

The publishable web app is in `web/` and is designed for GitHub Pages static hosting.

The Python Dash app in `src/financial_forecaster` remains the baseline/oracle for calculation parity during migration.

## Repository Structure

```text
financial_forecaster/
├── src/financial_forecaster/             # Python reference app + domain logic
├── tests/                                # Python tests
├── scripts/generate_forecast_fixtures.py # Python fixture snapshot generator
├── docs/migration/                       # Migration policy and contract docs
├── web/                                  # Astro + React GitHub Pages app
│   ├── src/domain/forecast.ts            # TS port of domain calculations
│   ├── src/application/                  # buildForecastViewModel app layer
│   └── src/fixtures/forecast-fixtures.json
└── .github/workflows/deploy-pages.yml    # Pages CI/CD workflow
```

## Python Reference App (Local)

1. Create and activate a virtual environment:
   ```bash
   python -m venv .venv
   .venv\Scripts\activate
   ```
2. Install dependencies:
   ```bash
   pip install -e ".[dev]"
   ```
3. Run the Dash app:
   ```bash
   python -m financial_forecaster.app
   ```
4. Open `http://127.0.0.1:8050/`.

## Web App (Astro + React) Local

From the `web/` directory:

1. Install dependencies:
   ```bash
   npm install
   ```
2. Run tests:
   ```bash
   npm run test
   ```
3. Run dev server:
   ```bash
   npm run dev
   ```
4. Build static output:
   ```bash
   npm run build
   ```

## Fixture and Parity Workflow

- Generate Python baseline fixtures:
  ```bash
  python scripts/generate_forecast_fixtures.py
  ```
- Fixture output: `web/src/fixtures/forecast-fixtures.json`
- Frontend parity tests are in `web/src/application/buildForecastViewModel.test.ts`.

## Publishing to GitHub Pages

1. Ensure repository Settings -> Pages uses **GitHub Actions** as source.
2. Push to `main`.
3. Workflow `.github/workflows/deploy-pages.yml` will:
   - install dependencies,
   - run frontend tests,
   - build Astro static assets,
   - deploy `web/dist` to GitHub Pages.

## Publish Readiness Checklist

- `python scripts/generate_forecast_fixtures.py` succeeds.
- `cd web && npm run test` passes.
- `cd web && npm run build` succeeds.
- Main KPI cards, asset chart, withdrawal chart, and summary tables render correctly.
- Mobile layout remains usable for input editing and chart viewing.
- Deployed Pages URL loads and recomputes outputs in-browser.

## Migration Policies

- Formatting/semantic policy: `docs/migration/formatting-policy.md`
- Python contract snapshot: `docs/migration/python-contract.md`
- Reduced-scope fallback v1 plan: `docs/migration/fallback-v1.md`
