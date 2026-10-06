import { useEffect, useMemo, useState, useRef, memo, useCallback } from 'react';
import { Box, Stack, Typography, useTheme } from '@mui/material';
import { useDispatch, useSelector } from 'react-redux';
import type { RootState } from 'store';
import styles from './BuildsContainer.module.scss';
import BuildHeader from './BuildHeader';
import UploadBuild from './UploadBuild/UploadBuild';
import { Column, DataTable } from 'components/common';
import EmptyState from 'components/common/EmptyState/EmptyState';
import CustomIcon from 'components/common/CustomIcon/CustomIcon';
import ConfirmFlagModal from 'components/common/ConfirmFlagModal/ConfirmFlagModal';
import { ConfirmDeleteModal } from 'components/common/ConfirmDeleteModal/ConfirmDeleteModal';
import cellsStyles from './BuildsContainer.module.scss';
import { useAuth } from 'hooks/useAuth';
import { useUploadWebSocket } from 'hooks/useUploadWebSocket';
import {
  fetchBuildFiltersRequest,
  fetchBuildsRequest,
  setBuildsSearch,
  setBuildsSort,
  setBuildsPage,
  setBuildsDeviceFamily,
  setBuildsDeviceType,
  setBuildsFlagged,
  updateBuildFlagRequest,
  updateBuildFlagInState,
  updateBuildStatusInState,
  removeBuildFromState,
  deleteBuildRequest,
} from 'store/slices/builds/buildsSlice';
import { setUploadProgress } from 'store/slices/upload/uploadSlice';
import type { BuildRelease } from 'types/builds';
import { toastService } from 'services/ToastService';
import { uploadFiles } from 'services/uploadService';

interface BuildsContainerProps {
  userType?: 'user' | 'admin';
  title?: string;
}

