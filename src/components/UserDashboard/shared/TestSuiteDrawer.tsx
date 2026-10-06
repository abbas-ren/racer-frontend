import { useCallback, useMemo, useState, type ReactNode } from 'react';
import {
  Box,
  Button,
  CircularProgress,
  Drawer,
  IconButton,
  Stack,
  Typography,
  useTheme,
} from '@mui/material';
import type { Theme, SxProps } from '@mui/material/styles';
import DownloadRoundedIcon from '@mui/icons-material/DownloadRounded';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import CheckCircleOutlineRoundedIcon from '@mui/icons-material/CheckCircleOutlineRounded';
import HighlightOffRoundedIcon from '@mui/icons-material/HighlightOffRounded';
import CustomIcon from 'components/common/CustomIcon/CustomIcon';
import TestSuiteCaseRow from './TestSuiteCaseRow';
import styles from './TestSuiteDrawer.module.scss';
import { TEST_RESULTS_BASE_URL } from 'constants/config';

export type TestSuiteCaseStatus = 'passed' | 'failed' | 'pending';

export interface TestSuiteCase {
  id: string;
  name: string;
  device: string;
  duration: string;
  executedAt: string;
  status: TestSuiteCaseStatus;
  issueLabel?: string;
  jiraUrl?: string;
  gitlabUrl?: string;
  outputFilePath?: string;
  dmesgFilePath?: string;
  steps?: string[];
}

interface TestSuiteDrawerProps {
  open: boolean;
  onClose: () => void;
  title: string;
  passed: number;
  failed: number;
  totalTests: number;
  cases: TestSuiteCase[];
  loading?: boolean;
  onViewIssue?: (testCase: TestSuiteCase) => void;
  onViewExternal?: (testCase: TestSuiteCase) => void;
  onExportLogs?: () => void;
  onDownloadLog?: (testCase: TestSuiteCase) => void;
  onDownloadDmesg?: (testCase: TestSuiteCase) => void;
  downloadingLogCaseIds?: string[];
  titleSx?: SxProps<Theme>;
  headerIcon?: ReactNode;
  rtosLogPath?: string;
}

