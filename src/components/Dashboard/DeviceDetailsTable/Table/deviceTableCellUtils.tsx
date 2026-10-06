import { Box, Stack, SvgIcon, Typography } from '@mui/material';
import { DeviceStatus } from 'typesCustom/components';
import { CheckGreen, CloseRed, DeleteRed } from 'assets';
import { InterfaceLabel } from 'components/common';
import styles from './Table.module.scss';
import { Interface } from 'typesCustom/types';

export interface DeviceStateHours {
  [state: string]: number;
}

export const calculateStatePercentage = (
  states: DeviceStateHours,
  targetState: string = 'busy',
  totalHours: number = 24,
): number => {
  const stateHours = states[targetState] ?? 0;
  const percentage = (stateHours / totalHours) * 100;
  return parseFloat(percentage.toFixed(2));
};

interface UsageCellProps {
  value: number;
}

interface InterfaceCellProps {
  interfaces: Interface[];
  disabled: boolean;
}

interface DeviceActionCellProps {
  status: DeviceStatus;
  loading: boolean;
  onApprove: () => void;
  onDecline: () => void;
  onDelete: () => void;
}

export const UsageCell = ({ value }: UsageCellProps) => (
  <Stack direction="row" alignItems="center" gap="0.75rem">
    <Box className={styles.percentageContainer}>
      <Box className={styles.percentageBar} width={`${value}%`} />
    </Box>
    <Typography color="button.disabled.text" variant="buttonBase">
      {value} %
    </Typography>
  </Stack>
);

export const InterfaceCell = ({ interfaces, disabled }: InterfaceCellProps) => (
  <InterfaceLabel
    label={interfaces.length}
    items={interfaces}
    disabled={disabled}
  />
);

export const DeviceActionCell = ({
  status,
  loading,
  onApprove,
  onDecline,
  onDelete,
}: DeviceActionCellProps) => {
  if (status === DeviceStatus.REQUESTED) {
    return (
      <Stack
        justifyContent="center"
        alignItems="center"
        direction="row"
        className={styles.approveContainer}
      >
        <SvgIcon
          component={CheckGreen}
          inheritViewBox
          className={styles.approveIcons}
          onClick={() => !loading && onApprove()}
        />
        <SvgIcon
          component={CloseRed}
          inheritViewBox
          className={styles.approveIcons}
          onClick={() => !loading && onDecline()}
        />
      </Stack>
    );
  }

  return (
    <Stack alignItems="center" justifyContent="center">
      <Stack
        alignItems="center"
        justifyContent="center"
        className={styles.deleteContainer}
        onClick={() => !loading && onDelete()}
      >
        <SvgIcon
          component={DeleteRed}
          inheritViewBox
          className={styles.deleteIcon}
          fontSize="small"
        />
      </Stack>
    </Stack>
  );
};
