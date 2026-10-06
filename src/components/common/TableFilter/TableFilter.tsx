import {
  Stack,
  TextField,
  InputAdornment,
  Select,
  MenuItem,
  OutlinedInput,
  Box,
} from '@mui/material';
import type { TextFieldProps } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import FilterAltOutlined from '@mui/icons-material/FilterAltOutlined';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import styles from './TableFilter.module.scss';

type FilterOption = { value: string; label: string };

interface TableFilterProps {
  filterValue: string;
  onFilterChange: (value: string) => void;
  filterOptions?: FilterOption[];
  searchValue: string;
  onSearchChange: (value: string) => void;
  count: number;
  countLabel?: string;
  searchPlaceholder?: string;
  customFilterComponent?: React.ReactNode;
  searchVariant?: 'outlined' | 'filled' | 'standard';
  searchSize?: 'small' | 'medium';
  searchStartAdornment?: React.ReactNode;
  searchTextFieldProps?: Omit<
    TextFieldProps,
    'value' | 'onChange' | 'placeholder' | 'variant' | 'size' | 'children'
  >;
  searchWidth?: string | number;
}

function TableFilter({
  filterValue,
  onFilterChange,
  filterOptions,
  searchValue,
  onSearchChange,
  count,
  countLabel = 'items',
  searchPlaceholder = 'Search...',
  customFilterComponent,
  searchVariant = 'outlined',
  searchSize = 'small',
  searchStartAdornment,
  searchTextFieldProps,
  searchWidth,
}: TableFilterProps) {
  return (
    <Stack direction="row" className={styles.tableFilterRow}>
      <Box
        className={styles.searchContainer}
        sx={
          searchWidth
            ? {
                width: searchWidth,
                flexBasis: searchWidth,
                flexGrow: 0,
                flexShrink: 0,
              }
            : { flexGrow: 1 }
        }
      >
        <TextField
          fullWidth
          placeholder={searchPlaceholder}
          variant={searchVariant}
          size={searchSize}
          value={searchValue}
          onChange={(e) => onSearchChange(e.target.value)}
          slotProps={{
            input: {
              startAdornment: searchStartAdornment ?? (
                <InputAdornment position="start">
                  <SearchIcon
                    className={styles.searchIcon}
                    fontSize={searchSize === 'small' ? 'small' : 'medium'}
                  />
                </InputAdornment>
              ),
              ...(searchTextFieldProps?.slotProps?.input ?? {}),
            },
            ...(searchTextFieldProps?.slotProps ?? {}),
          }}
          {...searchTextFieldProps}
        />
      </Box>

      {customFilterComponent ? (
        <Box className={styles.customFilterContainer}>
          {customFilterComponent}
        </Box>
      ) : (
        <Box className={styles.selectContainer}>
          <Select
            value={filterValue}
            onChange={(e) => onFilterChange(e.target.value as string)}
            size="small"
            displayEmpty
            input={
              <OutlinedInput
                startAdornment={
                  <InputAdornment position="start">
                    <FilterAltOutlined
                      className={styles.searchIcon}
                      fontSize="small"
                    />
                  </InputAdornment>
                }
              />
            }
            IconComponent={KeyboardArrowDownIcon}
          >
            {filterOptions?.map((opt) => (
              <MenuItem
                key={opt.value}
                value={opt.value}
                sx={{ fontSize: '12px' }}
              >
                {opt.label}
              </MenuItem>
            ))}
          </Select>
        </Box>
      )}

      <Box className={styles.countPill}>
        <span className={styles.countText}>
          {count} {countLabel}
        </span>
      </Box>
    </Stack>
  );
}

export default TableFilter;
