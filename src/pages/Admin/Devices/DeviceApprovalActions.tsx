import { Stack, SvgIcon } from '@mui/material';
import { CheckGreen, CloseRed } from 'assets/index';
import { DeviceStatus } from 'typesCustom/components';
import styles from './DevicesStyles.module.scss';

interface DeviceApprovalActionsProps {
  deviceId: string;
  actionLoading: boolean;
  onUpdateStatus: (deviceId: string, status: DeviceStatus) => void;
}

const DeviceApprovalActions: React.FC<DeviceApprovalActionsProps> = ({
  deviceId,
  actionLoading,
  onUpdateStatus,
}) => {
  return (
    <Stack
      direction="row"
      alignItems="center"
      justifyContent="flex-start"
      className={styles.approveContainer}
    >
      <SvgIcon
        component={CheckGreen}
        inheritViewBox
        className={styles.approveIcons}
        onClick={() => {
          if (!actionLoading) {
            onUpdateStatus(deviceId, DeviceStatus.APPROVED);
          }
        }}
      />
      <SvgIcon
        component={CloseRed}
        inheritViewBox
        className={styles.approveIcons}
        onClick={() => {
          if (!actionLoading) {
            onUpdateStatus(deviceId, DeviceStatus.DECLINED);
          }
        }}
      />
    </Stack>
  );
};

export default DeviceApprovalActions;
