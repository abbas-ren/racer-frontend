import { IDevice } from 'typesCustom/types';
import styles from './DevicesStyles.module.scss';
import clsx from 'clsx';
import Gen3InterfaceConnectionBoard from './Gen3DeviceInterface';
import { useHeartbeatManager } from 'hooks/useHeartbeatManager';
import { formatDate } from 'utils/common';
import { getRelativeDuration } from 'utils/dashboard';
import { calculateStatePercentage } from 'components/Dashboard/DeviceDetailsTable/Table/TableRowItem';
import { STATE_LABEL } from 'constants/dashboard';
import { Typography } from '@mui/material';

interface DeviceDetailsProps {
  selectedDevice: IDevice | null;
}

const DeviceDetails = ({ selectedDevice }: DeviceDetailsProps) => {
  const { heartbeats } = useHeartbeatManager();

  const getLatestTestStatus = () => {
    const lastExecutionStatus = selectedDevice?.lastExecutionStatus;

    if (!lastExecutionStatus) {
      return 'No Result Found';
    }

    return STATE_LABEL[lastExecutionStatus];
  };

  return (
    <div className={styles.device_details}>
      <div className={clsx('flex flex-gap-lg', styles.device_details_header)}>
        <div className="flex flex-gap-lg">
          <h2 className={styles.device_details_deviceId}>
            {selectedDevice?.deviceType}:
            {selectedDevice?.deviceId?.replace(/:/g, '-')}
          </h2>
          <p className={styles.last_updated_text}>
            {selectedDevice?.stateUpdatedAt
              ? getRelativeDuration(selectedDevice.stateUpdatedAt)
              : ''}
          </p>
        </div>
        <p className={styles.onboarded_text}>
          Onboarded on:{' '}
          {selectedDevice?.stateUpdatedAt
            ? formatDate(new Date(selectedDevice.stateUpdatedAt))
            : 'N/A'}
        </p>
      </div>

      <div className={styles.test_details}>
        <div className="flex flex-gap-lg">
          <div className={styles.test_card}>
            <Typography variant="h6">Test ID</Typography>
            <Typography component="p" className={styles.test_id}>
              {selectedDevice?.lastTestExecution || 'No Test Found!'}
            </Typography>
          </div>

          <div className={styles.test_card}>
            <Typography variant="h6" noWrap>
              Test Result
            </Typography>
            <Typography
              component="p"
              className={styles.test_status}
              aria-description={getLatestTestStatus()}
            >
              {getLatestTestStatus()}
            </Typography>
          </div>

          <div className={styles.test_card}>
            <Typography variant="h6" noWrap>
              Usage Details
            </Typography>
            <div className="flex flex-gap-md flex-items-center">
              <progress
                className={styles.progress_usage}
                value={
                  (calculateStatePercentage(
                    selectedDevice?.usage?.states ?? {},
                  ) || 0) / 100
                }
              />
              <p className={styles.progress}>
                {calculateStatePercentage(selectedDevice?.usage?.states ?? {})}%
              </p>
            </div>
            <p className={styles.usage_last}>
              {selectedDevice?.stateUpdatedAt
                ? getRelativeDuration(selectedDevice.stateUpdatedAt)
                : ''}
            </p>
          </div>
        </div>
      </div>

      <hr className={styles.hr_line} />

      <div className={clsx(styles.interface_details, 'flex flex-between')}>
        <h5>Interface Details</h5>
        <div className={clsx('flex', styles.list_container)}>
          <p
            datatype={'available'}
            className={clsx('flex', styles.list_items, 'm-l-sm')}
          >
            <span></span>Connected
          </p>
          <p
            datatype={'not-connected'}
            className={clsx('flex', styles.list_items)}
          >
            <span></span>Not Connected
          </p>
          <p
            datatype={'not-available'}
            className={clsx('flex', styles.list_items)}
          >
            <span></span>Not Available
          </p>
        </div>
      </div>

      {selectedDevice && (
        <Gen3InterfaceConnectionBoard
          device={selectedDevice}
          heartbeat={heartbeats[selectedDevice.deviceId]}
        />
      )}
    </div>
  );
};

export default DeviceDetails;
