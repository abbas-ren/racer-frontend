import {
  Box,
  Typography,
  Select,
  MenuItem,
  OutlinedInput,
} from '@mui/material';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import styles from './TestFilters.module.scss';
import type { FilterOption } from '../TestFilters';

interface FilterSelectProps {
  label: string;
  value: string;
  options: FilterOption[];
  disabled?: boolean;
  displayEmpty?: boolean;
  renderValue?: (value: string) => React.ReactNode;
  onChange: (value: string) => void;
}

/**
 * FilterSelect - A labeled dropdown used for each filter in the filter bar.
 */
function FilterSelect({
  label,
  value,
  options,
  disabled = false,
  displayEmpty,
  renderValue,
  onChange,
}: FilterSelectProps) {
  return (
    <Box className={styles.filterGroup}>
      <Typography className={styles.filterLabel}>{label}</Typography>
      <Select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={styles.filterSelect}
        size="small"
        IconComponent={KeyboardArrowDownIcon}
        input={<OutlinedInput />}
        disabled={disabled}
        displayEmpty={displayEmpty}
        renderValue={renderValue}
      >
        {options.map((option) => (
          <MenuItem
            key={option.value}
            value={option.value}
            sx={{ fontSize: '14px' }}
            disabled={option.disabled}
          >
            {option.label}
          </MenuItem>
        ))}
      </Select>
    </Box>
  );
}

export default FilterSelect;
