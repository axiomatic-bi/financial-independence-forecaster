import { useCallback, useEffect, useMemo, useState } from 'react';

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
const ONBOARDING_STORAGE_KEY = 'financial-forecaster:onboarding-complete';

interface OnboardingStep {
  key: string;
  targetSelector: string;
  text: string;
  openInputsPanel?: boolean;
}

const onboardingSteps: OnboardingStep[] = [
  {
    key: 'mobile-entry-point',
    targetSelector: '[data-tour-target="open-inputs-trigger"]',
    text: 'Begin by opening the Inputs panel to define your financial variables.',
    openInputsPanel: false,
  },
  {
    key: 'engine-room-income',
    targetSelector: '[data-tour-target="inputs-income"]',
    text: 'Start by entering your Net Monthly Income (Post-Tax/Pension) and core outgoings. This defines your Monthly Surplus for investment.',
    openInputsPanel: true,
  },
  {
    key: 'wealth-stack-assets',
    targetSelector: '[data-tour-target="inputs-current-assets"]',
    text: 'Add your current Individual Savings Account (ISA) and Pension Pot values. This populates your starting wealth for the modelling engine.',
    openInputsPanel: true,
  },
  {
    key: 'insight-loop-chart',
    targetSelector: '[data-tour-target="passive-income-chart"]',
    text: 'Watch the chart update in real-time. The FI Crossover point marks where your Safe Withdrawal Capacity covers your inflation-adjusted expenses.',
    openInputsPanel: false,
  },
];
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
  const [isOnboardingActive, setIsOnboardingActive] = useState(false);
  const [onboardingStepIndex, setOnboardingStepIndex] = useState(0);
  const [spotlightRect, setSpotlightRect] = useState<null | { top: number; left: number; width: number; height: number }>(null);

  const dataColors = useDataColors();
  const currentOnboardingStep = onboardingSteps[onboardingStepIndex] ?? null;

  const completeOnboarding = useCallback(() => {
    setIsOnboardingActive(false);
    setSpotlightRect(null);
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(ONBOARDING_STORAGE_KEY, 'true');
    }
  }, []);

  const refreshSpotlight = useCallback(() => {
    if (!isOnboardingActive || !currentOnboardingStep) {
      return;
    }
    const target = document.querySelector(currentOnboardingStep.targetSelector);
    if (!(target instanceof HTMLElement)) {
      return;
    }
    target.scrollIntoView({ block: 'center', inline: 'nearest', behavior: 'smooth' });
    window.setTimeout(() => {
      const rect = target.getBoundingClientRect();
      const padding = 8;
      setSpotlightRect({
        top: Math.max(0, rect.top - padding),
        left: Math.max(0, rect.left - padding),
        width: Math.max(0, rect.width + padding * 2),
        height: Math.max(0, rect.height + padding * 2),
      });
    }, 140);
  }, [currentOnboardingStep, isOnboardingActive]);

  const goToNextOnboardingStep = useCallback(() => {
    if (onboardingStepIndex >= onboardingSteps.length - 1) {
      completeOnboarding();
      return;
    }
    setOnboardingStepIndex((prev) => prev + 1);
  }, [completeOnboarding, onboardingStepIndex]);

  const goToPreviousOnboardingStep = useCallback(() => {
    setOnboardingStepIndex((prev) => Math.max(0, prev - 1));
  }, []);

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

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }
    const onboardingCompleted = window.localStorage.getItem(ONBOARDING_STORAGE_KEY) === 'true';
    if (onboardingCompleted) {
      return;
    }
    const isMobile = window.matchMedia('(max-width: 960px)').matches;
    setOnboardingStepIndex(isMobile ? 0 : 1);
    setIsOnboardingActive(true);
  }, []);

  useEffect(() => {
    if (!isOnboardingActive || !currentOnboardingStep) {
      return;
    }
    const isMobile = window.matchMedia('(max-width: 960px)').matches;
    if (currentOnboardingStep.openInputsPanel) {
      setIsInputsOpen(true);
    } else if (isMobile) {
      setIsInputsOpen(false);
    }
    refreshSpotlight();

    const handleViewportChange = () => refreshSpotlight();
    window.addEventListener('resize', handleViewportChange);
    window.addEventListener('scroll', handleViewportChange, true);
    return () => {
      window.removeEventListener('resize', handleViewportChange);
      window.removeEventListener('scroll', handleViewportChange, true);
    };
  }, [currentOnboardingStep, isOnboardingActive, refreshSpotlight]);

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
  const isFinalOnboardingStep = onboardingStepIndex === onboardingSteps.length - 1;
  const viewportWidth = typeof window === 'undefined' ? 1280 : window.innerWidth;
  const viewportHeight = typeof window === 'undefined' ? 720 : window.innerHeight;
  const tooltipWidth = Math.min(360, Math.max(260, viewportWidth - 32));
  const tooltipLeft = spotlightRect
    ? Math.min(Math.max(16, spotlightRect.left + spotlightRect.width / 2 - tooltipWidth / 2), Math.max(16, viewportWidth - tooltipWidth - 16))
    : 16;
  const shouldPlaceTooltipAbove = spotlightRect
    ? spotlightRect.top + spotlightRect.height + 240 > viewportHeight && spotlightRect.top > 220
    : false;
  const tooltipTop = spotlightRect ? (shouldPlaceTooltipAbove ? Math.max(16, spotlightRect.top - 170) : spotlightRect.top + spotlightRect.height + 14) : 16;

  return (
    <div className="app">
      <button
        type="button"
        className="panel-toggle"
        data-tour-target="open-inputs-trigger"
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
          onCloseMobilePanel={() => setIsInputsOpen(false)}
        />
        <div className="main-body">
          <section className="content">
            <header className="hero">
              <h1>Financial independence forecaster</h1>
              <p>Model your path to financial independence with scenario-based projections</p>
              <div className="hero-actions">
                <a
                  className="button button-secondary"
                  href="https://github.com/axiomatic-bi/financial-independence-forecaster"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Contribute on GitHub
                </a>
              </div>
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
      {isOnboardingActive && spotlightRect && currentOnboardingStep ? (
        <div className="onboarding-layer" role="dialog" aria-modal="true" aria-label="Onboarding guide">
          <div
            className="onboarding-dim onboarding-dim--top"
            style={{ left: 0, top: 0, width: '100vw', height: `${spotlightRect.top}px` }}
          />
          <div
            className="onboarding-dim onboarding-dim--left"
            style={{ left: 0, top: `${spotlightRect.top}px`, width: `${spotlightRect.left}px`, height: `${spotlightRect.height}px` }}
          />
          <div
            className="onboarding-dim onboarding-dim--right"
            style={{
              left: `${spotlightRect.left + spotlightRect.width}px`,
              top: `${spotlightRect.top}px`,
              width: `${Math.max(0, viewportWidth - spotlightRect.left - spotlightRect.width)}px`,
              height: `${spotlightRect.height}px`,
            }}
          />
          <div
            className="onboarding-dim onboarding-dim--bottom"
            style={{
              left: 0,
              top: `${spotlightRect.top + spotlightRect.height}px`,
              width: '100vw',
              height: `${Math.max(0, viewportHeight - spotlightRect.top - spotlightRect.height)}px`,
            }}
          />
          <div
            className="onboarding-spotlight-ring"
            aria-hidden="true"
            style={{
              left: `${spotlightRect.left}px`,
              top: `${spotlightRect.top}px`,
              width: `${spotlightRect.width}px`,
              height: `${spotlightRect.height}px`,
            }}
          />
          <section
            className="onboarding-tooltip"
            style={{
              width: `${tooltipWidth}px`,
              left: `${tooltipLeft}px`,
              top: `${tooltipTop}px`,
            }}
          >
            <p className="onboarding-tooltip-step">
              Step {onboardingStepIndex} of {onboardingSteps.length - 1}
            </p>
            <p>{currentOnboardingStep.text}</p>
            <div className="onboarding-tooltip-actions">
              <button type="button" className="button button-secondary" onClick={completeOnboarding}>
                Skip
              </button>
              <div className="onboarding-tooltip-progress-actions">
                <button
                  type="button"
                  className="button button-secondary"
                  disabled={onboardingStepIndex === 0}
                  onClick={goToPreviousOnboardingStep}
                >
                  Back
                </button>
                <button type="button" className="button button-primary" onClick={goToNextOnboardingStep}>
                  {isFinalOnboardingStep ? 'Finish' : 'Next'}
                </button>
              </div>
            </div>
          </section>
        </div>
      ) : null}
    </div>
  );
};
