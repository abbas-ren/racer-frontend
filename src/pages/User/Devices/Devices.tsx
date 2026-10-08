import { Stack } from '@mui/material';
import { useEffect, useMemo, useCallback, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import styles from './Devices.module.scss';
import TableFilter from 'components/common/TableFilter';
import { ConfirmPowerModal, DataTable } from 'components/common';
import { RootState } from 'store/store';
import {
  fetchUserDevicesRequest,
  setPage,
  setSearch,
  setStatus,
  setSort,
  triggerDevicesRefresh,
  toggleDevicePowerRequest,
} from 'store/slices/userDevices/userDevicesSlice';
import {
  clearDeviceMessage,
  deleteDeviceRequest,
} from 'store/slices/device/deviceSlice';
import type { UserDevicesState } from 'store/slices/userDevices/userDevicesSlice';
import { DeviceState } from 'typesCustom/components';
import { useDeviceTerminal } from 'hooks/useDeviceTerminal';
import { useDevicePowerToggle } from 'hooks/useDevicePowerToggle';
import { useDeviceColumns } from 'components/UserDevices/DeviceColumns';
import EmptyState from 'components/common/EmptyState/EmptyState';
import SSHTerminalBar from 'components/Terminal/SSHTeminalBar';
import SSHTerminalComponent from 'components/Terminal/SSHTerminal';
import RTOSTerminalComponent from 'components/Terminal/RTOSTerminal';
import TreeTopology from 'pages/Admin/Devices/TreeTopology';
import { ROLES } from 'utils/common';
import {
  DeviceActiveIcon,
  DevicePassiveIcon,
  TopologyActiveIcon,
  TopologyPassiveIcon,
} from 'assets/index';
import { DeleteConfirmDialog } from 'components/Dialogs/ConfirmDialog';
import toastService from 'services/ToastService';

interface PowerConfirmState {
  open: boolean;
  deviceId: string;
  deviceName: string;
  isPowerOn: boolean;
}

interface DeleteConfirmState {
  open: boolean;
  deviceId: string;
  deviceName: string;
}

const DEVICE_TABS = [
  {
    key: 'devices',
    label: 'Devices',
    activeIcon: DeviceActiveIcon,
    passiveIcon: DevicePassiveIcon,
  },
  {
    key: 'tree-topology',
    label: 'Tree Topology',
    activeIcon: TopologyActiveIcon,
    passiveIcon: TopologyPassiveIcon,
  },
] as const;

type DeviceTabKey = (typeof DEVICE_TABS)[number]['key'];

function Devices() {
  const dispatch = useDispatch();
  const [activeTab, setActiveTab] = useState<DeviceTabKey>('devices');
  const {
    search,
    status,
    sortBy,
    sortOrder,
    page,
    rowsPerPage,
    loading,
    dataFetched,
    totalDevices,
    data: paginatedData,
    powerToggleLoading,
    powerToggleError,
    refreshTrigger,
  } = useSelector((state: RootState) => state.userDevices);

  const user = useSelector((state: RootState) => state.auth.user);
  const {
    actionLoading: deleteActionLoading,
    message: deleteMessage,
    error: deleteError,
  } = useSelector((state: RootState) => state.device);
  const isAdmin = user?.realmRoles?.includes(ROLES.Admin) ?? false;
  const visibleTabs = isAdmin
    ? DEVICE_TABS
    : DEVICE_TABS.filter((tab) => tab.key !== 'tree-topology');

  // Power confirmation modal state
  const [powerConfirm, setPowerConfirm] = useState<PowerConfirmState>({
    open: false,
    deviceId: '',
    deviceName: '',
    isPowerOn: false,
  });
  const [deleteConfirm, setDeleteConfirm] = useState<DeleteConfirmState>({
    open: false,
    deviceId: '',
    deviceName: '',
  });
  const [deletingDeviceId, setDeletingDeviceId] = useState<string | null>(null);

  // Custom hooks for terminal and power toggle
  const {
    selectedDeviceId,
    terminalTarget,
    terminalMode,
    handleSshTerminalOpen,
    handleRtosTerminalOpen,
    closeTerminal,
  } = useDeviceTerminal(paginatedData);

  useDevicePowerToggle(powerToggleError);

  const statusOptions = useMemo(
    () => [
      { value: 'all', label: 'All Status' },
      { value: DeviceState.AVAILABLE, label: 'Available' },
      { value: DeviceState.BUSY, label: 'Busy' },
      { value: DeviceState.FAULTY, label: 'Faulty' },
      { value: DeviceState.NOT_REACHABLE, label: 'Not Reachable' },
    ],
    [],
  );

  const deviceCount = totalDevices || 0;
  const hasActiveFilters = !!(search || (status && status !== 'all'));

  // Open power confirmation modal
  const handlePowerToggleClick = useCallback(
    (deviceId: string, deviceName: string, isPowerOn: boolean) => {
      setPowerConfirm({
        open: true,
        deviceId,
        deviceName,
        isPowerOn,
      });
    },
    [],
  );

  // Close power confirmation modal
  const handlePowerConfirmCancel = useCallback(() => {
    setPowerConfirm((prev) => ({ ...prev, open: false }));
  }, []);

  // Confirm power toggle
  const handlePowerConfirm = useCallback(() => {
    dispatch(toggleDevicePowerRequest(powerConfirm.deviceId));
    setPowerConfirm((prev) => ({ ...prev, open: false }));
  }, [dispatch, powerConfirm.deviceId]);

  const handleDeleteClick = useCallback(
    (deviceId: string, deviceName: string) => {
      setDeleteConfirm({
        open: true,
        deviceId,
        deviceName,
      });
    },
    [],
  );

  const handleDeleteCancel = useCallback(() => {
    setDeleteConfirm((prev) => ({ ...prev, open: false }));
  }, []);

  const handleDeleteConfirm = useCallback(
    (force = false) => {
      setDeletingDeviceId(deleteConfirm.deviceId);
      dispatch(
        deleteDeviceRequest({ deviceId: deleteConfirm.deviceId, force }),
      );
      setDeleteConfirm((prev) => ({ ...prev, open: false }));
    },
    [dispatch, deleteConfirm.deviceId],
  );

  const handleClearFilters = useCallback(() => {
    dispatch(setSearch(''));
    dispatch(setStatus('all'));
  }, [dispatch]);

  // Get device columns configuration
  const columns = useDeviceColumns({
    selectedDeviceId,
    terminalTarget,
    powerToggleLoading,
    deletingDeviceId,
    deleteActionLoading,
    onSshTerminalOpen: handleSshTerminalOpen,
    onRtosTerminalOpen: handleRtosTerminalOpen,
    onPowerToggle: handlePowerToggleClick,
    onDelete: handleDeleteClick,
  });

  useEffect(() => {
    if (!deletingDeviceId || !deleteMessage) {
      return;
    }

    toastService.success(deleteMessage);
    dispatch(triggerDevicesRefresh());
    dispatch(clearDeviceMessage());
    setDeletingDeviceId(null);
  }, [dispatch, deleteMessage, deletingDeviceId]);

  useEffect(() => {
    if (!deletingDeviceId || !deleteError) {
      return;
    }

    toastService.error(deleteError);
    dispatch(clearDeviceMessage());
    setDeletingDeviceId(null);
  }, [dispatch, deleteError, deletingDeviceId]);

  useEffect(() => {
    if (activeTab !== 'devices') {
      return;
    }

    // Fetch devices for user based on UI filters
    dispatch(
      fetchUserDevicesRequest({
        page: (page + 1).toString(),
        limit: rowsPerPage.toString(),
        sortBy: sortBy,
        desc: sortOrder === 'desc' ? 'true' : 'false',
        deviceFamily: 'ALL',
        showAll: 'true', // Show all devices regardless of availability
        search: search || undefined,
        filterBy: status !== 'all' ? status : undefined,
        screen: 'userDevices',
      }),
    );
  }, [
    dispatch,
    page,
    rowsPerPage,
    sortBy,
    sortOrder,
    search,
    status,
    activeTab,
    refreshTrigger,
  ]);

  useEffect(() => {
    if (!isAdmin && activeTab === 'tree-topology') {
      setActiveTab('devices');
    }
  }, [isAdmin, activeTab]);

  // Empty state component
  const emptyStateComponent = dataFetched ? (
    <EmptyState
      message="No devices found matching your filters"
      hasActiveFilters={hasActiveFilters}
      onClearFilters={handleClearFilters}
      clearLabel="Clear all filters"
    />
  ) : undefined;

  return (
    <Stack className={styles.container}>
      {activeTab === 'devices' && (
        <div className={styles.tabsSection}>
          <div className={styles.tabsContainer}>
            <div className={styles.tabIndicator} />
            {visibleTabs.map((tab) => {
              const isActive = activeTab === tab.key;

              return (
                <button
                  key={tab.key}
                  type="button"
                  className={`${styles.tabButton} ${
                    isActive ? styles.tabActive : ''
                  }`}
                  onClick={() => setActiveTab(tab.key)}
                >
                  <img
                    src={isActive ? tab.activeIcon : tab.passiveIcon}
                    alt={`${tab.label} icon`}
                    className={styles.tabIcon}
                  />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {activeTab === 'tree-topology' && isAdmin ? (
        <TreeTopology onSwitchToDevices={() => setActiveTab('devices')} />
      ) : (
        <>
          <Stack className={styles.headerContainer}>
            <TableFilter
              filterValue={status}
              onFilterChange={(v) =>
                dispatch(setStatus(v as DeviceState | 'all'))
              }
              filterOptions={statusOptions}
              searchValue={search}
              onSearchChange={(v) => dispatch(setSearch(v))}
              count={deviceCount}
              countLabel="devices"
              searchPlaceholder="Search by device name or build..."
            />
          </Stack>
          <Stack className={styles.deviceTableContainer}>
            <DataTable
              title="devices"
              columns={columns}
              data={paginatedData}
              totalCount={totalDevices}
              page={page}
              onPageChange={(p) => dispatch(setPage(p))}
              sortBy={sortBy}
              sortOrder={sortOrder}
              onSort={(key) => {
                const nextOrder =
                  sortBy === key && sortOrder === 'asc' ? 'desc' : 'asc';
                dispatch(
                  setSort({
                    sortBy: key as UserDevicesState['sortBy'],
                    sortOrder: nextOrder,
                  }),
                );
              }}
              rowsPerPage={rowsPerPage}
              loading={loading}
              emptyState={emptyStateComponent}
            />
          </Stack>
          {selectedDeviceId && terminalMode && (
            <SSHTerminalBar
              deviceId={selectedDeviceId}
              onClose={closeTerminal}
              title={
                terminalMode === 'rtos'
                  ? `RTOS session for ${selectedDeviceId}`
                  : `Connected to ${selectedDeviceId}`
              }
              initialHeight={terminalMode === 'rtos' ? 420 : 300}
            >
              {terminalMode === 'rtos' ? (
                <RTOSTerminalComponent deviceId={selectedDeviceId} />
              ) : (
                terminalTarget && (
                  <SSHTerminalComponent target={terminalTarget} />
                )
              )}
            </SSHTerminalBar>
          )}

          <ConfirmPowerModal
            open={powerConfirm.open}
            deviceName={powerConfirm.deviceName}
            isPowerOn={powerConfirm.isPowerOn}
            onCancel={handlePowerConfirmCancel}
            onConfirm={handlePowerConfirm}
            loading={powerToggleLoading}
          />

          <DeleteConfirmDialog
            isOpen={deleteConfirm.open}
            onClose={handleDeleteCancel}
            onConfirm={handleDeleteConfirm}
            resourceName="Device"
            resourceId={deleteConfirm.deviceName || deleteConfirm.deviceId}
            allowForceDelete
          />
        </>
      )}
    </Stack>
  );
}

export default Devices;
