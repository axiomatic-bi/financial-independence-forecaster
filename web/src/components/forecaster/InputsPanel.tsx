import type { FocusEvent } from 'react';

import {
  advancedAssumptionsFields,
  currentAssetsFields,
  growthAssumptionsFields,
  incomeFields,
  inputTooltips,
  pensionFields,
  propertyFields,
  sippFields,
} from './constants';
import type { InputsPanelProps } from './types';
import type { ForecastInputs } from '../../types/forecast';

const inputId = (key: keyof ForecastInputs) => `input-${key}`;

const renderInputLabel = (key: keyof ForecastInputs, label: string) => (
  <label htmlFor={inputId(key)} className="label-with-info">
    <span>{label}</span>
    {inputTooltips[key] && (
      <span className="tooltip-wrap">
        <button type="button" className="info-icon" aria-label={`About ${label}`}>
          i
        </button>
        <span className="tooltip-content tooltip-content--center" role="tooltip">
          {inputTooltips[key]}
        </span>
      </span>
    )}
  </label>
);

const NumberInputField = ({
  inputKey,
  label,
  step,
  value,
  onFocus,
  onInputsChange,
}: {
  inputKey: keyof ForecastInputs;
  label: string;
  step?: number;
  value: number;
  onFocus: (event: FocusEvent<HTMLInputElement>) => void;
  onInputsChange: InputsPanelProps['onInputsChange'];
}) => (
  <div className="field">
    {renderInputLabel(inputKey, label)}
    <input
      id={inputId(inputKey)}
      name={inputId(inputKey)}
      type="number"
      step={step ?? 1}
      value={value}
      onFocus={onFocus}
      onChange={(event) =>
        onInputsChange((prev) => ({
          ...prev,
          [inputKey]: Number(event.target.value),
        }))
      }
    />
  </div>
);

export const InputsPanel = ({ inputs, elapsedMs, isOpen, onInputsChange }: InputsPanelProps) => {
  const handleNumberFocus = (event: FocusEvent<HTMLInputElement>) => {
    if (Number(event.target.value) === 0) {
      event.target.select();
    }
  };

  return (
    <aside id="inputs-panel" className={`panel${isOpen ? ' is-open' : ''}`}>
      <h2>Inputs</h2>
      <h3 className="inputs-subtitle">Income</h3>
      {incomeFields.map(({ key, label, step }) => (
        <NumberInputField
          key={key}
          inputKey={key}
          label={label}
          step={step}
          value={inputs[key] as number}
          onFocus={handleNumberFocus}
          onInputsChange={onInputsChange}
        />
      ))}

      <h3 className="inputs-subtitle">Current Assets</h3>
      {currentAssetsFields.map(({ key, label, step }) => (
        <NumberInputField
          key={key}
          inputKey={key}
          label={label}
          step={step}
          value={inputs[key] as number}
          onFocus={handleNumberFocus}
          onInputsChange={onInputsChange}
        />
      ))}

      <h3 className="inputs-subtitle">Growth Assumptions</h3>
      {growthAssumptionsFields.map(({ key, label, step }) => (
        <NumberInputField
          key={key}
          inputKey={key}
          label={label}
          step={step}
          value={inputs[key] as number}
          onFocus={handleNumberFocus}
          onInputsChange={onInputsChange}
        />
      ))}

      <div className="field">
        {renderInputLabel('forecastYears', 'Forecast Period (Years)')}
        <input
          id="input-forecastYears"
          name="input-forecastYears"
          type="range"
          min={1}
          max={40}
          step={1}
          value={inputs.forecastYears}
          onChange={(event) => onInputsChange((prev) => ({ ...prev, forecastYears: Number(event.target.value) }))}
        />
        <div className="range-markers" aria-hidden="true">
          <span className="range-marker">1</span>
          <span className="range-marker">10</span>
          <span className="range-marker">20</span>
          <span className="range-marker">30</span>
          <span className="range-marker">40</span>
        </div>
        <small className="range-value">{inputs.forecastYears} years</small>
      </div>

      <h3 className="inputs-subtitle">Advanced Inputs</h3>

      <details className="advanced-group">
        <summary>Property & Mortgage</summary>
        {propertyFields.map(({ key, label, step }) => (
          <NumberInputField
            key={key}
            inputKey={key}
            label={label}
            step={step}
            value={inputs[key] as number}
            onFocus={handleNumberFocus}
            onInputsChange={onInputsChange}
          />
        ))}
      </details>

      <details className="advanced-group">
        <summary>Pension</summary>
        <div className="field">
          <label htmlFor="input-pensionType" className="label-with-info">
            <span>Contribution Type</span>
          </label>
          <select
            id="input-pensionType"
            name="input-pensionType"
            value={inputs.pensionType}
            onChange={(event) => onInputsChange((prev) => ({ ...prev, pensionType: event.target.value as ForecastInputs['pensionType'] }))}
          >
            <option value="percentage">Percentage of Pensionable Pay</option>
            <option value="fixed">Fixed Amount</option>
          </select>
        </div>
        {pensionFields.map(({ key, label, step }) => (
          <NumberInputField
            key={key}
            inputKey={key}
            label={label}
            step={step}
            value={inputs[key] as number}
            onFocus={handleNumberFocus}
            onInputsChange={onInputsChange}
          />
        ))}
        <div className="field">
          {renderInputLabel('pensionTaxReliefRate', 'Pension Tax Relief')}
          <select
            id="input-pensionTaxReliefRate"
            name="input-pensionTaxReliefRate"
            value={inputs.pensionTaxReliefRate}
            onChange={(event) => onInputsChange((prev) => ({ ...prev, pensionTaxReliefRate: Number(event.target.value) }))}
          >
            <option value={0}>No Relief (0%)</option>
            <option value={20}>Basic Rate (20%)</option>
            <option value={40}>Higher Rate (40%)</option>
            <option value={45}>Additional Rate (45%)</option>
          </select>
        </div>
        {sippFields.map(({ key, label, step }) => (
          <NumberInputField
            key={key}
            inputKey={key}
            label={label}
            step={step}
            value={inputs[key] as number}
            onFocus={handleNumberFocus}
            onInputsChange={onInputsChange}
          />
        ))}
      </details>

      <details className="advanced-group">
        <summary>Forecast Assumptions</summary>
        {advancedAssumptionsFields.map(({ key, label, step }) => (
          <NumberInputField
            key={key}
            inputKey={key}
            label={label}
            step={step}
            value={inputs[key] as number}
            onFocus={handleNumberFocus}
            onInputsChange={onInputsChange}
          />
        ))}
      </details>
      <p className="perf">Recompute latency: {elapsedMs.toFixed(1)}ms</p>
    </aside>
  );
};
