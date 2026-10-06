import { Box, Typography } from '@mui/material';
import styles from './TestResultsDisplay.module.scss';

interface TestResultsDisplayProps {
  passed: number;
  failed: number;
}

function TestResultsDisplay({ passed, failed }: TestResultsDisplayProps) {
  return (
    <Box className={styles.testResults}>
      <Box className={styles.testResultsItem}>
        <Box
          className={styles.testResultsIndicator}
          sx={{ backgroundColor: 'success.main' }}
        />
        <Typography
          variant="body3"
          className={styles.testResultsText}
          sx={{ color: 'text.tertiary' }}
        >
          {passed} passed
        </Typography>
      </Box>
      <Box className={styles.testResultsItem}>
        <Box
          className={styles.testResultsIndicator}
          sx={{ backgroundColor: 'error.main' }}
        />
        <Typography
          variant="body3"
          className={styles.testResultsText}
          sx={{ color: 'text.tertiary' }}
        >
          {failed} failed
        </Typography>
      </Box>
    </Box>
  );
}

export default TestResultsDisplay;
