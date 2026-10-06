import { RootState } from 'store/store';

export const selectReportIssueLoading = (state: RootState) =>
  state.reportIssue.loading;
export const selectReportIssueError = (state: RootState) =>
  state.reportIssue.error;
export const selectReportIssueSuccess = (state: RootState) =>
  state.reportIssue.success;
