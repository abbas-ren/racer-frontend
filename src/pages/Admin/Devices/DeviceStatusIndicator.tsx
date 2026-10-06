import clsx from 'clsx';
import { DeviceState, DeviceStatus } from 'typesCustom/components';
import styles from './DevicesStyles.module.scss';
import { NotReachableIcon } from 'assets/index';

export enum HeartbeatTimeouts {
  FAULTY = 12,
  NOT_REACHABLE = 6,
}

interface DeviceStatusIndicatorProps {
  deviceName: string;
  status: DeviceStatus;
  state: DeviceState;
  seconds: number;
  heartbeatTimer: number;
}

const DeviceStatusIndicator: React.FC<DeviceStatusIndicatorProps> = ({
  deviceName,
  status,
  state,
  seconds,
  heartbeatTimer,
}) => {
  const getDataType = () => {
    if (status === DeviceStatus.REQUESTED) return null;
    if (state === DeviceState.BUSY) return 'busy';
    if (seconds == null) return 'not-reachable';
    if (seconds == null) return 'not-reachable';
    if (seconds > heartbeatTimer * HeartbeatTimeouts.FAULTY) return 'faulty';
    if (seconds > heartbeatTimer * HeartbeatTimeouts.NOT_REACHABLE)
      return 'not-reachable';
    return 'available';
  };

  const datatype = getDataType();

  return (
    <div className={clsx('flex flex-gap-sm flex-items-center')}>
      {deviceName}
      {datatype && datatype === 'not-reachable' ? (
        <img src={NotReachableIcon} alt="not-reachable" />
      ) : (
        <span className={styles.device_status} datatype={datatype!}></span>
      )}
      {/* <p datatype="not-reachable" className={clsx(styles.not_reachable_sign)}>
        <span>&#10005;</span>
      </p> */}
    </div>
  );
};

export default DeviceStatusIndicator;
