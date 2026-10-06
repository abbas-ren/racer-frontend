import { Button, CircularProgress, Tooltip } from '@mui/material';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import StopIcon from '@mui/icons-material/Stop';
import clsx from 'clsx';
import styles from './TestFilters.module.scss';

interface ExecutionButtonProps {
  isSubmitting: boolean;
  isRunning: boolean;
  isCancelling: boolean;
  canRerun: boolean;
  disableRun: boolean;
  hasSelection: boolean;
  onClick: () => void;
}

/**
 * ExecutionButton - The Run Tests / Stop button with proper state handling.
 */
function ExecutionButton({
  isSubmitting,
  isRunning,
  isCancelling,
  canRerun,
  disableRun,
  hasSelection,
  onClick,
}: ExecutionButtonProps) {
  const startIcon = isSubmitting ? (
    <CircularProgress size={16} sx={{ color: 'white' }} />
  ) : isCancelling ? (
    <CircularProgress size={16} sx={{ color: 'white' }} />
  ) : isRunning ? (
    <StopIcon />
  ) : (
    <PlayArrowIcon className={styles.playIcon} />
  );

  const label = isSubmitting
    ? 'Starting...'
    : isCancelling
      ? 'Cancelling...'
      : isRunning
        ? 'Stop'
        : 'Run Tests';

  // Disable logic:
  // - Always disabled while submitting
  // - Disabled while cancelling (cancel already in progress)
  // - Never disabled while running (need to allow stop)
  // - For rerun or new run: require at least one test case selected
  const isDisabled = isSubmitting
    ? true
    : isCancelling
      ? true
      : isRunning
        ? false
        : canRerun
          ? !hasSelection
          : disableRun;

  return (
    <Tooltip
      title={isCancelling ? 'Cancelling current execution' : ''}
      arrow
      disableHoverListener={!isCancelling}
    >
      <span>
        <Button
          variant="contained"
          startIcon={startIcon}
          onClick={onClick}
          className={clsx(styles.runButton, {
            [styles.runButtonError]: isRunning,
            [styles.runButtonDisabled]: disableRun,
          })}
          disabled={isDisabled}
        >
          {label}
        </Button>
      </span>
    </Tooltip>
  );
}

export default ExecutionButton;
