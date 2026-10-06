import { useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  setExpandedSuites,
  fetchTestCasesRequest,
  toggleSelectAll,
  toggleSuite,
  toggleCase,
} from 'store/slices/testExecution/testExecutionsSlice';
import { selectActiveTabId } from 'store/slices/testExecution/selectors';
import type { TransformedTestSuite } from './useTestSuiteData';

/**
 * Hook that provides all event handlers for suite list interactions:
 * global select, suite select, case select, and expand/collapse.
 */
export default function useTestSuiteHandlers(
  testSuites: TransformedTestSuite[],
  selectedPlanId: string,
  expandedSuiteIds: string[],
) {
  const dispatch = useDispatch();
  const currentTab = useSelector(selectActiveTabId);

  const handleGlobalSelectChange = useCallback(
    (selected: boolean) => {
      if (!currentTab) return;
      dispatch(toggleSelectAll({ tabId: currentTab, checked: selected }));
    },
    [currentTab, dispatch],
  );

  const handleSuiteSelectChange = useCallback(
    (suiteId: string | number, selected: boolean) => {
      if (!currentTab) return;
      const suite = testSuites.find((s) => String(s.id) === String(suiteId));
      const allCases = (suite?.cases || []).map((c) => Number(c.id));
      dispatch(
        toggleSuite({
          tabId: currentTab,
          suiteId: Number(suiteId),
          checked: selected,
          allCases,
        }),
      );
    },
    [currentTab, dispatch, testSuites],
  );

  const handleCaseSelectionChange = useCallback(
    (suiteId: string | number, caseId: string | number, selected: boolean) => {
      if (!currentTab) return;
      const suite = testSuites.find((s) => String(s.id) === String(suiteId));
      const allCases = (suite?.cases || []).map((c) => Number(c.id));
      dispatch(
        toggleCase({
          tabId: currentTab,
          suiteId: Number(suiteId),
          caseId: Number(caseId),
          checked: selected,
          allCases,
        }),
      );
    },
    [currentTab, dispatch, testSuites],
  );

  const handleToggleExpand = useCallback(
    (suiteId: string) => {
      if (!currentTab) return;
      const isOpen = expandedSuiteIds.includes(suiteId);
      const next = isOpen ? [] : [suiteId];
      dispatch(setExpandedSuites({ tabId: currentTab, expanded: next }));

      if (!isOpen) {
        const planNumeric = Number(selectedPlanId);
        if (Number.isFinite(planNumeric)) {
          dispatch(
            fetchTestCasesRequest({
              tabId: currentTab,
              planId: planNumeric,
              suiteId,
            }),
          );
        }
      }
    },
    [currentTab, dispatch, expandedSuiteIds, selectedPlanId],
  );

  return {
    handleGlobalSelectChange,
    handleSuiteSelectChange,
    handleCaseSelectionChange,
    handleToggleExpand,
  };
}
