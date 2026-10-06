import { Box, Typography } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import type { ReactNode } from 'react';
import styles from './EmptyState.module.scss';

interface EmptyStateProps {
  message: string;
  hasActiveFilters?: boolean;
  onClearFilters?: () => void;
  clearLabel?: string;
  icon?: ReactNode;
}

function EmptyState({
  message,
  hasActiveFilters = false,
  onClearFilters,
  clearLabel = 'Clear all filters',
  icon,
}: EmptyStateProps) {
  return (
    <Box className={styles.emptyState}>
      <Box className={styles.emptyStateIconContainer}>
        {icon || <SearchIcon className={styles.emptyStateIcon} />}
      </Box>
      <Typography
        variant="body2"
        className={
          hasActiveFilters
            ? `${styles.emptyStateMessage} ${styles.emptyStateMessageWithFilters}`
            : styles.emptyStateMessage
        }
      >
        {message}
      </Typography>
      {hasActiveFilters && onClearFilters && (
        <Typography
          component="button"
          variant="body3"
          className={styles.emptyStateClearButton}
          onClick={(e) => {
            e.preventDefault();
            onClearFilters();
          }}
        >
          {clearLabel}
        </Typography>
      )}
    </Box>
  );
}

export default EmptyState;
