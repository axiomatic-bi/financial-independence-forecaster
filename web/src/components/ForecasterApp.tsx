import { useEffect, useMemo, useState } from 'react';

import { buildForecastViewModel, defaultInputs } from '../application/buildForecastViewModel';
import { buildForecasterPresentation } from '../application/buildForecasterPresentation';
import { AssetsSection } from './forecaster/AssetsSection';
import { AssumptionsSection } from './forecaster/AssumptionsSection';
import { formatCompactCurrency } from './forecaster/format';
import { InputsPanel } from './forecaster/InputsPanel';
import { KpiCards } from './forecaster/KpiCards';
import { PassiveIncomeSection } from './forecaster/PassiveIncomeSection';
import { SavingsSection } from './forecaster/SavingsSection';
import type { DataColors, ForecasterPresentation } from './forecaster/types';
import type { ForecastInputs } from '../types/forecast';

const INPUTS_STORAGE_KEY = 'financial-forecaster:inputs';
const nonNegativeOrDefault = (value: number, fallback: number): number => {
  if (!Number.isFinite(value)) {
    return fallback;
  }
  return Math.max(0, value);
};

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

const buildPassiveIncomeAdvice = (presentation: ForecasterPresentation): string[] => {
  const advice: string[] = [];
  if (presentation.latestCoverageRatio >= 1) {
    advice.push(
      `You are projected to cover expenses by ${presentation.latestCoverageRatio.toFixed(
        2,
      )}x in ${presentation.latestIncomeSnapshot.year}; preserving this buffer improves resilience to weaker returns.`,
    );
  } else {
    advice.push(
      `Your projection is short of full coverage by ${formatCompactCurrency(
        Math.abs(presentation.latestCoverageGap),
      )} in ${presentation.latestIncomeSnapshot.year}; closing this gap through higher contributions or lower annual spending is the highest FI lever here.`,
    );
  }

  if (!presentation.fiAchievedYear) {
    advice.push('FI is not reached inside the selected horizon, so extending forecast years or raising surplus can materially change the outcome.');
  } else {
    advice.push(`At the current settings, FI is reached in ${presentation.fiAchievedYear}; focus on keeping expenses growth below income growth to bring that date earlier.`);
  }

  return advice;
};

const buildAssetsAdvice = (presentation: ForecasterPresentation): string[] => {
  const advice: string[] = [];
  const leadingShare = presentation.latestAssetTotal > 0 ? presentation.leadingAsset.value / presentation.latestAssetTotal : 0;
  advice.push(
    `${presentation.leadingAsset.label} is your largest projected asset at ${formatCompactCurrency(
      presentation.leadingAsset.value,
    )} (${(leadingShare * 100).toFixed(1)}% of total), so changes affecting this bucket are currently the biggest net-worth driver.`,
  );

  if (presentation.leadingAsset.label.toLowerCase().includes('home')) {
    advice.push('Home equity is valuable but less flexible for funding FI withdrawals, so accelerating liquid investments can improve FI readiness.');
  } else {
    advice.push('Your leading asset is an investment bucket, which supports FI flexibility; keep contributions and risk assumptions aligned with your target timeline.');
  }

  return advice;
};

const buildSavingsAdvice = (inputs: ForecastInputs, presentation: ForecasterPresentation): string[] => {
  const advice: string[] = [];
  const annualSurplus = presentation.latestMonthlySurplus * 12;
  const surplusRate = presentation.latestActiveIncomePostTax > 0 ? annualSurplus / presentation.latestActiveIncomePostTax : 0;
  if (presentation.latestMonthlySurplus <= 0) {
    advice.push('Current projection shows little or no monthly surplus, so FI timing is being held back mainly by cash-flow constraints.');
  } else {
    advice.push(
      `Your projected surplus is ${formatCompactCurrency(
        presentation.latestMonthlySurplus,
      )} per month (about ${(surplusRate * 100).toFixed(1)}% of annual take-home), making surplus retention one of your strongest controllable FI drivers.`,
    );
  }

  advice.push(
    `You currently model ISA contributions at ${formatCompactCurrency(
      inputs.isaAnnualContribution,
    )} yearly; reaching this cap consistently before adding non-ISA funds improves tax efficiency on the path to FI.`,
  );
  return advice;
};

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
      const merged = { ...defaultInputs, ...parsed };
      return {
        ...merged,
        pensionAssets: nonNegativeOrDefault(Number(merged.pensionAssets), defaultInputs.pensionAssets),
      };
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
  const [expandedAssetGroups, setExpandedAssetGroups] = useState<Record<string, boolean>>({
    investments: false,
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
  const passiveIncomeAdvice = buildPassiveIncomeAdvice(presentation);
  const assetsAdvice = buildAssetsAdvice(presentation);
  const savingsAdvice = buildSavingsAdvice(inputs, presentation);

  return (
    <div className="app">
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
        <span>{isInputsOpen ? 'Close inputs' : 'Open inputs'}</span>
      </button>
      <div className="main">
        <InputsPanel
          inputs={inputs}
          elapsedMs={vmResult.elapsedMs}
          isOpen={isInputsOpen}
          onInputsChange={setInputs}
        />
        <div className="main-body">
          <section className="content">
            <header className="hero">
              <h1>Financial independence forecaster</h1>
              <p>Model your path to financial independence with scenario-based projections</p>
            </header>
            <KpiCards vm={presentation.vm} extractionRate={inputs.extractionRate} />
            <PassiveIncomeSection
              data={presentation}
              dataColors={dataColors}
              isaAnnualContribution={inputs.isaAnnualContribution}
              advice={passiveIncomeAdvice}
            />
            <AssetsSection
              data={presentation}
              dataColors={dataColors}
              advice={assetsAdvice}
              expandedAssetGroups={expandedAssetGroups}
              onToggleAssetGroup={(groupKey) =>
                setExpandedAssetGroups((prev) => ({
                  ...prev,
                  [groupKey]: !prev[groupKey],
                }))
              }
            />
            <SavingsSection
              data={presentation}
              dataColors={dataColors}
              advice={savingsAdvice}
              expandedSavingsGroups={expandedSavingsGroups}
              onToggleSavingsGroup={(groupKey) =>
                setExpandedSavingsGroups((prev) => ({
                  ...prev,
                  [groupKey]: !prev[groupKey],
                }))
              }
            />
            <AssumptionsSection data={presentation} inputs={inputs} />
          </section>
        </div>
      </div>
    </div>
  );
};