const BuildsContainer = ({
  userType = 'user',
  title = 'Builds',
}: BuildsContainerProps) => {
  // keep it later implement customize
  void title;

  const theme = useTheme();
  const [showUpload, setShowUpload] = useState(false);
  const toastShownRef = useRef(false); // Use ref to prevent race conditions
  const [confirmState, setConfirmState] = useState<{
    open: boolean;
    buildVersion?: string;
    id?: string;
    nextFlag?: boolean;
  }>({ open: false });
  const [deleteConfirmState, setDeleteConfirmState] = useState<{
    open: boolean;
    buildVersion?: string;
    id?: string;
  }>({ open: false });
  const locallyDeletedBuildIdsRef = useRef<Set<string>>(new Set());
  const refreshTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const uploadProgressRef = useRef<typeof uploadProgress>(null);

  const dispatch = useDispatch();

  // Split selectors to prevent table re-renders when upload progress changes
  const {
    data,
    totalCount,
    page,
    rowsPerPage,
    sortBy,
    sortOrder,
    loading,
    search,
    deviceFamily,
    deviceType,
    flagged,
    buildVersion,
  } = useSelector((state: RootState) => state.builds);

  // Separate selector for upload progress - completely independent from builds
  const uploadProgress = useSelector(
    (state: RootState) => state.upload.progressUI,
  );

  const { user } = useAuth();
  const userId = user?.id || '';

  // Sync upload progress to ref for use in callbacks without causing re-renders
  useEffect(() => {
    uploadProgressRef.current = uploadProgress;
  }, [uploadProgress]);

  useEffect(() => {
    dispatch(fetchBuildFiltersRequest());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    dispatch(
      fetchBuildsRequest({
        search,
        deviceFamily: deviceFamily || undefined,
        deviceType: deviceType || undefined,
        flagged,
        buildVersion: buildVersion || undefined,
        page: page + 1,
        limit: rowsPerPage,
        sortBy: sortBy || undefined,
        sortOrder: sortOrder || undefined,
      }),
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    search,
    deviceFamily,
    deviceType,
    flagged,
    buildVersion,
    page,
    rowsPerPage,
    sortBy,
    sortOrder,
  ]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current);
      }
    };
  }, []);

  // WebSocket: listen for upload_* events for this user during active uploads
  // Enabled only for error notifications from backend processing
  useUploadWebSocket({
    userId,
    enabled: uploadProgressRef.current?.status === 'uploading', // Enable during active uploads
    onProgress: (_percent) => {
      // Using direct upload callbacks for progress tracking
    },
    onComplete: () => {
      // Using direct upload callback for completion
    },
    onError: (message) => {
      // Backend processing error - show it and stop upload
      toastService.error(`Upload processing failed: ${message}`, {
        clearExisting: false,
        autoClose: 8000,
      });
      dispatch(
        setUploadProgress({
          progress: 0,
          message: 'Processing failed',
          status: 'error',
        }),
      );
      setTimeout(() => dispatch(setUploadProgress(null)), 3000);
    },
  });

  // WebSocket: listen for build_uploaded broadcasts from backend (all users)
  useUploadWebSocket({
    userId,
    enabled: true, // Always enabled to receive build upload broadcasts
    onProgress: () => {},
    onComplete: () => {},
    onError: () => {},
    onBuildUploaded: (buildData) => {
      // Don't refresh if an upload is currently in progress - wait for completion
      if (uploadProgressRef.current?.status === 'uploading') {
        return;
      }

      // A new build was uploaded by someone - refresh the table
      toastService.info(
        `New build available: ${buildData.version} (${buildData.deviceType})`,
        { clearExisting: false, autoClose: 5000 },
      );

      // Debounce refresh to prevent multiple rapid calls
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current);
      }

      refreshTimeoutRef.current = setTimeout(() => {
        // Clear filters and refresh to first page to show new build
        dispatch(setBuildsSearch(''));
        dispatch(setBuildsDeviceFamily(''));
        dispatch(setBuildsDeviceType(''));
        dispatch(setBuildsFlagged(undefined));
        dispatch(setBuildsPage(0));
        dispatch(setBuildsSort({ sortBy: undefined, sortOrder: undefined }));

        // Refresh builds list silently (no loading state to prevent icon flash)
        dispatch(
          fetchBuildsRequest({
            page: 1,
            limit: rowsPerPage,
            silent: true,
          }),
        );
      }, 500);
    },
    onBuildFlagged: (flagData) => {
      // Skip toast if this user performed the action
      if (flagData.userId !== userId) {
        toastService.info(
          `Build ${flagData.isFaulty ? 'flagged' : 'unflagged'}: ${flagData.version}`,
          { clearExisting: false, autoClose: 3000 },
        );
      }

      // Immediately update state - no delay, no loading, no blinking
      if (flagData.releaseId && typeof flagData.isFaulty === 'boolean') {
        dispatch(
          updateBuildFlagInState({
            releaseId: flagData.releaseId,
            isFaulty: flagData.isFaulty,
          }),
        );
      }
    },
    onBuildStatusChanged: (statusData) => {
      if (!statusData.releaseId) {
        return;
      }

      dispatch(
        updateBuildStatusInState({
          releaseId: statusData.releaseId,
          status: statusData.status,
          isFaulty: statusData.isFaulty,
        }),
      );
    },
    onBuildDeleted: (deleteData) => {
      const isLocallyDeleted = deleteData.releaseId
        ? locallyDeletedBuildIdsRef.current.has(deleteData.releaseId)
        : false;

      if (isLocallyDeleted && deleteData.releaseId) {
        locallyDeletedBuildIdsRef.current.delete(deleteData.releaseId);
      }

      // Skip toast if this user performed the action
      if (deleteData.userId !== userId && !isLocallyDeleted) {
        toastService.info(`Build deleted: ${deleteData.version}`, {
          clearExisting: false,
          autoClose: 3000,
        });
      }

      // Immediately update state - no delay, no loading, no blinking
      if (deleteData.releaseId) {
        dispatch(
          removeBuildFromState({
            releaseId: deleteData.releaseId,
          }),
        );
      }
    },
  });

  const columns: Column<BuildRelease>[] = useMemo(() => {
    const getBuildStatusUi = (row: BuildRelease) => {
      const isOfficial = row.buildType?.toLowerCase() === 'official';
      const normalizedStatus = row.status?.toLowerCase();

      if (!isOfficial) {
        const isFlagged = row.isFaulty === true;
        return {
          isFlagged,
          statusLabel: isFlagged ? 'Flagged' : 'Active',
          iconName: isFlagged
            ? ('triangle-alert' as const)
            : ('circle-check' as const),
          statusColor: isFlagged
            ? theme.palette.error.main
            : theme.palette.success.main,
          statusBgColor: isFlagged
            ? theme.palette.error[20]
            : theme.palette.success[20],
          statusBorderColor: isFlagged
            ? theme.palette.error[20]
            : theme.palette.success[20],
        };
      }

      const isFlagged = row.isFaulty === true || normalizedStatus === 'failed';
      if (isFlagged) {
        return {
          isFlagged: true,
          statusLabel: 'Flagged',
          iconName: 'triangle-alert' as const,
          statusColor: theme.palette.error.main,
          statusBgColor: theme.palette.error[20],
          statusBorderColor: theme.palette.error[20],
        };
      }

      if (normalizedStatus === 'testing') {
        return {
          isFlagged: false,
          statusLabel: 'Validating',
          iconName: 'loader' as const,
          statusColor: theme.palette.warning.main,
          statusBgColor: theme.palette.warning[20],
          statusBorderColor: theme.palette.warning.main,
        };
      }

      if (normalizedStatus === 'untested') {
        return {
          isFlagged: false,
          statusLabel: 'Waiting',
          iconName: 'clock-3' as const,
          statusColor: theme.palette.warning.main,
          statusBgColor: theme.palette.warning[20],
          statusBorderColor: theme.palette.warning[20],
        };
      }

      return {
        isFlagged: false,
        statusLabel: 'Active',
        iconName: 'circle-check' as const,
        statusColor: theme.palette.success.main,
        statusBgColor: theme.palette.success[20],
        statusBorderColor: theme.palette.success[20],
      };
    };

    const ActionButtons = memo(({ row }: { row: BuildRelease }) => {
      const { isFlagged } = getBuildStatusUi(row);
      const nextFlag = !isFlagged;
      return (
        <Stack
          direction="row"
          gap={1}
          alignItems="center"
          justifyContent="center"
        >
          <Box
            onClick={() =>
              setConfirmState({
                open: true,
                buildVersion: row.version,
                id: row.id,
                nextFlag,
              })
            }
            sx={{
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'transform 200ms ease',
              '&:hover': { transform: 'scale(1.1)' },
            }}
          >
            <CustomIcon
              name="flag"
              size={18}
              color={
                isFlagged
                  ? theme.palette.error.main
                  : theme.palette.success.main
              }
              variant={isFlagged ? 'filled' : undefined}
            />
          </Box>
          <Box
            onClick={() =>
              setDeleteConfirmState({
                open: true,
                buildVersion: row.version,
                id: row.id,
              })
            }
            sx={{
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'transform 200ms ease',
              '&:hover': { transform: 'scale(1.1)' },
            }}
          >
            <CustomIcon
              name="trash-2"
              size={18}
              color={theme.palette.error.main}
            />
          </Box>
        </Stack>
      );
    });
    ActionButtons.displayName = 'ActionButtons';

    const base: Column<BuildRelease>[] = [
      {
        key: 'deviceFamily',
        label: 'Device Family',
        icon: 'cpu',
        sortable: true,
        minWidth: '160px',
        width: '160px',
        render: (row: BuildRelease) => (
          <Box className={cellsStyles.familyBadge}>
            <Typography
              className={cellsStyles.familyText}
              variant="body4"
              component="span"
            >
              {row.deviceFamily}
            </Typography>
          </Box>
        ),
      },
      {
        key: 'deviceType',
        label: 'Device',
        icon: 'hard-drive',
        sortable: true,
        minWidth: '180px',
        width: '180px',
        render: (row: BuildRelease) => (
          <Box className={cellsStyles.deviceTagContainer}>
            <Typography
              className={cellsStyles.deviceTag}
              variant="body4"
              component="span"
            >
              {row.deviceType}
            </Typography>
          </Box>
        ),
      },
      {
        key: 'version',
        label: 'Build Version',
        icon: 'package',
        sortable: true,
        minWidth: '180px',
        width: '220px',
        render: (row: BuildRelease) => (
          <Box className={cellsStyles.versionBadge}>
            <Typography
              className={cellsStyles.versionText}
              component="span"
              variant="body3"
            >
              {row.version}
            </Typography>
          </Box>
        ),
      },
      {
        key: 'status',
        label: 'Status',
        sortable: false,
        minWidth: '200px',
        width: '200px',
        render: (row: BuildRelease) => {
          const {
            isFlagged,
            statusLabel,
            iconName,
            statusColor,
            statusBgColor,
            statusBorderColor,
          } = getBuildStatusUi(row);

          return (
            <Box className={cellsStyles.statusContainer}>
              <Box
                className={cellsStyles.statusBadge}
                sx={
                  statusBgColor
                    ? {
                        backgroundColor: statusBgColor,
                        border: `1px solid ${statusBorderColor}`,
                      }
                    : undefined
                }
              >
                <CustomIcon name={iconName} size={14} color={statusColor} />
                <Typography
                  className={cellsStyles.statusText}
                  sx={{
                    color: statusColor,
                  }}
                >
                  {statusLabel}
                </Typography>
              </Box>
              {isFlagged && (
                <Typography
                  className={cellsStyles.statusDescription}
                  variant="body4"
                >
                  Critical stability issues causing test failures
                </Typography>
              )}
            </Box>
          );
        },
      },
      {
        key: 'createdAt',
        label: 'Upload Date',
        icon: 'calendar',
        sortable: true,
        minWidth: '160px',
        width: '160px',
        render: (row: BuildRelease) => {
          const d = new Date(row.createdAt);
          const yyyy = String(d.getFullYear());
          const mm = String(d.getMonth() + 1).padStart(2, '0');
          const dd = String(d.getDate()).padStart(2, '0');
          const hh = String(d.getHours()).padStart(2, '0');
          const min = String(d.getMinutes()).padStart(2, '0');
          const dateStr = `${yyyy}-${mm}-${dd} ${hh}:${min}`;
          return (
            <Typography
              className={cellsStyles.uploadDateText}
              variant="body4"
              component="span"
            >
              {dateStr}
            </Typography>
          );
        },
      },
    ];

    if (userType === 'admin') {
      base.push({
        key: 'actions',
        label: 'Actions',
        sortable: false,
        align: 'center',
        minWidth: '140px',
        width: '140px',
        render: (row: BuildRelease) => <ActionButtons row={row} />,
      });
    }

    return base;
  }, [
    theme.palette.error,
    theme.palette.success,
    theme.palette.warning,
    userType,
  ]);

  const hasActiveFilters = [
    search && search.trim(),
    deviceFamily,
    deviceType,
    flagged !== undefined ? 'x' : '',
    buildVersion,
  ].some(Boolean);

  const handlePageChange = useCallback(
    (p: number) => dispatch(setBuildsPage(p)),
    [dispatch],
  );

  const handleSort = useCallback(
    (key: string) => {
      const nextOrder = sortBy === key && sortOrder === 'asc' ? 'desc' : 'asc';
      dispatch(setBuildsSort({ sortBy: key, sortOrder: nextOrder }));
    },
    [dispatch, sortBy, sortOrder],
  );

  const handleClearFilters = useCallback(() => {
    dispatch(setBuildsSearch(''));
    dispatch(setBuildsSort({ sortBy: undefined, sortOrder: undefined }));
    dispatch(setBuildsDeviceFamily(''));
    dispatch(setBuildsDeviceType(''));
    dispatch(setBuildsFlagged(undefined));
  }, [dispatch]);

  const finalizeUploadBatch = useCallback(
    (totalFiles: number) => {
      if (toastShownRef.current) {
        return;
      }

      toastShownRef.current = true;
      toastService.success(
        `All files uploaded successfully! ${totalFiles} ${totalFiles === 1 ? 'file' : 'files'} processed.`,
        { clearExisting: false, autoClose: 4000 },
      );

      dispatch(setBuildsSearch(''));
      dispatch(setBuildsDeviceFamily(''));
      dispatch(setBuildsDeviceType(''));
      dispatch(setBuildsFlagged(undefined));
      dispatch(setBuildsPage(0));
      dispatch(
        setBuildsSort({
          sortBy: undefined,
          sortOrder: undefined,
        }),
      );

      dispatch(
        setUploadProgress({
          ...(uploadProgressRef.current || { progress: 0 }),
          progress: 100,
          filesTotal: totalFiles,
          filesCompleted: totalFiles,
          filesInProgress: 0,
          message: 'All files uploaded successfully!',
          status: 'completed',
        }),
      );

      setTimeout(() => {
        dispatch(
          fetchBuildsRequest({
            page: 1,
            limit: rowsPerPage,
            silent: true,
          }),
        );
      }, 1000);

      setTimeout(() => dispatch(setUploadProgress(null)), 3000);
    },
    [dispatch, rowsPerPage],
  );

  // Memoize table to prevent re-renders when upload progress changes
  const BuildsTable = useMemo(
    () => (
      <DataTable<BuildRelease>
        title="builds"
        columns={columns}
        data={data}
        totalCount={totalCount}
        page={page}
        onPageChange={handlePageChange}
        sortBy={sortBy}
        sortOrder={sortOrder}
        onSort={handleSort}
        rowsPerPage={rowsPerPage}
        loading={loading}
        isRowFlagged={(row) =>
          row.buildType?.toLowerCase() === 'official'
            ? row.isFaulty === true || row.status?.toLowerCase() === 'failed'
            : row.isFaulty === true
        }
        getRowKey={(row) => row.id}
        emptyState={
          <EmptyState
            message="No builds found matching your filters"
            hasActiveFilters={hasActiveFilters}
            onClearFilters={handleClearFilters}
            clearLabel="Clear all filters"
          />
        }
      />
    ),
    [
      columns,
      data,
      totalCount,
      page,
      handlePageChange,
      sortBy,
      sortOrder,
      handleSort,
      rowsPerPage,
      loading,
      hasActiveFilters,
      handleClearFilters,
    ],
  );

  return (
    <Stack className={styles.container}>
      <Stack className={styles.headerContainer}>
        <BuildHeader
          count={totalCount}
          onSearchChange={(v) => dispatch(setBuildsSearch(v))}
          onUploadClick={() => setShowUpload(true)}
          uploadProgress={uploadProgress}
        />
      </Stack>
      <Box className={styles.deviceTableContainer}>{BuildsTable}</Box>
      {confirmState.open && (
        <ConfirmFlagModal
          open={confirmState.open}
          buildVersion={confirmState.buildVersion}
          nextFlag={confirmState.nextFlag}
          onCancel={() => setConfirmState({ open: false })}
          onConfirm={() => {
            if (confirmState.id && typeof confirmState.nextFlag === 'boolean') {
              dispatch(
                updateBuildFlagRequest({
                  id: confirmState.id,
                  isFaulty: confirmState.nextFlag,
                }),
              );
            }
            setConfirmState({ open: false });
          }}
        />
      )}
      {deleteConfirmState.open && (
        <ConfirmDeleteModal
          open={deleteConfirmState.open}
          buildVersion={deleteConfirmState.buildVersion || ''}
          onCancel={() => setDeleteConfirmState({ open: false })}
          onConfirm={() => {
            if (deleteConfirmState.id) {
              locallyDeletedBuildIdsRef.current.add(deleteConfirmState.id);
              dispatch(deleteBuildRequest({ id: deleteConfirmState.id }));
            }
            setDeleteConfirmState({ open: false });
          }}
        />
      )}
      {showUpload && (
        <UploadBuild
          open={showUpload}
          userType={userType}
          maxFiles={5}
          onCancel={() => setShowUpload(false)}
          onConfirm={async (payload) => {
            const files = payload.files;
            if (!files || files.length === 0) return;

            // Debug logging for tags
            console.log('BuildsContainer - Upload payload:', {
              filesCount: files.length,
              fileNames: files.map((f) => f.name),
              tags: payload.tags,
              userType,
            });

            setShowUpload(false);
            toastShownRef.current = false; // Reset toast flag for new upload
            dispatch(
              setUploadProgress({
                progress: 0,
                filesTotal: files.length,
                filesInProgress: files.length,
                filesCompleted: 0,
                message: `Uploading ${files.length} ${files.length === 1 ? 'file' : 'files'}...`,
                status: 'uploading',
              }),
            );

            // Use authenticated user ID for server-targeted WS updates

            try {
              await uploadFiles({
                files,
                scope: userType === 'admin' ? 'admin' : 'user',
                userId,
                tags: payload.tags,
                onProgress: (percent, meta) => {
                  const currentProgress = uploadProgressRef.current;
                  const fileNum = meta.fileIndex + 1;
                  const total = currentProgress?.filesTotal || files.length;
                  const aggregateProgress = Math.min(
                    100,
                    Math.round(
                      ((meta.fileIndex + percent / 100) / total) * 100,
                    ),
                  );
                  dispatch(
                    setUploadProgress({
                      ...(currentProgress || { progress: 0 }),
                      progress: aggregateProgress,
                      message: `Uploading ${meta.fileName}${total > 1 ? ` (${fileNum}/${total})` : ''} - ${percent}%`,
                    }),
                  );
                },
                onStart: (meta) => {
                  const currentProgress = uploadProgressRef.current;
                  const fileNum = meta.fileIndex + 1;
                  const total = currentProgress?.filesTotal || files.length;
                  dispatch(
                    setUploadProgress({
                      ...(currentProgress || { progress: 0 }),
                      message: `Uploading ${meta.fileName}${total > 1 ? ` (${fileNum}/${total})` : ''}...`,
                    }),
                  );
                },
                onComplete: async (_meta) => {
                  // Update progress to show file completion count
                  const currentProgress = uploadProgressRef.current;
                  const completed = (currentProgress?.filesCompleted || 0) + 1;
                  const total = currentProgress?.filesTotal || files.length;
                  const isAllComplete = completed === total;

                  if (isAllComplete) {
                    finalizeUploadBatch(total);
                    return;
                  }

                  dispatch(
                    setUploadProgress({
                      ...(currentProgress || { progress: 0 }),
                      progress: Math.round((completed / total) * 100),
                      filesInProgress: Math.max(0, total - completed),
                      filesCompleted: completed,
                      status: currentProgress?.status ?? 'uploading',
                      message: `${completed} ${completed === 1 ? 'file' : 'files'} uploaded successfully${total > 1 ? ` (${completed}/${total})` : ''}`,
                    }),
                  );
                },
                onError: (err, meta) => {
                  let errorMsg = meta.message || err.message || 'Upload failed';

                  // Clean up error message for common cases
                  if (
                    errorMsg.includes('response code: 413') ||
                    errorMsg.toLowerCase().includes('maximum size exceeded')
                  ) {
                    errorMsg = 'File size limit exceeded (max 500 MB)';
                  } else if (errorMsg.includes('from request (method:')) {
                    // Extract just the meaningful part from verbose TUS errors
                    const match = errorMsg.match(/response text: ([^,]+)/);
                    if (match && match[1]) {
                      errorMsg = match[1].trim();
                    } else {
                      errorMsg = 'Upload failed';
                    }
                  }

                  toastService.error(
                    `Failed to upload ${meta.fileName}: ${errorMsg}`,
                    { clearExisting: false, autoClose: 8000 },
                  );
                  const currentProgress = uploadProgressRef.current;
                  const left = Math.max(
                    0,
                    (currentProgress?.filesInProgress || 1) - 1,
                  );
                  dispatch(
                    setUploadProgress({
                      progress: 0,
                      filesTotal: currentProgress?.filesTotal,
                      filesInProgress: left,
                      filesCompleted: currentProgress?.filesCompleted || 0,
                      message:
                        left === 0 ? 'Upload failed' : `${left} remaining`,
                      status: 'error',
                    }),
                  );
                  // Clear progress after delay if all done
                  setTimeout(() => {
                    const prog = uploadProgressRef.current;
                    if (prog && (prog.filesInProgress ?? 0) === 0) {
                      dispatch(setUploadProgress(null));
                    }
                  }, 3000);
                },
              });

              // Safety net: if a callback misses final state, finalize once the batch promise resolves
              finalizeUploadBatch(files.length);
            } catch (uploadError) {
              // Handle any errors from the upload process
              console.error('Upload process error:', uploadError);
              dispatch(setUploadProgress(null));
            }
          }}
        />
      )}
    </Stack>
  );
};

export default BuildsContainer;
