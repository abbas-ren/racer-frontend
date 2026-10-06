import { memo } from 'react';
import {
  Box,
  Button,
  Collapse,
  IconButton,
  Stack,
  Tooltip,
  Typography,
  useTheme,
} from '@mui/material';
import type { Theme } from '@mui/material/styles';
import KeyboardArrowDownRoundedIcon from '@mui/icons-material/KeyboardArrowDownRounded';
import KeyboardArrowUpRoundedIcon from '@mui/icons-material/KeyboardArrowUpRounded';
import CheckCircleOutlineRoundedIcon from '@mui/icons-material/CheckCircleOutlineRounded';
import HighlightOffRoundedIcon from '@mui/icons-material/HighlightOffRounded';
import AutorenewRoundedIcon from '@mui/icons-material/AutorenewRounded';
import CustomIcon from 'components/common/CustomIcon/CustomIcon';
import type { TestSuiteCase, TestSuiteCaseStatus } from './TestSuiteDrawer';
import styles from './TestSuiteDrawer.module.scss';

const getCaseStatusVisual = (status: TestSuiteCaseStatus, theme: Theme) => {
  if (status === 'passed') {
    return {
      Icon: CheckCircleOutlineRoundedIcon,
      iconColor: theme.palette.success.main,
      borderColor: '#98e4b0',
      bgColor: '#eaf8f0',
      hoverBgColor: '#dff3e8',
    };
  }

  if (status === 'pending') {
    return {
      Icon: AutorenewRoundedIcon,
      iconColor: theme.palette.warning.dark,
      borderColor: '#f2d59e',
      bgColor: '#fff8eb',
      hoverBgColor: '#fff2dd',
    };
  }

  return {
    Icon: HighlightOffRoundedIcon,
    iconColor: theme.palette.error.main,
    borderColor: '#f0b8b8',
    bgColor: '#fdeeee',
    hoverBgColor: '#f9e4e4',
  };
};

interface TestSuiteCaseRowProps {
  testCase: TestSuiteCase;
  isExpanded: boolean;
  iconButtonColor: string;
  isDownloadingLog?: boolean;
  onToggleExpanded: (caseId: string) => void;
  onViewIssue?: (testCase: TestSuiteCase) => void;
  onViewExternal?: (testCase: TestSuiteCase) => void;
  onDownloadLog?: (testCase: TestSuiteCase) => void;
  onDownloadDmesg?: (testCase: TestSuiteCase) => void;
}

