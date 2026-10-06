import { useCallback, useEffect, useMemo, useState } from 'react';
import { alpha, Box, Card, CardContent, useTheme } from '@mui/material';
import { debounce } from 'radash';
import { useDispatch, useSelector } from 'react-redux';
import {
  ConfigurationFilters,
  ConfigurationStatsCards,
  ConfigurationTable,
  ConfigureRelayDialog,
  DeleteControllerDialog,
  EditControllerDialog,
} from 'components/Configuration';
import {
  clearConfigurationFilters,
  closeConfigurationDeleteDialog,
  closeConfigurationEditDialog,
  closeConfigurationRelayDialog,
  deleteConfigurationControllerRequest,
  fetchConfigurationControllersRequest,
  hardwareSyncCompleted,
  hardwareSyncFailed,
  loadMoreConfigurationControllersRequest,
  loadMoreRelayDeviceOptionsRequest,
  openConfigurationDeleteDialog,
  openConfigurationEditDialog,
  openConfigurationRelayDialogRequest,
  resetConfigurationChannelAssignments,
  saveConfigurationRelayRequest,
  setConfigurationChannelAssignment,
  setConfigurationChannelHardwareAssignment,
  setConfigurationEditFormField,
  setConfigurationSearchTerm,
  setConfigurationStatusFilter,
  toggleConfigurationRowExpansion,
  updateConfigurationControllerRequest,
} from 'store/slices/configuration/configurationSlice';
import type {
  ChannelHardwareAssignment,
  ConfigurationStat,
  ControllerStatus,
  EditControllerForm,
  RelayRow,
  StatusStyles,
} from 'types/configuration';
import { useAuth } from 'hooks/useAuth';
import { useSocketIoEvent } from 'hooks/useSocketIoEvent';
import type { RootState } from 'store';
import toastService from 'services/ToastService';
import { saveRelayIdentity } from 'services/configurationApiService';
import type {
  RelayIdentityUpdatePayload,
  RelayIdentityUpdateResponse,
} from 'types/deviceController';
import styles from './Configuration.module.scss';

