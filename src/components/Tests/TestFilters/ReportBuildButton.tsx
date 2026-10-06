import { Button } from '@mui/material';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import styles from './TestFilters.module.scss';

interface ReportBuildButtonProps {
  onClick: () => void;
}

/**
 * ReportBuildButton - Button to open the report issue dialog.
 */
function ReportBuildButton({ onClick }: ReportBuildButtonProps) {
  return (
    <Button
      variant="text"
      startIcon={<ErrorOutlineIcon className={styles.reportIcon} />}
      onClick={onClick}
      className={styles.reportButton}
    >
      Report Build
    </Button>
  );
}

export default ReportBuildButton;
