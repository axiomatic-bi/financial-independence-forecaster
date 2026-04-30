# Reduced-Scope Publication Fallback (v1)

If full feature parity takes too long, publish a reduced but useful v1 first.

## v1 Scope

- Core inputs:
  - income, expenses
  - ISA/non-ISA assets and rates
  - forecast period
  - core pension inputs
- KPI band:
  - 3.9% withdrawal
  - FI date
  - years until FI
  - savings rate
- Charts:
  - asset breakdown over time
  - withdrawal vs expenses

## Deferred to v1.1+

- Full advanced input sections and all edge-case controls
- Optional URL state sharing
- Additional presentation refinements and expanded tables

## Release Decision Rule

Publish reduced v1 when all are true:

- Core parity tests pass against Python fixtures.
- Browser recompute latency is within guardrail for core scenarios.
- GitHub Pages CI/CD is stable.

Then ship iterative follow-up releases to recover full parity.
