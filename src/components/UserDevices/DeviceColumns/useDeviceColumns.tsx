import { useMemo } from 'react';
import { Box, Typography } from '@mui/material';
import { Column, InterfaceLabel } from 'components/common';
import { IDevice } from 'typesCustom/types';
import DeviceStatusChip from '../DeviceStatusChip';
import DeviceActionButtons from '../DeviceActionButtons';
import TestResultsDisplay from '../TestResultsDisplay';
import styles from './DeviceColumns.module.scss';
import { useAuth } from 'hooks/useAuth';
import { ROLES } from 'utils/common';
import { DeviceState } from 'typesCustom/components';

interface UseDeviceColumnsProps {
  selectedDeviceId: string | null;
  terminalTarget: string | null;
  powerToggleLoading: boolean;
  deletingDeviceId: string | null;
  deleteActionLoading: boolean;
  onSshTerminalOpen: (deviceId: string) => void;
  onRtosTerminalOpen: (deviceId: string) => void;
  onPowerToggle: (
    deviceId: string,
    deviceName: string,
    isPowerOn: boolean,
  ) => void;
  onDelete: (deviceId: string, deviceName: string) => void;
}

const getMaskedDeviceId = (device: IDevice): string => {
  const family = (device.deviceFamily || 'UNKNOWN').toUpperCase();
  const trailingNumber = device.id?.toString() || '1';

  return `${family}-DEVICE-${trailingNumber}`;
};

const getTestResultCounts = (device: IDevice) => {
  const execs = device.testExecutions || [];
  if (!execs.length) return null;

  const latest = execs[0];
  if (!latest) return null;

  const cases = latest.testCases || [];
  if (!cases.length) return null;

  const passed = cases.filter((c) => c.result === 'PASS').length;
  const failed = cases.filter((c) => c.result === 'FAIL').length;

  return { passed, failed };
};

export function useDeviceColumns({
  selectedDeviceId,
  terminalTarget,
  powerToggleLoading,
  deletingDeviceId,
  deleteActionLoading,
  onSshTerminalOpen,
  onRtosTerminalOpen,
  onPowerToggle,
  onDelete,
}: UseDeviceColumnsProps): Column<IDevice>[] {
  const { user } = useAuth();
  const isAdmin = user?.realmRoles?.includes(ROLES.Admin) ?? false;
  return useMemo(() => {
    const columns: Column<IDevice>[] = [
      {
        key: 'deviceFamily',
        label: 'Device Family',
        icon: 'cpu',
        sortable: false,
        width: '10%',
      },
      {
        key: 'deviceType',
        label: 'Device Name',
        sortable: true,
        width: '8%',
      },
      {
        key: 'deviceId',
        label: 'Device ID',
        sortable: true,
        width: '10%',
        render: (row) =>
          isAdmin ? (
            <Typography variant="body3">{row.deviceId}</Typography>
          ) : (
            <Typography variant="body3">{getMaskedDeviceId(row)}</Typography>
          ),
      },
      {
        key: 'ipAddress',
        label: 'IP Address',
        sortable: false,
        width: '10%',
      },
      {
        key: 'lastTestExecution',
        label: 'Execution Date',
        icon: 'calendar',
        sortable: true,
        width: '11%',
        render: (row) => {
          const latestExecution = row.testExecutions?.[0];
          if (!latestExecution?.updatedAt) {
            return <Typography variant="body3">-</Typography>;
          }
          const date = new Date(latestExecution.updatedAt);
          const formatted = date.toLocaleString('en-US', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            hour12: false,
          });
          return (
            <Typography variant="body3" className={styles.executionDateText}>
              {formatted}
            </Typography>
          );
        },
      },
      {
        key: 'softwareVersion',
        label: 'Build Version',
        icon: 'package',
        sortable: true,
        width: '10%',
        render: (row) =>
          row.softwareVersion ? (
            <Box className={styles.buildChip}>
              <Typography
                className={styles.buildChipText}
                sx={{ color: 'text.tertiary' }}
              >
                {row.softwareVersion}
              </Typography>
            </Box>
          ) : (
            <Typography variant="body3"></Typography>
          ),
      },
      {
        key: 'testResults',
        label: 'Test Results',
        width: '14%',
        render: (row) => {
          const counts = getTestResultCounts(row);
          if (!counts) return <Typography variant="body3"></Typography>;
          return (
            <TestResultsDisplay passed={counts.passed} failed={counts.failed} />
          );
        },
      },
      {
        key: 'state',
        label: 'Status',
        // slightly wider for status chip
        width: '10%',
        render: (row) => (
          <DeviceStatusChip
            state={row.state}
            upgrading={row.upgrading}
            flashing={row.flashing}
          />
        ),
      },
    ];

    if (!isAdmin) {
      const ipAddressColumnIndex = columns.findIndex(
        (column) => column.key === 'ipAddress',
      );
      if (ipAddressColumnIndex >= 0) {
        columns.splice(ipAddressColumnIndex, 1);
      }
    }

    if (!isAdmin) {
      columns.push({
        key: 'interfaces',
        label: 'Interfaces',
        sortable: false,
        width: '8%',
        render: (row) => {
          const notReachable = row.state === DeviceState.NOT_REACHABLE;
          return (
            <InterfaceLabel
              label={row.interfaces?.length ?? 0}
              items={row.interfaces ?? []}
              disabled={notReachable}
            />
          );
        },
      });
    }

    if (isAdmin) {
      columns.push({
        key: 'actions',
        label: 'Action',
        width: '11%',
        align: 'center',
        render: (row) => (
          <DeviceActionButtons
            deviceId={row.deviceId}
            deviceName={row.deviceName || row.deviceType}
            deviceType={row.deviceType}
            deviceState={row.state}
            devicePower={row.power}
            selectedDeviceId={selectedDeviceId}
            terminalTarget={terminalTarget}
            powerToggleLoading={powerToggleLoading}
            deleteLoading={
              deleteActionLoading && deletingDeviceId === row.deviceId
            }
            onSshTerminalOpen={onSshTerminalOpen}
            onRtosTerminalOpen={onRtosTerminalOpen}
            onPowerToggle={onPowerToggle}
            onDelete={onDelete}
          />
        ),
      });
    }

    return columns;
  }, [
    selectedDeviceId,
    terminalTarget,
    powerToggleLoading,
    deletingDeviceId,
    deleteActionLoading,
    onSshTerminalOpen,
    onRtosTerminalOpen,
    onPowerToggle,
    onDelete,
    isAdmin,
  ]);
}
