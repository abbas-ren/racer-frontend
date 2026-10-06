import {
  Box,
  Stack,
  SvgIcon,
  TableCell,
  TableRow,
  Typography,
} from '@mui/material';
import clsx from 'clsx';
import { DeviceState, DeviceStatus } from 'typesCustom/components';
import InterfaceLabel from './InterfaceLabel';
import styles from './Table.module.scss';
import { IDevice } from 'typesCustom/types';
import { DashboardTableColumn } from 'store/index';
import { CheckGreen, CloseRed, DeleteRed } from 'assets';
import { useEffect, useState } from 'react';
import { getRelativeDuration } from 'utils/dashboard';
import useTableRowUtility from 'components/Dashboard/DeviceDetailsTable/Table/useTableRowUtility';

interface TableRowItemProps {
  row: IDevice;
  filteredColumns: DashboardTableColumn[];
}

const TableRowItem = ({ row, filteredColumns }: TableRowItemProps) => {
  const [availabilityLabel, setAvailabilityLabel] = useState(() =>
    getRelativeDuration(row['stateUpdatedAt']),
  );

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

  const renderUsageCell = (value: number) => (
    <Stack direction="row" alignItems="center" gap="0.75rem">
      <Box className={styles.percentageContainer}>
        <Box className={styles.percentageBar} width={`${value}%`} />
      </Box>
      <Typography color="button.disabled.text" variant="buttonBase">
        {value} %
      </Typography>
    </Stack>
  );

  const renderInterfaceCell = () => (
    <InterfaceLabel
      label={row.interfaces.length}
      items={row.interfaces}
      disabled={notReachable}
    />
  );

  const renderDeviceAction = (status: DeviceStatus) => {
    if (status === DeviceStatus.REQUESTED) {
      return (
        <Stack
          alignItems="center"
          justifyContent="flex-start"
          direction="row"
          className={styles.approveContainer}
        >
          <SvgIcon
            component={CheckGreen}
            inheritViewBox
            className={styles.approveIcons}
            onClick={() =>
              !loading &&
              updateDeviceStatus(row.deviceId, DeviceStatus.APPROVED)
            }
          />
          <SvgIcon
            component={CloseRed}
            inheritViewBox
            className={styles.approveIcons}
            onClick={() =>
              !loading &&
              updateDeviceStatus(row.deviceId, DeviceStatus.DECLINED)
            }
          />
        </Stack>
      );
    } else {
      return (
        <Stack
          alignItems="center"
          justifyContent="center"
          className={styles.deleteContainer}
          onClick={() => !loading && deleteDevice(row.deviceId)}
        >
          <SvgIcon
            component={DeleteRed}
            inheritViewBox
            className={styles.deleteIcon}
          />
        </Stack>
      );
    }
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
      return renderUsageCell(0);
    }

    if (column.name === 'interfaces') {
      return renderInterfaceCell();
    }

    if (column.name === 'action') {
      return renderDeviceAction(row.status as DeviceStatus);
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
    <TableRow className={styles.tableRow}>
      {filteredColumns.map((column) => (
        <TableCell key={column.name} className={styles.noWrapCell}>
          {renderCellContent(column)}
        </TableCell>
      ))}
    </TableRow>
  );
};

export default TableRowItem;
