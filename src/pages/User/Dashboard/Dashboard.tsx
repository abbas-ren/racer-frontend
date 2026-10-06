import { DashboardTable } from 'components';
import { Alert, Snackbar, Stack } from '@mui/material';
import { useEffect, useState } from 'react';
import dayjs from 'dayjs';
import {
  ActivityEventsCard,
  BuildPerformanceCard,
  TestExecutionTrendsCard,
} from 'components/UserDashboard/DashboardAnalytics';

import { useDispatch, useSelector } from 'react-redux';
import { fetchUserDashboardDataRequest } from 'store';
import {
  selectUserDashboardActivities,
  selectUserDashboardBuildsComparison,
  selectUserDashboardDataFetched,
  selectUserDashboardError,
  selectUserDashboardExecutionDailySummary,
  selectUserDashboardExecutions,
  selectUserDashboardLoading,
} from 'store/selectors/userDashboardSelectors';
import styles from './Dashboard.module.scss';

const Dashboard = () => {
  const dispatch = useDispatch();
  const [selectedTrendDate, setSelectedTrendDate] = useState<string | null>(
    null,
  );
  const [isTrendDateAlertOpen, setIsTrendDateAlertOpen] = useState(false);
  const executions = useSelector(selectUserDashboardExecutions);
  const activities = useSelector(selectUserDashboardActivities);
  const buildsComparison = useSelector(selectUserDashboardBuildsComparison);
  const executionDailySummary = useSelector(
    selectUserDashboardExecutionDailySummary,
  );
  const isDashboardDataFetched = useSelector(selectUserDashboardDataFetched);
  const isDashboardDataLoading = useSelector(selectUserDashboardLoading);
  const dashboardDataError = useSelector(selectUserDashboardError);

  useEffect(() => {
    if (!isDashboardDataFetched && !isDashboardDataLoading) {
      dispatch(fetchUserDashboardDataRequest());
    }
  }, [dispatch, isDashboardDataFetched, isDashboardDataLoading]);

  const focusTestPerformanceSection = () => {
    if (typeof window === 'undefined') return;

    window.requestAnimationFrame(() => {
      const section = document.getElementById(
        'test-performance-analysis-section',
      );
      if (!section) return;

      section.scrollIntoView({ behavior: 'smooth', block: 'start' });
      if (section instanceof HTMLElement) {
        section.focus({ preventScroll: true });
      }
    });
  };

  const handleTrendDateSelection = (isoDate: string) => {
    setSelectedTrendDate(isoDate);
    setIsTrendDateAlertOpen(true);
    focusTestPerformanceSection();
  };

  const handleTrendDateAlertClose = () => {
    setIsTrendDateAlertOpen(false);
  };

  return (
    <>
      <Stack className={styles.page}>
        {dashboardDataError ? (
          <Alert
            severity="error"
            sx={{
              fontSize: '12px',
              '& .MuiAlert-message': { fontSize: '12px' },
            }}
          >
            {dashboardDataError}
          </Alert>
        ) : null}
        <Stack className={styles.analyticsGrid}>
          <ActivityEventsCard activities={activities} executions={executions} />
          <BuildPerformanceCard buildsComparison={buildsComparison} />
          <Stack className={styles.trendsCardWrap}>
            <TestExecutionTrendsCard
              onTrendDateSelect={handleTrendDateSelection}
              executions={executions}
              executionDailySummary={executionDailySummary}
            />
          </Stack>
        </Stack>
        <DashboardTable
          selectedTrendDate={selectedTrendDate}
          executions={executions}
        />
      </Stack>
      <Snackbar
        open={isTrendDateAlertOpen && !isDashboardDataLoading}
        autoHideDuration={2200}
        onClose={handleTrendDateAlertClose}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Alert
          onClose={handleTrendDateAlertClose}
          severity="success"
          sx={{
            width: '100%',
            fontSize: '12px',
            '& .MuiAlert-message': { fontSize: '12px', fontWeight: 600 },
          }}
        >
          {selectedTrendDate
            ? `Showing tests from ${dayjs(selectedTrendDate).format('MMM DD, YYYY')}`
            : 'Date selected'}
        </Alert>
      </Snackbar>
    </>
  );
};

export default Dashboard;
