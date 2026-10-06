import { createSelector } from '@reduxjs/toolkit';
import type { RootState } from 'store/store';

export const selectUserDashboardState = (state: RootState) =>
  state.userDashboard;

export const selectUserDashboardExecutions = createSelector(
  [selectUserDashboardState],
  (userDashboard) => userDashboard.executions,
);

export const selectUserDashboardActivities = createSelector(
  [selectUserDashboardState],
  (userDashboard) => userDashboard.activities,
);

export const selectUserDashboardBuildsComparison = createSelector(
  [selectUserDashboardState],
  (userDashboard) => userDashboard.buildsComparison,
);

export const selectUserDashboardLoading = createSelector(
  [selectUserDashboardState],
  (userDashboard) => userDashboard.loading,
);

export const selectUserDashboardError = createSelector(
  [selectUserDashboardState],
  (userDashboard) => userDashboard.error,
);

export const selectUserDashboardDataFetched = createSelector(
  [selectUserDashboardState],
  (userDashboard) => userDashboard.dataFetched,
);

export const selectUserDashboardExecutionDailySummary = createSelector(
  [selectUserDashboardState],
  (userDashboard) => userDashboard.executionDailySummary,
);

export const selectUserDashboardTrendFrom = (state: RootState) =>
  state.userDashboard.trendFrom;

export const selectUserDashboardTrendTo = (state: RootState) =>
  state.userDashboard.trendTo;

export const selectUserDashboardTestCasesByExecutionId = (
  state: RootState,
  executionId: string,
) => state.userDashboard.testCasesByExecutionId[executionId] ?? [];

export const selectUserDashboardTestCasesLoadingByExecutionId = (
  state: RootState,
  executionId: string,
) => state.userDashboard.testCasesLoadingByExecutionId[executionId] ?? false;

export const selectUserDashboardTestCasesErrorByExecutionId = (
  state: RootState,
  executionId: string,
) => state.userDashboard.testCasesErrorByExecutionId[executionId] ?? null;

export const selectUserDashboardHasExecutionTestCasesLoaded = (
  state: RootState,
  executionId: string,
) =>
  Object.prototype.hasOwnProperty.call(
    state.userDashboard.testCasesByExecutionId,
    executionId,
  );

export const selectExecutionReportByTestId = (
  state: RootState,
  testId: string,
) => state.userDashboard.reportByTestId[testId] ?? null;
