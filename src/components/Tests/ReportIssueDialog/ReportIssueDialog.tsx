import styles from './ReportIssueDialog.module.scss';
import React, { useCallback } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
  TextField,
  MenuItem,
  Button,
  Typography,
  Checkbox,
  FormControlLabel,
  IconButton,
  Stack,
  useTheme,
  Select,
  OutlinedInput,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import InsertDriveFileOutlinedIcon from '@mui/icons-material/InsertDriveFileOutlined';
import ErrorOutline from '@mui/icons-material/ErrorOutline';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import { Controller } from 'react-hook-form';
import { useDispatch, useSelector } from 'react-redux';
import {
  fetchFamiliesRequest,
  fetchDeviceTypesRequest,
  fetchBuildsRequest,
  resetReportIssueState,
} from 'store/slices/issues/reportIssueSlice';
import { RootState } from 'store/store';
import useReportIssueForm, {
  ReportIssueFormValues,
} from './useReportIssueForm';
import { SendMail } from 'assets/index';
import { CustomIcon } from 'components/common';
import { useUploadWebSocket } from 'hooks/useUploadWebSocket';
import { useAuth } from 'hooks/useAuth';

interface ReportIssueDialogProps {
  open: boolean;
  onClose: () => void;
  defaults?: Partial<
    Pick<ReportIssueFormValues, 'deviceFamily' | 'device' | 'buildVersion'>
  >;
  onSubmit?: (data: ReportIssueFormValues) => void | Promise<void>;
}

