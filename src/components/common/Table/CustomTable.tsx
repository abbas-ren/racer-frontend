import React, { memo, useMemo, useCallback, JSX } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  TablePagination,
  Skeleton,
} from '@mui/material';
import styles from './TableStyles.module.scss';
import clsx from 'clsx';
import { HeartbeatTimeouts } from 'pages/Admin/Devices/DeviceStatusIndicator';

export interface TableColumn<T = any> {
  key: keyof T;
  label: string;
  align?: 'left' | 'center' | 'right';
  minWidth?: number;
  width?: string;
  format?: (value: {
    userId: string;
    userName: string;
    isRequest: boolean;
    isHovered?: boolean;
    value?: string;
    row?: T;
  }) => string | React.ReactNode;
}

export interface CustomTableProps<T = any> {
  columns: TableColumn<T>[];
  data: T[];
  className?: string;
  stickyHeader?: boolean;
  showPagination?: boolean;
  rowsPerPageOptions?: number[];
  defaultRowsPerPage?: number;
  emptyMessage?: string;
  loading: boolean;
  currentPage?: number;
  setCurrentPage?: React.Dispatch<React.SetStateAction<number>>;
  selectedRow?: number;
  selectDevice?: (id: number) => void;
  totalRows?: number;
  rowsPerPage?: number;
  setRowsPerPage?: React.Dispatch<React.SetStateAction<number>>;
  heartbeatSeconds?: Record<string, number>;
}

// Memoized TableRow component to prevent unnecessary re-renders
const TableRowMemo = memo<{
  row: any;
  index: number;
  columns: TableColumn<any>[];
  selectedRow?: number;
  selectDevice?: (id: number) => void;
  heartbeatSeconds?: Record<string, number>;
  data: any[];
  hoveredRow: number | null;
  onMouseEnter: (id: number) => void;
  onMouseLeave: () => void;
}>(
  ({
    row,
    columns,
    selectedRow,
    selectDevice,
    heartbeatSeconds,
    data,
    hoveredRow,
    onMouseEnter,
    onMouseLeave,
  }) => {
    // Memoize row click handler
    const handleRowClick = useCallback(() => {
      selectDevice?.(row.id);
    }, [selectDevice, row.id]);

    const handleMouseEnter = useCallback(() => {
      onMouseEnter(row.id);
    }, [onMouseEnter, row.id]);

    // Pre-calculate row-specific values to avoid recalculation on every render
    const rowData = useMemo(() => {
      const seconds = heartbeatSeconds?.[row?.deviceId];
      const device = data?.find((d) => d?.deviceId === row?.deviceId);
      const isNotReachable =
        seconds != null && device?.heartbeatTimer
          ? seconds > device.heartbeatTimer * HeartbeatTimeouts.NOT_REACHABLE &&
            seconds < device.heartbeatTimer * HeartbeatTimeouts.FAULTY
          : false;

      return { seconds, device, isNotReachable };
    }, [heartbeatSeconds, row?.deviceId, data]);

    const isSelected = selectedRow === row.id;
    const isHovered = hoveredRow === row.id;

    return (
      <TableRow
        className={clsx(
          styles['table-body-row'],
          selectDevice ? styles['clickable-row'] : '',
          isSelected ? styles['selected'] : '',
        )}
        onClick={handleRowClick}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={onMouseLeave}
        hover={!!selectDevice}
      >
        {columns.map((column, colIndex) => (
          <TableCell
            key={colIndex}
            align={column.align || 'left'}
            className={clsx(
              styles['table-body-cell'],
              isSelected ? styles['selected_text'] : '',
              rowData.isNotReachable ? styles['not_reachable_text'] : '',
            )}
          >
            {column.format
              ? column.format({
                  userId: row.id,
                  userName: row['username'],
                  isRequest: !row.realmRoles?.includes('user'),
                  isHovered,
                  value: row[column.key],
                  row: row,
                })
              : row[column.key]}
          </TableCell>
        ))}
      </TableRow>
    );
  },
);

TableRowMemo.displayName = 'TableRowMemo';

// Memoized Skeleton Loader
const SkeletonRow = memo<{ columns: TableColumn<any>[]; rowsPerPage: number }>(
  ({ columns, rowsPerPage }) => (
    <>
      {[...Array(rowsPerPage)].map((_, index) => (
        <TableRow
          key={`skeleton-${index}`}
          className={styles['table-body-row']}
        >
          {columns.map((_, colIndex) => (
            <TableCell
              key={`${index}-${colIndex}`}
              align={columns[colIndex].align || 'left'}
              className={styles['table-body-cell']}
            >
              <Skeleton variant="text" width="80%" />
            </TableCell>
          ))}
        </TableRow>
      ))}
    </>
  ),
);

