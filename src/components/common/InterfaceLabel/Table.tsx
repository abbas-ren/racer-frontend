import {
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';
import { useCallback, useMemo, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from 'store/store';
import styles from './Table.module.scss';
import useDevice from 'hooks/useDevice';
import TableRowItem from './TableRowItem';
import { useIntersectionObserver } from 'hooks';
import { fetchDeviceRequest } from 'store/index';

function TableContent() {
  const dispatch = useDispatch();
  const devices = useDevice();
  const columns = useSelector((state: RootState) => state.dashboard.columns);
  const loadingRef = useRef<HTMLDivElement>(null);

  const filteredColumns = useMemo(
    () => columns?.filter((column) => column.visible),
    [columns],
  );

  const loadMore = useCallback(() => {
    if (!devices.loading && devices.currentPage < devices.totalPages) {
      dispatch(
        fetchDeviceRequest({
          page: (devices.currentPage + 1).toString(),
          limit: '10',
          sortBy: 'createdAt',
          desc: 'true',
        }),
      );
    }
  }, [devices.loading, devices.currentPage, devices.totalPages, dispatch]);

  useIntersectionObserver(loadingRef, loadMore);

  return (
    <TableContainer component={Paper} className={styles.tableContainer}>
      <Table stickyHeader aria-label="dashboard-table">
        <TableHead className={styles.tableHead}>
          <TableRow>
            {filteredColumns?.map((column) => (
              <TableCell
                component="th"
                key={column.name}
                sx={{
                  minWidth: column.minWidth,
                }}
                className={styles.tableHeaderCell}
              >
                <Typography variant="button2" color="primary.main">
                  {column.label}
                </Typography>
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
          <TableRow>
            <TableCell
              ref={loadingRef}
              colSpan={filteredColumns?.length || 1}
              style={{ height: '1.25rem', padding: 0, border: 'none' }}
            />
          </TableRow>
        </TableBody>
      </Table>
    </TableContainer>
  );
}

export default TableContent;
