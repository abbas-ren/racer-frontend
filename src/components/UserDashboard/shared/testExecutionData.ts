import dayjs, { type Dayjs } from 'dayjs';
import { TestExecutionForTable, TestStatus } from 'typesCustom/tests';
import type { ExecutionDailySummary } from 'typesCustom/analytics';
import type { TestSuiteCase } from './TestSuiteDrawer';

export type DashboardTableRow = TestExecutionForTable & {
  createdAt: string;
  deviceType: string;
  testCycleId: string;
};

export interface TrendPoint {
  date: string;
  label: string;
  total: number;
  passed: number;
  failed: number;
  durationMinutes: number;
  executions: TrendExecutionPreview[];
}

export interface TrendExecutionPreview {
  id: string;
  deviceName: string;
  testPlanName: string;
  passed: number;
  failed: number;
  durationMinutes: number;
}

export interface DashboardBuildPerformance {
  id: string;
  build: string;
  score: number;
  tests: number;
  avgTime: string;
  tone: 'green' | 'yellow' | 'red';
}

export interface NormalizedExecutionMetrics {
  total: number;
  passed: number;
  failed: number;
  durationSeconds: number;
}

export const normalizeExecutionStatus = (
  status: DashboardTableRow['status'] | string | null | undefined,
): TestStatus => {
  const normalizedStatus = String(status ?? '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '_');

  switch (normalizedStatus) {
    case TestStatus.COMPLETED:
    case 'complete':
      return TestStatus.COMPLETED;
    case TestStatus.FAILED:
    case 'fail':
      return TestStatus.FAILED;
    case TestStatus.CANCELLED:
    case 'canceled':
    case 'stopped':
    case 'stop':
      return TestStatus.CANCELLED;
    case TestStatus.QUEUED:
    case 'queue':
      return TestStatus.QUEUED;
    case TestStatus.NOT_EXECUTED:
      return TestStatus.NOT_EXECUTED;
    case TestStatus.IN_PROGRESS:
    case 'running':
    default:
      return TestStatus.IN_PROGRESS;
  }
};

export const getNormalizedExecutionMetrics = (
  execution: Pick<
    DashboardTableRow,
    'status' | 'total' | 'passed' | 'failed' | 'durationSeconds'
  >,
): NormalizedExecutionMetrics => {
  return {
    total: Math.max(0, execution.total ?? 0),
    passed: Math.max(0, execution.passed ?? 0),
    failed: Math.max(0, execution.failed ?? 0),
    durationSeconds: Math.max(0, execution.durationSeconds ?? 0),
  };
};

export const getDisplayedDeviceName = (row: DashboardTableRow) =>
  row.deviceType || row.deviceName || '-';

export const getExecutionCounts = (row: DashboardTableRow) => {
  const metrics = getNormalizedExecutionMetrics(row);

  return {
    passed: metrics.passed,
    failed: metrics.failed,
    total: metrics.total,
  };
};

export const buildDrawerCasesFromExecution = (
  row: DashboardTableRow,
): TestSuiteCase[] => {
  const counts = getExecutionCounts(row);
  const failedCount = counts.failed;
  const passedCount = counts.passed;
  const displayedCases = passedCount + failedCount;

  return Array.from({ length: displayedCases }, (_, index) => {
    const order = index + 1;
    const isFailed = order > passedCount;
    const status: TestSuiteCase['status'] = isFailed ? 'failed' : 'passed';
    const seconds = 1 + ((order * 13) % 40) / 10;
    const executedAt = dayjs(row.createdAt)
      .subtract(order * 3, 'minute')
      .format('HH:mm:ss');

    return {
      id: `${row.testId}-case-${order}`,
      name: `${row.testPlanName} Case ${order}`,
      device: getDisplayedDeviceName(row),
      duration: `${seconds.toFixed(1)}s`,
      executedAt,
      status,
      issueLabel: status === 'failed' ? 'View Issue' : undefined,
    };
  });
};

export const getExecutionDateBounds = (executions: DashboardTableRow[]) => {
  if (!executions.length) {
    const today = dayjs().startOf('day');
    return { min: today, max: today };
  }

  let min = dayjs(executions[0].createdAt).startOf('day');
  let max = min;

  executions.forEach((execution) => {
    const date = dayjs(execution.createdAt).startOf('day');
    if (date.isBefore(min, 'day')) min = date;
    if (date.isAfter(max, 'day')) max = date;
  });

  return { min, max };
};

export const buildTrendDataFromExecutions = (
  executions: DashboardTableRow[],
  fromDate: Dayjs,
  toDate: Dayjs,
): TrendPoint[] => {
  const aggregateByDate = new Map<
    string,
    {
      total: number;
      passed: number;
      failed: number;
      durationSeconds: number;
      executions: TrendExecutionPreview[];
    }
  >();

  executions.forEach((execution) => {
    const key = dayjs(execution.createdAt).format('YYYY-MM-DD');
    const existing = aggregateByDate.get(key) ?? {
      total: 0,
      passed: 0,
      failed: 0,
      durationSeconds: 0,
      executions: [],
    };
    const metrics = getNormalizedExecutionMetrics(execution);

    existing.total += metrics.total;
    existing.passed += metrics.passed;
    existing.failed += metrics.failed;
    existing.durationSeconds += metrics.durationSeconds;
    existing.executions.push({
      id: execution.testId,
      deviceName: execution.deviceName || '',
      testPlanName: execution.testPlanName,
      passed: metrics.passed,
      failed: metrics.failed,
      durationMinutes: Number((metrics.durationSeconds / 60).toFixed(1)),
    });

    aggregateByDate.set(key, existing);
  });

  const points: TrendPoint[] = [];
  let cursor = fromDate.startOf('day');
  const normalizedTo = toDate.startOf('day');

  while (
    cursor.isBefore(normalizedTo, 'day') ||
    cursor.isSame(normalizedTo, 'day')
  ) {
    const dateKey = cursor.format('YYYY-MM-DD');
    const dailyAggregate = aggregateByDate.get(dateKey) ?? {
      total: 0,
      passed: 0,
      failed: 0,
      durationSeconds: 0,
      executions: [],
    };

    points.push({
      date: dateKey,
      label: cursor.format('MMM DD'),
      total: dailyAggregate.total,
      passed: dailyAggregate.passed,
      failed: dailyAggregate.failed,
      durationMinutes: Number((dailyAggregate.durationSeconds / 60).toFixed(1)),
      executions: dailyAggregate.executions.sort((left, right) => {
        const leftScore = left.passed + left.failed;
        const rightScore = right.passed + right.failed;
        return rightScore - leftScore;
      }),
    });

    cursor = cursor.add(1, 'day');
  }

  return points;
};

/**
 * Build TrendPoint[] from the dedicated execution-status daily summary endpoint.
 * `passed` = completedCount, `failed` = failedCount, duration from startedAt→endedAt.
 */
export const buildTrendDataFromDailySummary = (
  summary: ExecutionDailySummary[],
  fromDate: Dayjs,
  toDate: Dayjs,
): TrendPoint[] => {
  const summaryMap = new Map<string, ExecutionDailySummary>(
    summary.map((entry) => [entry.date, entry]),
  );

  const points: TrendPoint[] = [];
  let cursor = fromDate.startOf('day');
  const normalizedTo = toDate.startOf('day');

  while (
    cursor.isBefore(normalizedTo, 'day') ||
    cursor.isSame(normalizedTo, 'day')
  ) {
    const dateKey = cursor.format('YYYY-MM-DD');
    const entry = summaryMap.get(dateKey);

    points.push({
      date: dateKey,
      label: cursor.format('MMM DD'),
      total: entry?.totalExecutions ?? 0,
      passed: entry?.passedTestCases ?? 0,
      failed: entry?.failedTestCases ?? 0,
      durationMinutes:
        entry && Number.isFinite(entry?.totalDurationSeconds)
          ? Number((entry.totalDurationSeconds / 60).toFixed(1))
          : 0,
      executions: [],
    });

    cursor = cursor.add(1, 'day');
  }

  return points;
};
