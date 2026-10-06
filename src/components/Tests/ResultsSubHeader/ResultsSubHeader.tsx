import { Stack, Typography } from '@mui/material';
import { clsx } from 'clsx';
import { SaveAltOutlined } from '@mui/icons-material';
import styles from './ResultsSubHeader.module.scss';
import { TestStatus } from 'types/tests';

type TabType = 'Test Case Result' | 'Device Logs';

interface ResultsSubHeaderProps {
  selectedTab: TabType;
  onTabChange: (tab: TabType) => void;
  onClear: () => void;
  onExport?: () => void;
  executionStatus?: TestStatus;
}

const TABS: TabType[] = ['Test Case Result', 'Device Logs'];

const RUNNING_STATUSES: TestStatus[] = [
  TestStatus.IN_PROGRESS,
  TestStatus.QUEUED,
];
const TERMINAL_STATUSES: TestStatus[] = [
  TestStatus.COMPLETED,
  TestStatus.FAILED,
  TestStatus.CANCELLED,
];

function ResultsSubHeader({
  selectedTab,
  onTabChange,
  onClear,
  onExport,
  executionStatus,
}: ResultsSubHeaderProps) {
  const isRunning =
    executionStatus != null && RUNNING_STATUSES.includes(executionStatus);
  const isTerminal =
    executionStatus != null && TERMINAL_STATUSES.includes(executionStatus);
  return (
    <Stack className={styles.subHeader}>
      <Stack direction="row" alignItems="center" justifyContent="space-between">
        <Typography
          className={styles.subHeaderTitle}
          variant="button"
          component="span"
        >
          Test Logs
        </Typography>
        <Stack direction="row" gap="9px">
          {selectedTab === 'Device Logs' && isTerminal && (
            <Stack
              direction="row"
              alignItems="center"
              gap="4.5px"
              className={styles.actionButton}
              onClick={onExport}
            >
              <SaveAltOutlined className={styles.exportIcon} />
              <Typography variant="label2" component="span">
                Export
              </Typography>
            </Stack>
          )}

          {isRunning && (
            <Stack
              direction="row"
              alignItems="center"
              gap="4.5px"
              className={styles.actionButton}
              onClick={onClear}
            >
              <Typography variant="label2" component="span">
                Clear
              </Typography>
            </Stack>
          )}
        </Stack>
      </Stack>
      <Stack
        direction="row"
        alignItems="center"
        justifyContent="space-between"
        gap="4.5px"
      >
        {TABS.map((tab) => (
          <Stack
            key={tab}
            alignItems="center"
            justifyContent="center"
            className={clsx([
              selectedTab === tab ? styles.tabActive : '',
              styles.tab,
            ])}
            onClick={() => onTabChange(tab)}
          >
            <Typography
              variant="label2"
              className={clsx([
                selectedTab === tab ? styles.tabTextActive : '',
                styles.tabText,
              ])}
            >
              {tab}
            </Typography>
          </Stack>
        ))}
      </Stack>
    </Stack>
  );
}

export default ResultsSubHeader;
