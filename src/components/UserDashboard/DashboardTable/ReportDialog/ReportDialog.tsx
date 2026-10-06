import { useState, useEffect } from 'react';
import {
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogContent,
  DialogTitle,
  IconButton,
  Stack,
  Typography,
  useTheme,
} from '@mui/material';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import { useDispatch, useSelector } from 'react-redux';
import type { RootState } from 'store/store';
import {
  generateExecutionReportRequest,
  fetchExecutionReportStatusRequest,
  uploadExecutionReportRequest,
  clearExecutionReportUploadError,
} from 'store/slices/userDashboard/userDashboardSlice';
import { selectExecutionReportByTestId } from 'store/selectors/userDashboardSelectors';
import { getExecutionReportHtml } from 'services/testsApiService';
import CustomIcon from 'components/common/CustomIcon/CustomIcon';

interface ReportDialogProps {
  open: boolean;
  onClose: () => void;
  testId: string;
  buildVersion: string;
  deviceType: string;
}

function ReportDialog({
  open,
  onClose,
  testId,
  buildVersion,
  deviceType,
}: ReportDialogProps) {
  const theme = useTheme();
  const dispatch = useDispatch();
  const reportInfo = useSelector((state: RootState) =>
    selectExecutionReportByTestId(state, testId),
  );

  // null = not loaded yet; string = loaded blob URL
  const [previewBlobUrl, setPreviewBlobUrl] = useState<string | null>(null);
  // true when an HTML fetch attempt finished with an error
  const [previewFetchError, setPreviewFetchError] = useState(false);
  // tracks which testId the current blob URL belongs to
  const [previewForTestId, setPreviewForTestId] = useState<string | null>(null);

  const status = reportInfo?.status ?? 'idle';
  const uploadError = reportInfo?.uploadError ?? null;
  const isPreviewable = status === 'completed' || status === 'uploaded';

  // On open: one-time fetch to sync any status changes that happened while dialog was closed.
  // Live updates while open are pushed via the WebSocket (execution_report_update).
  useEffect(() => {
    if (!open) return;
    dispatch(clearExecutionReportUploadError({ testId }));
    dispatch(fetchExecutionReportStatusRequest({ testId }));
  }, [open, testId, dispatch]);

  // Load preview HTML when report is in a previewable state
  useEffect(() => {
    if (!open || !isPreviewable) return;
    // Already loaded for this testId
    if (previewForTestId === testId && previewBlobUrl) return;

    let cancelled = false;

    getExecutionReportHtml(testId)
      .then((html) => {
        if (cancelled) return;
        const blob = new Blob([html], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        setPreviewBlobUrl(url);
        setPreviewForTestId(testId);
        setPreviewFetchError(false);
      })
      .catch(() => {
        if (!cancelled) setPreviewFetchError(true);
      });

    return () => {
      cancelled = true;
    };
  }, [open, isPreviewable, testId, previewBlobUrl, previewForTestId]);

  const handleClose = () => {
    if (previewBlobUrl) {
      URL.revokeObjectURL(previewBlobUrl);
      setPreviewBlobUrl(null);
      setPreviewForTestId(null);
    }
    onClose();
  };

  const handleGenerate = () => {
    dispatch(generateExecutionReportRequest({ testId }));
  };

  const handleUpload = () => {
    dispatch(uploadExecutionReportRequest({ testId }));
  };

  const handleOpenInNewTab = () => {
    if (previewBlobUrl) {
      window.open(previewBlobUrl, '_blank', 'noopener,noreferrer');
    }
  };

  const renderPreview = () => {
    const isPreviewLoading =
      isPreviewable && !previewBlobUrl && !previewFetchError;

    if (isPreviewLoading) {
      return (
        <Stack alignItems="center" justifyContent="center" sx={{ height: 320 }}>
          <CircularProgress size={28} />
          <Typography variant="caption" color="text.secondary" sx={{ mt: 1 }}>
            Loading preview...
          </Typography>
        </Stack>
      );
    }

    if (previewBlobUrl) {
      return (
        <Box
          component="iframe"
          src={previewBlobUrl}
          title="Report Preview"
          sx={{
            width: '100%',
            height: '55vh',
            border: `1px solid ${theme.palette.divider}`,
            borderRadius: '0.5rem',
          }}
        />
      );
    }

    return (
      <Stack
        alignItems="center"
        justifyContent="center"
        sx={{
          height: 200,
          border: `1px dashed ${theme.palette.divider}`,
          borderRadius: '0.5rem',
        }}
      >
        <Typography variant="body2" color="text.secondary">
          Preview not available.
        </Typography>
      </Stack>
    );
  };

  const renderBody = () => {
    if (status === 'idle') {
      return (
        <Stack alignItems="center" gap={2} sx={{ py: 3 }}>
          <CustomIcon
            name="file-chart-column"
            size={48}
            color={theme.palette.primary.main}
          />
          <Typography variant="body2" color="text.secondary" textAlign="center">
            No report has been generated for this test execution yet.
          </Typography>
          <Button
            variant="contained"
            onClick={handleGenerate}
            startIcon={
              <CustomIcon name="file-chart-column" size={16} color="inherit" />
            }
            sx={{ textTransform: 'none', borderRadius: '0.75rem' }}
          >
            Generate Report
          </Button>
        </Stack>
      );
    }

    if (status === 'generating') {
      return (
        <Stack alignItems="center" gap={2} sx={{ py: 4 }}>
          <CircularProgress size={36} />
          <Typography variant="body2" color="text.secondary">
            Generating report, please wait...
          </Typography>
          <Typography variant="caption" color="text.disabled">
            This may take a few minutes. Status refreshes automatically.
          </Typography>
        </Stack>
      );
    }

    if (status === 'failed') {
      return (
        <Stack alignItems="center" gap={2} sx={{ py: 3 }}>
          <CustomIcon
            name="circle-x"
            size={40}
            color={theme.palette.error.main}
          />
          <Typography variant="body2" color="error.main" textAlign="center">
            {reportInfo?.error ?? 'Report generation failed.'}
          </Typography>
          <Button
            variant="outlined"
            color="error"
            onClick={handleGenerate}
            sx={{ textTransform: 'none', borderRadius: '0.75rem' }}
          >
            Retry
          </Button>
        </Stack>
      );
    }

    if (status === 'uploading') {
      return (
        <Stack gap={2}>
          {renderPreview()}
          <Stack direction="row" alignItems="center" gap={1.5} sx={{ pt: 1 }}>
            <CircularProgress size={18} />
            <Typography variant="body2" color="text.secondary">
              Uploading to Confluence...
            </Typography>
          </Stack>
        </Stack>
      );
    }

    if (status === 'uploaded') {
      return (
        <Stack gap={2}>
          {renderPreview()}
          <Stack direction="row" alignItems="center" gap={1} sx={{ pt: 1 }}>
            <CustomIcon
              name="circle-check"
              size={18}
              color={theme.palette.success.main}
            />
            <Typography variant="body2" color="success.main">
              Successfully uploaded to Confluence.
            </Typography>
          </Stack>
        </Stack>
      );
    }

    // status === 'completed'
    return (
      <Stack gap={2}>
        {renderPreview()}
        {uploadError && (
          <Stack
            direction="row"
            alignItems="center"
            gap={1}
            sx={{
              px: 1.5,
              py: 1,
              borderRadius: '0.5rem',
              background: theme.palette.error.main + '18',
              border: `1px solid ${theme.palette.error.main}44`,
            }}
          >
            <CustomIcon
              name="circle-x"
              size={16}
              color={theme.palette.error.main}
            />
            <Typography variant="caption" color="error.main" sx={{ flex: 1 }}>
              {uploadError}
            </Typography>
          </Stack>
        )}
        <Stack direction="row" justifyContent="flex-end" gap={1}>
          <Button
            variant="outlined"
            onClick={handleOpenInNewTab}
            disabled={!previewBlobUrl}
            startIcon={
              <CustomIcon name="external-link" size={14} color="currentColor" />
            }
            sx={{
              textTransform: 'none',
              borderRadius: '0.75rem',
              fontSize: '13px',
            }}
          >
            Open in New Tab
          </Button>
          <Button
            variant="contained"
            onClick={handleUpload}
            startIcon={
              <CustomIcon name="upload" size={14} color="currentColor" />
            }
            sx={{
              textTransform: 'none',
              borderRadius: '0.75rem',
              fontSize: '13px',
            }}
          >
            {uploadError ? 'Retry Upload' : 'Upload to Confluence'}
          </Button>
        </Stack>
      </Stack>
    );
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      fullWidth
      maxWidth="md"
      slotProps={{
        paper: {
          sx: {
            borderRadius: '1rem',
            background: theme.palette.background.paper,
          },
        },
      }}
    >
      <DialogTitle
        component="div"
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          pb: 1,
        }}
      >
        <Stack direction="row" alignItems="center" gap={1.25}>
          <CustomIcon
            name="file-chart-column"
            size={22}
            color={theme.palette.primary.main}
          />
          <Stack>
            <Typography
              sx={{
                fontSize: '16px',
                fontWeight: 700,
                lineHeight: 1.2,
              }}
            >
              Execution Report
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {deviceType} · {buildVersion} · {testId}
            </Typography>
          </Stack>
        </Stack>
        <IconButton size="small" onClick={handleClose} aria-label="close">
          <CloseRoundedIcon sx={{ fontSize: '1.4rem' }} />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ pt: 1 }}>{renderBody()}</DialogContent>
    </Dialog>
  );
}

export default ReportDialog;
