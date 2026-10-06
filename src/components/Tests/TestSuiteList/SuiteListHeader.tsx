import { Stack, Typography } from '@mui/material';
import { FolderIcon } from 'assets/index';
import { TestStatus } from 'typesCustom/tests';
import styles from './TestSuiteList.module.scss';
import ExecutionStatusBadge from '../ExecutionStatusBadge';

interface SuiteListHeaderProps {
  headerTitle: string;
  suiteCount: number;
  execution?: { testId: string; status: TestStatus };
  executionCounts: { passed: number; failed: number };
}

/**
 * SuiteListHeader - Displays the plan name, suite count,
 * passed/failed badges, and execution status.
 */
function SuiteListHeader({
  headerTitle,
  suiteCount,
  execution,
  executionCounts,
}: SuiteListHeaderProps) {
  return (
    <Stack direction="row" className={styles.header}>
      <Stack className={styles.headerContent} direction="row">
        <Stack
          alignItems="center"
          justifyContent="center"
          className={styles.iconWrapper}
        >
          <FolderIcon
            className={styles.headerIcon}
            width="23.5px"
            height="23.5px"
          />
        </Stack>
        <Stack>
          <Typography className={styles.headerTitle} variant="subtitle2">
            {headerTitle}
          </Typography>
          <Typography className={styles.headerSubtitle}>
            {suiteCount} test suites
          </Typography>
        </Stack>
      </Stack>
      <Stack direction="row" alignItems="center" gap={1}>
        {execution &&
          (executionCounts.passed > 0 || executionCounts.failed > 0) && (
            <>
              <Stack className={styles.passedTestsBadge}>
                <Typography variant="caption" className={styles.passedText}>
                  Passed: {executionCounts.passed}
                </Typography>
              </Stack>
              <Stack className={styles.failedTestsBadge}>
                <Typography variant="caption" className={styles.failedText}>
                  Failed: {executionCounts.failed}
                </Typography>
              </Stack>
            </>
          )}
        <ExecutionStatusBadge execution={execution} />
      </Stack>
    </Stack>
  );
}

export default SuiteListHeader;
