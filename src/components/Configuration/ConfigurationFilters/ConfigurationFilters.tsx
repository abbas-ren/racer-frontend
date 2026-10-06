import { memo } from 'react';
import SearchIcon from '@mui/icons-material/Search';
import FilterListOutlinedIcon from '@mui/icons-material/FilterListOutlined';
import CloseIcon from '@mui/icons-material/Close';
import {
  Button,
  InputAdornment,
  MenuItem,
  Select,
  TextField,
} from '@mui/material';
import type { ControllerStatus } from 'types/configuration';
import styles from './ConfigurationFilters.module.scss';

interface ConfigurationFiltersProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  statusFilter: 'All' | ControllerStatus;
  onStatusChange: (value: 'All' | ControllerStatus) => void;
  hasActiveFilters: boolean;
  onClearFilters: () => void;
}

const ConfigurationFilters = ({
  searchTerm,
  onSearchChange,
  statusFilter,
  onStatusChange,
  hasActiveFilters,
  onClearFilters,
}: ConfigurationFiltersProps) => {
  return (
    <div className={styles.filtersContainer}>
      <TextField
        value={searchTerm}
        onChange={(event) => onSearchChange(event.target.value)}
        placeholder="Search by controller ID, name, or IP..."
        size="small"
        fullWidth
        className={styles.searchField}
        sx={{
          '& .MuiOutlinedInput-root': {
            height: 40,
            borderRadius: '8px',
            backgroundColor: 'common.white',
            '& input': {
              fontSize: 13,
              fontWeight: 500,
              color: 'text.secondary',
              fontFamily: 'var(--mui-font-family)',
              px: 1,
              '&::placeholder': {
                color: 'grey.400',
                opacity: 1,
              },
            },
            '& .MuiOutlinedInput-notchedOutline': {
              borderColor: 'grey.300',
            },
            '&:hover .MuiOutlinedInput-notchedOutline': {
              borderColor: 'grey.400',
            },
            '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
              borderColor: 'primary.main',
              borderWidth: 1,
            },
          },
        }}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <SearchIcon className={styles.searchIcon} />
            </InputAdornment>
          ),
        }}
      />

      <Select
        size="small"
        value={statusFilter}
        onChange={(event) =>
          onStatusChange(event.target.value as 'All' | ControllerStatus)
        }
        className={styles.statusSelect}
        sx={{
          height: 40,
          borderRadius: '8px',
          backgroundColor: 'common.white',
          '& .MuiSelect-select': {
            display: 'flex',
            alignItems: 'center',
            fontSize: 13,
            fontWeight: 500,
            color: 'text.primary',
            fontFamily: 'var(--mui-font-family)',
            minHeight: 'unset',
          },
          '& .MuiOutlinedInput-notchedOutline': {
            borderColor: 'grey.300',
          },
          '& .MuiSelect-icon': {
            color: 'grey.400',
            fontSize: 18,
          },
        }}
        startAdornment={
          <FilterListOutlinedIcon
            className={styles.filterIcon}
            fontSize="small"
          />
        }
      >
        <MenuItem value="All" className={styles.menuItem}>
          All Status
        </MenuItem>
        <MenuItem value="Online" className={styles.menuItem}>
          Online
        </MenuItem>
        <MenuItem value="Offline" className={styles.menuItem}>
          Offline
        </MenuItem>
      </Select>

      {hasActiveFilters && (
        <Button
          variant="text"
          size="small"
          startIcon={<CloseIcon fontSize="small" />}
          onClick={onClearFilters}
          className={styles.clearFiltersButton}
          sx={{
            '& .MuiButton-startIcon': {
              mr: '4px',
              ml: 0,
            },
            '& .MuiSvgIcon-root': {
              fontSize: 14,
            },
          }}
        >
          Clear Filters
        </Button>
      )}
    </div>
  );
};

export default memo(ConfigurationFilters);
