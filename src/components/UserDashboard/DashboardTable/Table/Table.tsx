import {
  TableContainer,
  Paper,
  TableHead,
  Table,
  TableCell,
  Typography,
  Stack,
  TableBody,
  TableRow,
  useTheme,
} from '@mui/material';
import styles from './Table.module.scss';
import { USER_DASHBOARD_TABLE } from 'constants/dashboard';
import { SortIcon } from 'assets';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from 'store/store';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useIntersectionObserver } from 'hooks';
import {
  fetchTestExecutionsRequest,
  getSelectedTestExecutionRequest,
} from 'store/slices';
import { useNavigate } from 'react-router';
import { formatDuration } from 'utils/test';
import { TestStatus } from 'typesCustom/tests';
import { TestCaseEntryForLogs } from 'types/tests';
import TestCaseResults from './TestCaseResults';
import clsx from 'clsx';
import { isEmpty } from 'radash';
import { getPercentage } from 'utils/common';
import InfoOutline from '@mui/icons-material/InfoOutline';

function TableContent({ search }: { search: string }) {
  const theme = useTheme();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { testExecutions, loading } = useSelector(
    (state: RootState) => state.tests,
  );

  const [testCaseResults, setTestCaseResults] = useState<{
    open: boolean;
    testCases: TestCaseEntryForLogs[];
  }>({
    open: false,
    testCases: [],
  });

  const loadingRef = useRef<HTMLDivElement>(null);
  const [sort, setSort] = useState<string | null>(null);
  const [selected, setSelected] = useState<string | null>(null);

  const handleTestIdClick = useCallback(
    (testId: string) => {
      setSelected(testId);
      navigate(`/user/tests?testId=${encodeURIComponent(testId)}`);
    },
    [navigate],
  );

  useEffect(() => {
    if (selected && !isEmpty(selected)) {
      dispatch(getSelectedTestExecutionRequest(selected));
    }
  }, [dispatch, selected]);

  const loadMore = useCallback(() => {
    if (
      testExecutions &&
      !loading &&
      testExecutions.currentPage < testExecutions?.totalPages
    ) {
      setSelected(null);
      dispatch(
        fetchTestExecutionsRequest({
          page: (testExecutions.currentPage + 1).toString(),
          limit: 20,
          sortBy: 'createdAt',
          desc: 'true',
        }),
      );
    }
  }, [loading, testExecutions, dispatch]);

  useEffect(() => {
    setSelected(null);
    dispatch(
      fetchTestExecutionsRequest({
        page: 1,
        limit: 20,
        sortBy: sort ? sort : 'createdAt',
        desc: 'true',
        search,
      }),
    );
  }, [search, sort, dispatch]);

  useEffect(() => {
    if (
      testExecutions &&
      testExecutions?.data.length > 0 &&
      selected === null
    ) {
      setSelected(testExecutions.data[0].testId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [testExecutions]);

  const STATE_COLOR = {
    [TestStatus.COMPLETED]: theme.palette.success.main,
    [TestStatus.FAILED]: theme.palette.error.main,
    [TestStatus.IN_PROGRESS]: theme.palette.info.main,
    [TestStatus.NOT_EXECUTED]: theme.palette.info.main,
    [TestStatus.QUEUED]: theme.palette.warning.main,
    [TestStatus.CANCELLED]: theme.palette.grey[600],
  };

  const STATE_LABEL = {
    [TestStatus.COMPLETED]: 'Completed',
    [TestStatus.FAILED]: 'Failed',
    [TestStatus.IN_PROGRESS]: 'In Progress',
    [TestStatus.NOT_EXECUTED]: 'In Progress',
    [TestStatus.QUEUED]: 'Queued',
    [TestStatus.CANCELLED]: 'Cancelled',
  };

  useIntersectionObserver(loadingRef, loadMore);

  const handleTestResultsClose = useCallback(() => {
    setTestCaseResults({
      open: false,
      testCases: [],
    });
  }, []);

  return (
    <>
      <TableContainer component={Paper} className={styles.tableContainer}>
        <Table stickyHeader aria-label="dashboard-table">
          <TableHead className={styles.tableHead}>
            <TableRow>
              {USER_DASHBOARD_TABLE?.map((column) => (
                <TableCell
                  component="th"
                  key={column.name}
                  sx={{
                    minWidth: column.minWidth,
                  }}
                  className={styles.tableHeaderCell}
                  onClick={() => {
                    if (column.sortable) setSort(column.name);
                  }}
                >
                  <Stack direction="row" alignItems="center" gap="0.25rem">
                    <Typography
                      variant="button2"
                      color="primary.main"
                      fontSize="0.875rem"
                    >
                      {column.label}
                    </Typography>
                    {column.sortable && (
                      <SortIcon className={styles.sortIcon} />
                    )}
                  </Stack>
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {testExecutions &&
              testExecutions.data?.length > 0 &&
              testExecutions.data.map((row) => {
                const status =
                  row.status === TestStatus.COMPLETED && row.failed !== 0
                    ? TestStatus.FAILED
                    : row.status;
                const rowTestCases = Array.isArray(row.testCases)
                  ? row.testCases
                  : Object.values(row.testCases || {}).flat();
                return (
                  <TableRow
                    className={clsx([
                      styles.tableRow,
                      {
                        [styles.selected]: selected === row.testId,
                      },
                    ])}
                    key={row.testId}
                    onClick={() => {
                      setSelected(row.testId);
                    }}
                  >
                    <TableCell
                      className={clsx([
                        styles.noWrapCell,
                        styles.clickableCell,
                        {
                          [styles.colored]: selected === row.testId,
                        },
                      ])}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleTestIdClick(row.testId);
                      }}
                    >
                      <Typography variant="system1">
                        {row.deviceName}
                      </Typography>
                    </TableCell>
                    <TableCell
                      className={clsx([
                        styles.noWrapCell,
                        {
                          [styles.colored]: selected === row.testId,
                        },
                      ])}
                    >
                      <Typography variant="system1">{row.buildId}</Typography>
                    </TableCell>
                    <TableCell
                      className={clsx([
                        styles.noWrapCell,
                        {
                          [styles.colored]: selected === row.testId,
                        },
                      ])}
                    >
                      <Typography variant="system1">
                        {formatDuration(row.durationSeconds)}
                      </Typography>
                    </TableCell>
                    <TableCell
                      className={clsx([
                        styles.noWrapCell,
                        {
                          [styles.colored]: selected === row.testId,
                        },
                      ])}
                    >
                      <Typography variant="system1">
                        {row.testPlanName}
                      </Typography>
                    </TableCell>
                    <TableCell className={styles.noWrapCell}>
                      <Typography variant="system1">
                        <Typography variant="system1" color="success.main">
                          {row.passed}
                        </Typography>
                        /{row.total}
                      </Typography>
                    </TableCell>
                    <TableCell className={styles.noWrapCell}>
                      <Typography variant="system1">
                        <Typography variant="system1" color="error.main">
                          {row.failed}
                        </Typography>
                        /{row.total}
                      </Typography>
                    </TableCell>
                    <TableCell className={styles.noWrapCell}>
                      {row.status === TestStatus.COMPLETED ? (
                        <Stack
                          className={styles.failedTestLabel}
                          justifyContent="center"
                          alignItems="center"
                          direction="row"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (rowTestCases.length > 0) {
                              setTestCaseResults({
                                open: true,
                                testCases: rowTestCases,
                              });
                            }
                          }}
                        >
                          <Typography
                            variant="system1"
                            color={STATE_COLOR[status]}
                            className={styles.statusText}
                          >
                            {STATE_LABEL[status]}
                          </Typography>
                          <InfoOutline className={styles.infoIcon} />
                        </Stack>
                      ) : (
                        <Typography
                          variant="system1"
                          color={STATE_COLOR[status]}
                          className={styles.statusText}
                        >
                          {STATE_LABEL[status]}
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell
                      className={clsx([
                        styles.noWrapCell,
                        {
                          [styles.colored]: selected === row.testId,
                        },
                      ])}
                    >
                      <Typography variant="system1">
                        {getPercentage({
                          total: row.total,
                          current: row.passed + row.failed,
                        })
                          ? getPercentage({
                              total: row.total,
                              current: row.passed + row.failed,
                            }) + '%'
                          : 'N/A'}
                      </Typography>
                    </TableCell>
                  </TableRow>
                );
              })}
            {testExecutions &&
              testExecutions.currentPage < testExecutions.totalPages && (
                <TableRow>
                  <TableCell
                    ref={loadingRef}
                    colSpan={USER_DASHBOARD_TABLE.length}
                    style={{ height: '1rem', padding: 0, border: 'none' }}
                  />
                </TableRow>
              )}
            {!loading &&
              (!testExecutions || testExecutions.data?.length === 0) && (
                <TableRow>
                  <TableCell
                    colSpan={USER_DASHBOARD_TABLE.length}
                    align="center"
                    sx={{ py: 4 }}
                  >
                    <Typography variant="system1" color="text.secondary">
                      No test executions found
                    </Typography>
                  </TableCell>
                </TableRow>
              )}
          </TableBody>
        </Table>
      </TableContainer>
      <TestCaseResults
        open={testCaseResults.open}
        setOpen={(_open) => handleTestResultsClose()}
        testCases={testCaseResults.testCases}
      />
    </>
  );
}

export default TableContent;
