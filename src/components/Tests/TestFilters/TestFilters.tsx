import { Box } from '@mui/material';
import styles from './TestFilters.module.scss';
import ReportIssueDialog from '../ReportIssueDialog';
import { useDispatch } from 'react-redux';
import { submitReportIssueRequest } from 'store/slices/issues/reportIssueSlice';
import { useState } from 'react';
import type { ReportIssueFormValues } from '../ReportIssueDialog/useReportIssueForm';
import { TestStatus } from 'typesCustom/tests';
import { useTestFilterHandlers } from './hooks';
import FilterSelect from './FilterSelect';
import ExecutionButton from './ExecutionButton';
import ReportBuildButton from './ReportBuildButton';
import { useUploadWebSocket } from 'hooks/useUploadWebSocket';
import { useAuth } from 'hooks/useAuth';

export interface FilterOption {
  value: string;
  label: string;
  disabled?: boolean;
}

function TestFilters(props: {
  execution?: { testId: string; status: TestStatus };
}) {
  const dispatch = useDispatch();
  const { user } = useAuth();
  const userId = user?.id || '';
  const [reportIssueOpen, setReportIssueOpen] = useState(false);

  const {
    filters,
    deviceFamilyOptions,
    deviceOptions,
    buildOptions,
    testPlanOptions,
    disableDeviceFamily,
    disableDevice,
    disableBuild,
    disableTestPlan,
    disableRun,
    isSubmitting,
    isRunning,
    isCancelling,
    canRerun,
    hasSelection,
    handleDeviceFamilyChange,
    handleDeviceChange,
    handleBuildChange,
    handleTestPlanChange,
    handleRunOrStop,
    handleRefetchBuilds,
  } = useTestFilterHandlers(props.execution);

  // Set up WebSocket to refetch builds when deviceType matches
  useUploadWebSocket({
    userId,
    enabled: true,
    selectedDeviceType: filters.deviceType,
    onRefetchBuilds: handleRefetchBuilds,
  });

  const handleSubmitReportIssue = (data: ReportIssueFormValues) => {
    const testExecutionId = props.execution?.testId || null;
    dispatch(
      submitReportIssueRequest({
        deviceFamily: data.deviceFamily,
        deviceType: data.device,
        releaseId: data.buildVersion,
        description: data.description,
        file: data.file ?? null,
        attachLogs: data.attachLogs,
        testExecutionId,
      }),
    );
  };

  return (
    <Box className={styles.filtersContainer}>
      <Box className={styles.filtersWrapper}>
        <FilterSelect
          label="Device Family"
          value={filters.deviceFamily}
          options={deviceFamilyOptions}
          disabled={disableDeviceFamily}
          displayEmpty
          renderValue={(value) => value || 'Select Device Family'}
          onChange={handleDeviceFamilyChange}
        />

        <FilterSelect
          label="Device"
          value={filters.deviceType}
          options={deviceOptions}
          disabled={disableDevice}
          onChange={handleDeviceChange}
        />

        <FilterSelect
          label="Build"
          value={filters.buildID}
          options={buildOptions}
          disabled={disableBuild}
          onChange={handleBuildChange}
        />

        <FilterSelect
          label="Test Plan"
          value={filters.testPlan || ''}
          options={testPlanOptions}
          disabled={disableTestPlan}
          onChange={handleTestPlanChange}
        />

        <ExecutionButton
          isSubmitting={isSubmitting}
          isRunning={isRunning}
          isCancelling={isCancelling}
          canRerun={canRerun}
          disableRun={disableRun}
          hasSelection={hasSelection}
          onClick={handleRunOrStop}
        />

        <ReportBuildButton onClick={() => setReportIssueOpen(true)} />
      </Box>
      <ReportIssueDialog
        open={reportIssueOpen}
        onClose={() => setReportIssueOpen(false)}
        onSubmit={handleSubmitReportIssue}
        defaults={{
          deviceFamily: filters.deviceFamily || '',
          device: filters.deviceType || '',
          buildVersion: filters.buildID || '',
        }}
      />
    </Box>
  );
}

export default TestFilters;
