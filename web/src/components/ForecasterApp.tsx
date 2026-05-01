import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { SetStateAction } from 'react';

import { buildForecastViewModel, defaultInputs } from '../application/buildForecastViewModel';
import { buildForecasterPresentation } from '../application/buildForecasterPresentation';
import { getIsaAnnualContributionForHousehold } from '../domain/forecast';
import { UK_BASELINE_BY_HOUSEHOLD_MODE } from '../domain/ukBaseline';
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
    key: 'main-inputs',
    targetSelector: '[data-tour-target="inputs-main-section"]',
    text: 'Set your main inputs here: household composition, income, expenses, pensionable income, current assets, and core growth assumptions.',
    openInputsPanel: true,
  },
  {
    key: 'insight-loop-kpis',
    targetSelector: '[data-tour-target="kpi-strip"]',
    text: 'As you adjust inputs, your key metrics update instantly. Focus on FI date, years to FI, and income coverage to compare scenarios quickly.',
    openInputsPanel: false,
  },
];
const nonNegativeOrDefault = (value: number, fallback: number): number => {
  if (!Number.isFinite(value)) {
    return fallback;
  }
  return Math.max(0, value);
};

export const normalizeHouseholdMode = (mode: ForecastInputs['householdMode'] | undefined): ForecastInputs['householdMode'] =>
  mode === 'couple' ? 'couple' : 'individual';

export const applyHouseholdDerivedValues = (inputs: ForecastInputs): ForecastInputs => {
  const householdMode = normalizeHouseholdMode(inputs.householdMode);
  return {
    ...inputs,
    householdMode,
    isaAnnualContribution: getIsaAnnualContributionForHousehold(householdMode),
  };
};

export const modeAwareDefaults = (householdMode: ForecastInputs['householdMode']): ForecastInputs => {
  const baseline = UK_BASELINE_BY_HOUSEHOLD_MODE[householdMode];
  return applyHouseholdDerivedValues({
    ...defaultInputs,
    householdMode,
    income: baseline.monthlyIncomeAfterTax,
    expenses: baseline.monthlyExpensesExMortgage,
    pensionableMonthlyPay: baseline.monthlyIncomeGross,
  });
};

export const deriveInitialInputsFromStorage = (storedInputsRaw: string | null): ForecastInputs => {
  if (!storedInputsRaw) {
    return defaultInputs;
  }
  const parsed = JSON.parse(storedInputsRaw) as Partial<ForecastInputs>;
  const merged = { ...defaultInputs, ...parsed };
  return applyHouseholdDerivedValues({
    ...merged,
    householdMode: normalizeHouseholdMode(merged.householdMode),
    pensionAssets: nonNegativeOrDefault(Number(merged.pensionAssets), defaultInputs.pensionAssets),
  });
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
      return deriveInitialInputsFromStorage(window.localStorage.getItem(INPUTS_STORAGE_KEY));
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
  const [onboardingTooltipHeight, setOnboardingTooltipHeight] = useState(220);
  const onboardingTooltipRef = useRef<HTMLElement | null>(null);

  const dataColors = useDataColors();
  const currentOnboardingStep = onboardingSteps[onboardingStepIndex] ?? null;

  const handleInputsChange = useCallback((nextState: SetStateAction<ForecastInputs>) => {
    setInputs((prev) => {
      const next = typeof nextState === 'function' ? nextState(prev) : nextState;
      return applyHouseholdDerivedValues(next);
    });
  }, []);

  const resetInputsToDefaults = useCallback(() => {
    setInputs((prev) => modeAwareDefaults(prev.householdMode));
  }, []);

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

  useEffect(() => {
    if (!isOnboardingActive || !currentOnboardingStep) {
      return;
    }
    const tooltipEl = onboardingTooltipRef.current;
    if (!tooltipEl) {
      return;
    }

    const measure = () => {
      const nextHeight = Math.ceil(tooltipEl.getBoundingClientRect().height);
      if (nextHeight > 0) {
        setOnboardingTooltipHeight((prev) => (Math.abs(prev - nextHeight) > 1 ? nextHeight : prev));
      }
    };

    measure();
    const resizeObserver = new ResizeObserver(measure);
    resizeObserver.observe(tooltipEl);
    window.addEventListener('resize', measure);
    return () => {
      resizeObserver.disconnect();
      window.removeEventListener('resize', measure);
    };
  }, [currentOnboardingStep, isOnboardingActive, onboardingStepIndex]);

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
  const isMobileViewport = viewportWidth <= 960;
  const tooltipVerticalGap = 14;
  const tooltipHorizontalMargin = 16;
  const tooltipSafeTop = isMobileViewport ? 12 : 16;
  const tooltipSafeBottom = isMobileViewport ? 112 : 16;
  const tooltipWidth = Math.min(360, Math.max(260, viewportWidth - 32));
  const tooltipLeft = spotlightRect
    ? Math.min(
        Math.max(tooltipHorizontalMargin, spotlightRect.left + spotlightRect.width / 2 - tooltipWidth / 2),
        Math.max(tooltipHorizontalMargin, viewportWidth - tooltipWidth - tooltipHorizontalMargin),
      )
    : tooltipHorizontalMargin;

  const tooltipPlacement: 'below' | 'above' | 'mobile-bottom' = (() => {
    if (!spotlightRect) {
      return isMobileViewport ? 'mobile-bottom' : 'below';
    }
    const availableBelow = viewportHeight - (spotlightRect.top + spotlightRect.height + tooltipVerticalGap) - tooltipSafeBottom;
    const availableAbove = spotlightRect.top - tooltipVerticalGap - tooltipSafeTop;
    const fitsBelow = availableBelow >= onboardingTooltipHeight;
    const fitsAbove = availableAbove >= onboardingTooltipHeight;
    if (fitsBelow) {
      return 'below';
    }
    if (fitsAbove) {
      return 'above';
    }
    if (isMobileViewport) {
      return 'mobile-bottom';
    }
    return availableBelow >= availableAbove ? 'below' : 'above';
  })();

  const tooltipTop =
    !spotlightRect || tooltipPlacement === 'mobile-bottom'
      ? undefined
      : tooltipPlacement === 'above'
        ? Math.max(tooltipSafeTop, spotlightRect.top - tooltipVerticalGap - onboardingTooltipHeight)
        : Math.min(
            spotlightRect.top + spotlightRect.height + tooltipVerticalGap,
            Math.max(tooltipSafeTop, viewportHeight - onboardingTooltipHeight - tooltipSafeBottom),
          );

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
          onInputsChange={handleInputsChange}
          onCloseMobilePanel={() => setIsInputsOpen(false)}
          onResetInputs={resetInputsToDefaults}
        />
        <div className="main-body">
          <section className="content">
            <header className="hero">
              <div className="hero-inner">
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
            ref={onboardingTooltipRef}
            className="onboarding-tooltip"
            data-placement={tooltipPlacement}
            style={{
              ...(tooltipPlacement === 'mobile-bottom'
                ? {
                    left: `${tooltipHorizontalMargin}px`,
                    right: `${tooltipHorizontalMargin}px`,
                    bottom: 'calc(env(safe-area-inset-bottom, 0px) + 12px)',
                  }
                : {
                    width: `${tooltipWidth}px`,
                    left: `${tooltipLeft}px`,
                    top: `${tooltipTop ?? tooltipSafeTop}px`,
                  }),
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