SkeletonRow.displayName = 'SkeletonRow';

// Memoized Empty Row
const EmptyRow = memo<{ columns: TableColumn<any>[]; emptyMessage: string }>(
  ({ columns, emptyMessage }) => (
    <TableRow>
      <TableCell
        colSpan={columns.length}
        align="center"
        className={styles['empty-message']}
      >
        {emptyMessage}
      </TableCell>
    </TableRow>
  ),
);

EmptyRow.displayName = 'EmptyRow';

export const CustomTable = memo(
  <T extends Record<string, any>>({
    columns,
    data,
    className = '',
    stickyHeader = false,
    showPagination = true,
    rowsPerPageOptions = [5, 10, 25, 50],
    emptyMessage = 'No data available',
    loading,
    currentPage = 0,
    setCurrentPage,
    selectedRow,
    selectDevice,
    totalRows = 0,
    rowsPerPage = 10,
    setRowsPerPage,
    heartbeatSeconds,
  }: CustomTableProps<T>) => {
    const [hoveredRow, setHoveredRow] = React.useState<number | null>(null);

    // Memoize paginated data calculation
    const paginatedData = useMemo(() => {
      if (showPagination && setCurrentPage && setRowsPerPage) {
        return data; // Server-side pagination
      }
      // Client-side pagination
      return data.slice(
        currentPage * rowsPerPage,
        currentPage * rowsPerPage + rowsPerPage,
      );
    }, [
      data,
      showPagination,
      setCurrentPage,
      setRowsPerPage,
      currentPage,
      rowsPerPage,
    ]);

    // Memoize pagination handlers
    const handleChangePage = useCallback(
      (_event: unknown, newPage: number) => {
        setCurrentPage?.(newPage);
      },
      [setCurrentPage],
    );

    const handleChangeRowsPerPage = useCallback(
      (event: React.ChangeEvent<HTMLInputElement>) => {
        setRowsPerPage?.(+event.target.value);
        setCurrentPage?.(0);
      },
      [setRowsPerPage, setCurrentPage],
    );

    // Memoize mouse event handlers
    const handleMouseEnter = useCallback((id: number) => {
      setHoveredRow(id);
    }, []);

    const handleMouseLeave = useCallback(() => {
      setHoveredRow(null);
    }, []);

    // Memoize table content to prevent unnecessary re-renders
    const tableContent = useMemo(() => {
      if (loading) {
        return <SkeletonRow columns={columns} rowsPerPage={rowsPerPage} />;
      }

      if (paginatedData.length === 0) {
        return <EmptyRow columns={columns} emptyMessage={emptyMessage} />;
      }

      // Render actual rows
      const rows = paginatedData.map((row, index) => (
        <TableRowMemo
          key={index} // Use stable key if available
          row={row}
          index={index}
          columns={columns}
          selectedRow={selectedRow}
          selectDevice={selectDevice}
          heartbeatSeconds={heartbeatSeconds}
          data={data}
          hoveredRow={hoveredRow}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        />
      ));

      return rows;
    }, [
      loading,
      paginatedData,
      columns,
      rowsPerPage,
      emptyMessage,
      selectedRow,
      selectDevice,
      heartbeatSeconds,
      data,
      hoveredRow,
      handleMouseEnter,
      handleMouseLeave,
    ]);

    return (
      <div className={clsx(styles['reusable-table-container'], className)}>
        <Paper className={styles['table-paper']}>
          <TableContainer className={styles['table-container']}>
            <Table
              stickyHeader={stickyHeader}
              className={styles['custom-table']}
            >
              <TableHead>
                <TableRow className={styles['table-header-row']}>
                  {columns.map((column, index) => (
                    <TableCell
                      key={index}
                      align={column.align || 'left'}
                      style={{ minWidth: column.minWidth, width: column.width }}
                      className={styles['table-header-cell']}
                    >
                      {column.label}
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>{tableContent}</TableBody>
            </Table>
          </TableContainer>
          {showPagination && data.length > 0 && (
            <TablePagination
              rowsPerPageOptions={rowsPerPageOptions}
              component="div"
              count={totalRows}
              rowsPerPage={rowsPerPage}
              page={currentPage}
              onPageChange={handleChangePage}
              onRowsPerPageChange={handleChangeRowsPerPage}
              className={styles['table-pagination']}
            />
          )}
        </Paper>
      </div>
    );
  },
) as <T extends Record<string, any>>(props: CustomTableProps<T>) => JSX.Element;
