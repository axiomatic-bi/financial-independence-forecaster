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
import { NumericInput } from './NumericInput';
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
  onInputsChange,
}: {
  inputKey: keyof ForecastInputs;
  label: string;
  step?: number;
  value: number;
  onInputsChange: InputsPanelProps['onInputsChange'];
}) => (
  <div className="field">
    {renderInputLabel(inputKey, label)}
    <NumericInput
      id={inputId(inputKey)}
      name={inputId(inputKey)}
      step={step ?? 1}
      value={value}
      onChange={(val) =>
        onInputsChange((prev) => ({
          ...prev,
          [inputKey]: val,
        }))
      }
    />
  </div>
);

export const InputsPanel = ({ inputs, elapsedMs, isOpen, onInputsChange, onCloseMobilePanel, onResetInputs }: InputsPanelProps) => {
  return (
    <aside id="inputs-panel" className={`panel${isOpen ? ' is-open' : ''}`}>
      <section className="tour-input-section" data-tour-target="inputs-main-section">
        <h2>Inputs</h2>
        <div className="field field--top-control">
          {renderInputLabel('householdMode', 'Household composition')}
          <div className="mode-toggle" role="radiogroup" aria-label="Household composition">
            <label className={`mode-toggle-option${inputs.householdMode === 'individual' ? ' is-selected' : ''}`}>
              <input
                type="radio"
                name="input-householdMode"
                value="individual"
                checked={inputs.householdMode === 'individual'}
                onChange={(event) =>
                  onInputsChange((prev) => ({
                    ...prev,
                    householdMode: event.target.value as ForecastInputs['householdMode'],
                  }))
                }
              />
              <span>Individual</span>
            </label>
            <label className={`mode-toggle-option${inputs.householdMode === 'couple' ? ' is-selected' : ''}`}>
              <input
                type="radio"
                name="input-householdMode"
                value="couple"
                checked={inputs.householdMode === 'couple'}
                onChange={(event) =>
                  onInputsChange((prev) => ({
                    ...prev,
                    householdMode: event.target.value as ForecastInputs['householdMode'],
                  }))
                }
              />
              <span>Couple</span>
            </label>
          </div>
        </div>
        <section className="tour-input-section" data-tour-target="inputs-income-section">
          <h3 className="inputs-subtitle">Income</h3>
          {incomeFields.map(({ key, label, step }) => (
            <NumberInputField
              key={key}
              inputKey={key}
              label={label}
              step={step}
              value={inputs[key] as number}
              onInputsChange={onInputsChange}
            />
          ))}
        </section>
      </section>

      <section className="tour-input-section" data-tour-target="inputs-current-assets-section">
        <h3 className="inputs-subtitle">Current assets</h3>
        {currentAssetsFields.map(({ key, label, step }) => (
          <NumberInputField
            key={key}
            inputKey={key}
            label={label}
            step={step}
            value={inputs[key] as number}
            onInputsChange={onInputsChange}
          />
        ))}
      </section>

      <h3 className="inputs-subtitle">Growth assumptions</h3>
      {growthAssumptionsFields.map(({ key, label, step }) => (
        <NumberInputField
          key={key}
          inputKey={key}
          label={label}
          step={step}
          value={inputs[key] as number}
          onInputsChange={onInputsChange}
        />
      ))}

      <div className="field">
        {renderInputLabel('forecastYears', 'Forecast period (years)')}
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

      <section className="tour-input-section" data-tour-target="inputs-advanced-section">
        <h3 className="inputs-subtitle">Advanced inputs</h3>

        <details className="advanced-group">
          <summary>Property & mortgage</summary>
          {propertyFields.map(({ key, label, step }) => (
            <NumberInputField
              key={key}
              inputKey={key}
              label={label}
              step={step}
              value={inputs[key] as number}
              onInputsChange={onInputsChange}
            />
          ))}
        </details>

        <details className="advanced-group">
          <summary>Pension</summary>
          <div className="field">
            <label htmlFor="input-pensionType" className="label-with-info">
              <span>Contribution type</span>
            </label>
            <select
              id="input-pensionType"
              name="input-pensionType"
              value={inputs.pensionType}
              onChange={(event) => onInputsChange((prev) => ({ ...prev, pensionType: event.target.value as ForecastInputs['pensionType'] }))}
            >
              <option value="percentage">Percentage of pensionable pay</option>
              <option value="fixed">Fixed amount</option>
            </select>
          </div>
          {pensionFields.map(({ key, label, step }) => (
            <NumberInputField
              key={key}
              inputKey={key}
              label={label}
              step={step}
              value={inputs[key] as number}
              onInputsChange={onInputsChange}
            />
          ))}
          <div className="field">
            {renderInputLabel('pensionTaxReliefRate', 'Pension tax relief')}
            <select
              id="input-pensionTaxReliefRate"
              name="input-pensionTaxReliefRate"
              value={inputs.pensionTaxReliefRate}
              onChange={(event) => onInputsChange((prev) => ({ ...prev, pensionTaxReliefRate: Number(event.target.value) }))}
            >
              <option value={0}>No relief (0%)</option>
              <option value={20}>Basic rate (20%)</option>
              <option value={40}>Higher rate (40%)</option>
              <option value={45}>Additional rate (45%)</option>
            </select>
          </div>
          {sippFields.map(({ key, label, step }) => (
            <NumberInputField
              key={key}
              inputKey={key}
              label={label}
              step={step}
              value={inputs[key] as number}
              onInputsChange={onInputsChange}
            />
          ))}
        </details>

        <details className="advanced-group">
          <summary>Forecast assumptions</summary>
          {advancedAssumptionsFields.map(({ key, label, step }) => (
            <NumberInputField
              key={key}
              inputKey={key}
              label={label}
              step={step}
              value={inputs[key] as number}
              onInputsChange={onInputsChange}
            />
          ))}
        </details>
      </section>
      <button type="button" className="button button-secondary" onClick={onResetInputs}>
        Reset to defaults
      </button>
      <p className="perf">Recompute latency: {elapsedMs.toFixed(1)}ms</p>
      <div className="mobile-panel-close-wrap">
        <button type="button" className="button button-primary mobile-panel-close-button" onClick={onCloseMobilePanel}>
          Apply changes
        </button>
      </div>
    </aside>
  );
};
