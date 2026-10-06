import { Box, Typography, Tabs, Tab, LinearProgress } from '@mui/material';
import { useState } from 'react';
import styles from './TestDetailsPanel.module.scss';

export interface TestDetails {
  testId: string;
  testName: string;
  status: 'pass' | 'fail' | 'pending' | 'running';
  progress: number;
  passed: number;
  failed: number;
  total: number;
  duration: string;
  logs: string[];
  overview?: {
    device?: string;
    build?: string;
    startTime?: string;
    endTime?: string;
  };
}

interface TestDetailsPanelProps {
  testDetails: TestDetails | null;
}

function TestDetailsPanel({ testDetails }: TestDetailsPanelProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'logs'>('overview');

  if (!testDetails) {
    return (
      <Box className={styles.emptyState}>
        <Typography className={styles.emptyText}>
          Select a test case to view details
        </Typography>
      </Box>
    );
  }

  const handleTabChange = (
    _event: React.SyntheticEvent,
    newValue: 'overview' | 'logs',
  ) => {
    setActiveTab(newValue);
  };

  return (
    <Box className={styles.container}>
      {/* Header with Progress */}
      <Box className={styles.header}>
        <Typography className={styles.testName}>
          {testDetails.testName}
        </Typography>

        <Box className={styles.progressSection}>
          <Box className={styles.progressHeader}>
            <Typography className={styles.progressLabel}>Progress</Typography>
            <Typography className={styles.progressPercentage}>
              {testDetails.progress}%
            </Typography>
          </Box>

          <LinearProgress
            variant="determinate"
            value={testDetails.progress}
            className={styles.progressBar}
          />

          <Box className={styles.statsRow}>
            <Box className={styles.statItem}>
              <Typography className={styles.statLabel}>Passed</Typography>
              <Typography className={styles.statValuePass}>
                {testDetails.passed}
              </Typography>
            </Box>
            <Box className={styles.statItem}>
              <Typography className={styles.statLabel}>Failed</Typography>
              <Typography className={styles.statValueFail}>
                {testDetails.failed}
              </Typography>
            </Box>
            <Box className={styles.statItem}>
              <Typography className={styles.statLabel}>Total</Typography>
              <Typography className={styles.statValueTotal}>
                {testDetails.total}
              </Typography>
            </Box>
            <Box className={styles.statItem}>
              <Typography className={styles.statLabel}>Duration</Typography>
              <Typography className={styles.statValueDuration}>
                {testDetails.duration}
              </Typography>
            </Box>
          </Box>
        </Box>
      </Box>

      {/* Tabs */}
      <Tabs
        value={activeTab}
        onChange={handleTabChange}
        className={styles.tabs}
      >
        <Tab label="Overview" value="overview" className={styles.tab} />
        <Tab label="Logs" value="logs" className={styles.tab} />
      </Tabs>

      {/* Content */}
      <Box className={styles.content}>
        {activeTab === 'overview' && (
          <Box className={styles.overviewContent}>
            {testDetails.overview?.device && (
              <Box className={styles.overviewItem}>
                <Typography className={styles.overviewLabel}>
                  Device:
                </Typography>
                <Typography className={styles.overviewValue}>
                  {testDetails.overview.device}
                </Typography>
              </Box>
            )}
            {testDetails.overview?.build && (
              <Box className={styles.overviewItem}>
                <Typography className={styles.overviewLabel}>Build:</Typography>
                <Typography className={styles.overviewValue}>
                  {testDetails.overview.build}
                </Typography>
              </Box>
            )}
            {testDetails.overview?.startTime && (
              <Box className={styles.overviewItem}>
                <Typography className={styles.overviewLabel}>
                  Start Time:
                </Typography>
                <Typography className={styles.overviewValue}>
                  {testDetails.overview.startTime}
                </Typography>
              </Box>
            )}
            {testDetails.overview?.endTime && (
              <Box className={styles.overviewItem}>
                <Typography className={styles.overviewLabel}>
                  End Time:
                </Typography>
                <Typography className={styles.overviewValue}>
                  {testDetails.overview.endTime}
                </Typography>
              </Box>
            )}
          </Box>
        )}

        {activeTab === 'logs' && (
          <Box className={styles.logsContent}>
            {testDetails.logs.length > 0 ? (
              <Box component="pre" className={styles.logsText}>
                {testDetails.logs.join('\n')}
              </Box>
            ) : (
              <Typography className={styles.noLogsText}>
                No logs available
              </Typography>
            )}
          </Box>
        )}
      </Box>
    </Box>
  );
}

export default TestDetailsPanel;
