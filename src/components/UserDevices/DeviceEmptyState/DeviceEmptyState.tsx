import { Box, Typography } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import styles from './DeviceEmptyState.module.scss';

interface DeviceEmptyStateProps {
  hasActiveFilters: boolean;
  onClearFilters: () => void;
}

function DeviceEmptyState({
  hasActiveFilters,
  onClearFilters,
}: DeviceEmptyStateProps) {
  return (
    <Box className={styles.emptyState}>
      <Box className={styles.emptyStateIconContainer}>
        <SearchIcon className={styles.emptyStateIcon} />
      </Box>
      <Typography
        variant="body2"
        className={
          hasActiveFilters
            ? `${styles.emptyStateMessage} ${styles.emptyStateMessageWithFilters}`
            : styles.emptyStateMessage
        }
      >
        No devices found matching your filters
      </Typography>
      {hasActiveFilters && (
        <Typography
          component="button"
          variant="body3"
          className={styles.emptyStateClearButton}
          onClick={(e) => {
            e.preventDefault();
            onClearFilters();
          }}
        >
          Clear all filters
        </Typography>
      )}
    </Box>
  );
}

export default DeviceEmptyState;
