import { ReactNode, memo, useMemo } from 'react';
import {
  Box,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  IconButton,
  CircularProgress,
} from '@mui/material';
import styles from './DataTable.module.scss';
import CustomIcon from 'components/common/CustomIcon/CustomIcon';
import { IconName } from 'lucide-react/dynamic';

export interface Column<T> {
  key: string;
  label: string;
  icon?: IconName | ReactNode;
  sortable?: boolean;
  width?: string;
  minWidth?: string;
  align?: 'left' | 'center' | 'right';
  render?: (row: T) => ReactNode;
}

export interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  totalCount: number;
  page: number;
  rowsPerPage?: number;
  onPageChange: (page: number) => void;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  onSort?: (columnKey: string) => void;
  loading?: boolean;
  emptyMessage?: string;
  emptyState?: ReactNode;
  isRowFlagged?: (row: T) => boolean;
  title: string;
  getRowKey?: (row: T, index: number) => string | number;
}

const DataTable = <T extends object>({
  columns,
  data,
  totalCount,
  page,
  rowsPerPage = 8,
  onPageChange,
  sortBy,
  sortOrder,
  onSort,
  loading = false,
  emptyMessage = 'No data available',
  emptyState,
  isRowFlagged,
  title,
  getRowKey = (_, i) => i,
}: DataTableProps<T>) => {
  const totalPages = Math.ceil(totalCount / rowsPerPage);

  const handleSort = (key: string) => {
    onSort?.(key);
  };

  const renderCell = (row: T, column: Column<T>) => {
    if (column.render) return column.render(row);
    return String((row as Record<string, unknown>)[column.key] ?? '-');
  };

  // If data length equals rowsPerPage (or less for last page), assume it's already paginated from backend
  // Otherwise, paginate locally
  const isBackendPaginated = data.length <= rowsPerPage;

  const paginatedData = isBackendPaginated
    ? data
    : data.slice(page * rowsPerPage, (page + 1) * rowsPerPage);

  // Create empty rows to maintain consistent height
  const emptyRows = rowsPerPage - paginatedData.length;

  // Memoize rendered rows to prevent re-renders when data hasn't changed
  const MemoizedRow = memo(
    ({ row, rowIndex }: { row: T; rowIndex: number }) => {
      const isFlagged = isRowFlagged?.(row) ?? false;
      return (
        <TableRow
          hover
          className={`${styles.tableRow} ${
            isFlagged ? styles.tableRowFlagged : ''
          }`}
        >
          {columns.map((column) => (
            <TableCell
              key={column.key}
              align={column.align || 'left'}
              className={styles.tableCell}
              sx={{
                minWidth: column.minWidth,
                borderBottom:
                  rowIndex === paginatedData.length - 1
                    ? 'none !important'
                    : undefined,
              }}
            >
              {renderCell(row, column)}
            </TableCell>
          ))}
        </TableRow>
      );
    },
    (prev, next) => {
      // Custom comparison to prevent re-renders if row data hasn't changed
      return prev.row === next.row && prev.rowIndex === next.rowIndex;
    },
  );
  MemoizedRow.displayName = 'MemoizedRow';

  const from = page * rowsPerPage + 1;
  const to = Math.min((page + 1) * rowsPerPage, totalCount);

  // Generate page numbers to display
  const getPageNumbers = () => {
    const pages: (number | string)[] = [];

    if (totalPages <= 10) {
      // Show all pages if 10 or fewer
      for (let i = 0; i < totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Show first 5 and last 5 with ellipsis
      for (let i = 0; i < 5; i++) {
        pages.push(i);
      }
      pages.push('...');
      for (let i = totalPages - 5; i < totalPages; i++) {
        pages.push(i);
      }
    }

    return pages;
  };

  const pageNumbers = getPageNumbers();

  // Apply fadeIn animation key when data changes to trigger re-animation
  const tableKey = useMemo(
    () => `table-${data.length}-${loading}`,
    [data.length, loading],
  );

  return (
    <Box className={styles.dataTable}>
      <TableContainer className={styles.tableContainer}>
        <Table stickyHeader>
          <TableHead>
            <TableRow>
              {columns.map((column) => (
                <TableCell
                  key={column.key}
                  align={column.align || 'left'}
                  style={{ width: column.width, minWidth: column.minWidth }}
                  className={styles.tableHeaderCell}
                >
                  <Stack
                    direction="row"
                    alignItems="center"
                    justifyContent={
                      column.align === 'right'
                        ? 'flex-end'
                        : column.align === 'center'
                          ? 'center'
                          : 'flex-start'
                    }
                    spacing={0.5}
                  >
                    <button
                      className={`${styles.headerButton} ${
                        !column.sortable ? styles.notSortable : ''
                      }`}
                      onClick={() => column.sortable && handleSort(column.key)}
                      disabled={!column.sortable}
                    >
                      {typeof column.icon === 'string' ? (
                        <Box className={styles.headerIcon}>
                          <CustomIcon
                            name={column.icon as IconName}
                            size={14}
                          />
                        </Box>
                      ) : (
                        column.icon && (
                          <Box className={styles.headerIcon}>{column.icon}</Box>
                        )
                      )}
                      <span>{column.label}</span>
                      {column.sortable &&
                        (sortBy === column.key ? (
                          <Box
                            className={`${styles.sortIcon} ${
                              sortOrder === 'desc' ? styles.sortIconDesc : ''
                            }`}
                          >
                            <CustomIcon name="arrow-down-up" size={16} active />
                          </Box>
                        ) : (
                          <Box className={styles.sortIcon}>
                            <CustomIcon name="arrow-down-up" size={16} />
                          </Box>
                        ))}
                    </button>
                  </Stack>
                </TableCell>
              ))}
            </TableRow>
          </TableHead>

          <TableBody
            key={loading ? 'loading' : tableKey}
            className={
              !loading && data.length > 0 ? styles.tableBody : undefined
            }
          >
            {loading || data.length === 0 ? (
              <>
                {Array.from({ length: rowsPerPage }).map((_, i) => (
                  <TableRow key={`empty-${i}`}>
                    {columns.map((column) => (
                      <TableCell
                        key={column.key}
                        align={column.align || 'left'}
                        className={styles.tableCellEmpty}
                      >
                        &nbsp;
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </>
            ) : (
              <>
                {paginatedData.map((row, i) => {
                  const rowKey = getRowKey(row, i);
                  return <MemoizedRow key={rowKey} row={row} rowIndex={i} />;
                })}
                {emptyRows > 0 &&
                  Array.from({ length: emptyRows }).map((_, i) => (
                    <TableRow key={`empty-${i}`}>
                      {columns.map((column) => (
                        <TableCell
                          key={column.key}
                          align={column.align || 'left'}
                          className={styles.tableCellEmpty}
                          sx={{ minWidth: column.minWidth }}
                        >
                          &nbsp;
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
              </>
            )}
          </TableBody>
        </Table>

        {loading && (
          <Box className={styles.overlayMessage}>
            <CircularProgress size={40} />
          </Box>
        )}

        {!loading && data.length === 0 && (emptyState || emptyMessage) && (
          <Box className={styles.overlayMessage}>
            {emptyState || (
              <Typography variant="body2">{emptyMessage}</Typography>
            )}
          </Box>
        )}
      </TableContainer>

      <Box className={styles.paginationContainer}>
        <Typography variant="body3">
          Showing {from}-{to} of {totalCount} {title}
        </Typography>

        <Stack direction="row" spacing={1} alignItems="center">
          <IconButton
            disabled={page === 0}
            onClick={() => onPageChange(page - 1)}
            sx={{
              typography: 'body3',
              color: page === 0 ? 'text.disabled' : 'text.primary',
              borderRadius: '8px',
              padding: '6px 14px',
              '&.Mui-disabled': {
                color: 'text.disabled',
              },
              '&:hover': {
                backgroundColor: 'shadow.hoverBg',
              },
            }}
          >
            Previous
          </IconButton>

          {pageNumbers.map((pageNum, index) =>
            pageNum === '...' ? (
              <Box key={`ellipsis-${index}`} className={styles.pageEllipsis}>
                ...
              </Box>
            ) : (
              <Box
                key={pageNum}
                onClick={() => onPageChange(pageNum as number)}
                className={
                  page === pageNum
                    ? styles.pageNumber
                    : styles.pageNumberInactive
                }
                typography="body3"
              >
                {(pageNum as number) + 1}
              </Box>
            ),
          )}

          <IconButton
            disabled={page + 1 >= totalPages}
            onClick={() => onPageChange(page + 1)}
            sx={{
              typography: 'body3',
              color: page + 1 >= totalPages ? 'text.disabled' : 'text.primary',
              borderRadius: '8px',
              padding: '6px 14px',
              '&.Mui-disabled': {
                color: 'text.disabled',
              },
              '&:hover': {
                backgroundColor: 'shadow.hoverBg',
              },
            }}
          >
            Next
          </IconButton>
        </Stack>
      </Box>
    </Box>
  );
};

export default memo(DataTable) as typeof DataTable;
