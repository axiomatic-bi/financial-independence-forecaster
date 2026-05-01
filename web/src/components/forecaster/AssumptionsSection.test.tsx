import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import { buildForecastViewModel, defaultInputs } from '../../application/buildForecastViewModel';
import { buildForecasterPresentation } from '../../application/buildForecasterPresentation';
import { AssumptionsSection } from './AssumptionsSection';

describe('AssumptionsSection', () => {
  it('shows mode-specific CGT exempt amount and extraction rate text', () => {
    const inputs = {
      ...defaultInputs,
      householdMode: 'couple' as const,
      extractionRate: 4.2,
    };
    const vm = buildForecastViewModel(inputs);
    const presentation = buildForecasterPresentation(vm);
    const html = renderToStaticMarkup(<AssumptionsSection data={presentation} inputs={inputs} />);

    expect(html).toContain('Household mode');
    expect(html).toContain('Couple');
    expect(html).toMatch(/£6[kK] annual exempt amount/);
    expect(html).toContain('4.2%');
  });

  it('keeps pensionable pay assumption value aligned with provided inputs', () => {
    const inputs = {
      ...defaultInputs,
      householdMode: 'individual' as const,
      pensionableMonthlyPay: 0,
      pensionType: 'percentage' as const,
      pensionContribution: 7.5,
    };
    const vm = buildForecastViewModel(inputs);
    const presentation = buildForecasterPresentation(vm);
    const html = renderToStaticMarkup(<AssumptionsSection data={presentation} inputs={inputs} />);

    expect(vm.raw.pensionable_monthly_pay).toBe(0);
    expect(html).toContain('£0/month');
    expect(html).toContain('7.5% of pensionable pay');
  });
});
