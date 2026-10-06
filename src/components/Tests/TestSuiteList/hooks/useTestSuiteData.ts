import { useMemo } from 'react';
import { useSelector } from 'react-redux';
import { selectActiveTab } from 'store/slices/testExecution/selectors';
import { TestPlanWithSuites, TestSuiteWithCases } from 'typesCustom/tests';
import {
  calculateSelectionTotals,
  getSuiteCheckboxState as getCheckboxState,
  isCaseSelected as checkCaseSelected,
  getGlobalCheckboxState,
} from 'utils/testSelectionHelpers';

export interface TransformedTestCase {
  id: string;
  name: string;
}

export interface TransformedTestSuite {
  id: string;
  name: string;
  total: number;
  cases: TransformedTestCase[];
}

/**
 * Hook that derives and transforms test suite data from the Redux store.
 * Handles plan lookup, suite transformation, selection state calculations,
 * and execution counts.
 */
export default function useTestSuiteData() {
  const activeTab = useSelector(selectActiveTab);

  // Selected plan
  const selectedPlanId = activeTab?.values.filters?.testPlan || '';
  const plans = useMemo(
    () => activeTab?.values.data.testPlans.items || [],
    [activeTab?.values.data.testPlans.items],
  );
  const selectedPlan = useMemo(() => {
    const numericPlanId = Number(selectedPlanId);
    if (!Number.isFinite(numericPlanId)) return undefined;
    return (plans as TestPlanWithSuites[]).find(
      (p) =>
        Number(p.id ?? (p as unknown as { planId?: number }).planId) ===
        numericPlanId,
    );
  }, [plans, selectedPlanId]);

  const headerTitle = selectedPlan?.name || 'Select a Test Plan';
  const expandedSuiteIds = activeTab?.values.data.expandedSuiteIds || [];
  const isLoadingSuites = activeTab?.values.data.testSuites.loading || false;

  // Transform test suites data
  const rawTestSuites = useMemo(
    () => activeTab?.values.data.testSuites.items || [],
    [activeTab?.values.data.testSuites.items],
  );
  const testCasesBySuiteId = useMemo(
    () => activeTab?.values.data.testCasesBySuiteId || {},
    [activeTab?.values.data.testCasesBySuiteId],
  );
  const testSuites: TransformedTestSuite[] = useMemo(
    () =>
      rawTestSuites.map((s: TestSuiteWithCases) => {
        const numericSuiteId = Number(s.id);
        const fetchedCases = testCasesBySuiteId[numericSuiteId]?.items || [];
        const cases =
          fetchedCases.length > 0
            ? fetchedCases.map((c: { id: number; title: string }) => ({
                id: String(c.id),
                name: c.title,
              }))
            : ((s.cases || []) as { id: number; title: string }[]).map((c) => ({
                id: String(c.id),
                name: c.title,
              }));

        return {
          id: String(s.id),
          name: s.name,
          total: cases.length,
          cases,
        };
      }),
    [rawTestSuites, testCasesBySuiteId],
  );

  // Selection rules and derived state
  const selection = activeTab?.values.data.testPlanSelectionRules;
  const isGlobalSelected = selection?.mode === 'ALL';
  const excludeSuites: number[] = useMemo(
    () => (selection?.exclude?.suites as number[] | undefined) ?? [],
    [selection?.exclude?.suites],
  );
  const excludeCases: Record<number, number[]> = useMemo(
    () =>
      (selection?.exclude?.cases as Record<number, number[]> | undefined) ?? {},
    [selection?.exclude?.cases],
  );

  // Calculate totals and global checkbox state
  const totals = useMemo(
    () =>
      calculateSelectionTotals(
        testSuites,
        excludeSuites,
        excludeCases,
        isGlobalSelected,
      ),
    [testSuites, excludeSuites, excludeCases, isGlobalSelected],
  );

  const globalCheckboxState = useMemo(
    () => getGlobalCheckboxState(isGlobalSelected, totals),
    [isGlobalSelected, totals],
  );

  // Execution counts
  const executionCounts = useMemo(() => {
    const testExecution = activeTab?.values.data.testExecution;
    if (!testExecution || !testExecution.testCases) {
      return { passed: 0, failed: 0 };
    }

    const testCases = testExecution.testCases;
    const passed = testCases.filter(
      (tc) =>
        tc.result?.toLowerCase() === 'pass' ||
        tc.result?.toLowerCase() === 'passed',
    ).length;
    const failed = testCases.filter(
      (tc) =>
        tc.result?.toLowerCase() === 'fail' ||
        tc.result?.toLowerCase() === 'failed',
    ).length;

    return { passed, failed };
  }, [activeTab?.values.data.testExecution]);

  // Helper functions for checkbox states
  const getSuiteState = (suiteId: string | number) => {
    const numericSuiteId = Number(suiteId);
    const suite = testSuites.find((s) => String(s.id) === String(suiteId));
    const totalCases = suite?.total || 0;
    return getCheckboxState(
      numericSuiteId,
      selection,
      totalCases,
      excludeSuites,
      excludeCases,
    );
  };

  const isCaseChecked = (suiteId: string | number, caseId: string | number) => {
    return checkCaseSelected(Number(suiteId), Number(caseId), selection);
  };

  const isCaseExcludedFn = (
    suiteId: string | number,
    caseId: string | number,
  ) => {
    const numericSuiteId = Number(suiteId);
    const numericCaseId = Number(caseId);
    return (excludeCases[numericSuiteId] || []).includes(numericCaseId);
  };

  return {
    selectedPlanId,
    headerTitle,
    expandedSuiteIds,
    isLoadingSuites,
    testSuites,
    testCasesBySuiteId,
    selection,
    isGlobalSelected,
    excludeSuites,
    excludeCases,
    globalChecked: globalCheckboxState.checked,
    globalIndeterminate: globalCheckboxState.indeterminate,
    executionCounts,
    getSuiteState,
    isCaseChecked,
    isCaseExcludedFn,
  };
}
