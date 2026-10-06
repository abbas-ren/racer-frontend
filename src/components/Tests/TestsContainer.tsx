import { useEffect, useState } from 'react';
import {
  Stack,
  Typography,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Alert,
} from '@mui/material';
import TestTabBar, { Tab } from './TestTabBar';
import TestingTab from './TestingTab';
import toastService from 'services/ToastService';
import { useDispatch, useSelector } from 'react-redux';
import {
  initializeTabs,
  createTabRequest,
  deleteTabRequest,
  setActiveTab,
} from 'store/slices/testExecution/testExecutionsSlice';
import {
  selectTabsState,
  selectAllTabs,
  selectActiveTabId,
  selectIsAnyExecutionSubmitting,
} from 'store/slices/testExecution/selectors';
import styles from './TestsContainer.module.scss';

const TestsContainer = () => {
  const dispatch = useDispatch();
  const [confirmCloseOpen, setConfirmCloseOpen] = useState(false);
  const [closingTabId, setClosingTabId] = useState<string | null>(null);

  const tabsState = useSelector(selectTabsState);
  const allTabs = useSelector(selectAllTabs);
  const activeTabId = useSelector(selectActiveTabId);
  const isAnyExecutionSubmitting = useSelector(selectIsAnyExecutionSubmitting);

  const { error } = tabsState;

  useEffect(() => {
    dispatch(initializeTabs());
  }, [dispatch]);

  const tabs: Tab[] = allTabs.map((tab, idx) => {
    const deviceType = tab.values?.filters?.deviceType || '';
    const testPlanId = tab.values?.filters?.testPlan;
    const testPlans = tab.values?.data?.testPlans?.items || [];
    const testPlan = testPlans.find((p) => String(p.id) === String(testPlanId));
    const testPlanName = testPlan?.name || '';
    const status = tab.values?.data?.testExecution?.status;
    const testCases = tab.values?.data?.testExecution?.testCases || [];
    const hasFailedCases = testCases.some((tc) => {
      const r = (tc.result ?? '').toString().toUpperCase();
      return r === 'FAIL' || r === 'FAILED';
    });

    let label = '';
    if (deviceType && testPlanName) {
      label = `${deviceType} - ${testPlanName}`;
    } else if (deviceType) {
      label = deviceType;
    } else if (testPlanName) {
      label = testPlanName;
    } else {
      label = tab.name || `Tab ${idx + 1}`;
    }

    return {
      id: tab.id,
      label,
      status,
      hasFailedCases,
    };
  });

  const handleTabChange = (tabId: string) => {
    if (isAnyExecutionSubmitting) {
      toastService.info(
        'Please wait for Run Test Execution response before switching tabs.',
      );
      return;
    }
    dispatch(setActiveTab(tabId));
  };

  const handleAddTab = () => {
    if (isAnyExecutionSubmitting) {
      toastService.info(
        'Please wait for Run Test Execution response before creating a new tab.',
      );
      return;
    }
    dispatch(createTabRequest());
    toastService.success(
      <Typography variant="body2" fontWeight={600}>
        Creating new tab...
      </Typography>,
      {
        position: 'top-right',
        theme: 'light',
        hideProgressBar: false,
        autoClose: 3000,
      },
    );
  };

  const handleRequestCloseTab = (tabId: string) => {
    setClosingTabId(tabId);
    setConfirmCloseOpen(true);
  };

  const handleCancelCloseTab = () => {
    setConfirmCloseOpen(false);
    setClosingTabId(null);
  };

  const handleConfirmCloseTab = () => {
    if (!closingTabId) return;

    dispatch(deleteTabRequest({ tabId: closingTabId }));
    // If this was the last tab, immediately create a new one to avoid empty state
    if (tabs.length <= 1) {
      dispatch(createTabRequest());
      toastService.success(
        <Typography variant="body2" fontWeight={600}>
          Creating new tab...
        </Typography>,
        {
          position: 'top-right',
          theme: 'light',
          hideProgressBar: false,
          autoClose: 3000,
        },
      );
    }
    setConfirmCloseOpen(false);
    setClosingTabId(null);

    toastService.success(
      <Typography variant="body2" fontWeight={600}>
        Tab closed successfully
      </Typography>,
      {
        position: 'top-right',
        theme: 'light',
        autoClose: 2000,
      },
    );
  };

  if (error) {
    return (
      <Stack
        className={styles.container}
        alignItems="center"
        justifyContent="center"
        sx={{ minHeight: '60vh', p: 3 }}
      >
        <Alert severity="error" sx={{ maxWidth: 600 }}>
          <Typography variant="body2" fontWeight={600}>
            Failed to load tabs
          </Typography>
          <Typography variant="body2" sx={{ mt: 1 }}>
            {error}
          </Typography>
        </Alert>
      </Stack>
    );
  }

  return (
    <Stack className={styles.container}>
      <TestTabBar
        tabs={tabs}
        activeTab={activeTabId || ''}
        onTabChange={handleTabChange}
        onAddTab={handleAddTab}
        onCloseTab={handleRequestCloseTab}
        disableTabSwitch={isAnyExecutionSubmitting}
        disableAddTab={isAnyExecutionSubmitting}
      />

      {activeTabId && <TestingTab tabId={activeTabId} isActive={true} />}

      <Dialog
        open={confirmCloseOpen}
        onClose={handleCancelCloseTab}
        maxWidth="sm"
        fullWidth
        slotProps={{
          paper: {
            className: styles.dialogPaper,
          },
        }}
      >
        <DialogTitle>
          <Typography variant="h6" component="span" fontWeight={600}>
            Close Tab
          </Typography>
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary">
            Are you sure you want to close this tab? Any unsaved will be lost.
          </Typography>
        </DialogContent>
        <DialogActions className={styles.dialogActions}>
          <Button
            variant="outlined"
            onClick={handleCancelCloseTab}
            className={styles.dialogButton}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            color="error"
            onClick={handleConfirmCloseTab}
            className={styles.dialogButton}
          >
            Close Tab
          </Button>
        </DialogActions>
      </Dialog>
    </Stack>
  );
};

export default TestsContainer;
