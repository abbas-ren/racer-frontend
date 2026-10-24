import { Stack, Typography, Box, CircularProgress } from '@mui/material';
import styles from './ResultProgressBar.module.scss';
import clsx from 'clsx';
import ExecutionStatusBadge from '../ExecutionStatusBadge';
import type { TestStatus } from 'types/tests';

interface ResultProgressBarProps {
  title?: string;
  progress?: number;
  totalCases?: number;
  completedCases?: number;
  /** When set, replaces the "N/M Test Cases" footer label. */
  footerLabel?: string;
  hideStatusBadge?: boolean;
  forceActive?: boolean;
  execution?: { testId: string; status: TestStatus } | null;
}

function ResultProgressBar({
  title = 'Result Progress',
  progress = 0,
  totalCases = 0,
  completedCases = 0,
  footerLabel,
  hideStatusBadge = false,
  forceActive = false,
  execution,
}: ResultProgressBarProps) {
  const safeProgress = Math.max(0, Math.min(100, Math.round(progress)));
  const isComplete =
    safeProgress >= 100 ||
    execution?.status === 'completed' ||
    execution?.status === 'failed' ||
    execution?.status === 'cancelled';
  const isActive =
    forceActive ||
    execution?.status === 'inProgress' ||
    execution?.status === 'queued';
  return (
    <Box className={clsx(styles.container, { [styles.completed]: isComplete })}>
      {/* Header */}
      <Stack className={styles.header}>
        <Stack direction="row" alignItems="center" gap={1}>
          <Typography className={styles.title} variant="body2">
            {title}
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
            {safeProgress}%
          </Typography>
        </Stack>
      </Stack>

      {/* Progress Bar */}
      <Box className={styles.progressBarWrapper}>
        <Box className={styles.progressBarTrack}>
          <Box
            className={styles.progressBarFill}
            sx={{ width: `${safeProgress}%` }}
          />
        </Box>

        {/* Circular Indicator */}
        {!isComplete && (
          <Box className={styles.indicator} sx={{ left: `${safeProgress}%` }}>
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
            {footerLabel ??
              `${completedCases}/${totalCases} Test Cases`}
          </Typography>
          {isActive && !isComplete && (
            <Box className={styles.dotLoader}>
              <Box className={styles.dot} />
              <Box className={styles.dot} />
              <Box className={styles.dot} />
            </Box>
          )}
        </Stack>
        {!hideStatusBadge && (
          <ExecutionStatusBadge
            execution={execution ?? undefined}
            size="small"
            textCase="sentence"
          />
        )}
      </Stack>
    </Box>
  );
}

export default ResultProgressBar;
