import { useCallback, useMemo, useState } from 'react';

type Id = string | number;

type CaseLike = {
  id: Id;
  status?: 'pass' | 'fail' | 'pending' | 'running';
};
type SuiteLike = { id: Id; total: number; cases: CaseLike[] };

export interface UseSuiteListParams<TSuite extends SuiteLike> {
  testSuites: TSuite[];
  globalSelected?: boolean;
  getSuiteCheckboxState?: (
    suiteId: Id,
  ) => 'checked' | 'unchecked' | 'indeterminate';
  isCaseSelected?: (suiteId: Id, caseId: Id) => boolean;
  isCaseExcluded?: (suiteId: Id, caseId: Id) => boolean;
  onSuiteSelectChange?: (suiteId: Id, selected: boolean) => void;
  onCaseSelectionChange?: (suiteId: Id, caseId: Id, selected: boolean) => void;
}

export default function useSuiteList<TSuite extends SuiteLike>({
  testSuites,
  globalSelected,
  getSuiteCheckboxState,
  isCaseSelected,
  isCaseExcluded,
  onSuiteSelectChange,
  onCaseSelectionChange,
}: UseSuiteListParams<TSuite>) {
  const SUITE_PAGE_SIZE = 10;

  const [suiteVisiblePage, setSuiteVisiblePage] = useState(1);
  const [selectedSuites, setSelectedSuites] = useState<Record<string, boolean>>(
    {},
  );
  const [unselectedCases, setUnselectedCases] = useState<
    Record<string, Set<string>>
  >({});

  const totalSuites = testSuites.length;
  const maxSuitePage = Math.max(1, Math.ceil(totalSuites / SUITE_PAGE_SIZE));
  const visibleSuites = useMemo(
    () => testSuites.slice(0, SUITE_PAGE_SIZE * suiteVisiblePage),
    [testSuites, suiteVisiblePage],
  );

  const getSuiteState = useCallback(
    (suiteId: Id): 'checked' | 'unchecked' | 'indeterminate' => {
      if (getSuiteCheckboxState) return getSuiteCheckboxState(suiteId);
      const key = String(suiteId);
      return selectedSuites[key] ? 'checked' : 'unchecked';
    },
    [getSuiteCheckboxState, selectedSuites],
  );

  const isCaseChecked = useCallback(
    (suiteId: Id, caseId: Id): boolean => {
      const suiteState = getSuiteState(suiteId);
      const sKey = String(suiteId);
      const cKey = String(caseId);
      if (globalSelected) {
        if (suiteState === 'unchecked') return false;
        if (isCaseExcluded) return !isCaseExcluded(suiteId, caseId);
        const isUnselected = unselectedCases[sKey]?.has(cKey);
        return !isUnselected;
      }
      if (suiteState === 'checked') {
        const isUnselected = unselectedCases[sKey]?.has(cKey);
        return !isUnselected;
      }
      return isCaseSelected ? !!isCaseSelected(suiteId, caseId) : false;
    },
    [
      getSuiteState,
      globalSelected,
      unselectedCases,
      isCaseSelected,
      isCaseExcluded,
    ],
  );

  const handleCaseChange = useCallback(
    (suiteId: Id, caseId: string | number | undefined, checked: boolean) => {
      if (!caseId) return;
      const suiteState = getSuiteState(suiteId);
      const sKey = String(suiteId);
      const cKey = String(caseId);
      const isAll = !!globalSelected || suiteState === 'checked';
      if (isAll) {
        setUnselectedCases((prev) => {
          const set = new Set(prev[sKey] || []);
          if (!checked) {
            set.add(cKey);
          } else {
            set.delete(cKey);
          }
          return { ...prev, [sKey]: set };
        });
      }
      onCaseSelectionChange?.(suiteId, caseId, checked);
    },
    [getSuiteState, globalSelected, onCaseSelectionChange],
  );

  const handleSuiteChange = useCallback(
    (suiteId: Id, _caseId: string | number | undefined, checked: boolean) => {
      const key = String(suiteId);
      setSelectedSuites((prev) => ({ ...prev, [key]: checked }));
      onSuiteSelectChange?.(suiteId, checked);
    },
    [onSuiteSelectChange],
  );

  const handleSuitesScroll = useCallback(
    (el: HTMLElement) => {
      const { scrollTop, clientHeight, scrollHeight } = el;
      if (scrollTop + clientHeight >= scrollHeight - 20) {
        setSuiteVisiblePage((p) => Math.min(maxSuitePage, p + 1));
      }
    },
    [maxSuitePage],
  );

  const getSuiteSelectedCount = useCallback(
    (suite: TSuite): { totalCases: number; selectedCount: number } => {
      const suiteState = getSuiteState(suite.id);
      const sKey = String(suite.id);
      const totalCases = suite.total ?? 0;
      const executedCount = (suite.cases || []).filter(
        (c) => c.status === 'pass' || c.status === 'fail',
      ).length;

      if (globalSelected) {
        if (suiteState === 'unchecked') return { totalCases, selectedCount: 0 };
        let excludedCount = 0;
        if (isCaseExcluded) {
          excludedCount = (suite.cases || []).reduce(
            (acc, c) => acc + (isCaseExcluded(suite.id, c.id) ? 1 : 0),
            0,
          );
        } else {
          excludedCount = unselectedCases[sKey]?.size || 0;
        }
        return {
          totalCases,
          selectedCount: Math.max(
            0,
            totalCases - executedCount - excludedCount,
          ),
        };
      }

      if (suiteState === 'checked') {
        const unselectedCount = unselectedCases[sKey]?.size || 0;
        return {
          totalCases,
          selectedCount: Math.max(
            0,
            totalCases - executedCount - unselectedCount,
          ),
        };
      }

      const selectedCount = isCaseSelected
        ? (suite.cases || []).reduce(
            (acc, c) => acc + (isCaseSelected(suite.id, c.id) ? 1 : 0),
            0,
          )
        : 0;
      return { totalCases, selectedCount };
    },
    [
      getSuiteState,
      globalSelected,
      unselectedCases,
      isCaseSelected,
      isCaseExcluded,
    ],
  );

  return {
    suiteVisiblePage,
    setSuiteVisiblePage,
    selectedSuites,
    visibleSuites,
    getSuiteState,
    isCaseChecked,
    handleCaseChange,
    handleSuiteChange,
    handleSuitesScroll,
    getSuiteSelectedCount,
  };
}