function TestSuiteDrawer({
  open,
  onClose,
  title,
  passed,
  failed,
  totalTests,
  cases,
  loading = false,
  onViewIssue,
  onViewExternal,
  onExportLogs,
  onDownloadLog,
  onDownloadDmesg,
  downloadingLogCaseIds = [],
  titleSx,
  headerIcon,
  rtosLogPath,
}: TestSuiteDrawerProps) {
  const theme = useTheme();
  const [expandedCaseIds, setExpandedCaseIds] = useState<string[]>([]);
  const iconButtonColor = theme.palette.text.secondary;

  const normalizedCases = useMemo(
    () =>
      cases.map((testCase) => ({
        ...testCase,
        steps: testCase.steps?.length
          ? testCase.steps
          : ['Execution details are available for this test case.'],
      })),
    [cases],
  );

  const getDefaultErrorMessage = (testCase: TestSuiteCase) => {
    if (testCase.status !== 'failed') return '';

    const matchedStep = testCase.steps?.find((step) =>
      /error|failed|timeout/i.test(step),
    );
    return matchedStep ?? 'Connection timeout after 30 seconds';
  };

  const escapeCsvField = (value: string | number) => {
    const text = String(value ?? '');
    if (text.includes(',') || text.includes('"') || text.includes('\n')) {
      return `"${text.replace(/"/g, '""')}"`;
    }
    return text;
  };

  const extractDurationSeconds = (duration: string) => {
    const numeric = Number.parseFloat((duration || '').replace(/[^0-9.]/g, ''));
    return Number.isFinite(numeric) ? numeric : 0;
  };

  const getExportFileName = () => {
    const date = new Date();
    const year = date.getFullYear();
    const month = `${date.getMonth() + 1}`.padStart(2, '0');
    const day = `${date.getDate()}`.padStart(2, '0');
    const safeTitle = (title || 'test_suite')
      .replace(/[^a-zA-Z0-9]+/g, '_')
      .replace(/^_+|_+$/g, '');

    return `${safeTitle || 'test_suite'}_test_logs_${year}-${month}-${day}.csv`;
  };

  const handleExportLogsClick = () => {
    if (onExportLogs) {
      onExportLogs();
      return;
    }

    if (typeof window === 'undefined' || !normalizedCases.length) return;

    const headers = [
      'Test Name',
      'Status',
      'Duration (s)',
      'Timestamp',
      'Error Message',
    ];
    const rows = normalizedCases.map((testCase) => [
      testCase.name,
      testCase.status,
      extractDurationSeconds(testCase.duration),
      testCase.executedAt,
      getDefaultErrorMessage(testCase),
    ]);

    const csv = [
      headers.map(escapeCsvField).join(','),
      ...rows.map((row) => row.map((value) => escapeCsvField(value)).join(',')),
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');

    link.href = url;
    link.setAttribute('download', getExportFileName());
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  };

  const handleToggleExpanded = useCallback((caseId: string) => {
    setExpandedCaseIds((prev) =>
      prev.includes(caseId)
        ? prev.filter((id) => id !== caseId)
        : [...prev, caseId],
    );
  }, []);

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      slotProps={{
        paper: {
          sx: {
            width: 'min(520px, 100vw)',
            borderLeft: `1px solid ${theme.palette.divider}`,
            background: theme.palette.background.paper,
          },
        },
      }}
    >
      <Stack sx={{ height: '100%' }}>
        <Stack
          direction="row"
          alignItems="center"
          justifyContent="space-between"
          sx={{
            px: 3,
            py: 2,
            borderBottom: `1px solid ${theme.palette.divider}`,
          }}
        >
          <Stack direction="row" alignItems="center" gap="0.7rem">
            <Box
              className={styles.headerIconContainer}
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {headerIcon ?? (
                <CustomIcon
                  name="terminal"
                  size={20}
                  color={theme.palette.primary[300]}
                />
              )}
            </Box>
            <Stack>
              <Typography
                noWrap
                sx={{
                  fontSize: '18px',
                  fontWeight: 700,
                  color: 'text.primary',
                  lineHeight: 1.15,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  ...(titleSx as object),
                }}
              >
                {title}
              </Typography>
              <Stack
                direction="row"
                alignItems="center"
                gap={1.25}
                sx={{ mt: 0.25 }}
              >
                <Stack direction="row" alignItems="center" gap={0.25}>
                  <CheckCircleOutlineRoundedIcon
                    sx={{ fontSize: '0.95rem', color: 'success.main' }}
                  />
                  <Typography sx={{ fontSize: '12px', color: 'success.main' }}>
                    {passed} Passed
                  </Typography>
                </Stack>
                <Stack direction="row" alignItems="center" gap={0.25}>
                  <HighlightOffRoundedIcon
                    sx={{ fontSize: '0.95rem', color: 'error.main' }}
                  />
                  <Typography sx={{ fontSize: '12px', color: 'error.main' }}>
                    {failed} Failed
                  </Typography>
                </Stack>
              </Stack>
            </Stack>
          </Stack>
          <Stack direction="row" alignItems="center" gap={0.5}>
            {rtosLogPath && (
              <IconButton
                size="small"
                aria-label="download RTOS log"
                onClick={() => {
                  const url = `${TEST_RESULTS_BASE_URL}${rtosLogPath}`;
                  window.open(url, '_blank', 'noopener,noreferrer');
                }}
                title="Download RTOS Log"
              >
                <CustomIcon name="logs" size={18} color={iconButtonColor} />
              </IconButton>
            )}
            <IconButton
              onClick={onClose}
              size="small"
              aria-label="close test suite sidebar"
            >
              <CloseRoundedIcon
                sx={{ fontSize: '1.7rem', color: iconButtonColor }}
              />
            </IconButton>
          </Stack>
        </Stack>

        <Stack
          direction="row"
          justifyContent="space-between"
          alignItems="center"
          sx={{
            px: 2,
            py: 1.25,
            borderBottom: `1px solid ${theme.palette.divider}`,
            background: theme.palette.background.default,
          }}
        >
          <Typography sx={{ fontSize: '12px', color: 'text.secondary' }}>
            Test Cases
          </Typography>
          <Typography sx={{ fontSize: '12px', color: 'text.secondary' }}>
            {totalTests} tests
          </Typography>
        </Stack>

        <Stack
          sx={{
            flex: 1,
            overflow: 'auto',
            p: 1.5,
            gap: 1,
            background: theme.palette.background.paper,
          }}
        >
          {loading ? (
            <Stack alignItems="center" justifyContent="center" sx={{ py: 4 }}>
              <CircularProgress size={22} />
              <Typography
                sx={{ mt: 1, fontSize: '12px', color: 'text.secondary' }}
              >
                Loading test cases...
              </Typography>
            </Stack>
          ) : normalizedCases.length === 0 ? (
            <Typography
              sx={{ fontSize: '12px', color: 'text.secondary', px: 1, py: 2 }}
            >
              No test cases available for this execution.
            </Typography>
          ) : (
            normalizedCases.map((testCase) => (
              <TestSuiteCaseRow
                key={testCase.id}
                testCase={testCase}
                isExpanded={expandedCaseIds.includes(testCase.id)}
                iconButtonColor={iconButtonColor}
                isDownloadingLog={downloadingLogCaseIds.includes(testCase.id)}
                onToggleExpanded={handleToggleExpanded}
                onViewIssue={onViewIssue}
                onViewExternal={onViewExternal}
                onDownloadLog={onDownloadLog}
                onDownloadDmesg={onDownloadDmesg}
              />
            ))
          )}
        </Stack>

        <Box
          sx={{
            flexShrink: 0,
            p: '1rem 1.5rem',
            borderTop: `1px solid ${theme.palette.divider}`,
            background: theme.palette.background.paper,
          }}
        >
          <Button
            fullWidth
            startIcon={<DownloadRoundedIcon sx={{ fontSize: '1rem' }} />}
            onClick={handleExportLogsClick}
            sx={{
              textTransform: 'none',
              borderRadius: '0.5rem',
              color: theme.palette.background.elevated,
              background: theme.palette.primary[300],
              fontSize: '13px',
              fontWeight: 600,
              py: 1.25,
              px: 2,
              gap: 1,
              transition: 'background-color 180ms ease, transform 180ms ease',
              '&:hover': {
                background: theme.palette.primary[400],
                transform: 'scale(1.02)',
              },
            }}
          >
            Export Test Logs
          </Button>
        </Box>
      </Stack>
    </Drawer>
  );
}

export default TestSuiteDrawer;
