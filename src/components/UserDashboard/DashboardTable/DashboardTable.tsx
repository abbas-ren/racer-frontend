import {
  Button,
  Chip,
  IconButton,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  useTheme,
} from '@mui/material';
import type { Theme } from '@mui/material/styles';
import TrendingUpRoundedIcon from '@mui/icons-material/TrendingUpRounded';
import FileDownloadOutlinedIcon from '@mui/icons-material/FileDownloadOutlined';
import CheckRoundedIcon from '@mui/icons-material/CheckRounded';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import FiberManualRecordIcon from '@mui/icons-material/FiberManualRecord';
import AutorenewRoundedIcon from '@mui/icons-material/AutorenewRounded';
import StopRoundedIcon from '@mui/icons-material/StopRounded';
import dayjs from 'dayjs';
import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router';
import { TestStatus } from 'typesCustom/tests';
import toastService from 'services/ToastService';
import { downloadUserDashboardExecutionLogRequest } from 'store/slices/userDashboard/userDashboardSlice';
import { fetchUserDashboardTestCasesByExecutionIdRequest } from 'store/slices/userDashboard/userDashboardSlice';
import {
  selectUserDashboardTestCasesByExecutionId,
  selectUserDashboardTestCasesLoadingByExecutionId,
} from 'store/selectors/userDashboardSelectors';
import { TEST_RESULTS_BASE_URL } from 'constants/config';
import type { RootState } from 'store/store';
import {
  DashboardTableRow,
  getDisplayedDeviceName,
  getExecutionCounts,
  getNormalizedExecutionMetrics,
  normalizeExecutionStatus,
} from '../shared/testExecutionData';
import { DASHBOARD_TABLE_EXPORT_HEADERS } from '../shared/dashboardTableExport';
import TestSuiteDrawer from 'components/UserDashboard/shared/TestSuiteDrawer';
import type { TestSuiteCase } from 'components/UserDashboard/shared/TestSuiteDrawer';
import { TEST_RAIL_VIEW_URL } from 'constants/config';
import CustomIcon from 'components/common/CustomIcon/CustomIcon';
import ReportDialog from './ReportDialog';
import styles from './DashboardTable.module.scss';

const ROWS_PER_PAGE = 10;

const getDurationMinutes = (seconds: number) => `${(seconds / 60).toFixed(1)}m`;

const getExecutionStatusConfig = (
  status: TestStatus | string,
  theme: Theme,
) => {
  switch (normalizeExecutionStatus(status)) {
    case TestStatus.COMPLETED:
      return {
        label: 'COMPLETED',
        color: theme.palette.success.dark,
        bg: '#EAF8F0',
        Icon: CheckRoundedIcon,
      };
    case TestStatus.FAILED:
      return {
        label: 'FAILED',
        color: theme.palette.error.dark,
        bg: '#FDEDED',
        Icon: CloseRoundedIcon,
      };
    case TestStatus.CANCELLED:
      return {
        label: 'CANCELLED',
        color: theme.palette.grey[700],
        bg: theme.palette.grey[200],
        Icon: StopRoundedIcon,
      };
    case TestStatus.QUEUED:
      return {
        label: 'QUEUED',
        color: theme.palette.warning.dark,
        bg: '#FFF7E6',
        Icon: FiberManualRecordIcon,
      };
    default:
      return {
        label: 'RUNNING',
        color: theme.palette.info.dark,
        bg: '#EAF2FF',
        Icon: AutorenewRoundedIcon,
      };
  }
};

const getPageNumbers = (current: number, total: number): (number | '...')[] => {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  if (current <= 4) return [1, 2, 3, 4, 5, '...', total];
  if (current >= total - 3)
    return [1, '...', total - 4, total - 3, total - 2, total - 1, total];
  return [1, '...', current - 1, current, current + 1, '...', total];
};

interface DashboardTableProps {
  selectedTrendDate?: string | null;
  executions: DashboardTableRow[];
}

