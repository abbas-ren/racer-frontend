import { Box, Typography } from '@mui/material';
import CustomCheckbox from 'components/common/CustomCheckbox';
import styles from './TestSuiteList.module.scss';

export interface TestCase {
  id: string;
  name: string;
  status?: 'pass' | 'fail' | 'pending' | 'running';
  duration?: string;
  timestamp?: string;
}

interface TestCaseItemProps {
  testCase: TestCase;
  suiteId: string;
  checked: boolean;
  onChangeWithIds: (
    suiteId: string,
    caseId: string | undefined,
    checked: boolean,
  ) => void;
  disabled?: boolean;
}

function TestCaseItem({
  testCase,
  suiteId,
  checked,
  onChangeWithIds,
  disabled = false,
}: TestCaseItemProps) {
  return (
    <Box
      key={testCase.id}
      className={styles.caseRow}
      onClick={() =>
        !disabled && onChangeWithIds(suiteId, testCase.id, !checked)
      }
      sx={{ cursor: disabled ? 'default' : 'pointer' }}
    >
      <Box onClick={(e) => e.stopPropagation()}>
        <CustomCheckbox
          checked={checked}
          onChange={(isChecked) => {
            if (disabled) return;
            onChangeWithIds(suiteId, testCase.id, isChecked);
          }}
          size={16}
          disabled={disabled}
        />
      </Box>
      <Typography className={styles.caseName}>{testCase.name}</Typography>
    </Box>
  );
}

export default TestCaseItem;
