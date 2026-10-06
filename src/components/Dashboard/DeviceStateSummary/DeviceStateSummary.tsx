import { Stack } from '@mui/material';
import styles from './DeviceStateSummary.module.scss';
import DeviceStateCard from '../DeviceStateCard';
import { DeviceState } from 'typesCustom/components';
import { useDispatch, useSelector } from 'react-redux';
import { useEffect } from 'react';
import { fetchDeviceStateAnalyticsRequest } from 'store/slices';
import { RootState } from 'store/store';
import { useAlertSocket } from 'hooks/useAlertSocket';
import { AlertData } from 'services/wsClient';

function DeviceStateSummary() {
  const dispatch = useDispatch();
  const deviceState = useSelector(
    (state: RootState) => state.dashboard.deviceState,
  );
  useEffect(() => {
    dispatch(fetchDeviceStateAnalyticsRequest());
  }, [dispatch]);
  useAlertSocket((alert: AlertData) => {
    if (
      alert.subtype === 'device-approval' ||
      alert.subtype === 'device-state-change' ||
      alert.subtype === 'device-deletion'
    ) {
      dispatch(fetchDeviceStateAnalyticsRequest());
    }
  });

  return (
    <Stack
      className={styles.container}
      direction="row"
      justifyContent="space-between"
      alignItems="center"
    >
      <DeviceStateCard
        type={DeviceState.AVAILABLE}
        data={{
          total: deviceState?.total ?? 0,
          current: deviceState?.stateCount?.get?.(DeviceState.AVAILABLE) ?? 0,
        }}
      />
      <DeviceStateCard
        type={DeviceState.BUSY}
        data={{
          total: deviceState?.total ?? 0,
          current: deviceState?.stateCount?.get?.(DeviceState.BUSY) ?? 0,
        }}
      />
      <DeviceStateCard
        type={DeviceState.FAULTY}
        data={{
          total: deviceState?.total ?? 0,
          current: deviceState?.stateCount?.get?.(DeviceState.FAULTY) ?? 0,
        }}
      />
      <DeviceStateCard
        type={DeviceState.NOT_REACHABLE}
        data={{
          total: deviceState?.total ?? 0,
          current:
            deviceState?.stateCount?.get?.(DeviceState.NOT_REACHABLE) ?? 0,
        }}
      />
    </Stack>
  );
}

export default DeviceStateSummary;