const Configuration = () => {
  const dispatch = useDispatch();
  const theme = useTheme();
  const { user } = useAuth();
  const userId = user?.id || '';
  const {
    controllerRows,
    isLoading,
    isLoadingMore,
    isSaving,
    isSyncingHardware,
    isLoadingRelayChannels,
    isLoadingMoreDevices,
    hasMoreDevices,
    hasMore,
    fetchError,
    searchTerm,
    statusFilter,
    expandedRows,
    isEditDialogOpen,
    isDeleteDialogOpen,
    isConfigureRelayDialogOpen,
    selectedControllerId,
    selectedRelayContext,
    channelAssignments,
    channelHardwareAssignments,
    assignedDevices,
    relayDeviceOptions,
    summary,
    editForm,
    originalEditForm,
    originalChannelAssignments,
    originalChannelHardwareAssignments,
  } = useSelector((state: RootState) => state.configuration);

  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState(searchTerm);

  const refreshControllersDebounced = useMemo(
    () =>
      debounce({ delay: 400 }, () => {
        dispatch(fetchConfigurationControllersRequest());
      }),
    [dispatch],
  );

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 450);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [searchTerm]);

  const selectedController = useMemo(
    () =>
      controllerRows.find(
        (controller) => controller.controllerId === selectedControllerId,
      ) ?? null,
    [controllerRows, selectedControllerId],
  );

  const hasEditFormChanges = useMemo(() => {
    return editForm.controllerName !== originalEditForm.controllerName;
  }, [editForm, originalEditForm]);

  const hasChannelChanges = useMemo(() => {
    const currentChannels = Object.keys(channelAssignments);
    const originalChannels = Object.keys(originalChannelAssignments);

    if (currentChannels.length !== originalChannels.length) {
      return true;
    }

    const hasAssignmentChanges = currentChannels.some(
      (channel) =>
        channelAssignments[Number(channel)] !==
        originalChannelAssignments[Number(channel)],
    );

    const hardwareChannels = Object.keys(channelHardwareAssignments);
    const originalHardwareChannels = Object.keys(
      originalChannelHardwareAssignments,
    );

    const hasHardwareCountChanges =
      hardwareChannels.length !== originalHardwareChannels.length;

    const hasHardwareValueChanges = hardwareChannels.some((channel) => {
      const channelNumber = Number(channel);
      const current = channelHardwareAssignments[channelNumber] ?? {
        gpio: '',
        gpioDefaultLevel: 'LOW',
        relayDefaultLevel: 'LOW',
      };
      const original = originalChannelHardwareAssignments[channelNumber] ?? {
        gpio: '',
        gpioDefaultLevel: 'LOW',
        relayDefaultLevel: 'LOW',
      };

      return (
        current.gpio !== original.gpio ||
        current.gpioDefaultLevel !== original.gpioDefaultLevel ||
        current.relayDefaultLevel !== original.relayDefaultLevel
      );
    });

    return (
      hasAssignmentChanges || hasHardwareCountChanges || hasHardwareValueChanges
    );
  }, [
    channelAssignments,
    originalChannelAssignments,
    channelHardwareAssignments,
    originalChannelHardwareAssignments,
  ]);

  useEffect(() => {
    dispatch(fetchConfigurationControllersRequest());
  }, [debouncedSearchTerm, dispatch, statusFilter]);

  useSocketIoEvent<{
    action: 'added' | 'updated' | 'deleted';
    controllerId: string;
  }>(
    'device_controller_changed',
    () => {
      refreshControllersDebounced();
    },
    {
      userId,
      enabled: Boolean(userId),
    },
  );

  useSocketIoEvent<{
    controllerId?: string;
    relayId?: string;
    status: 'in_progress' | 'completed' | 'completed_with_errors' | 'failed';
    total?: number;
    completed?: number;
    errors?: string[];
    message?: string;
  }>(
    'relay_configuration_status',
    (payload) => {
      if (!isSyncingHardware) {
        return;
      }

      if (payload.status === 'completed') {
        dispatch(hardwareSyncCompleted());
        toastService.success('Hardware sync completed successfully.');
      } else if (payload.status === 'completed_with_errors' && payload.errors) {
        dispatch(hardwareSyncCompleted());
        toastService.warning(
          `Hardware sync completed with ${payload.errors.length} error(s). Some channels may need reconfiguration.`,
        );
      } else if (payload.status === 'failed') {
        dispatch(hardwareSyncFailed());
        toastService.error(
          payload.message ?? 'Hardware sync failed. Please try again.',
        );
      }
    },
    {
      userId,
      enabled: Boolean(userId),
    },
  );

  const hasActiveFilters =
    statusFilter !== 'All' || searchTerm.trim().length > 0;

  const stats = useMemo<ConfigurationStat[]>(() => {
    const totalControllers = summary.controllers.total;
    const onlineControllers = summary.controllers.online;
    const totalRelays = summary.relays.total;
    const onlineRelays = summary.relays.online;

    return [
      {
        label: 'Total Controllers',
        value: totalControllers,
        iconName: 'server',
        iconBg: 'linear-gradient(to bottom right, #3b82f6, #4f46e5)',
      },
      {
        label: 'Online Controllers',
        value: onlineControllers,
        iconName: 'wifi',
        iconBg: 'linear-gradient(to bottom right, #22c55e, #059669)',
      },
      {
        label: 'Total Relays',
        value: totalRelays,
        iconName: 'zap',
        iconBg: 'linear-gradient(to bottom right, #a855f7, #4f46e5)',
      },
      {
        label: 'Online Relays',
        value: onlineRelays,
        iconName: 'activity',
        iconBg: 'linear-gradient(to bottom right, #22c55e, #059669)',
      },
    ];
  }, [summary]);

  const getStatusStyles = useCallback(
    (status: ControllerStatus): StatusStyles => {
      if (status === 'Online') {
        return {
          color: theme.palette.success.main,
          bg: alpha(theme.palette.success.main, 0.14),
          border: alpha(theme.palette.success.main, 0.35),
        };
      }

      return {
        color: theme.palette.error.main,
        bg: alpha(theme.palette.error.main, 0.12),
        border: alpha(theme.palette.error.main, 0.35),
      };
    },
    [theme.palette.error.main, theme.palette.success.main],
  );

  const clearFilters = useCallback(() => {
    dispatch(clearConfigurationFilters());
  }, [dispatch]);

  const toggleRowExpansion = useCallback(
    (controllerId: string) => {
      dispatch(toggleConfigurationRowExpansion(controllerId));
    },
    [dispatch],
  );

  const openEditDialog = useCallback(
    (row: (typeof controllerRows)[number]) => {
      dispatch(openConfigurationEditDialog(row));
    },
    [dispatch],
  );

  const openDeleteDialog = useCallback(
    (row: (typeof controllerRows)[number]) => {
      dispatch(openConfigurationDeleteDialog(row));
    },
    [dispatch],
  );

  const openConfigureRelayDialog = useCallback(
    (controllerId: string, relay: RelayRow) => {
      dispatch(openConfigurationRelayDialogRequest({ controllerId, relay }));
    },
    [dispatch],
  );

  const handleEditSubmit = useCallback(async () => {
    if (!selectedController) {
      return;
    }

    dispatch(updateConfigurationControllerRequest());
  }, [dispatch, selectedController]);

  const handleDeleteSubmit = useCallback(async () => {
    if (!selectedController) {
      return;
    }
    dispatch(deleteConfigurationControllerRequest());
  }, [dispatch, selectedController]);

  const handleResetChannelAssignments = useCallback(() => {
    dispatch(resetConfigurationChannelAssignments());
  }, [dispatch]);

  const handleSaveChannelAssignments = useCallback(async () => {
    if (!selectedRelayContext || isSaving) {
      return;
    }

    const changedChannels = Object.keys(channelAssignments).filter(
      (channelKey) =>
        channelAssignments[Number(channelKey)] !==
        originalChannelAssignments[Number(channelKey)],
    );

    const hasAnyDeviceAssignments = changedChannels.some(
      (channelKey) =>
        (channelAssignments[Number(channelKey)] ?? '').trim() !== '',
    );

    dispatch(
      saveConfigurationRelayRequest({
        waitForHardwareSync: hasAnyDeviceAssignments,
      }),
    );
  }, [
    channelAssignments,
    dispatch,
    isSaving,
    originalChannelAssignments,
    selectedRelayContext,
  ]);

  const handleLoadMore = useCallback(() => {
    if (isLoading || isLoadingMore || !hasMore) {
      return;
    }
    dispatch(loadMoreConfigurationControllersRequest());
  }, [dispatch, isLoading, isLoadingMore, hasMore]);

  const handleLoadMoreDevices = useCallback(() => {
    if (isLoadingMoreDevices || !hasMoreDevices) {
      return;
    }
    dispatch(loadMoreRelayDeviceOptionsRequest());
  }, [dispatch, isLoadingMoreDevices, hasMoreDevices]);

  const handleEditFormChange = useCallback(
    (field: keyof EditControllerForm, value: string) => {
      dispatch(setConfigurationEditFormField({ field, value }));
    },
    [dispatch],
  );

  const handleChannelChange = useCallback(
    (channel: number, value: string) => {
      dispatch(setConfigurationChannelAssignment({ channel, value }));
    },
    [dispatch],
  );

  const handleChannelHardwareChange = useCallback(
    (
      channel: number,
      field: keyof ChannelHardwareAssignment,
      value: string,
    ) => {
      dispatch(
        setConfigurationChannelHardwareAssignment({ channel, field, value }),
      );
    },
    [dispatch],
  );

  const closeEditDialog = useCallback(() => {
    dispatch(closeConfigurationEditDialog());
  }, [dispatch]);

  const closeDeleteDialog = useCallback(() => {
    dispatch(closeConfigurationDeleteDialog());
  }, [dispatch]);

  const closeConfigureRelayDialog = useCallback(() => {
    dispatch(closeConfigurationRelayDialog());
  }, [dispatch]);

  const handleRelayIdentityUpdate = useCallback(
    async (
      payload: RelayIdentityUpdatePayload,
    ): Promise<RelayIdentityUpdateResponse> => {
      if (!selectedRelayContext) {
        throw new Error('No relay is selected');
      }
      try {
        const result = await saveRelayIdentity(
          selectedRelayContext.relay.relayId,
          payload,
        );
        toastService.success(
          `Relay identity updated to ${result.serialNumber}.`,
        );
        dispatch(fetchConfigurationControllersRequest());
        return result;
      } catch (error: unknown) {
        const axiosError = error as {
          response?: { data?: { message?: string; error?: string } };
        };
        toastService.error(
          axiosError.response?.data?.message ??
            axiosError.response?.data?.error ??
            'Unable to update relay identity.',
        );
        throw error;
      }
    },
    [dispatch, selectedRelayContext],
  );

  return (
    <Box className={styles.pageRoot}>
      <ConfigurationStatsCards stats={stats} />

      <Card className={styles.configurationCard}>
        <CardContent className={styles.configurationCardContent}>
          <ConfigurationFilters
            searchTerm={searchTerm}
            onSearchChange={(value: string) =>
              dispatch(setConfigurationSearchTerm(value))
            }
            statusFilter={statusFilter}
            onStatusChange={(value: 'All' | ControllerStatus) =>
              dispatch(setConfigurationStatusFilter(value))
            }
            hasActiveFilters={hasActiveFilters}
            onClearFilters={clearFilters}
          />

          <ConfigurationTable
            isLoading={isLoading}
            isLoadingMore={isLoadingMore}
            fetchError={fetchError}
            rows={controllerRows}
            expandedRows={expandedRows}
            onToggleRowExpansion={toggleRowExpansion}
            onOpenEditDialog={openEditDialog}
            onOpenDeleteDialog={openDeleteDialog}
            onOpenConfigureRelayDialog={openConfigureRelayDialog}
            getStatusStyles={getStatusStyles}
            hasActiveFilters={hasActiveFilters}
            onClearFilters={clearFilters}
            hasMore={hasMore}
            onLoadMore={handleLoadMore}
          />
        </CardContent>
      </Card>

      <EditControllerDialog
        open={isEditDialogOpen}
        onClose={closeEditDialog}
        editForm={editForm}
        onFormChange={handleEditFormChange}
        onSubmit={handleEditSubmit}
        isSaving={isSaving}
        hasChanges={hasEditFormChanges}
      />

      <DeleteControllerDialog
        open={isDeleteDialogOpen}
        onClose={closeDeleteDialog}
        onSubmit={handleDeleteSubmit}
        controllerId={selectedController?.controllerId}
        isSaving={isSaving}
      />

      <ConfigureRelayDialog
        open={isConfigureRelayDialogOpen}
        onClose={closeConfigureRelayDialog}
        selectedRelayContext={selectedRelayContext}
        channelAssignments={channelAssignments}
        channelHardwareAssignments={channelHardwareAssignments}
        assignedDevices={assignedDevices}
        onChannelChange={handleChannelChange}
        onChannelHardwareChange={handleChannelHardwareChange}
        onRelayIdentityUpdate={handleRelayIdentityUpdate}
        onResetAll={handleResetChannelAssignments}
        onSave={handleSaveChannelAssignments}
        channelValueOptions={relayDeviceOptions}
        isSaving={isSaving}
        isSyncingHardware={isSyncingHardware}
        isLoading={isLoadingRelayChannels}
        isLoadingMoreDevices={isLoadingMoreDevices}
        hasMoreDevices={hasMoreDevices}
        onLoadMoreDevices={handleLoadMoreDevices}
        hasChanges={hasChannelChanges}
      />
    </Box>
  );
};

export default Configuration;
