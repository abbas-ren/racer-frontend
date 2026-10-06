import { Box } from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import styles from './TestSuiteList.module.scss';

/**
 * LoadingSkeleton - Placeholder UI shown while test suites are loading.
 */
function LoadingSkeleton() {
  return (
    <>
      {[0, 1].map((idx) => (
        <Box key={idx} className={styles.suiteItem}>
          <Box className={styles.suiteHeader}>
            <Box
              sx={{
                width: 18,
                height: 18,
                borderRadius: '4px',
                bgcolor: 'rgba(0,0,0,0.08)',
              }}
            />
            <Box className={styles.suiteInfo} sx={{ flex: 1 }}>
              <Box
                sx={{
                  width: '40%',
                  height: 14,
                  bgcolor: 'rgba(0,0,0,0.08)',
                  borderRadius: '4px',
                }}
              />
              <Box
                sx={{
                  width: '25%',
                  height: 12,
                  bgcolor: 'rgba(0,0,0,0.06)',
                  borderRadius: '4px',
                  mt: 1,
                }}
              />
            </Box>
            <ExpandMoreIcon className={styles.chevron} />
          </Box>
        </Box>
      ))}
    </>
  );
}

export default LoadingSkeleton;
