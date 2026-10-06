import { Box, Typography, CircularProgress } from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import CustomCheckbox from 'components/common/CustomCheckbox';
import styles from './TestSuiteList.module.scss';
import TestCaseItem from './TestCaseItem';
import { TransformedTestSuite } from './hooks/useTestSuiteData';

interface SuiteItemProps {
  suite: TransformedTestSuite;
  expanded: boolean;
  checkboxState: 'checked' | 'unchecked' | 'indeterminate';
  counts: { totalCases: number; selectedCount: number } | null;
  isLoadingCases: boolean;
  disabled: boolean;
  onToggleExpand: (suiteId: string) => void;
  onSuiteSelectChange: (suiteId: string | number, checked: boolean) => void;
  isCaseChecked: (suiteId: string, caseId: string) => boolean;
  onCaseChange: (
    suiteId: string | number,
    caseId: string | number | undefined,
    checked: boolean,
  ) => void;
}

/**
 * SuiteItem - A single expandable test suite row with its checkbox,
 * name, case count, and child test case items.
 */
function SuiteItem({
  suite,
  expanded,
  checkboxState,
  counts,
  isLoadingCases,
  disabled,
  onToggleExpand,
  onSuiteSelectChange,
  isCaseChecked,
  onCaseChange,
}: SuiteItemProps) {
  return (
    <Box
      className={`${styles.suiteItem} ${expanded ? styles.suiteItemActive : ''}`}
    >
      <Box
        className={styles.suiteHeader}
        onClick={() => !disabled && onToggleExpand(suite.id)}
        sx={disabled ? { cursor: 'default' } : undefined}
      >
        <Box onClick={(e) => e.stopPropagation()}>
          <CustomCheckbox
            checked={checkboxState === 'checked'}
            indeterminate={checkboxState === 'indeterminate'}
            onChange={(checked) => onSuiteSelectChange(suite.id, checked)}
            size={18}
            disabled={disabled}
          />
        </Box>
        <Box className={styles.suiteInfo}>
          <Typography className={styles.testCaseName}>{suite.name}</Typography>
          {expanded && counts && (
            <Typography className={styles.testCaseDuration}>
              {counts.totalCases} cases · {counts.selectedCount} selected
            </Typography>
          )}
        </Box>
        <ExpandMoreIcon
          className={`${styles.chevron} ${expanded ? styles.chevronExpanded : ''}`}
        />
      </Box>

      {expanded && (
        <Box className={styles.expandArea}>
          <Box className={styles.casesScrollable}>
            {isLoadingCases ? (
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  padding: '20px',
                }}
              >
                <CircularProgress size={24} />
              </Box>
            ) : (
              (suite.cases || []).map((testCase) => (
                <TestCaseItem
                  key={testCase.id}
                  testCase={testCase}
                  suiteId={suite.id}
                  checked={isCaseChecked(suite.id, testCase.id)}
                  onChangeWithIds={onCaseChange}
                  disabled={disabled}
                />
              ))
            )}
          </Box>
        </Box>
      )}
    </Box>
  );
}

export default SuiteItem;
