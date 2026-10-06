import { Stack, Typography } from '@mui/material';
import { useState, useMemo, useCallback } from 'react';
import styles from './ResultsMonitoring.module.scss';
import ResultProgressBar from '../ResultProgressBar';
import ResultsSubHeader from '../ResultsSubHeader';
import TestCaseResult from '../TestCaseResult';
import CommonLogs from '../CommonLogs';
import type { TabExecution } from 'store/slices/testExecution/types';
import type { TestStatus, TestCaseEntryForLogs } from 'types/tests';
import { useDispatch } from 'react-redux';
import { downloadLogsRequest } from 'store/slices/testExecution/testExecutionsSlice';

type TabType = 'Test Case Result' | 'Device Logs';

interface ResultsMonitoringProps {
  execution?: TabExecution | null;
  currentTabId: string;
}

function ResultsMonitoring({
  execution,
  currentTabId,
}: ResultsMonitoringProps) {
  const dispatch = useDispatch();
  const [selectedTab, setSelectedTab] = useState<TabType>('Test Case Result');

  // Local "clear point" state – only affects what is displayed in the
  // Test Case Result / Device Logs tabs.  Progress bar, suite-list counts,
  // and everything outside this component stay untouched.
  //
  // Logs are append-only in Redux, so an index-based cutoff is safe.
  // Test cases are fully replaced by the API on every update (order may
  // change), so we track cleared IDs instead of an index.
  const [clearLogIndex, setClearLogIndex] = useState(0);
  const [clearedTestCaseIds, setClearedTestCaseIds] = useState<Set<number>>(
    new Set(),
  );

  const testCases = useMemo(
    () => (execution?.testCases as TestCaseEntryForLogs[]) ?? [],
    [execution],
  );

  const logs = useMemo(() => execution?.logs ?? [], [execution]);

  const { totalCases, completedCases, filteredTestCases } = useMemo(() => {
    const total = testCases.length;
    const filtered = testCases.filter((tc) => {
      const r = (tc.result ?? '').toString().toUpperCase();
      return r === 'PASS' || r === 'FAIL';
    });
    const completed = testCases.reduce((acc, tc) => {
      const r = (tc.result ?? '').toString().toUpperCase();
      return acc + (r === 'PASS' || r === 'FAIL' ? 1 : 0);
    }, 0);

    return {
      totalCases: total,
      completedCases: completed,
      filteredTestCases: filtered,
    };
  }, [testCases]);

  // Visible subsets – items arriving after the clear point
  const visibleLogs = useMemo(
    () => logs.slice(clearLogIndex),
    [logs, clearLogIndex],
  );

  const visibleTestCases = useMemo(
    () =>
      filteredTestCases.filter((tc) => !clearedTestCaseIds.has(tc.testCaseId)),
    [filteredTestCases, clearedTestCaseIds],
  );

  // Number of completed test cases hidden by the clear action,
  // so TestCaseResult can continue numbering from the right position.
  const clearedCount = useMemo(
    () =>
      filteredTestCases.filter((tc) => clearedTestCaseIds.has(tc.testCaseId))
        .length,
    [filteredTestCases, clearedTestCaseIds],
  );

  const progress = totalCases
    ? Math.round((completedCases / totalCases) * 100)
    : 0;

  // Clear only hides current items in the two tabs – new items still appear
  const handleClear = useCallback(() => {
    setClearLogIndex(logs.length);
    setClearedTestCaseIds(
      new Set(filteredTestCases.map((tc) => tc.testCaseId)),
    );
  }, [logs, filteredTestCases]);

  const handleLogExport = () => {
    if (execution?.testId) {
      dispatch(
        downloadLogsRequest({
          tabId: currentTabId,
          testId: execution?.testId,
        }),
      );
    }
  };

  return (
    <Stack className={styles.container}>
      <Typography component="p" className={styles.title} variant="label1">
        Results & Monitoring
      </Typography>
      <ResultProgressBar
        progress={progress}
        totalCases={totalCases}
        completedCases={completedCases}
        execution={execution}
      />
      <ResultsSubHeader
        selectedTab={selectedTab}
        onTabChange={setSelectedTab}
        onClear={handleClear}
        onExport={handleLogExport}
        executionStatus={execution?.status as TestStatus | undefined}
      />
      {selectedTab === 'Test Case Result' ? (
        <TestCaseResult
          testCases={visibleTestCases}
          totalCases={totalCases}
          startIndex={clearedCount}
        />
      ) : (
        <CommonLogs logs={visibleLogs} />
      )}
    </Stack>
  );
}

export default ResultsMonitoring;