const TestSuiteCaseRow = memo(
  function TestSuiteCaseRow({
    testCase,
    isExpanded,
    iconButtonColor,
    isDownloadingLog = false,
    onToggleExpanded,
    onViewIssue,
    onViewExternal,
    onDownloadLog,
    onDownloadDmesg,
  }: TestSuiteCaseRowProps) {
    const theme = useTheme();
    const visual = getCaseStatusVisual(testCase.status, theme);

    return (
      <Box
        sx={{
          border: `1px solid ${visual.borderColor}`,
          backgroundColor: visual.bgColor,
          borderRadius: '0.7rem',
          cursor: 'pointer',
          p: '0.625rem 0.75rem',
          '&:hover': {
            borderColor: visual.borderColor,
            backgroundColor: visual.hoverBgColor,
          },
        }}
        onClick={() => onToggleExpanded(testCase.id)}
      >
        <Stack
          direction="row"
          justifyContent="space-between"
          alignItems="center"
          gap={1}
        >
          <Stack direction="row" alignItems="center" gap="0.6rem" minWidth={0}>
            <visual.Icon
              sx={{
                color: visual.iconColor,
                fontSize: '1.15rem',
                flexShrink: 0,
              }}
            />
            <Stack minWidth={0} sx={{ gap: '0.2rem' }}>
              <Typography
                sx={{
                  fontSize: '11px',
                  color: '#0b1a33',
                  lineHeight: 1.1,
                  margin: 0,
                }}
                noWrap
              >
                {testCase.name}
              </Typography>
              <Typography
                sx={{
                  fontSize: '9px',
                  color: 'text.secondary',
                  lineHeight: 1.15,
                  margin: 0,
                }}
              >
                {[testCase.duration, testCase.executedAt]
                  .filter((value) => Boolean(value) && value !== '-')
                  .join(' · ')}
              </Typography>
            </Stack>
          </Stack>

          <Stack
            direction="row"
            alignItems="center"
            gap="0.25rem"
            flexShrink={0}
          >
            {testCase.issueLabel && testCase.jiraUrl ? (
              <>
                <Button
                  className={styles.viewIssueLink}
                  component="a"
                  href={testCase.jiraUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  size="small"
                  onClick={(e) => {
                    e.stopPropagation();
                    onViewIssue?.(testCase);
                  }}
                  sx={{
                    minWidth: 'auto',
                  }}
                >
                  View Issue
                  <CustomIcon
                    name="external-link"
                    size={12}
                    color="currentColor"
                  />
                </Button>
                <IconButton
                  className={styles.gitlabLinkButton}
                  size="small"
                  component="a"
                  href={testCase.gitlabUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => {
                    e.stopPropagation();
                    onViewExternal?.(testCase);
                  }}
                  title="View test case in GitLab"
                >
                  <CustomIcon
                    name="external-link"
                    size={14}
                    color="currentColor"
                  />
                </IconButton>
              </>
            ) : (
              <IconButton
                className={styles.gitlabLinkButton}
                size="small"
                component="a"
                href={testCase.gitlabUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => {
                  e.stopPropagation();
                  onViewExternal?.(testCase);
                }}
                title="View test case in GitLab"
              >
                <CustomIcon
                  name="external-link"
                  size={14}
                  color="currentColor"
                />
              </IconButton>
            )}

            {testCase.outputFilePath ? (
              <IconButton
                className={styles.gitlabLinkButton}
                size="small"
                disabled={isDownloadingLog}
                onClick={(e) => {
                  e.stopPropagation();
                  onDownloadLog?.(testCase);
                }}
                title="Download test case log"
              >
                <CustomIcon name="file-down" size={14} color="currentColor" />
              </IconButton>
            ) : null}

            {testCase.dmesgFilePath ? (
              <Tooltip title="dmesg" arrow>
                <IconButton
                  className={styles.gitlabLinkButton}
                  size="small"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDownloadDmesg?.(testCase);
                  }}
                >
                  <CustomIcon name="microchip" size={14} color="currentColor" />
                </IconButton>
              </Tooltip>
            ) : null}

            <IconButton size="small" sx={{ color: iconButtonColor }}>
              {isExpanded ? (
                <KeyboardArrowUpRoundedIcon />
              ) : (
                <KeyboardArrowDownRoundedIcon />
              )}
            </IconButton>
          </Stack>
        </Stack>

        <Collapse in={isExpanded} timeout="auto" unmountOnExit>
          <Stack
            sx={{
              mt: 0.5,
              px: 1.5,
              pb: 1.5,
              pt: 0.5,
              borderTop: '1px solid rgba(0, 0, 0, 0.1)',
              gap: 0.5,
            }}
          >
            <Typography
              sx={{
                fontSize: '9px',
                fontWeight: 600,
                fontFamily: 'DM Sans, sans-serif',
                lineHeight: 1.2,
                color: '#4b5563',
                margin: '0 0 0.4rem 0',
              }}
            >
              Execution Steps:
            </Typography>
            <Stack sx={{ gap: 0.5 }}>
              {(testCase.steps || []).map((step, index) => (
                <Typography
                  key={`${testCase.id}-step-${index}`}
                  sx={{
                    fontSize: '9px',
                    fontFamily:
                      'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
                    lineHeight: 1.35,
                    color: '#374151',
                    margin: 0,
                    pl: 1.5,
                    py: 0.25,
                    borderRadius: 0.5,
                  }}
                >
                  <Box component="span" sx={{ color: '#9ca3af', mr: 0.5 }}>
                    {index + 1}.
                  </Box>
                  {step}
                </Typography>
              ))}
            </Stack>
          </Stack>
        </Collapse>
      </Box>
    );
  },
  (prev, next) => {
    if (prev.isExpanded !== next.isExpanded) return false;

    return (
      prev.testCase.id === next.testCase.id &&
      prev.testCase.status === next.testCase.status &&
      prev.testCase.name === next.testCase.name &&
      prev.testCase.duration === next.testCase.duration &&
      prev.testCase.executedAt === next.testCase.executedAt &&
      prev.testCase.issueLabel === next.testCase.issueLabel &&
      prev.testCase.jiraUrl === next.testCase.jiraUrl &&
      prev.testCase.gitlabUrl === next.testCase.gitlabUrl &&
      prev.testCase.steps === next.testCase.steps
    );
  },
);

export default TestSuiteCaseRow;
