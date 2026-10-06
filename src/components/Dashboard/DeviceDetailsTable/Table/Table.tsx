import {
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';
import { useMemo, useRef, useEffect, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from 'store/store';
import styles from './Table.module.scss';
import useDevice from 'hooks/useDevice';
import TableRowItem from './TableRowItem';
import { DashboardTableColumn, fetchDeviceRequest } from 'store/index';

function TableContent() {
  const dispatch = useDispatch();
  const devices = useDevice();
  const columns = useSelector((state: RootState) => state.dashboard.columns);
  const tableContainerRef = useRef<HTMLDivElement>(null);
  const isLoadingRef = useRef(false);

  const filteredColumns = useMemo(
    () => columns?.filter((column: DashboardTableColumn) => column.visible),
    [columns],
  );

  const loadMore = useCallback(() => {
    if (
      !devices.loading &&
      !isLoadingRef.current &&
      devices.currentPage < devices.totalPages
    ) {
      isLoadingRef.current = true;
      dispatch(
        fetchDeviceRequest({
          page: devices.currentPage + 1,
          limit: 16,
          sortBy: 'createdAt',
          desc: 'true',
        }),
      );
    }
  }, [dispatch, devices.loading, devices.currentPage, devices.totalPages]);

  useEffect(() => {
    if (!devices.loading) {
      isLoadingRef.current = false;
    }
  }, [devices.loading]);

  useEffect(() => {
    const container = tableContainerRef.current;
    if (!container) return;

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = container;
      if (scrollTop + clientHeight >= scrollHeight - 100) {
        loadMore();
      }
    };

    container.addEventListener('scroll', handleScroll);
    return () => container.removeEventListener('scroll', handleScroll);
  }, [loadMore]);

  return (
    <TableContainer
      component={Paper}
      className={styles.tableContainer}
      ref={tableContainerRef}
    >
      <Table stickyHeader aria-label="dashboard-table" size="small">
        <TableHead className={styles.tableHead}>
          <TableRow>
            {filteredColumns?.map((column) => (
              <TableCell
                component="td"
                key={column.name}
                sx={{
                  minWidth: column.minWidth,
                }}
                className={styles.tableHeaderCell}
              >
                <Stack className={`flex-${column.align}`}>
                  <Typography variant="button2" color="primary.main">
                    {column.label}
                  </Typography>
                </Stack>
              </TableCell>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          {filteredColumns &&
            filteredColumns?.length > 0 &&
            devices?.data.map((row) => (
              <TableRowItem
                key={row.deviceId}
                row={row}
                filteredColumns={filteredColumns}
              />
            ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}

export default TableContent;
