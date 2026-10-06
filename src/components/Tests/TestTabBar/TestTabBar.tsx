import { Box, IconButton, Typography, CircularProgress } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import CloseIcon from '@mui/icons-material/Close';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import styles from './TestTabBar.module.scss';
import { TestStatus } from 'typesCustom/tests';

export interface Tab {
  id: string;
  label: string;
  status?: TestStatus;
  hasFailedCases?: boolean;
}

interface TestTabBarProps {
  tabs: Tab[];
  activeTab: string;
  onTabChange: (tabId: string) => void;
  onAddTab: () => void;
  onCloseTab?: (tabId: string) => void;
  disableTabSwitch?: boolean;
  disableAddTab?: boolean;
}

function TestTabBar({
  tabs,
  activeTab,
  onTabChange,
  onAddTab,
  onCloseTab,
  disableTabSwitch = false,
  disableAddTab = false,
}: TestTabBarProps) {
  const getStatusIndicator = (
    status?: TestStatus,
    hasFailedCases?: boolean,
  ) => {
    if (!status || status === TestStatus.NOT_EXECUTED) {
      return (
        <Box
          sx={{
            width: 8,
            height: 8,
            borderRadius: '50%',
            backgroundColor: '#99A1AF',
            flexShrink: 0,
          }}
        />
      );
    }
    if (status === TestStatus.IN_PROGRESS) {
      return (
        <CircularProgress
          size={10}
          sx={{
            color: 'primary.main',
            flexShrink: 0,
          }}
        />
      );
    }
    if (status === TestStatus.QUEUED) {
      return (
        <Box
          sx={{
            width: 8,
            height: 8,
            borderRadius: '50%',
            backgroundColor: '#EFB100',
            flexShrink: 0,
          }}
        />
      );
    }
    if (status === TestStatus.FAILED) {
      return (
        <CancelIcon
          sx={{
            fontSize: 12,
            color: '#FB2C36',
            flexShrink: 0,
          }}
        />
      );
    }
    if (status === TestStatus.COMPLETED) {
      // Show failed indicator if any test case failed
      if (hasFailedCases) {
        return (
          <CancelIcon
            sx={{
              fontSize: 12,
              color: '#FB2C36',
              flexShrink: 0,
            }}
          />
        );
      }
      return (
        <CheckCircleIcon
          sx={{
            fontSize: 12,
            color: '#00C950',
            flexShrink: 0,
          }}
        />
      );
    }
    if (status === TestStatus.CANCELLED) {
      return (
        <Box
          sx={{
            width: 8,
            height: 8,
            borderRadius: '50%',
            backgroundColor: '#99A1AF',
            flexShrink: 0,
          }}
        />
      );
    }
    return null;
  };

  return (
    <Box className={styles.tabBarContainer}>
      <Box className={styles.tabsWrapper}>
        {tabs.map((tab) => (
          <Box
            key={tab.id}
            className={`${styles.tab} ${activeTab === tab.id ? styles.tabActive : ''}`}
            onClick={() => {
              if (!disableTabSwitch) {
                onTabChange(tab.id);
              }
            }}
            sx={{
              cursor: disableTabSwitch ? 'not-allowed' : 'pointer',
              opacity: disableTabSwitch ? 0.72 : 1,
            }}
          >
            {getStatusIndicator(tab.status, tab.hasFailedCases)}
            <Typography
              className={styles.tabLabel}
              sx={{
                maxWidth: '200px',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {tab.label}
            </Typography>
            <IconButton
              className={styles.tabCloseButton}
              size="small"
              title="Close tab"
              disabled={disableTabSwitch}
              onClick={(e) => {
                e.stopPropagation();
                if (!disableTabSwitch) {
                  onCloseTab?.(tab.id);
                }
              }}
            >
              <CloseIcon className={styles.closeIcon} />
            </IconButton>
          </Box>
        ))}
        <IconButton
          className={styles.addTabButton}
          onClick={onAddTab}
          title="New tab"
          size="small"
          disabled={disableAddTab}
        >
          <AddIcon className={styles.addIcon} />
        </IconButton>
      </Box>
    </Box>
  );
}

export default TestTabBar;
