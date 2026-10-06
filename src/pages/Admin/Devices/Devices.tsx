import CustomInputField from 'components/common/InputField';
import { CustomTable, TableColumn } from 'components/common/Table';
import { useCallback, useState, useMemo, memo, useRef, useEffect } from 'react';
import { IDevice } from 'typesCustom/types';
import styles from './DevicesStyles.module.scss';
import DeviceDetails from './DeviceDetails';
import { DeviceStatus } from 'typesCustom/components';
import useTableRowUtility from 'components/Dashboard/DeviceDetailsTable/Table/useTableRowUtility';
import { useHeartbeatManager } from 'hooks/useHeartbeatManager';
import { useDeviceSearch } from 'hooks/useDeviceSearch';
import DeviceStatusIndicator from './DeviceStatusIndicator';
import DeviceApprovalActions from './DeviceApprovalActions';
import DeviceHeartbeatDisplay from './DeviceHeartbeatDisplay';
import DeviceStatusLegend from './DeviceStatusLegend';
import { NoDevice } from 'assets/index';
import clsx from 'clsx';
import { CLI_Icon, CLI_Icon_disabled } from 'assets/index';
import {
  DeviceActiveIcon,
  DevicePassiveIcon,
  TopologyActiveIcon,
  TopologyPassiveIcon,
} from 'assets/index';
import SSHTerminalComponent from 'components/Terminal/Terminal';
import SSHTerminalBar from 'components/Terminal/SSHTeminalBar';
import useDevice from 'hooks/useDevice';
import { useAlertSocket } from 'hooks/useAlertSocket';
import { AlertData } from 'services/wsClient';
import TreeTopology from './TreeTopology';

export const ROW_PER_PAGE = 10;

interface TableDeviceData extends IDevice {
  action?: any;
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

const TerminalButton = memo<{
  row: TableDeviceData;
  selectedDeviceId?: number;
  onTerminalOpen: (row: TableDeviceData) => void;
}>(({ row, selectedDeviceId, onTerminalOpen }) => {
  const handleClick = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      onTerminalOpen(row);
    },
    [row, onTerminalOpen],
  );

  if (row?.status === DeviceStatus.REQUESTED) {
    return <>-</>;
  }

