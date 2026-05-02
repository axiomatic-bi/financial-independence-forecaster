import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import { NumericInput } from './NumericInput';

describe('NumericInput', () => {
  it('renders a text input with inputMode decimal and the formatted value', () => {
    const html = renderToStaticMarkup(
      <NumericInput id="test-id" name="test-name" value={1500} step={1} onChange={() => {}} />
    );
    expect(html).toContain('type="text"');
    expect(html).toContain('inputMode="decimal"');
    expect(html).toContain('value="1500"');
    expect(html).not.toContain('type="number"');
  });

  it('renders zero value as "0" string', () => {
    const html = renderToStaticMarkup(
      <NumericInput id="zero" name="zero" value={0} step={1} onChange={() => {}} />
    );
    expect(html).toContain('value="0"');
  });

  it('renders decimal step values correctly', () => {
    const html = renderToStaticMarkup(
      <NumericInput id="rate" name="rate" value={5.5} step={0.1} onChange={() => {}} />
    );
    expect(html).toContain('value="5.5"');
  });
});
