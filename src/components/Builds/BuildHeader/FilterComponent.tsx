import { useState } from 'react';
import {
  Stack,
  Typography,
  Box,
  Popover,
  Button,
  useTheme,
  Select,
  MenuItem,
} from '@mui/material';
import styles from './FilterComponent.module.scss';
import { CustomIcon } from 'components/common';
import { useDispatch, useSelector } from 'react-redux';
import type { RootState } from 'store';
import {
  setBuildsDeviceFamily,
  setBuildsDeviceType,
  setBuildsFlagged,
} from 'store/slices/builds/buildsSlice';

const statuses = [
  { value: '', label: 'All Status' },
  { value: 'unflagged', label: 'Active' },
  { value: 'flagged', label: 'Inactive' },
];

function FilterComponent() {
  const theme = useTheme();
  const dispatch = useDispatch();
  const { deviceFamilies, deviceTypes } = useSelector(
    (state: RootState) => state.builds.filters,
  );
  const selectedFamily = useSelector(
    (state: RootState) => state.builds.deviceFamily,
  );
  const selectedType = useSelector(
    (state: RootState) => state.builds.deviceType,
  );
  const selectedFlagged = useSelector(
    (state: RootState) => state.builds.flagged,
  );
  const [open, setOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const family = selectedFamily || '';
  const type = selectedType || '';
  const status = (() => {
    if (selectedFlagged === undefined) return '';
    return selectedFlagged ? 'flagged' : 'unflagged';
  })();

  const handleToggle = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
    setOpen(true);
  };
  const handleClose = () => {
    setOpen(false);
    setAnchorEl(null);
  };

  return (
    <Box>
      <Stack
        className={styles.container + (open ? ' ' + styles.active : '')}
        direction="row"
        alignItems="center"
        justifyContent="flex-end"
        onClick={handleToggle}
        tabIndex={0}
        sx={{ userSelect: 'none' }}
      >
        <CustomIcon name="filter" size={18} color={theme.palette.grey[400]} />
        <Typography variant="body4" sx={{ ml: 1, mr: 1 }}>
          Filters
        </Typography>
        <CustomIcon
          name="chevron-down"
          size={18}
          color={theme.palette.grey[400]}
        />
      </Stack>
      <Popover
        open={open}
        anchorEl={anchorEl}
        onClose={handleClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        slotProps={{
          paper: {
            sx: {
              borderRadius: 3,
              minWidth: 280,
              maxHeight: 420,
              minHeight: 320,
              boxShadow: 3,
              p: 2,
              display: 'flex',
              flexDirection: 'column',
              gap: 2,
              overflowY: 'auto',
            },
          },
        }}
      >
        {/* Device Family */}
        <Box className={styles.field}>
          <Typography variant="caption" className={styles.label}>
            Device Family
          </Typography>

          <Select
            fullWidth
            value={family || ''}
            onChange={(e) =>
              dispatch(setBuildsDeviceFamily(String(e.target.value)))
            }
            displayEmpty
            IconComponent={(props) => (
              <CustomIcon
                {...props}
                name="chevron-down"
                size={18}
                color={theme.palette.grey[400]}
              />
            )}
            className={styles.select}
            MenuProps={{
              PaperProps: { className: styles.menuPaper },
            }}
          >
            <MenuItem value="" className={styles.menuItem}>
              All Families
            </MenuItem>
            {deviceFamilies.map((fam) => (
              <MenuItem key={fam} value={fam} className={styles.menuItem}>
                {fam}
              </MenuItem>
            ))}
          </Select>
        </Box>

        {/* Device Type */}
        <Box className={styles.field}>
          <Typography variant="caption" className={styles.label}>
            Device Type
          </Typography>

          <Select
            fullWidth
            value={type || ''}
            onChange={(e) =>
              dispatch(setBuildsDeviceType(String(e.target.value)))
            }
            displayEmpty
            IconComponent={(props) => (
              <CustomIcon
                {...props}
                name="chevron-down"
                size={18}
                color={theme.palette.grey[400]}
              />
            )}
            className={styles.select}
            MenuProps={{
              PaperProps: { className: styles.menuPaper },
            }}
          >
            <MenuItem value="" className={styles.menuItem}>
              All Devices
            </MenuItem>
            {deviceTypes.map((dt) => (
              <MenuItem key={dt} value={dt} className={styles.menuItem}>
                {dt}
              </MenuItem>
            ))}
          </Select>
        </Box>

        {/* Status */}
        <Box className={styles.field}>
          <Typography variant="caption" className={styles.label}>
            Status
          </Typography>

          <Select
            fullWidth
            value={status || ''}
            onChange={(e) => {
              const val = String(e.target.value);
              dispatch(
                setBuildsFlagged(
                  val === '' ? undefined : val === 'flagged' ? true : false,
                ),
              );
            }}
            displayEmpty
            IconComponent={(props) => (
              <CustomIcon
                {...props}
                name="chevron-down"
                size={18}
                color={theme.palette.grey[400]}
              />
            )}
            className={styles.select}
            MenuProps={{
              PaperProps: { className: styles.menuPaper },
            }}
          >
            {statuses.map((item) => (
              <MenuItem
                key={item.value}
                value={item.value}
                className={styles.menuItem}
              >
                {item.label}
              </MenuItem>
            ))}
          </Select>
        </Box>

        {(family || type || status) && (
          <Button
            fullWidth
            className={styles.clearBtn}
            onClick={() => {
              dispatch(setBuildsDeviceFamily(''));
              dispatch(setBuildsDeviceType(''));
              dispatch(setBuildsFlagged(undefined));
            }}
          >
            Clear All Filters
          </Button>
        )}
      </Popover>
    </Box>
  );
}

export default FilterComponent;
