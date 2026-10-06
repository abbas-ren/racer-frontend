/**
 * Helper utilities for test suite/case selection state management
 */

import { TestPlanSelectionRules } from 'store/slices/testExecution/types';

export interface SuiteTotals {
  totalCases: number;
  excludedAcrossAll: number;
  allDeselected: boolean;
  someExcluded: boolean;
}

export type CheckboxState = 'checked' | 'unchecked' | 'indeterminate';

/**
 * Calculate excluded count for a specific suite
 */
export function getExcludedCountForSuite(
  suiteId: number,
  excludeSuites: number[],
  excludeCases: Record<number, number[]>,
  totalCases: number,
): number {
  if (excludeSuites.includes(suiteId)) {
    return totalCases;
  }
  return (excludeCases[suiteId] || []).length;
}

/**
 * Calculate totals for all suites (used in global select all state)
 */
export function calculateSelectionTotals(
  testSuites: Array<{ id: string | number; total: number }>,
  excludeSuites: number[],
  excludeCases: Record<number, number[]>,
  isGlobalSelected: boolean,
): SuiteTotals {
  // Count total cases (only from expanded suites)
  const totalCases = testSuites.reduce((acc, s) => acc + (s.total || 0), 0);

  // Count suites that are present in the UI
  const presentSuiteIds = testSuites.map((s) => Number(s.id));

  // Count excluded suites (suite-level exclusion)
  const excludedSuitesCount = presentSuiteIds.filter((id) =>
    excludeSuites.includes(id),
  ).length;

  // Count excluded cases across all suites
  const excludedCasesCount = testSuites.reduce((acc, s) => {
    const sid = Number(s.id);
    const total = s.total || 0;
    const excluded = getExcludedCountForSuite(
      sid,
      excludeSuites,
      excludeCases,
      total,
    );
    return acc + excluded;
  }, 0);

  // In ALL mode:
  // - allDeselected = true ONLY if all present suites are excluded at suite level
  //   (we can't reliably determine if all cases are excluded when some suites aren't expanded)
  // - someExcluded = true if any suite or case is excluded but not all suites
  const allDeselected = isGlobalSelected
    ? excludedSuitesCount >= testSuites.length
    : true;

  const someExcluded =
    isGlobalSelected &&
    (excludedSuitesCount > 0 || excludedCasesCount > 0) &&
    !allDeselected;

  return {
    totalCases,
    excludedAcrossAll: excludedCasesCount,
    allDeselected,
    someExcluded,
  };
}

/**
 * Get global "Select All" checkbox state
 */
export function getGlobalCheckboxState(
  isGlobalSelected: boolean,
  totals: SuiteTotals,
): { checked: boolean; indeterminate: boolean } {
  if (!isGlobalSelected) {
    // PARTIAL mode: check if everything is selected
    return { checked: false, indeterminate: false };
  }

  // ALL mode
  if (totals.allDeselected) {
    // Everything excluded
    return { checked: false, indeterminate: false };
  }

  if (totals.someExcluded) {
    // Some excluded, some selected
    return { checked: true, indeterminate: true };
  }

  // Nothing excluded, everything selected
  return { checked: true, indeterminate: false };
}

/**
 * Get checkbox state for a suite (checked/unchecked/indeterminate)
 */
export function getSuiteCheckboxState(
  suiteId: number,
  selection: TestPlanSelectionRules | undefined,
  totalCasesInSuite: number,
  excludeSuites: number[],
  excludeCases: Record<number, number[]>,
): CheckboxState {
  if (!selection) return 'unchecked';

  const isGlobalMode = selection.mode === 'ALL';

  if (isGlobalMode) {
    // In ALL mode: check exclude lists
    // If entire suite is excluded
    if (excludeSuites.includes(suiteId)) {
      return 'unchecked';
    }

    // Check if some cases are excluded
    const excludedCaseCount = (excludeCases[suiteId] || []).length;
    if (excludedCaseCount > 0) {
      // If all cases are excluded
      if (totalCasesInSuite > 0 && excludedCaseCount >= totalCasesInSuite) {
        return 'unchecked';
      }
      // Some cases excluded
      return 'indeterminate';
    }

    // Nothing excluded, all selected
    return 'checked';
  }

  // In PARTIAL mode: check include lists
  const includeSuites = (selection.include?.suites || []) as number[];
  const includeCases = (selection.include?.cases || {}) as Record<
    number,
    number[]
  >;

  const isIncluded = includeSuites.includes(suiteId);
  const hasIncludedCases = (includeCases[suiteId] || []).length > 0;

  if (isIncluded) return 'checked';
  if (hasIncludedCases) return 'indeterminate';
  return 'unchecked';
}

