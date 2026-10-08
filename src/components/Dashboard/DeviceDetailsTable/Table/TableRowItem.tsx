import { Box, TableCell, TableRow, Typography } from '@mui/material';
import clsx from 'clsx';
import { DeviceState, DeviceStatus } from 'typesCustom/components';
import styles from './Table.module.scss';
import { IDevice } from 'typesCustom/types';
import useTableRowUtility from './useTableRowUtility';
import { DashboardTableColumn } from 'store/index';
import { useEffect, useState } from 'react';
import { getRelativeDuration } from 'utils/dashboard';
import { DeleteConfirmDialog } from 'components/Dialogs/ConfirmDialog';
import {
  calculateStatePercentage,
  DeviceActionCell,
  InterfaceCell,
  UsageCell,
} from './deviceTableCellUtils';

interface TableRowItemProps {
  row: IDevice;
  filteredColumns: DashboardTableColumn[];
}

export { calculateStatePercentage } from './deviceTableCellUtils';

const TableRowItem = ({ row, filteredColumns }: TableRowItemProps) => {
  const [availabilityLabel, setAvailabilityLabel] = useState(() =>
    getRelativeDuration(row['stateUpdatedAt']),
  );
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string | null>(null);

  useEffect(() => {
    const update = () => {
      setAvailabilityLabel(getRelativeDuration(row['stateUpdatedAt']));
    };
    const interval = setInterval(update, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [row]);

  const {
    getFormattedValue,
    getCellColor,
    getStateColor,
    loading,
    updateDeviceStatus,
    deleteDevice,
  } = useTableRowUtility();

  const notReachable = row.state === DeviceState.NOT_REACHABLE;
  const stateColor = getStateColor(row.state as DeviceState);

  const handleOpenConfirmDialog = () => {
    setIsDialogOpen(true);
  };

  const handleCloseConfirmDialog = () => {
    setIsDialogOpen(false);
  };

  const handleConfirmDelete = (force = false) => {
    console.log('Device deleted!');
    deleteDevice(selectedDeviceId!, force);
    setIsDialogOpen(false);
  };

  const renderCellContent = (column: DashboardTableColumn) => {
    getRelativeDuration(row['createdAt']);
    let value = getFormattedValue(
      row[column.name as keyof typeof row],
      column.name,
      row,
    );

    if (
      column.name === 'availability' &&
      row['status'] === DeviceStatus.APPROVED
    ) {
      value = availabilityLabel;
    }

    if (column.name === 'usage') {
      return (
        <UsageCell
          value={calculateStatePercentage(row['usage']?.states || {})}
        />
      );
    }
    if (column.name === 'deviceId') {
      return value?.toString().replace(/:/g, '-');
    }

    if (column.name === 'interfaces') {
      return (
        <InterfaceCell interfaces={row.interfaces} disabled={notReachable} />
      );
    }

    if (column.name === 'action') {
      return (
        <DeviceActionCell
          status={row.status as DeviceStatus}
          loading={loading}
          onApprove={() =>
            updateDeviceStatus(row.deviceId, DeviceStatus.APPROVED)
          }
          onDecline={() =>
            updateDeviceStatus(row.deviceId, DeviceStatus.DECLINED)
          }
          onDelete={() => {
            setSelectedDeviceId(row.deviceId);
            handleOpenConfirmDialog();
          }}
        />
      );
    }

    return (
      <>
        <Typography
          variant="system1"
          color={getCellColor(column.name, value, stateColor ?? '')}
          className={clsx({ [styles.disabledText]: notReachable })}
        >
          {value}
        </Typography>
        {column.name === 'deviceName' && (
          <Box bgcolor={stateColor} className={styles.stateIndicator} />
        )}
      </>
    );
  };

  return (
    <>
      <TableRow className={styles.tableRow}>
        {filteredColumns.map((column) => (
          <TableCell key={column.name} className={styles.noWrapCell}>
            {renderCellContent(column)}
          </TableCell>
        ))}
      </TableRow>
      {selectedDeviceId && (
        <DeleteConfirmDialog
          isOpen={isDialogOpen}
          onClose={handleCloseConfirmDialog}
          onConfirm={handleConfirmDelete}
          resourceName={'Device'}
          resourceId={selectedDeviceId}
          allowForceDelete
          requireForceDelete={notReachable}
        />
      )}
    </>
  );
};

export default TableRowItem;
