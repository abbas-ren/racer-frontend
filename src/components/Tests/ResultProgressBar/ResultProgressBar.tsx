import { Stack, Typography, Box, CircularProgress } from '@mui/material';
import styles from './ResultProgressBar.module.scss';
import clsx from 'clsx';
import ExecutionStatusBadge from '../ExecutionStatusBadge';
import type { TestStatus } from 'types/tests';

interface ResultProgressBarProps {
  progress?: number;
  totalCases?: number;
  completedCases?: number;
  execution?: { testId: string; status: TestStatus } | null;
}

function ResultProgressBar({
  progress = 50,
  totalCases = 593,
  completedCases = 296,
  execution,
}: ResultProgressBarProps) {
  const isComplete =
    progress >= 100 ||
    execution?.status === 'completed' ||
    execution?.status === 'failed' ||
    execution?.status === 'cancelled';
  const isActive =
    execution?.status === 'in_progress' || execution?.status === 'queued';
  return (
    <Box className={clsx(styles.container, { [styles.completed]: isComplete })}>
      {/* Header */}
      <Stack className={styles.header}>
        <Stack direction="row" alignItems="center" gap={1}>
          <Typography className={styles.title} variant="body2">
            Result Progress
          </Typography>
          {isActive && !isComplete && (
            <CircularProgress size={16} thickness={4} />
          )}
        </Stack>
        <Stack
          className={styles.percentageBadge}
          alignItems="center"
          justifyContent="center"
        >
          <Typography className={styles.percentageText} variant="body2">
            {progress}%
          </Typography>
        </Stack>
      </Stack>

      {/* Progress Bar */}
      <Box className={styles.progressBarWrapper}>
        <Box className={styles.progressBarTrack}>
          <Box
            className={styles.progressBarFill}
            sx={{ width: `${progress}%` }}
          />
        </Box>

        {/* Circular Indicator */}
        {!isComplete && (
          <Box className={styles.indicator} sx={{ left: `${progress}%` }}>
            <Box className={styles.indicatorOuter}>
              <Box className={styles.indicatorInner} />
            </Box>
          </Box>
        )}
      </Box>

      {/* Footer */}
      <Stack className={styles.footer}>
        <Stack direction="row" alignItems="center">
          <Typography className={styles.casesText} variant="buttonBase">
            {completedCases}/{totalCases} Test Cases
          </Typography>
          {isActive && !isComplete && (
            <Box className={styles.dotLoader}>
              <Box className={styles.dot} />
              <Box className={styles.dot} />
              <Box className={styles.dot} />
            </Box>
          )}
        </Stack>
        <ExecutionStatusBadge
          execution={execution ?? undefined}
          size="small"
          textCase="sentence"
        />
      </Stack>
    </Box>
  );
}

export default ResultProgressBar;
