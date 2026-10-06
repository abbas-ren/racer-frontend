import { Box, Stack, Theme, Typography, useTheme } from '@mui/material';
import { useMemo, useState } from 'react';
import dayjs from 'dayjs';
import type { IconName } from 'lucide-react/dynamic';
import { TestStatus } from 'typesCustom/tests';
import type { TestExecutionActivity } from 'typesCustom/analytics';
import CustomIcon from 'components/common/CustomIcon/CustomIcon';
import TestSuiteDrawer from 'components/UserDashboard/shared/TestSuiteDrawer';
import type { DashboardTableRow } from '../../shared/testExecutionData';
import {
  downloadUserDashboardExecutionLogRequest,
  fetchUserDashboardTestCasesByExecutionIdRequest,
} from 'store/slices/userDashboard/userDashboardSlice';
import { getExecutionCounts } from '../../shared/testExecutionData';
import {
  selectUserDashboardTestCasesByExecutionId,
  selectUserDashboardTestCasesLoadingByExecutionId,
} from 'store/selectors/userDashboardSelectors';
import type { RootState } from 'store/store';
import { useDispatch, useSelector } from 'react-redux';
import styles from './ActivityEventsCard.module.scss';

type ActivityStatus = 'running' | 'completed' | 'failed' | 'queued';

interface ActivityItem {
  id: string;
  deviceType: string;
  testPlanName: string;
  statusLabel: string;
  status: ActivityStatus;
  buildVersion: string;
  tests: number;
  durationLabel: string;
  timeAgo: string;
  row: DashboardTableRow | null;
}

interface ActivityEventsCardProps {
  activities: TestExecutionActivity[];
  executions: DashboardTableRow[];
}

