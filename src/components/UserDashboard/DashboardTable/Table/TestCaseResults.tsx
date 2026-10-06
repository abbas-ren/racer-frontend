import React, { useState, useMemo } from 'react';
import {
  Typography,
  Paper,
  Button,
  Modal,
  Checkbox,
  useTheme,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Stack,
} from '@mui/material';
import styles from './Table.module.scss';
import { TestCaseEntryForLogs } from 'types/tests';
import { ClearSharp } from '@mui/icons-material';
import CustomInputField from 'components/common/InputField';
import { SortIcon } from 'assets/index';

interface InterfaceLabelProps {
  testCases: TestCaseEntryForLogs[];
  open: boolean;
  setOpen: (open: boolean) => void;
}

const TestCaseResults: React.FC<InterfaceLabelProps> = ({
  testCases,
  open,
  setOpen,
}) => {
  const theme = useTheme();
  const [onlyPassedTest, setOnlyPassedTest] = useState(false);
  const [onlyFailedTest, setOnlyFailedTest] = useState(false);
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<'sno' | 'status' | 'summary'>('sno');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PASS':
        return theme.palette.success.main;
      case 'FAIL':
        return theme.palette.error.main;
      default:
        return theme.palette.warning.main;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'PASS':
        return 'Passed';
      case 'FAIL':
        return 'Failed';
      default:
        return 'Not Executed';
    }
  };

  // Filter by status checkboxes
  const filteredByStatus = useMemo(() => {
    if (onlyPassedTest && !onlyFailedTest) {
      return testCases.filter((testCase) => testCase.result === 'PASS');
    } else if (onlyFailedTest && !onlyPassedTest) {
      return testCases.filter((testCase) => testCase.result === 'FAIL');
    }
    return testCases;
  }, [testCases, onlyPassedTest, onlyFailedTest]);

  // Filter by search (status, summary, s.no)
  const filteredTestCase = useMemo(() => {
    if (!search.trim()) return filteredByStatus;
    const searchLower = search.trim().toLowerCase();
    return filteredByStatus.filter((testCase) => {
      const statusText = getStatusText(testCase.result ?? '').toLowerCase();
      const summary = (testCase.title ?? '').toLowerCase();
      return statusText.includes(searchLower) || summary.includes(searchLower);
    });
  }, [filteredByStatus, search]);

  const sortedTestCase = useMemo(() => {
    const arr = [...filteredTestCase];
    arr.sort((a, b) => {
      if (sortBy === 'sno') {
        const idxA = testCases.findIndex((tc) => tc.id === a.id);
        const idxB = testCases.findIndex((tc) => tc.id === b.id);
        return sortOrder === 'asc' ? idxA - idxB : idxB - idxA;
      }
      if (sortBy === 'status') {
        const statusA = getStatusText(a.result ?? '');
        const statusB = getStatusText(b.result ?? '');
        return sortOrder === 'asc'
          ? statusA.localeCompare(statusB)
          : statusB.localeCompare(statusA);
      }
      if (sortBy === 'summary') {
        const summaryA = (a.title ?? '').toLowerCase();
        const summaryB = (b.title ?? '').toLowerCase();
        return sortOrder === 'asc'
          ? summaryA.localeCompare(summaryB)
          : summaryB.localeCompare(summaryA);
      }
      return 0;
    });
    return arr;
  }, [filteredTestCase, sortBy, sortOrder, testCases]);

  const handleSort = (column: 'sno' | 'status' | 'summary') => {
    if (sortBy === column) {
      setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortBy(column);
      setSortOrder('asc');
    }
  };

  const handleClose = () => {
    setOpen(false);
    setOnlyPassedTest(false);
    setOnlyFailedTest(false);
    setSearch('');
  };

  return (
    <Modal
      open={open}
      onClose={handleClose}
      aria-labelledby="failed-tests-modal-title"
      aria-describedby="failed-tests-modal-description"
    >
      <Paper elevation={4} className={styles.tooltipContent}>
        <Stack
          direction="row"
          justifyContent="space-between"
          alignItems="center"
        >
          <Typography variant="h5">Test Results</Typography>
          <Button onClick={handleClose} sx={{ minWidth: 'unset' }}>
            <ClearSharp />
          </Button>
        </Stack>
        <Stack
          direction="row"
          alignItems="center"
          spacing={2}
          justifyContent="space-between"
        >
          <Stack direction="row" alignItems="center" spacing={1}>
            <Stack direction="row" alignItems="center">
              <Checkbox
                checked={onlyPassedTest}
                onChange={(e) => setOnlyPassedTest(e.target.checked)}
                color="secondary"
                size="medium"
              />
              <Typography variant="body1" color="text.legend">
                Show Passed Only
              </Typography>
            </Stack>
            <Stack direction="row" alignItems="center">
              <Checkbox
                checked={onlyFailedTest}
                onChange={(e) => setOnlyFailedTest(e.target.checked)}
                color="secondary"
                size="medium"
              />
              <Typography variant="body1" color="text.legend">
                Show Failed Only
              </Typography>
            </Stack>
          </Stack>
          <CustomInputField
            placeholder="Search"
            floating={false}
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
            }}
            inputStyle={{
              height: '1.875rem',
              ...theme.typography.body2,
            }}
            specificWidth="240px"
          />
        </Stack>
        <TableContainer
          component={Paper}
          className={styles.tooltipRowContainer}
        >
          <Table stickyHeader size="small">
            <TableHead className={styles.tableHead}>
              <TableRow
                sx={{
                  height: '3rem',
                }}
              >
                <TableCell
                  onClick={() => handleSort('sno')}
                  className={styles.tableHeaderCell}
                  width={120}
                  style={{ cursor: 'pointer' }}
                >
                  <Stack direction="row" alignItems="center" gap="0.25rem">
                    <Typography variant="subtitle2">S.No</Typography>
                    <SortIcon className={styles.sortIcon} />
                  </Stack>
                </TableCell>
                <TableCell
                  onClick={() => handleSort('status')}
                  className={styles.tableHeaderCell}
                  width={120}
                  style={{ cursor: 'pointer' }}
                >
                  <Stack direction="row" alignItems="center" gap="0.25rem">
                    <Typography variant="subtitle2">Status</Typography>
                    <SortIcon className={styles.sortIcon} />
                  </Stack>
                </TableCell>
                <TableCell
                  onClick={() => handleSort('summary')}
                  className={styles.tableHeaderCell}
                  style={{ cursor: 'pointer' }}
                >
                  <Stack direction="row" alignItems="center" gap="0.25rem">
                    <Typography variant="subtitle2">Summary</Typography>
                    <SortIcon className={styles.sortIcon} />
                  </Stack>
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {sortedTestCase.map((cases, index) => {
                const sno =
                  sortBy === 'sno'
                    ? String(
                        testCases.findIndex((tc) => tc.id === cases.id) + 1,
                      ).padStart(2, '0')
                    : String(index + 1).padStart(2, '0');
                return (
                  <TableRow key={cases.id}>
                    <TableCell className={styles.noWrapCell}>
                      <Typography
                        className={styles.tooltipRowText1}
                        variant="body2"
                        color="text.caption"
                      >
                        Testcase {sno}
                      </Typography>
                    </TableCell>
                    <TableCell className={styles.noWrapCell}>
                      <Typography
                        color={getStatusColor(cases.result ?? '')}
                        variant="body2"
                        className={styles.tooltipRowText2}
                        noWrap
                      >
                        {getStatusText(cases.result ?? '')}
                      </Typography>
                    </TableCell>
                    <TableCell className={styles.noWrapCell}>
                      <Typography
                        noWrap
                        variant="body2"
                        color="text.caption"
                        className={styles.tooltipRowText3}
                      >
                        {cases.title}
                      </Typography>
                    </TableCell>
                  </TableRow>
                );
              })}
              {sortedTestCase.length === 0 && (
                <TableRow>
                  <TableCell colSpan={3}>
                    <Typography
                      variant="body2"
                      color="text.disabled"
                      align="center"
                    >
                      No test cases found.
                    </Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
    </Modal>
  );
};

export default TestCaseResults;