const ReportIssueDialog = ({
  open,
  onClose,
  defaults,
  onSubmit,
}: ReportIssueDialogProps) => {
  const {
    control,
    errors,
    descriptionLength,
    selectedFile,
    inputRef,
    triggerFileDialog,
    onFileChange,
    submit,
    resetToEmpty,
    setValue,
    watchedDeviceFamily,
    watchedDevice,
  } = useReportIssueForm({ defaults, onSubmit });

  const theme = useTheme();
  const dispatch = useDispatch();
  const { user } = useAuth();
  const userId = user?.id || '';
  const families = useSelector(
    (s: RootState) => s.reportIssue.deviceFamilies.items,
  );
  const types = useSelector((s: RootState) => s.reportIssue.deviceTypes.items);
  const builds = useSelector((s: RootState) => s.reportIssue.builds.items);

  const disableDevice = !watchedDeviceFamily;
  const disableBuild = !watchedDevice;

  // Callback to refetch builds
  const handleRefetchBuilds = useCallback(() => {
    if (watchedDevice) {
      dispatch(fetchBuildsRequest({ deviceType: watchedDevice }));
    }
  }, [watchedDevice, dispatch]);

  // Set up WebSocket to refetch builds when deviceType matches
  useUploadWebSocket({
    userId,
    enabled: open,
    selectedDeviceType: watchedDevice || null,
    onRefetchBuilds: handleRefetchBuilds,
  });

  // Fetch data cascade based on defaults when dialog opens
  React.useEffect(() => {
    if (open) {
      // Always fetch device families first
      dispatch(fetchFamiliesRequest());

      // If deviceFamily is provided (and not 'ALL'), fetch device types
      if (defaults?.deviceFamily && defaults.deviceFamily !== 'ALL') {
        dispatch(
          fetchDeviceTypesRequest({ deviceFamily: defaults.deviceFamily }),
        );

        // If deviceType is also provided, fetch builds
        if (defaults?.device) {
          dispatch(fetchBuildsRequest({ deviceType: defaults.device }));
        }
      }
    }
  }, [open, defaults?.deviceFamily, defaults?.device, dispatch]);

  // Get loading and success states from store
  const reportIssueLoading = useSelector(
    (s: RootState) => s.reportIssue.loading,
  );
  const reportIssueSuccess = useSelector(
    (s: RootState) => s.reportIssue.success,
  );

  // Close dialog on successful submission
  React.useEffect(() => {
    if (reportIssueSuccess && open) {
      // Reset form and close after a short delay to show success state
      setTimeout(() => {
        dispatch(resetReportIssueState());
        resetToEmpty();
        onClose();
      }, 500);
    }
  }, [reportIssueSuccess, open, dispatch, resetToEmpty, onClose]);

  // Create options arrays for consistency with TestFilters
  const deviceFamilyOptions = [
    { value: 'ALL', label: 'All' },
    ...families.map((f) => ({
      value: f,
      label: f,
    })),
  ];

  const deviceOptions = types.map((t) => ({
    value: t,
    label: t,
  }));

  const buildOptions = builds.map((b) => ({
    value: b.id,
    label: b.version,
  }));

  return (
    <Dialog
      open={open}
      onClose={() => {
        // Clear slice data and form state on close
        dispatch(resetReportIssueState());
        // Reset form fields including description and file
        resetToEmpty();
        onClose();
      }}
      maxWidth="md"
      fullWidth
      slotProps={{
        backdrop: {
          sx: {
            backgroundColor: 'rgba(0,0,0,0.15)',
            backdropFilter: 'blur(6px)',
            WebkitBackdropFilter: 'blur(6px)',
          },
        },
        paper: {
          className: styles.dialogPaper,
        },
      }}
    >
      {/* Header */}
      <DialogTitle className={styles.header}>
        <Stack
          className={styles.headerLeft}
          direction="row"
          alignItems="center"
        >
          <Stack
            alignItems="center"
            justifyContent="center"
            className={styles.headerIcon}
          >
            <ErrorOutline className={styles.headerIconSvg} />
          </Stack>
          <Stack>
            <Typography
              className={styles.title}
              variant="subtitle1"
              component="span"
            >
              Report Build Issue
            </Typography>
            <Typography
              className={styles.subtitle}
              variant="system1"
              component="span"
            >
              Submit a detailed report to the admin team
            </Typography>
          </Stack>
        </Stack>
        <IconButton onClick={onClose} className={styles.closeBtn}>
          <CloseIcon fontSize="small" />
        </IconButton>
      </DialogTitle>

      <DialogContent>
        <Box
          id="reportIssueForm"
          component="form"
          onSubmit={(e) => {
            e.preventDefault();
            submit();
          }}
          className={styles.content}
        >
          <Stack spacing="22px">
            {/* Dropdowns */}
            <Stack spacing="16px">
              <Box className={styles.selectRow}>
                <Controller
                  name="deviceFamily"
                  control={control}
                  render={({ field }) => (
                    <Box>
                      <Typography className={styles.label} variant="caption">
                        Device Family
                      </Typography>
                      <Select
                        fullWidth
                        disabled={false}
                        value={field.value}
                        onChange={(e) => {
                          const v = e.target.value;
                          field.onChange(v);
                          // clear dependents
                          setValue('device', '');
                          setValue('buildVersion', '');
                          if (v)
                            dispatch(
                              fetchDeviceTypesRequest({ deviceFamily: v }),
                            );
                        }}
                        className={styles.selectField}
                        size="small"
                        IconComponent={KeyboardArrowDownIcon}
                        input={<OutlinedInput />}
                        displayEmpty
                        renderValue={(value) => value || 'Select device family'}
                        error={!!errors.deviceFamily}
                        sx={{
                          '& .MuiOutlinedInput-notchedOutline': {
                            borderColor: theme.palette.grey[200],
                            borderRadius: '12px',
                          },
                        }}
                      >
                        {deviceFamilyOptions.map((option) => (
                          <MenuItem
                            key={option.value}
                            value={option.value}
                            sx={{ fontSize: '14px' }}
                          >
                            {option.label}
                          </MenuItem>
                        ))}
                      </Select>
                      {errors.deviceFamily && (
                        <Typography
                          className={styles.errorText}
                          variant="caption"
                        >
                          {errors.deviceFamily.message as string}
                        </Typography>
                      )}
                    </Box>
                  )}
                />

                <Controller
                  name="device"
                  control={control}
                  render={({ field }) => (
                    <Box>
                      <Typography className={styles.label} variant="caption">
                        Device
                      </Typography>
                      <Select
                        fullWidth
                        disabled={disableDevice}
                        value={field.value}
                        onChange={(e) => {
                          const v = e.target.value;
                          field.onChange(v);
                          // clear dependent
                          setValue('buildVersion', '');
                          if (v)
                            dispatch(fetchBuildsRequest({ deviceType: v }));
                        }}
                        className={styles.selectField}
                        size="small"
                        IconComponent={KeyboardArrowDownIcon}
                        input={<OutlinedInput />}
                        displayEmpty
                        renderValue={(value) => value || 'Select device'}
                        error={!!errors.device}
                        sx={{
                          '& .MuiOutlinedInput-notchedOutline': {
                            borderColor: theme.palette.grey[200],
                            borderRadius: '12px',
                          },
                        }}
                      >
                        {deviceOptions.map((option) => (
                          <MenuItem
                            key={option.value}
                            value={option.value}
                            sx={{ fontSize: '14px' }}
                          >
                            {option.label}
                          </MenuItem>
                        ))}
                      </Select>
                      {errors.device && (
                        <Typography
                          className={styles.errorText}
                          variant="caption"
                        >
                          {errors.device.message as string}
                        </Typography>
                      )}
                    </Box>
                  )}
                />

                <Controller
                  name="buildVersion"
                  control={control}
                  render={({ field }) => (
                    <Box>
                      <Typography className={styles.label} variant="caption">
                        Build Version
                      </Typography>
                      <Select
                        fullWidth
                        disabled={disableBuild}
                        value={field.value}
                        onChange={field.onChange}
                        className={styles.selectField}
                        size="small"
                        IconComponent={KeyboardArrowDownIcon}
                        input={<OutlinedInput />}
                        displayEmpty
                        renderValue={(value) => {
                          const selected = buildOptions.find(
                            (b) => b.value === value,
                          );
                          return selected
                            ? selected.label
                            : 'Select build version';
                        }}
                        error={!!errors.buildVersion}
                        sx={{
                          '& .MuiOutlinedInput-notchedOutline': {
                            borderColor: theme.palette.grey[200],
                            borderRadius: '12px',
                          },
                        }}
                      >
                        {buildOptions.map((option) => (
                          <MenuItem
                            key={option.value}
                            value={option.value}
                            sx={{ fontSize: '14px' }}
                          >
                            {option.label}
                          </MenuItem>
                        ))}
                      </Select>
                      {errors.buildVersion && (
                        <Typography
                          className={styles.errorText}
                          variant="caption"
                        >
                          {errors.buildVersion.message as string}
                        </Typography>
                      )}
                    </Box>
                  )}
                />
              </Box>
            </Stack>

            {/* Description */}
            <Stack spacing="9px">
              <Controller
                name="description"
                control={control}
                render={({ field }) => (
                  <Stack className={styles.textareaWrap} spacing="9px">
                    <Box className={styles.labelRow}>
                      <Typography className={styles.label} variant="caption">
                        Issue Description
                      </Typography>
                      <span className={styles.required}>*</span>
                    </Box>
                    <TextField
                      placeholder="Describe the issue in detail. Include steps to reproduce, expected behavior, and actual behavior..."
                      multiline
                      rows={6}
                      fullWidth
                      value={field.value}
                      onChange={field.onChange}
                      error={!!errors.description}
                      helperText={(errors.description?.message as string) || ''}
                      className={styles.textarea}
                      sx={{
                        '& .MuiOutlinedInput-notchedOutline': {
                          borderColor: theme.palette.background.pressed,
                          borderWidth: '1px',
                        },
                        '& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline':
                          {
                            borderColor: theme.palette.background.pressed,
                          },
                        '& .MuiOutlinedInput-root.Mui-error .MuiOutlinedInput-notchedOutline':
                          {
                            borderColor: theme.palette.background.pressed,
                          },
                      }}
                    />
                  </Stack>
                )}
              />

              <Typography className={styles.charCount} variant="buttonBase">
                {descriptionLength} / 1000 characters
              </Typography>
            </Stack>

            {/* Upload section */}
            <Stack spacing="9px" className={styles.attachContainer}>
              <Typography className={styles.label} variant="caption">
                Attach File (Optional)
              </Typography>
              {selectedFile ? (
                <Box className={styles.fileCard}>
                  <Box className={styles.fileInfo}>
                    <span className={styles.fileBadge}>
                      <InsertDriveFileOutlinedIcon
                        className={styles.fileBadgeIcon}
                      />
                    </span>
                    <Box>
                      <Typography className={styles.fileName} variant="body2">
                        {selectedFile.name}
                      </Typography>
                      <Typography className={styles.fileSize} variant="caption">
                        {`${(selectedFile.size / 1024).toFixed(2)} KB`}
                      </Typography>
                    </Box>
                  </Box>
                  <IconButton
                    onClick={() => onFileChange(null)}
                    className={styles.removeBtn}
                  >
                    <CloseIcon fontSize="small" />
                  </IconButton>
                </Box>
              ) : (
                <Stack
                  className={styles.uploadBox}
                  role="button"
                  onClick={triggerFileDialog}
                  justifyContent="center"
                  alignItems="center"
                >
                  <CustomIcon name="upload" />
                  <Typography
                    className={styles.uploadTitle}
                    variant="buttonBase"
                  >
                    Click to upload a file
                  </Typography>
                  <Typography className={styles.uploadHint} variant="caption">
                    Supported: .txt, .log, .pdf, images, .zip (Max 10MB)
                  </Typography>
                </Stack>
              )}
              <input
                type="file"
                ref={inputRef}
                style={{ display: 'none' }}
                onChange={(e) => onFileChange(e.target.files?.[0] || null)}
                accept=".txt,.log,.pdf,.png,.jpg,.jpeg,.gif,.zip"
              />
              {errors.file && (
                <Typography className={styles.errorText} variant="caption">
                  {errors.file.message as string}
                </Typography>
              )}
            </Stack>

            {/* Checkbox info box */}
            <Box className={styles.infoBox}>
              <Controller
                name="attachLogs"
                control={control}
                render={({ field }) => (
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={field.value}
                        onChange={(e) => field.onChange(e.target.checked)}
                        sx={{
                          color: theme.palette.checkbox?.primary,
                          '&.Mui-checked': {
                            color: theme.palette.checkbox?.primary,
                          },
                        }}
                      />
                    }
                    label={
                      <Stack>
                        <Typography
                          className={styles.infoTitle}
                          variant="buttonBase"
                          sx={{ color: theme.palette.text.infoTitle }}
                        >
                          Attach test logs automatically
                        </Typography>
                        <Typography
                          className={styles.infoText}
                          variant="caption"
                        >
                          Include all test execution logs from this session to
                          help the admin team diagnose the issue
                        </Typography>
                      </Stack>
                    }
                  />
                )}
              />
            </Box>
          </Stack>
        </Box>
      </DialogContent>

      {/* Footer */}
      <DialogActions className={styles.footer}>
        <Button
          onClick={() => {
            dispatch(resetReportIssueState());
            // Reset form
            resetToEmpty();
            onClose();
          }}
          className={styles.cancelBtn}
        >
          <Typography variant="label1" className={styles.cancelBtnText}>
            Cancel
          </Typography>
        </Button>
        <Button
          variant="contained"
          className={styles.submitBtn}
          type="submit"
          form="reportIssueForm"
          disabled={reportIssueLoading}
          startIcon={<SendMail />}
        >
          <Typography variant="label1" className={styles.submitBtnText}>
            {reportIssueLoading ? 'Submitting...' : 'Submit Report'}
          </Typography>
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ReportIssueDialog;