  return (
    <button
      onClick={handleClick}
      style={{
        all: 'unset',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
      title={selectedDeviceId === row.id ? 'Open Terminal' : 'Select row'}
    >
      <img
        src={selectedDeviceId === row.id ? CLI_Icon : CLI_Icon_disabled}
        alt="Terminal"
        width={24}
        height={24}
      />
    </button>
  );
});

TerminalButton.displayName = 'TerminalButton';

const RightColumnContent = memo<{
  selectedDevice: IDevice | null;
  loading: boolean;
}>(({ selectedDevice, loading }) => {
  if (selectedDevice && !loading) {
    return (
      <>
        <div className="p-y-sm">
          <DeviceStatusLegend />
        </div>
        <DeviceDetails selectedDevice={selectedDevice} />
      </>
    );
  }

  return (
    <div className={clsx(styles.device_details, styles.device_details_empty_h)}>
      <img src={NoDevice} alt="No device" />
      <p>No Device Found</p>
    </div>
  );
});

RightColumnContent.displayName = 'RightColumnContent';

const Devices = () => {
  const [activeTab, setActiveTab] = useState<DeviceTabKey>('devices');
  const [currentPage, setCurrentPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(ROW_PER_PAGE);
  const [terminalTarget, setTerminalTarget] = useState<string | null>(null);
  const [terminalDeviceId, setTerminalDeviceId] = useState<any | null>(null);

  const paginationParams = useMemo(
    () => ({
      page: currentPage + 1,
      limit: rowsPerPage,
      screen: 'deviceDetails' as const,
      setCurrentPage,
    }),
    [currentPage, rowsPerPage],
  );

  const {
    data,
    actionLoading,
    loading,
    approvedDevice,
    totalDevices: totalRows,
    deviceTimeouts,
    selectedDevice,
    selectDevice: setSelectedDevice,
    fetchPageData,
    requestedDevice,
  } = useDevice(paginationParams);

  const dataRef = useRef(data);
  const currentPageRef = useRef(currentPage);
  const totalDataRef = useRef(totalRows);
  const requestedDeviceRef = useRef(requestedDevice);

  useEffect(() => {
    dataRef.current = data;
    currentPageRef.current = currentPage;
    totalDataRef.current = totalRows;
    requestedDeviceRef.current = requestedDevice;
  }, [data, currentPage, totalRows, requestedDevice]);

  const { updateDeviceStatus } = useTableRowUtility(paginationParams);
  const { heartbeatTimers, deviceHeartbeatStatus } = useHeartbeatManager();
  const { searchTerm, setSearchTerm, filteredData } = useDeviceSearch(data);

  useAlertSocket((alert: AlertData) => {
    if (!alert?.subtype) return;
    switch (alert?.subtype) {
      case 'device-deletion':
        if (dataRef.current.length === 0) {
          setCurrentPage((prev) => {
            return prev > 0 ? prev - 1 : 0;
          });
        }
        fetchPageData(currentPageRef.current + 1);
        break;

      default:
        break;
    }
  });

  const handleSearch = useCallback(
    (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      event.preventDefault();
      setSearchTerm(event.target.value);
      setCurrentPage(0);
    },
    [setSearchTerm],
  );

  const closeTerminal = useCallback(() => {
    setTerminalTarget(null);
    setTerminalDeviceId(null);
  }, []);

  const selectDevice = useCallback(
    (id: number) => {
      const device = approvedDevice?.find((d) => d.id === id);
      if (device && requestedDeviceRef.current < ROW_PER_PAGE) {
        console.log('open');
        setSelectedDevice(device);
        if (terminalDeviceId && terminalDeviceId !== device.id) {
          closeTerminal();
        }
      }
    },
    [approvedDevice, terminalDeviceId, setSelectedDevice, closeTerminal],
  );

  const handleTerminalOpen = useCallback(
    (row: TableDeviceData) => {
      if (selectedDevice?.id !== row.id) {
        selectDevice(row.id);
        return;
      }
      setTerminalTarget(row.ipAddress);
      setTerminalDeviceId(row.id);
    },
    [selectedDevice?.id, selectDevice],
  );

  const deviceColumns: TableColumn<TableDeviceData>[] = useMemo(
    () => [
      {
        key: 'deviceType',
        label: 'Device',
        minWidth: 60,
        width: '20%',
        format: ({ value, row }) => {
          const seconds = heartbeatTimers[row?.deviceId!] || 0;
          return (
            <DeviceStatusIndicator
              deviceName={value!}
              status={row?.status!}
              state={row?.state!}
              seconds={seconds}
              heartbeatTimer={row?.heartbeatTimer || 5}
            />
          );
        },
      },
      {
        key: 'deviceId',
        label: 'Device ID',
        minWidth: 100,
        width: '30%',
        format: ({ value, row }) =>
          row?.status === DeviceStatus.REQUESTED
            ? '-'
            : value?.replace(/:/g, '-'),
      },
      {
        key: 'softwareVersion',
        label: 'Software',
        minWidth: 40,
        width: '15%',
        format: ({ row }) =>
          row?.status === DeviceStatus.REQUESTED
            ? '-'
            : row?.softwareVersion && row.softwareVersion !== ''
              ? row?.softwareVersion
              : 'Unknown',
      },
      {
        key: 'terminal',
        label: 'Terminal',
        minWidth: 40,
        width: '15%',
        format: ({ row }) => (
          <TerminalButton
            row={row!}
            selectedDeviceId={selectedDevice?.id}
            onTerminalOpen={handleTerminalOpen}
          />
        ),
      },
      {
        key: 'action',
        label: 'Heartbeat',
        minWidth: 60,
        width: '20%',
        format: ({ row }) => {
          if (row?.status === DeviceStatus.REQUESTED) {
            return (
              <DeviceApprovalActions
                deviceId={row?.deviceId!}
                actionLoading={actionLoading}
                onUpdateStatus={updateDeviceStatus}
              />
            );
          }

          const seconds = heartbeatTimers[row?.deviceId!] || 0;
          const hasHeartbeat = deviceHeartbeatStatus[row?.deviceId!] || false;
          const heartbeatTimeout = deviceTimeouts[row?.deviceId!] || 5;

          return (
            <DeviceHeartbeatDisplay
              device={row!}
              seconds={seconds}
              hasHeartbeat={hasHeartbeat}
              heartbeatTimeout={heartbeatTimeout}
            />
          );
        },
      },
    ],
    [
      heartbeatTimers,
      selectedDevice?.id,
      handleTerminalOpen,
      actionLoading,
      updateDeviceStatus,
      deviceHeartbeatStatus,
      deviceTimeouts,
    ],
  );

  const tableProps = useMemo(() => {
    const isDeviceTable = data?.some((item) => item.deviceId);
    return {
      heartbeatSeconds: isDeviceTable ? heartbeatTimers : undefined,
    };
  }, [data, heartbeatTimers]);

  return (
    <div className="p-md flex flex-column gap-md">
      <div className={styles.deviceTabs}>
        {DEVICE_TABS.map((tab) => {
          const isActive = activeTab === tab.key;

          return (
            <button
              key={tab.key}
              type="button"
              className={clsx(
                styles.deviceTabButton,
                isActive && styles.deviceTabButtonActive,
              )}
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

      {activeTab === 'devices' ? (
        <>
          <div className="flex flex-gap-lg">
            <div className={styles.deviceList}>
              <div className="flex flex-between">
                <h2 className="primary-heading-text">Device</h2>
                <div className="flex flex-items-end flex-gap-md">
                  <CustomInputField
                    variant="filled"
                    fullWidth={false}
                    type="search"
                    customClasses={styles.search_device_field}
                    placeholder="Search"
                    value={searchTerm}
                    onChange={handleSearch}
                  />
                </div>
              </div>
              <CustomTable
                columns={deviceColumns}
                data={filteredData || []}
                showPagination={true}
                defaultRowsPerPage={10}
                rowsPerPageOptions={[5, 10, 25]}
                stickyHeader={true}
                emptyMessage="No device found"
                loading={loading}
                setCurrentPage={setCurrentPage}
                currentPage={currentPage}
                selectedRow={selectedDevice?.id}
                selectDevice={selectDevice}
                totalRows={totalRows}
                rowsPerPage={rowsPerPage}
                setRowsPerPage={setRowsPerPage}
                {...tableProps}
              />
            </div>

            <div className={styles.deviceDetails}>
              <RightColumnContent
                selectedDevice={selectedDevice}
                loading={loading}
              />
            </div>
          </div>

          {terminalTarget && selectedDevice?.deviceId && (
            <SSHTerminalBar
              target={terminalTarget}
              deviceId={selectedDevice.deviceId}
              onClose={closeTerminal}
            >
              <SSHTerminalComponent target={terminalTarget} />
            </SSHTerminalBar>
          )}
        </>
      ) : (
        <TreeTopology />
      )}
    </div>
  );
};

export default memo(Devices);
