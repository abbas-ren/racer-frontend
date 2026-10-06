import { Stack, Typography } from '@mui/material';
import CustomCheckbox from 'components/common/CustomCheckbox';
import styles from './TestSuiteList.module.scss';

interface SelectAllBarProps {
  checked: boolean;
  indeterminate: boolean;
  disabled: boolean;
  onChange: (selected: boolean) => void;
}

/**
 * SelectAllBar - The "Select All" checkbox row that appears
 * above the suites list.
 */
function SelectAllBar({
  checked,
  indeterminate,
  disabled,
  onChange,
}: SelectAllBarProps) {
  return (
    <Stack
      className={styles.selectAllContainer}
      direction="row"
      alignItems="center"
      sx={disabled ? { opacity: 0.4, pointerEvents: 'none' } : undefined}
    >
      <Stack
        direction="row"
        alignItems="center"
        justifyContent="center"
        onClick={() => !disabled && onChange(!checked)}
        sx={{
          marginLeft: '10px',
          gap: '8px',
          cursor: disabled ? 'default' : 'pointer',
        }}
      >
        <span onClick={(e) => e.stopPropagation()}>
          <CustomCheckbox
            checked={checked}
            indeterminate={indeterminate}
            onChange={onChange}
            size={18}
            disabled={disabled}
          />
        </span>
        <Typography className={styles.headerSubtitle}>Select All</Typography>
      </Stack>
    </Stack>
  );
}

export default SelectAllBar;
