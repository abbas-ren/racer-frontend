import {
  Checkbox,
  ClickAwayListener,
  FormControlLabel,
  Paper,
  Popper,
  Stack,
  Typography,
  useTheme,
} from '@mui/material';
import ExpandMoreSharp from '@mui/icons-material/ExpandMoreSharp';
import styles from './DeviceDetailsTable.module.scss';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { DashboardTableColumn, RootState, setDashboardColumns } from 'store';

function TableColumnsCustomize() {
  const dispatch = useDispatch();
  const { columns } = useSelector((state: RootState) => state.dashboard);
  const [columnList, setColumnList] = useState<DashboardTableColumn[]>([]);
  const theme = useTheme();
  const [open, setOpen] = useState(false);
  const anchorRef = useRef<HTMLDivElement | null>(null);
  const handleToggle = () => setOpen((prev) => !prev);
  const handleClose = useCallback(() => {
    if (columns) setColumnList(columns);
    setOpen(false);
  }, [columns]);

  const handleSubmit = useCallback(() => {
    dispatch(setDashboardColumns(columnList));
    setOpen(false);
  }, [dispatch, columnList, setOpen]);

  useEffect(() => {
    if (columns && columns.length > 0) {
      setColumnList(columns);
    }
  }, [columns]);

  return (
    <>
      <Stack
        alignItems="center"
        justifyContent="center"
        direction="row"
        className={styles.dropDown}
        ref={anchorRef}
        onClick={handleToggle}
      >
        <Typography variant="body2" color="primary.300">
          Columns
        </Typography>
        <ExpandMoreSharp className={styles.expandIcon} />
      </Stack>
      <Popper
        open={open}
        anchorEl={anchorRef.current}
        placement="bottom"
        sx={{
          zIndex: 2,
        }}
        modifiers={[
          {
            name: 'offset',
            options: {
              offset: [0, 8],
            },
          },
        ]}
      >
        <ClickAwayListener onClickAway={handleClose}>
          <Paper elevation={4} className={styles.popperPaper}>
            <Stack className={styles.columnsList}>
              {columnList?.map((column) => (
                <Stack
                  key={column.name}
                  direction="row"
                  gap="0.5rem"
                  className={styles.columnsListItem}
                >
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={column.visible}
                        onChange={(e) => {
                          const updatedColumns = columnList.map((col) =>
                            col.name === column.name
                              ? { ...col, visible: e.target.checked }
                              : col,
                          );
                          setColumnList(updatedColumns);
                        }}
                        sx={{
                          color: theme.palette.primary[300],
                          '&.Mui-checked': {
                            color: theme.palette.primary[300],
                          },
                          '& .MuiSvgIcon-root': { fontSize: '1rem' },
                        }}
                      />
                    }
                    label={
                      <Typography variant="body2">{column.label}</Typography>
                    }
                  />
                </Stack>
              ))}
            </Stack>
            <Stack
              className={styles.applyButton}
              alignItems="center"
              justifyContent="center"
              onClick={handleSubmit}
            >
              <Typography variant="body2" color="button.primary.text">
                Apply
              </Typography>
            </Stack>
          </Paper>
        </ClickAwayListener>
      </Popper>
    </>
  );
}

export default TableColumnsCustomize;