const normalizeExecutionStatus = (status: string | null | undefined) =>
  String(status ?? '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '_');

const toSentenceCaseStatus = (status: string | null | undefined) => {
  const normalized = normalizeExecutionStatus(status);

  return normalized
    .replace(/[_-]+/g, ' ')
    .split(' ')
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
};

const formatTimeAgo = (isoDate: string) => {
  const now = dayjs();
  const createdAt = dayjs(isoDate);
  const secondsDiff = Math.max(0, now.diff(createdAt, 'second'));

  if (secondsDiff < 60) return `${secondsDiff} sec ago`;

  const minutesDiff = Math.max(0, now.diff(createdAt, 'minute'));
  if (minutesDiff < 60) return `${minutesDiff} min ago`;

  const hoursDiff = now.diff(createdAt, 'hour');
  if (hoursDiff < 24) return `${hoursDiff} hr ago`;

  const daysDiff = now.diff(createdAt, 'day');
  return `${daysDiff} day${daysDiff === 1 ? '' : 's'} ago`;
};

const formatDurationFromRange = (startIso: string, endIso?: string | null) => {
  const start = dayjs(startIso);
  const end = endIso ? dayjs(endIso) : dayjs();
  const totalSeconds = Math.max(0, end.diff(start, 'second'));

  if (totalSeconds < 60) return `${totalSeconds} sec`;
  if (totalSeconds < 3600) return `${Math.floor(totalSeconds / 60)} min`;

  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  return `${hours}:${String(minutes).padStart(2, '0')}`;
};

const getEffectiveActivityStatus = (
  status: DashboardTableRow['status'] | string | null | undefined,
): ActivityStatus => {
  const rawStatus = String(status ?? '').toLowerCase();
  if (rawStatus === 'waiting') return 'queued';

  const normalizedStatus = normalizeExecutionStatus(status);

  switch (normalizedStatus) {
    case TestStatus.IN_PROGRESS:
      return 'running';
    case TestStatus.QUEUED:
      return 'queued';
    case TestStatus.FAILED:
    case TestStatus.CANCELLED:
      return 'failed';
    case TestStatus.COMPLETED:
    default:
      return 'completed';
  }
};

const getActivityMeta = (status: ActivityStatus, theme: Theme) => {
  const withIcon = (
    label: string,
    iconName: IconName,
    iconColor: string,
    backgroundColor: string,
  ) => ({ label, iconName, iconColor, backgroundColor });

  switch (status) {
    case 'completed':
      return withIcon(
        'Test Suite Completed',
        'circle-check',
        '#00c951',
        '#00c9511a',
      );
    case 'failed':
      return withIcon('Test Suite Failed', 'circle-x', '#fb2c36', '#fb2c361a');
    case 'queued':
      return withIcon('Test Suite Queued', 'clock', '#f0b100', '#f0b1001a');
    default:
      return withIcon(
        'Test Suite Running',
        'activity',
        theme.palette.primary[300] ?? '',
        theme.palette.primary.lite ?? '',
      );
  }
};

function ActivityEventsCard({
  activities,
  executions,
}: ActivityEventsCardProps) {
  const theme = useTheme();
  const dispatch = useDispatch();
  const [selectedActivityId, setSelectedActivityId] = useState<string | null>(
    null,
  );

  const activityData = useMemo<ActivityItem[]>(
    () =>
      [...activities]
        .sort(
          (left, right) =>
            dayjs(right.createdAt).valueOf() - dayjs(left.createdAt).valueOf(),
        )
        .slice(0, 3)
        .map((activity) => {
          const matchedExecution =
            executions.find(
              (execution) => execution.testId === activity.testId,
            ) || null;

          const startedAt = activity.startedAt
            ? dayjs(activity.startedAt).toISOString()
            : dayjs(activity.createdAt).toISOString();
          const endedAt = activity.endedAt
            ? dayjs(activity.endedAt).toISOString()
            : null;

          return {
            id: activity.testId,
            deviceType: activity.deviceType,
            testPlanName: activity.testPlanName,
            statusLabel: toSentenceCaseStatus(activity.status),
            status: getEffectiveActivityStatus(activity.status),
            buildVersion: activity.buildVersion || '-',
            tests: Math.max(0, activity.totalTestCases || 0),
            durationLabel: formatDurationFromRange(startedAt, endedAt),
            timeAgo: formatTimeAgo(dayjs(activity.createdAt).toISOString()),
            row: matchedExecution,
          };
        }),
    [activities, executions],
  );

  const selectedActivity = selectedActivityId
    ? (activityData.find((item) => item.id === selectedActivityId) ?? null)
    : null;

  const selectedActivityCases = useSelector((state: RootState) =>
    selectedActivityId
      ? selectUserDashboardTestCasesByExecutionId(state, selectedActivityId)
      : [],
  );

  const isActivityCasesLoading = useSelector((state: RootState) =>
    selectedActivityId
      ? selectUserDashboardTestCasesLoadingByExecutionId(
          state,
          selectedActivityId,
        )
      : false,
  );

  const selectedActivityCounts = useMemo(
    () =>
      selectedActivity
        ? selectedActivity.row
          ? getExecutionCounts(selectedActivity.row)
          : {
              total: selectedActivity.tests,
              passed: selectedActivityCases.filter(
                (item) => item.status === 'passed',
              ).length,
              failed: selectedActivityCases.filter(
                (item) => item.status === 'failed',
              ).length,
            }
        : { total: 0, passed: 0, failed: 0 },
    [selectedActivity, selectedActivityCases],
  );
  const isActivityDrawerOpen = Boolean(selectedActivity);

  const handleActivityClick = (activityId: string) => {
    setSelectedActivityId(activityId);
    dispatch(
      fetchUserDashboardTestCasesByExecutionIdRequest({
        executionId: activityId,
      }),
    );
  };

  const handleViewIssueClick = (testCase: {
    id: string;
    name: string;
    device: string;
    executedAt: string;
    status: string;
    jiraUrl?: string;
  }) => {
    if (typeof window !== 'undefined' && testCase.jiraUrl) {
      window.open(testCase.jiraUrl, '_blank', 'noopener,noreferrer');
    }
  };

  const handleViewExternalClick = (testCase: {
    id: string;
    name: string;
    device: string;
    executedAt: string;
    status: string;
    gitlabUrl?: string;
  }) => {
    if (typeof window !== 'undefined' && testCase.gitlabUrl) {
      window.open(testCase.gitlabUrl, '_blank', 'noopener,noreferrer');
    }
  };

  const handleActivityDrawerClose = () => {
    setSelectedActivityId(null);
  };

  const handleExportLogs = () => {
    if (!selectedActivity?.id) return;

    dispatch(
      downloadUserDashboardExecutionLogRequest({
        testId: selectedActivity.id,
      }),
    );
  };

  return (
    <Box className={styles.card}>
      <Stack
        className={styles.header}
        direction="row"
        justifyContent="space-between"
      >
        <Typography variant="h6" className={styles.title}>
          Recent Test Activity & Events
        </Typography>
      </Stack>

      <Stack className={styles.list}>
        {activityData.map((execution) => {
          const activityMeta = getActivityMeta(execution.status, theme);
          return (
            <Stack
              key={execution.id}
              className={styles.item}
              direction="row"
              gap="0.65rem"
              role="button"
              tabIndex={0}
              onClick={() => handleActivityClick(execution.id)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault();
                  handleActivityClick(execution.id);
                }
              }}
            >
              <Stack className={styles.iconColumn}>
                <Box
                  className={styles.icon}
                  sx={{ backgroundColor: activityMeta.backgroundColor }}
                >
                  <CustomIcon
                    name={activityMeta.iconName}
                    size={22.5}
                    color={activityMeta.iconColor}
                  />
                </Box>
                <Typography className={styles.iconTime}>
                  {execution.timeAgo}
                </Typography>
              </Stack>
              <Stack className={styles.itemContent}>
                <Typography variant="body1" className={styles.activityTitle}>
                  {execution.deviceType} - {execution.testPlanName} -{' '}
                  {execution.statusLabel}
                </Typography>
                <Stack
                  className={styles.activityMetaRow}
                  direction="row"
                  gap={0.75}
                >
                  <Typography className={styles.activityMetaText}>
                    {execution.buildVersion}
                  </Typography>
                  <Typography className={styles.activityMetaDot}>•</Typography>
                  <Typography className={styles.activityMetaText}>
                    {execution.tests} tests
                  </Typography>
                  <Typography className={styles.activityMetaDot}>•</Typography>
                  <Typography className={styles.activityMetaText}>
                    {execution.durationLabel}
                  </Typography>
                </Stack>
              </Stack>
            </Stack>
          );
        })}
      </Stack>

      <TestSuiteDrawer
        open={isActivityDrawerOpen}
        onClose={handleActivityDrawerClose}
        title={selectedActivity?.testPlanName ?? ''}
        passed={selectedActivityCounts.passed}
        failed={selectedActivityCounts.failed}
        totalTests={selectedActivityCounts.total}
        cases={selectedActivityCases}
        loading={isActivityCasesLoading}
        onViewIssue={handleViewIssueClick}
        onViewExternal={handleViewExternalClick}
        onExportLogs={handleExportLogs}
        rtosLogPath={selectedActivity?.row?.rtosLogPath}
      />
    </Box>
  );
}

export default ActivityEventsCard;
