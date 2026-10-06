import { Box } from '@mui/material';
import { useEffect } from 'react';
import styles from './TestSuiteList.module.scss';
import useSuiteList from '../../../hooks/useSuiteList';
import { TestStatus } from 'typesCustom/tests';
import { useTestSuiteData, useTestSuiteHandlers } from './hooks';
import SuiteListHeader from './SuiteListHeader';
import SelectAllBar from './SelectAllBar';
import SuiteItem from './SuiteItem';
import LoadingSkeleton from './LoadingSkeleton';

interface TestSuiteListProps {
  execution?: { testId: string; status: TestStatus };
  isSubmittingExecution?: boolean;
}

function TestSuiteList({
  execution,
  isSubmittingExecution = false,
}: TestSuiteListProps) {
  const {
    selectedPlanId,
    headerTitle,
    expandedSuiteIds,
    isLoadingSuites,
    testSuites,
    testCasesBySuiteId,
    isGlobalSelected,
    globalChecked,
    globalIndeterminate,
    executionCounts,
    getSuiteState,
    isCaseChecked,
    isCaseExcludedFn,
  } = useTestSuiteData();

  const {
    handleGlobalSelectChange,
    handleSuiteSelectChange,
    handleCaseSelectionChange,
    handleToggleExpand,
  } = useTestSuiteHandlers(testSuites, selectedPlanId, expandedSuiteIds);

  // Lock selection during IN_PROGRESS, QUEUED, or NOT_EXECUTED.
  // Also lock immediately when submitting to prevent race conditions.
  // Allow changes once execution reaches completed, cancelled, or failed.
  const isLocked =
    isSubmittingExecution ||
    (!!execution &&
      (execution.status === TestStatus.IN_PROGRESS ||
        execution.status === TestStatus.QUEUED ||
        execution.status === TestStatus.NOT_EXECUTED));

  // Hook for suite list pagination
  const suiteList = useSuiteList({
    testSuites,
    globalSelected: isGlobalSelected,
    getSuiteCheckboxState: getSuiteState,
    isCaseSelected: isCaseChecked,
    isCaseExcluded: isCaseExcludedFn,
    onSuiteSelectChange: handleSuiteSelectChange,
    onCaseSelectionChange: handleCaseSelectionChange,
  });

  // Reset pagination when test suites change
  useEffect(() => {
    suiteList.setSuiteVisiblePage(1);
  }, [suiteList, testSuites]);

  return (
    <Box className={styles.container}>
      <SuiteListHeader
        headerTitle={headerTitle}
        suiteCount={testSuites.length}
        execution={execution}
        executionCounts={executionCounts}
      />

      {suiteList.visibleSuites.length > 0 && (
        <SelectAllBar
          checked={globalChecked}
          indeterminate={globalIndeterminate}
          disabled={isLocked}
          onChange={handleGlobalSelectChange}
        />
      )}

      <Box
        className={styles.suitesScrollable}
        onScroll={(e) => suiteList.handleSuitesScroll(e.currentTarget)}
      >
        {isLoadingSuites ? (
          <LoadingSkeleton />
        ) : (
          suiteList.visibleSuites.map((suite) => {
            const expanded = expandedSuiteIds.includes(suite.id);
            const counts = expanded
              ? suiteList.getSuiteSelectedCount(suite)
              : null;

            return (
              <SuiteItem
                key={suite.id}
                suite={suite}
                expanded={expanded}
                checkboxState={suiteList.getSuiteState(suite.id)}
                counts={counts}
                isLoadingCases={
                  testCasesBySuiteId[Number(suite.id)]?.loading || false
                }
                disabled={isLocked}
                onToggleExpand={handleToggleExpand}
                onSuiteSelectChange={handleSuiteSelectChange}
                isCaseChecked={suiteList.isCaseChecked}
                onCaseChange={suiteList.handleCaseChange}
              />
            );
          })
        )}
      </Box>
    </Box>
  );
}

export default TestSuiteList;
