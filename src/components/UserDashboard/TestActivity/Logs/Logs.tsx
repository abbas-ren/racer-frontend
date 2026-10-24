import { Stack, Typography } from '@mui/material';
import { useMemo } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from 'store/store';
import CommonLogs from 'components/Tests/CommonLogs';
import styles from './Logs.module.scss';

function mergeLogs(
  httpLogs: string[],
  liveFromTabs: string[] | null,
  liveGlobal: string[] | null,
): string[] {
  const parts = [httpLogs, liveFromTabs ?? [], liveGlobal ?? []];
  const merged: string[] = [];
  const seen = new Set<string>();
  for (const part of parts) {
    for (const line of part) {
      if (!seen.has(line)) {
        seen.add(line);
        merged.push(line);
      }
    }
  }
  return merged;
}

function Logs() {
  const { logs, selectedTestExecution, selectTestExecutionLoading } =
    useSelector((state: RootState) => state.tests);

  const liveFromTabs = useSelector((state: RootState) => {
    const testId = state.tests.selectedTestExecution?.testId;
    if (!testId) {
      return null;
    }
    for (const tabId of state.testExecutions.tabOrder) {
      const exec =
        state.testExecutions.tabsById[tabId]?.values.data.testExecution;
      if (exec?.testId === testId && Array.isArray(exec.logs)) {
        return exec.logs;
      }
    }
    return null;
  });

  const liveGlobal = useSelector((state: RootState) => {
    const testId = state.tests.selectedTestExecution?.testId;
    if (!testId) {
      return null;
    }
    return state.testExecutions.liveLogsByTestId[testId] ?? null;
  });

  const httpLogs = useMemo(() => {
    if (!selectedTestExecution) {
      return [];
    }
    return logs[selectedTestExecution.testId] ?? [];
  }, [logs, selectedTestExecution]);

  const testLogs = useMemo(
    () => mergeLogs(httpLogs, liveFromTabs, liveGlobal),
    [httpLogs, liveFromTabs, liveGlobal],
  );

  const emptyMessage = selectTestExecutionLoading
    ? 'Loading logs…'
    : !selectedTestExecution
      ? 'Select a test execution to view logs'
      : 'No logs available yet';

  return (
    <Stack className={styles.wrap}>
      {testLogs.length === 0 ? (
        <Stack className={styles.empty}>
          <Typography variant="h6" color="text.subtitle">
            {emptyMessage}
          </Typography>
        </Stack>
      ) : (
        <Stack className={styles.logsHost}>
          <CommonLogs logs={testLogs} />
        </Stack>
      )}
    </Stack>
  );
}

export default Logs;