function DashboardTable({
  selectedTrendDate,
  executions,
}: DashboardTableProps) {
  const theme = useTheme();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [currentPage, setCurrentPage] = useState(1);
  const [prevTrendDate, setPrevTrendDate] = useState<string | null | undefined>(
    selectedTrendDate,
  );
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [sortAnimationKey, setSortAnimationKey] = useState(0);
  const [selectedExecutionId, setSelectedExecutionId] = useState<string | null>(
    null,
  );
  const [reportDialogRow, setReportDialogRow] =
    useState<DashboardTableRow | null>(null);

  const selectedExecutionRow = selectedExecutionId
    ? (executions.find((row) => row.testId === selectedExecutionId) ?? null)
    : null;

  const selectedExecutionCases = useSelector((state: RootState) =>
    selectedExecutionId
      ? selectUserDashboardTestCasesByExecutionId(state, selectedExecutionId)
      : [],
  );

  const isDrawerCasesLoading = useSelector((state: RootState) =>
    selectedExecutionId
      ? selectUserDashboardTestCasesLoadingByExecutionId(
          state,
          selectedExecutionId,
        )
      : false,
  );

  const handleExport = () => {
    if (typeof window === 'undefined') return;

    if (!exportRows.length) {
      toastService.info('No test execution data available to export.');
      return;
    }

    const rows = exportRows.map((row) => {
      const counts = getExecutionCounts(row);
      const metrics = getNormalizedExecutionMetrics(row);
      const statusLabel = getExecutionStatusConfig(row.status, theme).label;

      return [
        row.createdAt ? dayjs(row.createdAt).format('MMM DD, YYYY') : '-',
        row.testId,
        row.testCycleId || '-',
        getDisplayedDeviceName(row),
        row.buildId || '-',
        row.testPlanName || '-',
        statusLabel,
        counts.total,
        row.passed,
        row.failed,
        getDurationMinutes(metrics.durationSeconds),
      ];
    });

    const csvContent = [
      DASHBOARD_TABLE_EXPORT_HEADERS.map(escapeCsvField).join(','),
      ...rows.map((row) => row.map((cell) => escapeCsvField(cell)).join(',')),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', getExportFileName());
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  };

  const handleRegressionReport = () => {
    toastService.info('Regression report export is not available yet.');
  };

  const handleTableRowClick = (row: DashboardTableRow) => {
    setSelectedExecutionId(row.testId);
    dispatch(
      fetchUserDashboardTestCasesByExecutionIdRequest({
        executionId: row.testId,
      }),
    );
  };

  const handleTestIdClick = (testId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    localStorage.setItem('activeTestId', testId);
    navigate('/user/tests');
  };

  const handleTestCycleIdClick = (testCycleId: number, e: React.MouseEvent) => {
    e.stopPropagation();
    const url = `${TEST_RAIL_VIEW_URL.replace('%d', String(testCycleId))}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const handleDrawerClose = () => {
    setSelectedExecutionId(null);
  };

  const handleDownloadCaseLog = (testCase: TestSuiteCase) => {
    if (!testCase.outputFilePath) return;
    const url = `${TEST_RESULTS_BASE_URL}${testCase.outputFilePath}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const handleDownloadDmesg = (testCase: TestSuiteCase) => {
    if (!testCase.dmesgFilePath) return;
    const url = `${TEST_RESULTS_BASE_URL}${testCase.dmesgFilePath}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const handleExportLogs = () => {
    if (!selectedExecutionRow?.testId) {
      toastService.info('No execution selected for log download.');
      return;
    }

    dispatch(
      downloadUserDashboardExecutionLogRequest({
        testId: selectedExecutionRow.testId,
      }),
    );
  };

  const handleViewIssueClick = (testCase: TestSuiteCase) => {
    if (typeof window !== 'undefined' && testCase.jiraUrl) {
      window.open(testCase.jiraUrl, '_blank', 'noopener,noreferrer');
    }
  };

  const handleViewExternalClick = (testCase: TestSuiteCase) => {
    if (typeof window !== 'undefined' && testCase.gitlabUrl) {
      window.open(testCase.gitlabUrl, '_blank', 'noopener,noreferrer');
    }
  };

  const toggleSortDirection = () => {
    setCurrentPage(1);
    setSortAnimationKey((previous) => previous + 1);
    setSortDirection((previous) => (previous === 'desc' ? 'asc' : 'desc'));
  };

  const sortedExecutions = (() => {
    const sortedRows = [...executions];

    sortedRows.sort((left, right) => {
      const leftDate = dayjs(left.createdAt).valueOf();
      const rightDate = dayjs(right.createdAt).valueOf();

      return sortDirection === 'desc'
        ? rightDate - leftDate
        : leftDate - rightDate;
    });

    return sortedRows;
  })();

  const totalPages = Math.max(
    1,
    Math.ceil(sortedExecutions.length / ROWS_PER_PAGE),
  );
  const startIndex = (currentPage - 1) * ROWS_PER_PAGE;
  const paginatedRows = sortedExecutions.slice(
    startIndex,
    startIndex + ROWS_PER_PAGE,
  );

  const selectedDateRows = !selectedTrendDate
    ? []
    : sortedExecutions.filter((row) =>
        dayjs(row.createdAt).isSame(dayjs(selectedTrendDate), 'day'),
      );

  const selectedDateSummary = (() => {
    if (!selectedDateRows.length) return null;

    const aggregate = selectedDateRows.reduce(
      (acc, row) => {
        const metrics = getNormalizedExecutionMetrics(row);
        acc.total += metrics.total;
        acc.passed += metrics.passed;
        acc.failed += metrics.failed;
        acc.durationSeconds += metrics.durationSeconds;
        return acc;
      },
      { total: 0, passed: 0, failed: 0, durationSeconds: 0 },
    );

    return {
      total: aggregate.total,
      passed: aggregate.passed,
      failed: aggregate.failed,
      durationMinutes: Number((aggregate.durationSeconds / 60).toFixed(1)),
    };
  })();

  const selectedExecutionCounts = selectedExecutionRow
    ? getExecutionCounts(selectedExecutionRow)
    : { total: 0, passed: 0, failed: 0 };

  const exportRows =
    selectedTrendDate && selectedDateRows.length > 0
      ? selectedDateRows
      : sortedExecutions;

  const escapeCsvField = (value: string | number) => {
    const text = String(value ?? '');

    if (text.includes(',') || text.includes('"') || text.includes('\n')) {
      return `"${text.replace(/"/g, '""')}"`;
    }

    return text;
  };

  const getExportFileName = () => {
    const dateStamp = dayjs().format('YYYY-MM-DD');

    if (selectedTrendDate && selectedDateRows.length > 0) {
      return `test_performance_${dayjs(selectedTrendDate).format('YYYY-MM-DD')}_${dateStamp}.csv`;
    }

    return `test_performance_${dateStamp}.csv`;
  };

  // When selectedTrendDate changes, jump to the page containing the first
  // matching row. Uses the "adjusting state during rendering" pattern instead
  // of useEffect so the React Compiler doesn't flag cascading renders.
  if (selectedTrendDate !== prevTrendDate) {
    setPrevTrendDate(selectedTrendDate);
    if (selectedTrendDate) {
      const firstMatchIndex = sortedExecutions.findIndex((row) =>
        dayjs(row.createdAt).isSame(dayjs(selectedTrendDate), 'day'),
      );
      if (firstMatchIndex >= 0) {
        setCurrentPage(Math.floor(firstMatchIndex / ROWS_PER_PAGE) + 1);
      }
    }
  }

  const currentRangeStart =
    paginatedRows.length === 0 ? 0 : (currentPage - 1) * ROWS_PER_PAGE + 1;
  const currentRangeEnd =
    paginatedRows.length === 0
      ? 0
      : currentRangeStart + paginatedRows.length - 1;
  const emptyRowsCount = Math.max(0, ROWS_PER_PAGE - paginatedRows.length);

  return (
    <Stack className={styles.tableWrap}>
      <Stack
        id="test-performance-analysis-section"
        tabIndex={-1}
        className={styles.tablePanel}
        sx={{ outline: 'none' }}
      >
        <Stack className={styles.tableTopBar} direction="row">
          <Typography
            variant="h6"
            color="primary.text.main"
            sx={{ lineHeight: 1.2, fontWeight: 400 }}
          >
            Test Performance Analysis
          </Typography>

          <Stack direction="row" gap="0.675rem" className={styles.tableActions}>
            <Button
              variant="contained"
              onClick={handleRegressionReport}
              startIcon={<TrendingUpRoundedIcon />}
              className={styles.tableBtnPrimary}
            >
              Regression Report
            </Button>
            <Button
              variant="outlined"
              onClick={handleExport}
              startIcon={<FileDownloadOutlinedIcon />}
              className={styles.tableBtnSecondary}
            >
              Export
            </Button>
          </Stack>
        </Stack>

        <TableContainer className={styles.tableContainer}>
          {selectedTrendDate ? (
            <Stack className={styles.tableDateBanner}>
              <Typography variant="body2">
                Showing tests from{' '}
                {dayjs(selectedTrendDate).format('MMM DD, YYYY')} (highlighted
                below)
                {selectedDateSummary
                  ? ` • Total: ${selectedDateSummary.total} | Passed: ${selectedDateSummary.passed} | Failed: ${selectedDateSummary.failed} | Duration: ${selectedDateSummary.durationMinutes}m`
                  : ''}
              </Typography>
            </Stack>
          ) : null}
          <Table
            stickyHeader
            aria-label="user-dashboard-performance-table"
            className={styles.fixedTable}
          >
            <TableHead>
              <TableRow>
                <TableCell
                  className={styles.tableHeadCell}
                  align="center"
                  onClick={toggleSortDirection}
                  sx={{
                    cursor: 'pointer',
                    minWidth: 110,
                    textAlign: 'center !important',
                  }}
                >
                  <Stack
                    direction="row"
                    alignItems="center"
                    justifyContent="center"
                    gap="0.35rem"
                  >
                    <CustomIcon name="calendar" size={14} />
                    <Typography variant="button2">Date</Typography>
                    <CustomIcon name="arrow-down-up" size={14} />
                  </Stack>
                </TableCell>
                <TableCell
                  className={styles.tableHeadCell}
                  align="center"
                  sx={{ minWidth: 140, textAlign: 'center !important' }}
                >
                  <Typography variant="button2">Test ID</Typography>
                </TableCell>
                <TableCell
                  className={styles.tableHeadCell}
                  align="center"
                  sx={{ minWidth: 100, textAlign: 'center !important' }}
                >
                  <Typography variant="button2">TestRail ID</Typography>
                </TableCell>
                <TableCell
                  className={styles.tableHeadCell}
                  align="center"
                  sx={{ minWidth: 120, textAlign: 'center !important' }}
                >
                  <Stack
                    direction="row"
                    alignItems="center"
                    justifyContent="center"
                    gap="0.35rem"
                  >
                    <CustomIcon name="cpu" size={14} />
                    <Typography variant="button2">Device</Typography>
                  </Stack>
                </TableCell>
                <TableCell
                  className={styles.tableHeadCell}
                  align="center"
                  sx={{ minWidth: 120, textAlign: 'center !important' }}
                >
                  <Typography variant="button2">Build Version</Typography>
                </TableCell>
                <TableCell
                  className={styles.tableHeadCell}
                  align="center"
                  sx={{ minWidth: 140, textAlign: 'center !important' }}
                >
                  <Typography variant="button2">Test Plan</Typography>
                </TableCell>
                <TableCell
                  className={styles.tableHeadCell}
                  align="center"
                  sx={{ minWidth: 150, textAlign: 'center !important' }}
                >
                  <Typography variant="button2">Execution Status</Typography>
                </TableCell>
                <TableCell
                  className={styles.tableHeadCell}
                  align="center"
                  sx={{ minWidth: 70, textAlign: 'center !important' }}
                >
                  <Typography variant="button2">Total</Typography>
                </TableCell>
                <TableCell
                  className={styles.tableHeadCell}
                  align="center"
                  sx={{ minWidth: 90, textAlign: 'center !important' }}
                >
                  <Stack
                    direction="row"
                    alignItems="center"
                    justifyContent="center"
                    gap="0.35rem"
                  >
                    <CustomIcon name="circle-check" size={14} />
                    <Typography variant="button2">Passed</Typography>
                  </Stack>
                </TableCell>
                <TableCell
                  className={styles.tableHeadCell}
                  align="center"
                  sx={{ minWidth: 90, textAlign: 'center !important' }}
                >
                  <Stack
                    direction="row"
                    alignItems="center"
                    justifyContent="center"
                    gap="0.35rem"
                  >
                    <CustomIcon name="circle-x" size={14} />
                    <Typography variant="button2">Failed</Typography>
                  </Stack>
                </TableCell>
                <TableCell
                  className={styles.tableHeadCell}
                  align="center"
                  sx={{ minWidth: 120, textAlign: 'center !important' }}
                >
                  <Stack
                    direction="row"
                    alignItems="center"
                    justifyContent="center"
                    gap="0.35rem"
                  >
                    <CustomIcon name="clock-3" size={14} />
                    <Typography variant="button2">Duration (Min)</Typography>
                  </Stack>
                </TableCell>
                <TableCell
                  className={styles.tableHeadCell}
                  align="center"
                  sx={{ minWidth: 100, textAlign: 'center !important' }}
                >
                  <Typography variant="button2">Actions</Typography>
                </TableCell>
              </TableRow>
            </TableHead>

            <TableBody
              key={`sort-animation-${sortAnimationKey}`}
              className={styles.tableBodySortAnimation}
            >
              {paginatedRows.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={11}
                    align="center"
                    className={styles.tableEmptyCell}
                  >
                    <Typography variant="body2" color="text.secondary">
                      No test executions found.
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                <>
                  {paginatedRows.map((row) => {
                    const statusConfig = getExecutionStatusConfig(
                      row.status,
                      theme,
                    );
                    const counts = getExecutionCounts(row);
                    const metrics = getNormalizedExecutionMetrics(row);
                    const isSelectedDate = selectedTrendDate
                      ? dayjs(row.createdAt).isSame(
                          dayjs(selectedTrendDate),
                          'day',
                        )
                      : false;

                    return (
                      <TableRow
                        key={row.testId}
                        hover
                        className={`${styles.tableRow} ${isSelectedDate ? styles.tableRowSelected : ''}`}
                        onClick={() => {
                          handleTableRowClick(row);
                        }}
                        sx={{ cursor: 'pointer' }}
                      >
                        <TableCell
                          align="center"
                          className={styles.tableBodyCell}
                          sx={{ textAlign: 'center !important' }}
                        >
                          <Typography variant="body2" color="text.secondary">
                            {row.createdAt
                              ? dayjs(row.createdAt).format('MMM DD, YYYY')
                              : '-'}
                          </Typography>
                        </TableCell>
                        <TableCell
                          align="center"
                          className={styles.tableBodyCell}
                          sx={{ textAlign: 'center !important' }}
                        >
                          <Typography
                            variant="body2"
                            className={styles.tableLink}
                            onClick={(e) => handleTestIdClick(row.testId, e)}
                            role="button"
                            tabIndex={0}
                            onKeyDown={(event) => {
                              if (event.key === 'Enter' || event.key === ' ') {
                                event.preventDefault();
                                event.stopPropagation();
                              }
                            }}
                          >
                            {row.testId}
                          </Typography>
                        </TableCell>
                        <TableCell
                          align="center"
                          className={styles.tableBodyCell}
                          sx={{ textAlign: 'center !important' }}
                        >
                          <Typography
                            variant="body2"
                            className={styles.tableLink}
                            onClick={(e) => {
                              if (row.testCycleId) {
                                handleTestCycleIdClick(
                                  Number(row.testCycleId),
                                  e,
                                );
                              }
                            }}
                            role="button"
                            tabIndex={0}
                            onKeyDown={(event) => {
                              if (event.key === 'Enter' || event.key === ' ') {
                                event.preventDefault();
                                event.stopPropagation();
                              }
                            }}
                          >
                            {row.testCycleId ? `R${row.testCycleId}` : '-'}
                          </Typography>
                        </TableCell>
                        <TableCell
                          align="center"
                          className={styles.tableBodyCell}
                          sx={{ textAlign: 'center !important' }}
                        >
                          <Typography variant="body2">
                            {getDisplayedDeviceName(row)}
                          </Typography>
                        </TableCell>
                        <TableCell
                          align="center"
                          className={styles.tableBodyCell}
                          sx={{ textAlign: 'center !important' }}
                        >
                          <Typography variant="body2">
                            {row.buildVersion || '-'}
                          </Typography>
                        </TableCell>
                        <TableCell
                          align="center"
                          className={styles.tableBodyCell}
                          sx={{ textAlign: 'center !important' }}
                        >
                          <Typography variant="body2">
                            {row.testPlanName || '-'}
                          </Typography>
                        </TableCell>
                        <TableCell
                          align="center"
                          className={styles.tableBodyCell}
                          sx={{ textAlign: 'center !important' }}
                        >
                          <Stack direction="row" justifyContent="center">
                            <Chip
                              icon={<statusConfig.Icon />}
                              label={statusConfig.label}
                              size="small"
                              className={styles.tableStatusChip}
                              sx={{
                                color: statusConfig.color,
                                backgroundColor: statusConfig.bg,
                                fontSize: '10px !important',
                                '& .MuiChip-label': {
                                  fontSize: '10px !important',
                                  fontWeight: 400,
                                  lineHeight: 1.1,
                                },
                                '& .MuiChip-labelSmall': {
                                  fontSize: '10px !important',
                                  fontWeight: 400,
                                  lineHeight: 1.1,
                                },
                                '& .MuiChip-icon': {
                                  color: statusConfig.color,
                                  fontSize: '0.7rem',
                                },
                              }}
                            />
                          </Stack>
                        </TableCell>
                        <TableCell
                          align="center"
                          className={styles.tableBodyCell}
                          sx={{ textAlign: 'center !important' }}
                        >
                          <Typography variant="body2">
                            {counts.total}
                          </Typography>
                        </TableCell>
                        <TableCell
                          align="center"
                          className={styles.tableBodyCell}
                          sx={{ textAlign: 'center !important' }}
                        >
                          <Typography variant="body2" color="success.main">
                            {counts.passed}
                          </Typography>
                        </TableCell>
                        <TableCell
                          align="center"
                          className={styles.tableBodyCell}
                          sx={{ textAlign: 'center !important' }}
                        >
                          <Typography variant="body2" color="error.main">
                            {counts.failed}
                          </Typography>
                        </TableCell>
                        <TableCell
                          align="center"
                          className={styles.tableBodyCell}
                          sx={{ textAlign: 'center !important' }}
                        >
                          <Typography variant="body2">
                            {getDurationMinutes(metrics.durationSeconds)}
                          </Typography>
                        </TableCell>
                        <TableCell
                          align="center"
                          className={styles.tableBodyCell}
                          sx={{ textAlign: 'center !important' }}
                          onClick={(e) => e.stopPropagation()}
                        >
                          {row.status === TestStatus.COMPLETED && (
                            <IconButton
                              size="small"
                              title="Generate / View Report"
                              onClick={(e) => {
                                e.stopPropagation();
                                setReportDialogRow(row);
                              }}
                              sx={{
                                color: theme.palette.primary.main,
                                borderRadius: '0.5rem',
                                '&:hover': {
                                  backgroundColor: 'rgba(103, 100, 255, 0.1)',
                                },
                              }}
                            >
                              <CustomIcon
                                name="file-chart-column"
                                size={17}
                                color="currentColor"
                              />
                            </IconButton>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                  {Array.from({ length: emptyRowsCount }).map((_, index) => (
                    <TableRow
                      key={`empty-row-${index}`}
                      className={styles.tableRow}
                    >
                      {Array.from({ length: 12 }).map((_, cellIdx) => (
                        <TableCell
                          key={`empty-cell-${cellIdx}`}
                          align="center"
                          className={styles.tableBodyCell}
                          sx={{ textAlign: 'center !important' }}
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
        </TableContainer>

        <Stack className={styles.tableFooter} direction="row">
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ fontSize: '12px !important' }}
          >
            Showing {currentRangeStart}-{currentRangeEnd} of{' '}
            {sortedExecutions.length} test suites
            {selectedTrendDate && selectedDateRows.length > 0
              ? ` • ${selectedDateRows.length} on ${dayjs(selectedTrendDate).format('MMM DD, YYYY')}`
              : ''}
          </Typography>

          <Stack direction="row" alignItems="center" gap="0.25rem">
            <Button
              variant="text"
              disabled={currentPage <= 1}
              onClick={() =>
                setCurrentPage((previous) => Math.max(1, previous - 1))
              }
              className={styles.tablePaginateBtn}
            >
              Previous
            </Button>

            {getPageNumbers(currentPage, totalPages).map((page, idx) =>
              page === '...' ? (
                <Typography
                  key={`ellipsis-${idx}`}
                  variant="body2"
                  sx={{ px: 0.5, color: 'text.secondary' }}
                >
                  ...
                </Typography>
              ) : (
                <Button
                  key={page}
                  variant={page === currentPage ? 'contained' : 'text'}
                  onClick={() => setCurrentPage(page as number)}
                  className={
                    page === currentPage
                      ? styles.tablePaginateBtnActive
                      : styles.tablePaginateBtn
                  }
                >
                  {page}
                </Button>
              ),
            )}

            <Button
              variant="text"
              disabled={currentPage >= totalPages}
              onClick={() =>
                setCurrentPage((previous) => Math.min(totalPages, previous + 1))
              }
              className={styles.tablePaginateBtn}
            >
              Next
            </Button>
          </Stack>
        </Stack>
      </Stack>

      <TestSuiteDrawer
        open={Boolean(selectedExecutionRow)}
        onClose={handleDrawerClose}
        title={selectedExecutionRow?.testPlanName ?? ''}
        passed={selectedExecutionCounts.passed}
        failed={selectedExecutionCounts.failed}
        totalTests={selectedExecutionCounts.total}
        cases={selectedExecutionCases}
        loading={isDrawerCasesLoading}
        onViewIssue={handleViewIssueClick}
        onViewExternal={handleViewExternalClick}
        onExportLogs={handleExportLogs}
        onDownloadLog={handleDownloadCaseLog}
        onDownloadDmesg={handleDownloadDmesg}
        rtosLogPath={selectedExecutionRow?.rtosLogPath}
      />

      {reportDialogRow ? (
        <ReportDialog
          open={Boolean(reportDialogRow)}
          onClose={() => setReportDialogRow(null)}
          testId={reportDialogRow.testId}
          buildVersion={reportDialogRow.buildVersion ?? ''}
          deviceType={reportDialogRow.deviceType ?? ''}
        />
      ) : null}
    </Stack>
  );
}

export default DashboardTable;