/**
 * Check if a specific test case is selected
 */
export function isCaseSelected(
  suiteId: number,
  caseId: number,
  selection: TestPlanSelectionRules | undefined,
): boolean {
  if (!selection) return false;

  const isGlobalMode = selection.mode === 'ALL';

  if (isGlobalMode) {
    // In ALL mode: check if case is NOT excluded
    const excludeSuites = (selection.exclude?.suites || []) as number[];
    const excludeCases = (selection.exclude?.cases || {}) as Record<
      number,
      number[]
    >;

    if (excludeSuites.includes(suiteId)) return false;
    return !(excludeCases[suiteId] || []).includes(caseId);
  }

  // In PARTIAL mode: check if case IS included
  const includeSuites = (selection.include?.suites || []) as number[];
  const includeCases = (selection.include?.cases || {}) as Record<
    number,
    number[]
  >;

  if (includeSuites.includes(suiteId)) return true;
  return (includeCases[suiteId] || []).includes(caseId);
}

/**
 * Get selected count for a suite
 */
export function getSuiteSelectedCount(
  suiteId: number,
  totalCases: number,
  selection: TestPlanSelectionRules | undefined,
): { totalCases: number; selectedCount: number } {
  if (!selection) {
    return { totalCases, selectedCount: 0 };
  }

  const isGlobalMode = selection.mode === 'ALL';

  if (isGlobalMode) {
    const excludeSuites = (selection.exclude?.suites || []) as number[];
    const excludeCases = (selection.exclude?.cases || {}) as Record<
      number,
      number[]
    >;

    if (excludeSuites.includes(suiteId)) {
      return { totalCases, selectedCount: 0 };
    }

    const excludedCount = (excludeCases[suiteId] || []).length;
    return { totalCases, selectedCount: totalCases - excludedCount };
  }

  // PARTIAL mode
  const includeSuites = (selection.include?.suites || []) as number[];
  const includeCases = (selection.include?.cases || {}) as Record<
    number,
    number[]
  >;

  if (includeSuites.includes(suiteId)) {
    return { totalCases, selectedCount: totalCases };
  }

  const includedCount = (includeCases[suiteId] || []).length;
  return { totalCases, selectedCount: includedCount };
}

/**
 * Check if any test cases or suites are selected
 * This works on a per-tab basis - the selection parameter comes from a specific tab's state
 *
 * @param selection - The test plan selection rules
 * @param totalSuitesCount - Total number of test suites available (optional, used for ALL mode validation)
 * @returns true if any selection exists, false otherwise
 */
export function hasAnySelection(
  selection: TestPlanSelectionRules | undefined,
  totalSuitesCount?: number,
): boolean {
  if (!selection) return false;

  const isGlobalMode = selection.mode === 'ALL';

  if (isGlobalMode) {
    // In ALL mode, everything is selected by default
    // BUT if all suites are explicitly excluded, then nothing is selected
    const excludeSuites = (selection.exclude?.suites || []) as number[];
    const excludeCases = (selection.exclude?.cases || {}) as Record<
      number,
      number[]
    >;

    // If we know total suites count and all are excluded, no selection
    if (
      totalSuitesCount !== undefined &&
      excludeSuites.length >= totalSuitesCount &&
      totalSuitesCount > 0
    ) {
      return false;
    }

    // If there are no exclusions at all, definitely has selection
    if (excludeSuites.length === 0 && Object.keys(excludeCases).length === 0) {
      return true;
    }

    // Otherwise, assume we have selection (can't determine without full suite list)
    return true;
  }

  // In PARTIAL mode, check if anything is in the include lists
  const includeSuites = (selection.include?.suites || []) as number[];
  const includeCases = (selection.include?.cases || {}) as Record<
    number,
    number[]
  >;
  return includeSuites.length > 0 || Object.keys(includeCases).length > 0;
}
