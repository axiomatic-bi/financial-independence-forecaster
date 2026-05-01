import { useEffect, useMemo, useState } from 'react';

import { buildForecastViewModel, defaultInputs } from '../application/buildForecastViewModel';
import { buildForecasterPresentation } from '../application/buildForecasterPresentation';
import { AssetsSection } from './forecaster/AssetsSection';
import { InputsPanel } from './forecaster/InputsPanel';
import { KpiCards } from './forecaster/KpiCards';
import { PassiveIncomeSection } from './forecaster/PassiveIncomeSection';
import { SavingsSection } from './forecaster/SavingsSection';
import type { DataColors } from './forecaster/types';
import type { ForecastInputs } from '../types/forecast';

const INPUTS_STORAGE_KEY = 'financial-forecaster:inputs';

const themeDataColor = (token: string, fallback: string): string => {
  if (typeof window === 'undefined') {
    return fallback;
  }
  const value = getComputedStyle(document.documentElement).getPropertyValue(token).trim();
  return value || fallback;
};

const useDataColors = (): DataColors =>
  useMemo(
    () => ({
      isa: themeDataColor('--data-color-1', '#5B8CFF'),
      nonIsa: themeDataColor('--data-color-2', '#8E75FF'),
      pension: themeDataColor('--data-color-3', '#6E5BFF'),
      homeEquity: themeDataColor('--data-color-4', '#C7B8FF'),
      withdrawal: themeDataColor('--data-color-1', '#5B8CFF'),
      expenses: themeDataColor('--data-color-2', '#8E75FF'),
      livingExpenses: themeDataColor('--data-color-2', '#8E75FF'),
      mortgage: themeDataColor('--data-color-3', '#6E5BFF'),
      surplusIsa: themeDataColor('--data-color-1', '#5B8CFF'),
      surplusNonIsa: themeDataColor('--data-color-2', '#8E75FF'),
      monthlySurplus: themeDataColor('--data-color-1', '#5B8CFF'),
      sippContribution: themeDataColor('--data-color-4', '#C7B8FF'),
      workplacePensionContribution: themeDataColor('--data-color-3', '#6E5BFF'),
      monthlyPensionContribution: themeDataColor('--data-color-4', '#C7B8FF'),
      monthlyInvestmentGains: themeDataColor('--data-color-5', '#88A4FF'),
    }),
    [],
  );

export const ForecasterApp = () => {
  const [inputs, setInputs] = useState<ForecastInputs>(() => {
    if (typeof window === 'undefined') {
      return defaultInputs;
    }
    try {
      const raw = window.localStorage.getItem(INPUTS_STORAGE_KEY);
      if (!raw) {
        return defaultInputs;
      }
      const parsed = JSON.parse(raw) as Partial<ForecastInputs>;
      return { ...defaultInputs, ...parsed };
    } catch {
      return defaultInputs;
    }
  });
  const [isInputsOpen, setIsInputsOpen] = useState(false);
  const [expandedSavingsGroups, setExpandedSavingsGroups] = useState<Record<string, boolean>>({
    income: false,
    pension: false,
    surplus: false,
    gains: false,
  });

  const dataColors = useDataColors();

  const vmResult = useMemo(() => {
    try {
      const start = performance.now();
      const computed = buildForecastViewModel(inputs);
      const elapsed = performance.now() - start;
      return { vm: computed, elapsedMs: elapsed, error: null as string | null };
    } catch (error: unknown) {
      const message = error instanceof Error ? `${error.message}\n${error.stack ?? ''}` : 'Unknown forecast rendering error';
      return { vm: null, elapsedMs: 0, error: message };
    }
  }, [inputs]);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }
    window.localStorage.setItem(INPUTS_STORAGE_KEY, JSON.stringify(inputs));
  }, [inputs]);

  if (vmResult.error || !vmResult.vm) {
    return (
      <div className="app-error">
        <h1>App failed to render</h1>
        <pre>{vmResult.error ?? 'Unknown error'}</pre>
      </div>
    );
  }

  const presentation = buildForecasterPresentation(vmResult.vm);

  return (
    <div className="app">
      <header className="hero">
        <h1>Financial Independence Forecaster</h1>
        <p>Model your path to financial independence with scenario-based projections</p>
      </header>
      <button
        type="button"
        className="panel-toggle"
        aria-expanded={isInputsOpen}
        aria-controls="inputs-panel"
        onClick={() => setIsInputsOpen((prev) => !prev)}
      >
        <span className="burger-icon" aria-hidden="true">
          <span />
          <span />
          <span />
        </span>
        <span>{isInputsOpen ? 'Close Inputs' : 'Open Inputs'}</span>
      </button>
      <div className="main">
        <InputsPanel
          inputs={inputs}
          elapsedMs={vmResult.elapsedMs}
          isOpen={isInputsOpen}
          onInputsChange={setInputs}
        />
        <section className="content">
          <KpiCards vm={presentation.vm} extractionRate={inputs.extractionRate} />
          <PassiveIncomeSection
            data={presentation}
            dataColors={dataColors}
            isaAnnualContribution={inputs.isaAnnualContribution}
          />
          <AssetsSection data={presentation} dataColors={dataColors} />
          <SavingsSection
            data={presentation}
            dataColors={dataColors}
            expandedSavingsGroups={expandedSavingsGroups}
            onToggleSavingsGroup={(groupKey) =>
              setExpandedSavingsGroups((prev) => ({
                ...prev,
                [groupKey]: !prev[groupKey],
              }))
            }
          />
        </section>
      </div>
    </div>
  );
};
